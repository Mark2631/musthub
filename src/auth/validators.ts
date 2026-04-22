import { z } from "zod";

export const MUST_DOMAIN = "@students.must.ac.ke";

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .refine((value) => value.toLowerCase().endsWith(MUST_DOMAIN), {
    message: `Use your MUST student email (${MUST_DOMAIN}).`,
  });

export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);
