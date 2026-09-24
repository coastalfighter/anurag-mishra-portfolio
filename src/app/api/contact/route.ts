import { NextResponse, type NextRequest } from "next/server";
import { contactSchema, fieldErrors, type ContactResponse } from "@/lib/contactSchema";
import { createRateLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 10_000;
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

function json(body: ContactResponse, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

function allowedOrigins(): string[] {
  return (process.env.CONTACT_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

/**
 * CSRF defence: browsers always send Origin on cross-site POSTs.
 * Same-origin requests are always accepted (so preview / *.vercel.app deployments
 * work out of the box); CONTACT_ALLOWED_ORIGINS adds any extra trusted origins.
 */
function originAllowed(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host && originHost === host) return true;
  return allowedOrigins().includes(origin.replace(/\/$/, ""));
}

export async function POST(req: NextRequest) {
  if (!originAllowed(req)) {
    return json({ ok: false, code: "FORBIDDEN", message: "Origin not allowed." }, 403);
  }

  const rl = limiter(clientIp(req));
  if (!rl.allowed) {
    const retry = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return json(
      { ok: false, code: "RATE_LIMITED", message: "Too many messages — please try again a little later." },
      429,
      { "Retry-After": String(retry) },
    );
  }

  if (!req.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false, code: "BAD_REQUEST", message: "Expected application/json." }, 415);
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ ok: false, code: "BAD_REQUEST", message: "Message is too large." }, 413);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ ok: false, code: "BAD_REQUEST", message: "Malformed JSON." }, 400);
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return json({ ok: false, code: "VALIDATION", errors: fieldErrors(parsed.error) }, 422);
  }

  const { name, email, message, website } = parsed.data;
  // Honeypot tripped: pretend success so bots learn nothing.
  if (website) return json({ ok: true }, 200);

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    return json(
      { ok: false, code: "EMAIL_NOT_CONFIGURED", message: "Direct sending isn't configured — use your email app instead." },
      503,
    );
  }

  try {
    // Plain-text email only: no HTML rendering of user input, so no injection surface.
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Portfolio enquiry from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[contact] provider error", res.status, await res.text().catch(() => ""));
      return json({ ok: false, code: "SEND_FAILED", message: "The message couldn't be sent. Please email directly." }, 502);
    }
  } catch (err) {
    console.error("[contact] send failed", err);
    return json({ ok: false, code: "SEND_FAILED", message: "The message couldn't be sent. Please email directly." }, 502);
  }

  return json({ ok: true }, 200);
}
