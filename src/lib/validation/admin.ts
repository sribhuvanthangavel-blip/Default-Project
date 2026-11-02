import { z } from 'zod';
import {
  checkboxSchema,
  emailSchema,
  optionalEmailSchema,
  optionalPhoneSchema,
  phoneSchema,
  slugSchema,
  uuidSchema,
} from './forms';

export const serviceFormSchema = z.object({
  id: uuidSchema.optional().or(z.literal('')),
  name: z
    .string()
    .trim()
    .min(2, 'Enter a service name.')
    .max(120, 'Keep the name under 120 characters.'),
  slug: slugSchema,
  description: z
    .string()
    .trim()
    .max(4000, 'Keep the description under 4000 characters.')
    .default(''),
  displayOrder: z.coerce
    .number()
    .int('Use a whole number.')
    .min(0, 'Use zero or a positive number.')
    .max(10000, 'That order is too large.'),
  isActive: checkboxSchema,
});

export type ServiceFormInput = z.infer<typeof serviceFormSchema>;

export const settingsFormSchema = z.object({
  clinicPhone: optionalPhoneSchema,
  clinicWhatsapp: optionalPhoneSchema,
  clinicEmail: optionalEmailSchema,
  clinicAddress: z.string().trim().max(300, 'Keep the address under 300 characters.'),
  clinicHours: z.string().trim().max(500, 'Keep the hours under 500 characters.'),
  clinicMapUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => value === '' || /^https:\/\/[^\s]+$/i.test(value),
      'Use a full https:// link, or leave blank.',
    ),
  announcement: z.string().trim().max(300, 'Keep the announcement under 300 characters.'),
  bookingEnabled: checkboxSchema,
});

export type SettingsFormInput = z.infer<typeof settingsFormSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.').max(200, 'That password is too long.'),
  next: z.string().max(300).optional().default(''),
});

export const resetRequestSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, 'Use at least 12 characters.')
      .max(200, 'That password is too long.')
      .refine(
        (value) => /[a-zA-Z]/.test(value) && /[0-9]/.test(value),
        'Include letters and numbers.',
      ),
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'The passwords do not match.',
    path: ['confirmPassword'],
  });

// Re-exported for forms that need the individual pieces.
export { emailSchema, phoneSchema };
