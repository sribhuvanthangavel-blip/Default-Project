import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/auth/authorize';
import { getServiceById } from '@/lib/db/services';
import { ServiceForm } from '@/components/admin/service-form';
import { DeleteServiceForm } from '@/components/admin/delete-service-form';
import { ArrowLeftIcon, ExternalLinkIcon } from '@/components/ui/icons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Edit service',
  robots: { index: false, follow: false },
};

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const service = await getServiceById(id);
  if (!service) notFound();

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
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl text-forest-950">{service.name}</h1>
          {service.is_active ? (
            <Link
              href={`/services/${service.slug}`}
              className="btn-outline btn-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on the public site
              <ExternalLinkIcon className="size-3.5" />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="admin-card p-5 sm:p-7">
        <ServiceForm service={service} />
      </div>

      <div className="admin-card border-clay-700/20 p-5 sm:p-7">
        <h2 className="font-display text-xl text-forest-950">Delete this service</h2>
        <p className="mt-2 max-w-xl text-[0.82rem] leading-6 text-muted">
          Deletion is permanent. A service with appointment requests attached cannot be deleted —
          deactivate it instead so the history stays intact.
        </p>
        <div className="mt-4">
          <DeleteServiceForm id={service.id} name={service.name} />
        </div>
      </div>
    </div>
  );
}
