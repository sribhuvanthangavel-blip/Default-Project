import 'server-only';
import { logger } from '@/lib/logger';

async function sendClinicEmail(subject: string, text: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const to = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();

  if (!apiKey || !from || !to) return;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });

    if (!response.ok) {
      logger.warn({ event: 'email.send_failed', status: response.status });
    }
  } catch {
    logger.warn({ event: 'email.send_failed' });
  }
}

export interface AppointmentNotification {
  reference: string;
  patientName: string;
  phone: string;
  email: string;
  serviceName: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
}

/**
 * Optional clinic notification via Resend. When credentials are absent the
 * request is still stored and visible in the dashboard; email is a convenience,
 * never the source of truth.
 */
export async function sendAppointmentNotification(
  notification: AppointmentNotification,
): Promise<void> {
  if (!process.env.RESEND_API_KEY?.trim()) return;

  const text = [
    `New appointment request (${notification.reference})`,
    '',
    `Name: ${notification.patientName}`,
    `Phone: ${notification.phone}`,
    `Email: ${notification.email}`,
    `Service: ${notification.serviceName}`,
    `Preferred date: ${notification.preferredDate}`,
    `Preferred time: ${notification.preferredTime}`,
    '',
    'Message:',
    notification.message || '(none)',
    '',
    'This is a request, not a confirmed booking. Sign in to the dashboard to confirm.',
  ].join('\n');

  await sendClinicEmail(`New appointment request — ${notification.reference}`, text);
}

export async function sendContactNotification(input: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY?.trim()) return;

  const text = [
    'New website contact message',
    '',
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone || '(not provided)'}`,
    '',
    input.message,
  ].join('\n');

  await sendClinicEmail('New website contact message', text);
}
