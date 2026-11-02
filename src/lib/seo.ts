import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from '@/lib/env';
import type { PublicSettings } from '@/lib/settings';
import type { Service } from '@/types/database';

type JsonLd = Record<string, unknown>;

/**
 * Structured data only contains verified values. Fields the clinic has not
 * supplied (phone, address) are omitted rather than invented. No review,
 * rating or price markup is emitted because none has been verified.
 */
export function buildDentistJsonLd(settings: PublicSettings): JsonLd {
  const base = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    '@id': `${base}/#clinic`,
    name: SITE_NAME,
    url: base,
    description: SITE_DESCRIPTION,
    ...(settings.clinicPhone ? { telephone: settings.clinicPhone } : {}),
    ...(settings.clinicEmail ? { email: settings.clinicEmail } : {}),
    ...(settings.clinicAddress ? { address: settings.clinicAddress } : {}),
    ...(settings.clinicMapUrl ? { hasMap: settings.clinicMapUrl } : {}),
  };
}

export function buildServiceJsonLd(service: Service): JsonLd {
  const base = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: service.name,
    description: service.description,
    url: `${base}/services/${service.slug}`,
    ...(service.description ? {} : {}),
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>): JsonLd {
  const base = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  };
}

/** Serialise JSON-LD without allowing `</script>` injection. */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}
