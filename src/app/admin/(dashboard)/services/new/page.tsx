import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/auth/authorize';
import { ServiceForm } from '@/components/admin/service-form';
import { ArrowLeftIcon } from '@/components/ui/icons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'New service',
  robots: { index: false, follow: false },
};

export default async function NewServicePage() {
  await requireAdminPage();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/services"
          className="inline-flex items-center gap-2 text-[0.72rem] font-semibold tracking-[0.12em] text-muted uppercase transition hover:text-forest-900"
        >
          <ArrowLeftIcon className="size-3.5" />
          All services
        </Link>
        <h1 className="mt-4 font-display text-3xl text-forest-950">Add a service</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          New services start hidden if you leave the visibility box unticked. Review the wording
          before publishing — patients rely on it.
        </p>
      </div>

      <div className="admin-card p-5 sm:p-7">
        <ServiceForm />
      </div>
    </div>
  );
}
