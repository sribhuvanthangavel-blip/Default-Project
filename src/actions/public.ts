'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { appointmentReference } from '@/lib/dates';
import { createAppointmentRequest, hasRecentDuplicateAppointment } from '@/lib/db/appointments';
import { createContactMessage, hasRecentDuplicateMessage } from '@/lib/db/messages';
import { listPublicServices } from '@/lib/db/services';
import { getPublicSettings } from '@/lib/db/settings';
import { sendAppointmentNotification, sendContactNotification } from '@/lib/email';
import { RateLimitError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { actionFail, actionOk, type ActionResult } from '@/lib/result';
import { hashClientIp, getClientIp } from '@/lib/security/ip';
import { publicFormRateLimiter } from '@/lib/security/rate-limit';
import { fieldErrorsFromZod } from '@/lib/validation/errors';
import { appointmentRequestSchema, contactMessageSchema } from '@/lib/validation/forms';
import { failFromError } from './helpers';

const MIN_FILL_MS = 2500;
const MAX_FORM_AGE_MS = 24 * 60 * 60 * 1000;

async function checkRateLimit(scope: string): Promise<void> {
  const headerList = await headers();
  const key = `${scope}:${hashClientIp(getClientIp(headerList))}`;
  const result = publicFormRateLimiter.check(key);
  if (!result.ok) {
    logger.warn({ event: 'public_form.rate_limited', scope });
    throw new RateLimitError();
  }
}

/** Returns true when the timing data is clearly automated. */
function looksAutomated(formStartedAt: number | undefined, now = Date.now()): boolean {
  if (!formStartedAt) return false;
  const age = now - formStartedAt;
  return age < MIN_FILL_MS || age > MAX_FORM_AGE_MS;
}

export async function submitAppointmentRequest(
  raw: unknown,
): Promise<ActionResult<{ reference: string }>> {
  try {
    await checkRateLimit('appointment');

    const parsed = appointmentRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return actionFail('Please check the highlighted fields and try again.', {
        code: 'validation',
        fieldErrors: fieldErrorsFromZod(parsed.error),
      });
    }

    const input = parsed.data;

    // Honeypot: silently accept so bots receive no feedback, but write nothing.
    if (input.website) {
      logger.warn({ event: 'public_form.honeypot_triggered', scope: 'appointment' });
      return actionOk({ reference: 'JD-RECEIVED' });
    }

    if (looksAutomated(input.formStartedAt)) {
      return actionFail('Please take a moment to review your details, then submit again.', {
        code: 'validation',
      });
    }

    const settings = await getPublicSettings();
    if (!settings.bookingEnabled) {
      return actionFail(
        'Online appointment requests are paused right now. Please contact the clinic directly.',
        { code: 'conflict' },
      );
    }

    const services = await listPublicServices();
    const service = services.find((item) => item.id === input.serviceId);
    if (!service) {
      return actionFail('Please choose a service from the list.', {
        code: 'validation',
        fieldErrors: { serviceId: ['Choose a service from the list.'] },
      });
    }

    if (await hasRecentDuplicateAppointment({ email: input.email, phone: input.phone })) {
      return actionFail(
        'We have already received a request from you recently. The clinic will be in touch. To change something, please contact the clinic.',
        { code: 'duplicate' },
      );
    }

    const { id } = await createAppointmentRequest(input);
    const reference = appointmentReference(id);

    await sendAppointmentNotification({
      reference,
      patientName: input.patientName,
      phone: input.phone,
      email: input.email,
      serviceName: service.name,
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      message: input.message ?? '',
    });

    logger.info({ event: 'appointment.request_created' });
    revalidatePath('/admin');
    revalidatePath('/admin/appointments');

    return actionOk({ reference });
  } catch (error) {
    return failFromError(error);
  }
}

export async function submitContactMessage(
  raw: unknown,
): Promise<ActionResult<{ received: true }>> {
  try {
    await checkRateLimit('contact');

    const parsed = contactMessageSchema.safeParse(raw);
    if (!parsed.success) {
      return actionFail('Please check the highlighted fields and try again.', {
        code: 'validation',
        fieldErrors: fieldErrorsFromZod(parsed.error),
      });
    }

    const input = parsed.data;

    if (input.website) {
      logger.warn({ event: 'public_form.honeypot_triggered', scope: 'contact' });
      return actionOk({ received: true });
    }

    if (looksAutomated(input.formStartedAt)) {
      return actionFail('Please take a moment to review your message, then submit again.', {
        code: 'validation',
      });
    }

    if (await hasRecentDuplicateMessage({ email: input.email })) {
      return actionFail(
        'We have already received a message from you recently. The clinic will respond as soon as it can.',
        { code: 'duplicate' },
      );
    }

    await createContactMessage(input);
    await sendContactNotification({
      name: input.name,
      email: input.email,
      phone: input.phone ?? '',
      message: input.message,
    });

    logger.info({ event: 'contact.message_created' });
    revalidatePath('/admin');
    revalidatePath('/admin/messages');

    return actionOk({ received: true });
  } catch (error) {
    return failFromError(error);
  }
}
