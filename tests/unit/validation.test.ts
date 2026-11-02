import { describe, expect, it } from 'vitest';
import {
  appointmentRequestSchema,
  contactMessageSchema,
  createAppointmentRequestSchema,
  emailSchema,
  optionalPhoneSchema,
  phoneSchema,
  slugSchema,
} from '@/lib/validation/forms';

const SERVICE_ID = '11111111-1111-4111-8111-111111111111';

function validAppointment(overrides: Record<string, unknown> = {}) {
  return {
    patientName: 'Asha Menon',
    phone: '+91 98765 43210',
    email: '  Asha@Example.COM ',
    serviceId: SERVICE_ID,
    preferredDate: '2099-06-15',
    preferredTime: '09:30',
    message: 'Please call in the morning.',
    consent: true,
    website: '',
    ...overrides,
  };
}

describe('appointment request validation', () => {
  it('accepts a well-formed request and normalises it', () => {
    const parsed = appointmentRequestSchema.safeParse(validAppointment());
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.data.email).toBe('asha@example.com');
    expect(parsed.data.phone).toBe('+919876543210');
    expect(parsed.data.preferredTime).toBe('09:30');
  });

  it('rejects a date in the past', () => {
    const parsed = appointmentRequestSchema.safeParse(
      validAppointment({ preferredDate: '2000-01-01' }),
    );
    expect(parsed.success).toBe(false);
  });

  it('rejects an impossible date', () => {
    const parsed = appointmentRequestSchema.safeParse(
      validAppointment({ preferredDate: '2099-02-30' }),
    );
    expect(parsed.success).toBe(false);
  });

  it('rejects a request without consent', () => {
    const parsed = appointmentRequestSchema.safeParse(validAppointment({ consent: false }));
    expect(parsed.success).toBe(false);
  });

  it('rejects a filled honeypot', () => {
    const parsed = appointmentRequestSchema.safeParse(
      validAppointment({ website: 'https://spam.example' }),
    );
    expect(parsed.success).toBe(false);
  });

  it('rejects a bad service identifier', () => {
    const parsed = appointmentRequestSchema.safeParse(
      validAppointment({ serviceId: 'not-a-uuid' }),
    );
    expect(parsed.success).toBe(false);
  });

  it('rejects an over-long message', () => {
    const parsed = appointmentRequestSchema.safeParse(
      validAppointment({ message: 'x'.repeat(2001) }),
    );
    expect(parsed.success).toBe(false);
  });

  it('rejects control characters in a name', () => {
    const parsed = appointmentRequestSchema.safeParse(
      validAppointment({ patientName: 'Asha\u0007Menon' }),
    );
    expect(parsed.success).toBe(false);
  });

  it('uses the injected time zone for the past-date rule', () => {
    const schema = createAppointmentRequestSchema({ timeZone: 'UTC' });
    const parsed = schema.safeParse(validAppointment({ preferredDate: '2099-01-01' }));
    expect(parsed.success).toBe(true);
  });
});

describe('contact message validation', () => {
  it('accepts a message with an optional phone left blank', () => {
    const parsed = contactMessageSchema.safeParse({
      name: 'Ravi',
      email: 'ravi@example.com',
      phone: '',
      message: 'I would like to ask about a consultation.',
      website: '',
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.phone).toBe('');
  });

  it('rejects a message that is too short', () => {
    const parsed = contactMessageSchema.safeParse({
      name: 'Ravi',
      email: 'ravi@example.com',
      message: 'hi',
      website: '',
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a malformed optional phone number', () => {
    const parsed = contactMessageSchema.safeParse({
      name: 'Ravi',
      email: 'ravi@example.com',
      phone: 'call me',
      message: 'A perfectly long enough message.',
      website: '',
    });
    expect(parsed.success).toBe(false);
  });
});

describe('field-level schemas', () => {
  it('lowercases and trims email addresses', () => {
    const parsed = emailSchema.safeParse('  Person@Example.COM  ');
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toBe('person@example.com');
  });

  it('requires a plausible phone number', () => {
    expect(phoneSchema.safeParse('+44 20 7946 0958').success).toBe(true);
    expect(phoneSchema.safeParse('123').success).toBe(false);
    expect(phoneSchema.safeParse('not a phone').success).toBe(false);
  });

  it('treats an empty optional phone as absent', () => {
    const parsed = optionalPhoneSchema.safeParse('');
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toBe('');
  });

  it('accepts and normalises slugs', () => {
    const parsed = slugSchema.safeParse('  Dental-Consultation  ');
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toBe('dental-consultation');
    expect(slugSchema.safeParse('has spaces').success).toBe(false);
    expect(slugSchema.safeParse('double--hyphen').success).toBe(false);
  });
});
