import type { Json, SiteSetting } from '@/types/database';

export interface PublicSettings {
  clinicPhone: string;
  clinicWhatsapp: string;
  clinicEmail: string;
  clinicAddress: string;
  clinicHours: string;
  clinicMapUrl: string;
  announcement: string;
  bookingEnabled: boolean;
}

export const EMPTY_PUBLIC_SETTINGS: PublicSettings = {
  clinicPhone: '',
  clinicWhatsapp: '',
  clinicEmail: '',
  clinicAddress: '',
  clinicHours: '',
  clinicMapUrl: '',
  announcement: '',
  bookingEnabled: true,
};

export const PUBLIC_SETTING_KEYS = [
  'clinic_phone',
  'clinic_whatsapp',
  'clinic_email',
  'clinic_address',
  'clinic_hours',
  'clinic_map_url',
  'announcement',
  'booking_enabled',
] as const;

function asString(value: Json | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asBoolean(value: Json | undefined, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return fallback;
}

export function parsePublicSettings(
  rows: ReadonlyArray<Pick<SiteSetting, 'setting_key' | 'setting_value'>>,
): PublicSettings {
  const map = new Map(rows.map((row) => [row.setting_key, row.setting_value]));

  return {
    clinicPhone: asString(map.get('clinic_phone')),
    clinicWhatsapp: asString(map.get('clinic_whatsapp')),
    clinicEmail: asString(map.get('clinic_email')),
    clinicAddress: asString(map.get('clinic_address')),
    clinicHours: asString(map.get('clinic_hours')),
    clinicMapUrl: asString(map.get('clinic_map_url')),
    announcement: asString(map.get('announcement')),
    bookingEnabled: asBoolean(map.get('booking_enabled'), true),
  };
}

export function hasContactDetails(settings: PublicSettings): boolean {
  return Boolean(settings.clinicPhone || settings.clinicEmail || settings.clinicAddress);
}

/** Converts a stored phone number into a tel: link, or null when unavailable. */
export function telHref(phone: string): string | null {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned.length >= 7 ? `tel:${cleaned}` : null;
}

/** WhatsApp requires an international number without punctuation. */
export function whatsappHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}

export function mailtoHref(email: string): string | null {
  const trimmed = email.trim();
  return trimmed.includes('@') ? `mailto:${trimmed}` : null;
}
