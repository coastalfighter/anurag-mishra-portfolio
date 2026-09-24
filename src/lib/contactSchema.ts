import { z } from "zod";

/** Shared client/server validation for the contact form. */
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(80, "Name is too long (80 characters max).")
    // Block header-injection style payloads in a field that ends up in the subject line.
    .refine((v) => !/[\r\n]/.test(v), "Name cannot contain line breaks."),
  email: z.string().trim().max(254, "Email is too long.").email("Please enter a valid email address."),
  message: z
    .string()
    .trim()
    .min(10, "Please write a little more (10 characters minimum).")
    .max(4000, "Message is too long (4000 characters max)."),
  /** Honeypot — real visitors never see it. A filled value is accepted but silently dropped by the API. */
  website: z.string().max(500).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if ((key === "name" || key === "email" || key === "message") && !out[key]) out[key] = issue.message;
  }
  return out;
}

export type ContactResponse =
  | { ok: true }
  | { ok: false; code: "VALIDATION"; errors: FieldErrors }
  | { ok: false; code: "RATE_LIMITED" | "FORBIDDEN" | "BAD_REQUEST" | "EMAIL_NOT_CONFIGURED" | "SEND_FAILED"; message: string };
