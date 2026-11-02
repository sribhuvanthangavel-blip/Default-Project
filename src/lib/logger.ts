/**
 * Minimal structured logger.
 *
 * Callers must never pass names, emails, phones or message bodies. As a second
 * line of defence, keys that look like personal data are replaced with
 * `[redacted]` before the entry is serialised, so a careless call site cannot
 * leak patient information into platform logs.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogFields {
  event: string;
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Keys that must never carry a raw value into logs. `event` is excluded because
 * it is a fixed, developer-authored identifier.
 */
const REDACTED_KEY =
  /(email|phone|name|message|notes?|token|key|authorization|cookie|password|secret|address)/i;

function redact(fields: LogFields): Record<string, unknown> {
  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (key !== 'event' && REDACTED_KEY.test(key)) {
      safe[key] = '[redacted]';
    } else {
      safe[key] = value;
    }
  }

  return safe;
}

function write(level: LogLevel, fields: LogFields): void {
  const entry = JSON.stringify({
    level,
    time: new Date().toISOString(),
    ...redact(fields),
  });

  if (level === 'error') console.error(entry);
  else console.warn(entry); // `no-console` allows warn/error; info stays visible.
}

export const logger = {
  info: (fields: LogFields) => write('info', fields),
  warn: (fields: LogFields) => write('warn', fields),
  error: (fields: LogFields) => write('error', fields),
};

/** One-way masking for the rare case a human-readable identifier is required. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***${digits.slice(-4)}`;
}
