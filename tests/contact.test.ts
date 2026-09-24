import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { contactSchema } from "@/lib/contactSchema";
import { createRateLimiter } from "@/lib/rateLimit";

const valid = { name: "Jane Doe", email: "jane@example.com", message: "Hello there, lovely work!", website: "" };

describe("contactSchema", () => {
  it("accepts a valid message", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });
  it.each([
    [{ name: "J" }, "name"],
    [{ name: "Bad\r\nBcc: x@y.z" }, "name"],
    [{ email: "not-an-email" }, "email"],
    [{ message: "short" }, "message"],
    [{ message: "x".repeat(4001) }, "message"],
  ])("rejects %o", (patch, field) => {
    const r = contactSchema.safeParse({ ...valid, ...patch });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]!.path[0]).toBe(field);
  });
});

describe("rate limiter", () => {
  it("allows up to the limit per window, then blocks, then resets", () => {
    const check = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(check("ip", 0).allowed).toBe(true);
    expect(check("ip", 10).allowed).toBe(true);
    expect(check("ip", 20).allowed).toBe(false);
    expect(check("other", 20).allowed).toBe(true);
    expect(check("ip", 1500).allowed).toBe(true);
  });
  it("bounds memory", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 3 });
    for (let i = 0; i < 10; i++) expect(check(`k${i}`, 0).allowed).toBe(true);
  });
});

describe("POST /api/contact", () => {
  const env = { ...process.env };
  beforeEach(() => {
    vi.resetModules();
    process.env.CONTACT_ALLOWED_ORIGINS = "http://localhost:3000";
  });
  afterEach(() => {
    process.env = { ...env };
    vi.restoreAllMocks();
  });

  async function post(body: unknown, headers: Record<string, string> = {}) {
    const { POST } = await import("@/app/api/contact/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost:3000", "x-forwarded-for": `1.2.3.${Math.random()}`, ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
    return POST(req);
  }

  it("rejects foreign origins", async () => {
    const res = await post(valid, { origin: "https://evil.example" });
    expect(res.status).toBe(403);
  });

  it("returns field errors for invalid input", async () => {
    const res = await post({ ...valid, email: "nope" });
    expect(res.status).toBe(422);
    expect((await res.json()).errors.email).toBeTruthy();
  });

  it("rejects malformed JSON", async () => {
    expect((await post("{oops")).status).toBe(400);
  });

  it("silently accepts honeypot submissions without sending", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const res = await post({ ...valid, website: "spam" });
    expect(res.status).toBe(200);
    expect(spy).not.toHaveBeenCalled();
  });

  it("reports 503 when email delivery isn't configured", async () => {
    delete process.env.RESEND_API_KEY;
    const res = await post(valid);
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("EMAIL_NOT_CONFIGURED");
  });

  it("sends a plain-text email via Resend when configured", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.CONTACT_TO_EMAIL = "to@example.com";
    process.env.CONTACT_FROM_EMAIL = "from@example.com";
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    const res = await post(valid);
    expect(res.status).toBe(200);
    const [, init] = spy.mock.calls[0]!;
    const sent = JSON.parse(String((init as RequestInit).body));
    expect(sent.reply_to).toBe(valid.email);
    expect(sent.text).toContain(valid.message);
    expect(sent.html).toBeUndefined();
  });

  it("rate limits repeat senders", async () => {
    delete process.env.RESEND_API_KEY;
    const headers = { "x-forwarded-for": "9.9.9.9" };
    const { POST } = await import("@/app/api/contact/route");
    const { NextRequest } = await import("next/server");
    let last = 0;
    for (let i = 0; i < 6; i++) {
      const res = await POST(
        new NextRequest("http://localhost:3000/api/contact", {
          method: "POST",
          headers: { "content-type": "application/json", origin: "http://localhost:3000", ...headers },
          body: JSON.stringify(valid),
        }),
      );
      last = res.status;
    }
    expect(last).toBe(429);
  });
});
