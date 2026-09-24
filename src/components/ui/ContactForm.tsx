"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useState, type FormEvent } from "react";
import { contactSchema, fieldErrors, type ContactResponse, type FieldErrors } from "@/lib/contactSchema";
import { PERSON } from "@/lib/sectionData";

type Status = "idle" | "sending" | "sent" | "error" | "fallback";

function mailtoHref(name: string, message: string): string {
  const subject = encodeURIComponent(`Portfolio enquiry from ${name || "your website"}`);
  const body = encodeURIComponent(message);
  return `mailto:${PERSON.email}?subject=${subject}&body=${body}`;
}

/**
 * Accessible contact form: client-side validation mirrors the server schema,
 * errors are announced and linked to their fields, and when direct sending isn't
 * configured it hands off to the visitor's mail client.
 */
export function ContactForm() {
  const uid = useId();
  const [values, setValues] = useState({ name: "", email: "", message: "", website: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState("");

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key as keyof FieldErrors]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      const first = (["name", "email", "message"] as const).find((k) => errs[k]);
      if (first) document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    setStatus("sending");
    setServerMessage("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json().catch(() => null)) as ContactResponse | null;
      if (res.ok && data?.ok) {
        setStatus("sent");
        setValues({ name: "", email: "", message: "", website: "" });
        return;
      }
      if (data && !data.ok && data.code === "VALIDATION") {
        setErrors(data.errors);
        setStatus("idle");
        return;
      }
      if (data && !data.ok && data.code === "EMAIL_NOT_CONFIGURED") {
        setStatus("fallback");
        return;
      }
      setStatus("error");
      setServerMessage(data && !data.ok && "message" in data ? data.message : "Something went wrong. Please email directly.");
    } catch {
      setStatus("error");
      setServerMessage("Network error — please check your connection or email directly.");
    }
  }

  const field =
    "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-paper placeholder:text-paper/30 outline-none transition focus:border-signal focus:bg-black/50 aria-[invalid=true]:border-signal";

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5" aria-describedby={`${uid}-status`}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-name`} className="mb-2 block text-xs uppercase tracking-[0.25em] text-mute">
            Name
          </label>
          <input
            id={`${uid}-name`}
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={set("name")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `${uid}-name-error` : undefined}
            className={field}
            maxLength={80}
            required
          />
          {errors.name && (
            <p id={`${uid}-name-error`} className="mt-2 text-sm text-ember">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className="mb-2 block text-xs uppercase tracking-[0.25em] text-mute">
            Email
          </label>
          <input
            id={`${uid}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={values.email}
            onChange={set("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `${uid}-email-error` : undefined}
            className={field}
            maxLength={254}
            required
          />
          {errors.email && (
            <p id={`${uid}-email-error`} className="mt-2 text-sm text-ember">
              {errors.email}
            </p>
          )}
        </div>
      </div>
      <div>
        <label htmlFor={`${uid}-message`} className="mb-2 block text-xs uppercase tracking-[0.25em] text-mute">
          Message
        </label>
        <textarea
          id={`${uid}-message`}
          name="message"
          rows={5}
          value={values.message}
          onChange={set("message")}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? `${uid}-message-error` : undefined}
          className={`${field} resize-y`}
          maxLength={4000}
          required
        />
        {errors.message && (
          <p id={`${uid}-message-error`} className="mt-2 text-sm text-ember">
            {errors.message}
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people and assistive tech, irresistible to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${uid}-website`}>Website</label>
        <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={status === "sending"}
          className="group relative overflow-hidden rounded-full bg-signal px-8 py-4 text-sm font-bold uppercase tracking-[0.25em] text-white transition hover:shadow-[0_0_40px_-6px_rgba(255,0,4,0.8)] disabled:opacity-60"
        >
          <span className="relative z-10">{status === "sending" ? "Sending…" : "Send message"}</span>
          <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-700 group-hover:translate-x-0" />
        </button>
        <a href={`mailto:${PERSON.email}`} className="link-underline text-sm text-paper/70">
          or email {PERSON.email}
        </a>
      </div>

      <div id={`${uid}-status`} role="status" aria-live="polite" className="min-h-6">
        <AnimatePresence mode="wait">
          {status === "sent" && (
            <motion.p key="sent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-paper">
              Thank you — your message is on its way.
            </motion.p>
          )}
          {status === "fallback" && (
            <motion.p key="fallback" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-paper/85">
              Direct sending isn&apos;t available right now.{" "}
              <a className="text-signal underline" href={mailtoHref(values.name, values.message)}>
                Open your email app with this message
              </a>
              .
            </motion.p>
          )}
          {status === "error" && (
            <motion.p key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-ember">
              {serverMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
