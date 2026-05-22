import { z } from "zod";

const NAME_MAX = 200;
const PHONE_MAX = 32;
const EMAIL_MAX = 254;
const NOTE_MAX = 5000;
const TAGS_MAX = 500;

const phoneSchema = z
  .string()
  .trim()
  .min(6, "Phone number is too short.")
  .max(PHONE_MAX, "Phone number is too long.")
  .regex(/^[\d+\s().-]+$/, "Phone contains invalid characters.");

const emailSchema = z
  .string()
  .trim()
  .max(EMAIL_MAX)
  .email("Invalid email address.")
  .optional()
  .or(z.literal(""));

const preferredLanguageSchema = z.enum(["en", "ar", ""]).optional();

export const customerProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Name is required.").max(NAME_MAX),
  phone: phoneSchema,
  email: emailSchema,
});

export const customerNoteSchema = z.object({
  id: z.string().min(1),
  internalNote: z.string().trim().max(NOTE_MAX).optional().or(z.literal("")),
});

export const customerTagsSchema = z.object({
  id: z.string().min(1),
  tags: z.string().trim().max(TAGS_MAX).optional().or(z.literal("")),
});

export const customerPreferredLanguageSchema = z.object({
  id: z.string().min(1),
  preferredLanguage: preferredLanguageSchema,
});

export const customerIdSchema = z.object({
  id: z.string().min(1, "Missing customer."),
});
