import { getPublicSettings } from '@/lib/db/settings';
import { telHref } from '@/lib/settings';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-full bg-forest-950 px-5 py-3 text-sm font-medium text-cream-50 focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>

      <SiteHeader
        announcement={settings.announcement}
        phone={settings.clinicPhone}
        phoneHref={telHref(settings.clinicPhone)}
        bookingEnabled={settings.bookingEnabled}
      />

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      <SiteFooter settings={settings} />
    </>
  );
}
