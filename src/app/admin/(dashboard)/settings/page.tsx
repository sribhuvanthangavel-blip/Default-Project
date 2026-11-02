import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/auth/authorize';
import { getPublicSettings } from '@/lib/db/settings';
import { SettingsForm } from '@/components/admin/settings-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Clinic settings',
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const user = await requireAdminPage();
  const settings = await getPublicSettings();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-muted uppercase">
          Settings
        </p>
        <h1 className="mt-2 font-display text-3xl text-forest-950">Clinic details</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          These values are stored in the database and published on the public website. Only publish
          details the clinic has verified.
        </p>
      </header>

      <div className="admin-card p-5 sm:p-7">
        <SettingsForm settings={settings} />
      </div>

      <p className="text-[0.72rem] leading-6 text-muted">
        Changes are attributed to {user.email}. Published static copy (page headings, process
        explanations, legal text) lives in the repository under{' '}
        <code className="font-mono text-[0.7rem]">src/content</code> and is changed by a developer,
        so that edits are reviewed and versioned.
      </p>
    </div>
  );
}
