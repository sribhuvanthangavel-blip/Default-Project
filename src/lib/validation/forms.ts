import { z } from 'zod';
import { isValidISODate, isValidTime, isPastDate, normalizeTime } from '@/lib/dates';
import { getClinicTimeZone } from '@/lib/env';

export const EMAIL_MAX = 320;
export const PHONE_MAX = 24;
export const NAME_MAX = 120;
export const MESSAGE_MAX = 2000;

const PHONE_SHAPE = /^\+?[0-9][0-9\s().-]{5,22}$/;
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

/** Store phones consistently so duplicate detection and admin search work. */
function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith('+');
  return `${hasPlus ? '+' : ''}${trimmed.replace(/\D/g, '')}`;
}

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Please enter at least two characters.')
  .max(NAME_MAX, 'Please keep this under 120 characters.')
  .refine((value) => !CONTROL_CHARACTERS.test(value), 'Please remove unusual characters.');

export const emailSchema = z
  .string()
  .trim()
  .max(EMAIL_MAX, 'Please use an email address under 320 characters.')
  .transform((value) => value.toLowerCase())
  .pipe(z.email());

export const phoneSchema = z
  .string()
  .trim()
  .min(7, 'Please enter a phone number.')
  .max(PHONE_MAX, 'Please keep the phone number under 24 characters.')
  .refine((value) => PHONE_SHAPE.test(value), 'Enter a valid phone number.')
  .refine((value) => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }, 'Enter a valid phone number, including the country code.')
  .transform(normalizePhone);

export const optionalPhoneSchema = z
  .string()
  .trim()
  .max(PHONE_MAX)
  .refine((value) => value === '' || PHONE_SHAPE.test(value), 'Enter a valid phone number.')
  .refine((value) => {
    if (value === '') return true;
    const digits = value.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }, 'Enter a valid phone number, including the country code.')
  .transform((value) => (value === '' ? '' : normalizePhone(value)));

export const optionalEmailSchema = z
  .string()
  .trim()
  .max(EMAIL_MAX)
  .transform((value) => value.toLowerCase())
  .refine(
    (value) => value === '' || z.email().safeParse(value).success,
    'Enter a valid email address.',
  );

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'The slug is too short.')
  .max(80, 'The slug is too long.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.');

export const uuidSchema = z.uuid('That identifier is not valid.');

export const checkboxSchema = z.preprocess(
  (value) => value === true || value === 'true' || value === 'on' || value === '1',
  z.boolean(),
);

/**
 * Booking request validation. The same schema is used by the client (React Hook
 * Form) and by the server action, so the two can never drift.
 */
export function createAppointmentRequestSchema(options?: { timeZone?: string }) {
  const timeZone = options?.timeZone ?? getClinicTimeZone();

  return z.object({
    patientName: nameSchema,
    phone: phoneSchema,
    email: emailSchema,
    serviceId: uuidSchema,
    preferredDate: z
      .string()
      .trim()
      .refine(isValidISODate, 'Choose a valid date.')
      .refine((value) => !isPastDate(value, timeZone), 'Choose today or a future date.'),
    preferredTime: z
      .string()
      .trim()
      .refine(isValidTime, 'Choose a valid time.')
      .transform(normalizeTime),
    message: z
      .string()
      .trim()
      .max(MESSAGE_MAX, 'Please keep your message under 2000 characters.')
      .optional()
      .default(''),
    consent: z
      .boolean()
      .refine((value) => value === true, 'Please agree before sending your request.'),
    // Anti-spam fields — validated on the server, never shown to visitors.
    website: z.string().max(0, 'Rejected.').optional().default(''),
    formStartedAt: z.coerce.number().int().positive().optional(),
  });
}

export const appointmentRequestSchema = createAppointmentRequestSchema();
export type AppointmentRequestInput = z.infer<typeof appointmentRequestSchema>;

export function createContactMessageSchema() {
  return z.object({
    name: nameSchema,
    email: emailSchema,
    phone: optionalPhoneSchema.optional().default(''),
    message: z
      .string()
      .trim()
      .min(10, 'Please add a little more detail.')
      .max(3000, 'Please keep your message under 3000 characters.'),
    website: z.string().max(0, 'Rejected.').optional().default(''),
    formStartedAt: z.coerce.number().int().positive().optional(),
  });
}

export const contactMessageSchema = createContactMessageSchema();
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
