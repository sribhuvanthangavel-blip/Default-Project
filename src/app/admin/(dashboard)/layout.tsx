import { requireStaffPage } from '@/lib/auth/authorize';
import { getNavCounts } from '@/lib/db/appointments';
import { AdminNav } from '@/components/admin/admin-nav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaffPage();
  const counts = await getNavCounts();

  return (
    <div className="lg:flex lg:h-dvh">
      <AdminNav
        role={user.role}
        name={user.fullName}
        email={user.email}
        pendingCount={counts.pending}
        newMessageCount={counts.newMessages}
      />
      <main className="min-w-0 flex-1 px-5 py-7 sm:px-8 lg:h-dvh lg:overflow-y-auto lg:py-10">
        {children}
      </main>
    </div>
  );
}
