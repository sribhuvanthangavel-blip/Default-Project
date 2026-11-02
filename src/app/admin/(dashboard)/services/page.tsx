import Link from 'next/link';
import type { Metadata } from 'next';
import { requireStaffPage } from '@/lib/auth/authorize';
import { listAllServices } from '@/lib/db/services';
import { hasAtLeastRole } from '@/lib/auth/roles';
import { formatClinicDateTime } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Services',
  robots: { index: false, follow: false },
};

export default async function AdminServicesPage() {
  const user = await requireStaffPage();
  const services = await listAllServices();
  const isAdmin = hasAtLeastRole(user.role, 'admin');
  const activeCount = services.filter((service) => service.is_active).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-muted uppercase">
            Services
          </p>
          <h1 className="mt-2 font-display text-3xl text-forest-950">Treatment list</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            {activeCount} of {services.length} active. Inactive services are hidden from visitors
            and cannot be requested, but their appointment history is preserved.
          </p>
        </div>
        {isAdmin ? (
          <Link href="/admin/services/new" className="btn-dark btn-sm">
            Add a service
          </Link>
        ) : null}
      </header>

      {!isAdmin ? (
        <p className="rounded-xl border border-line bg-cream-100 px-4 py-3 text-sm leading-6 text-muted">
          Your role can view the treatment list but not change it. Ask an administrator for the
          admin role if you need to edit services.
        </p>
      ) : null}

      {services.length === 0 ? (
        <div className="admin-card px-5 py-14 text-center">
          <p className="font-display text-xl text-forest-950">No services yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
            The public appointment form stays paused until at least one service is active.
          </p>
          {isAdmin ? (
            <Link href="/admin/services/new" className="btn-dark btn-sm mt-5">
              Add the first service
            </Link>
          ) : null}
        </div>
      ) : (
        <section className="admin-card overflow-hidden">
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Treatment list</caption>
              <thead>
                <tr>
                  <th scope="col">Service</th>
                  <th scope="col">Slug</th>
                  <th scope="col">Order</th>
                  <th scope="col">Visibility</th>
                  <th scope="col">Updated</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <p className="font-medium text-forest-950">{service.name}</p>
                      <p className="mt-1 line-clamp-2 max-w-md text-[0.75rem] leading-5 text-muted">
                        {service.description || 'No description yet.'}
                      </p>
                    </td>
                    <td className="font-mono text-[0.72rem] text-muted">/{service.slug}</td>
                    <td className="text-muted">{service.display_order}</td>
                    <td>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[0.66rem] font-semibold tracking-wide uppercase ${
                          service.is_active
                            ? 'border-sage-600/25 bg-sage-100 text-forest-900'
                            : 'border-line bg-cream-200 text-muted'
                        }`}
                      >
                        {service.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="text-[0.72rem] whitespace-nowrap text-muted">
                      {formatClinicDateTime(service.updated_at)}
                    </td>
                    <td className="text-right">
                      {isAdmin ? (
                        <Link
                          href={`/admin/services/${service.id}`}
                          className="text-[0.72rem] font-semibold tracking-[0.1em] text-forest-800 uppercase hover:text-forest-600"
                        >
                          Edit
                        </Link>
                      ) : (
                        <span className="text-[0.72rem] text-muted">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="text-[0.72rem] leading-6 text-muted">
        Never publish claims about outcomes, guarantees, prices or credentials that the clinic has
        not verified. If in doubt, describe the process rather than a promise.
      </p>
    </div>
  );
}
