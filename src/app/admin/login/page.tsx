import Link from 'next/link';
import type { Metadata } from 'next';
import { Logo } from '@/components/ui/logo';
import { LoginForm } from '@/components/admin/login-form';
import { isSupabaseConfigured } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Staff sign in',
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; reason?: string }>;
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next =
    params.next && params.next.startsWith('/admin') && !params.next.startsWith('//')
      ? params.next
      : '/admin';

  const configured = isSupabaseConfigured();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-14">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-8 font-display text-3xl text-forest-950">Staff sign in</h1>
          <p className="mt-2 text-sm text-muted">
            This area is for clinic staff. There is no public registration.
          </p>
        </div>

        <div className="admin-card mt-8 p-6 sm:p-8">
          {configured ? (
            <LoginForm next={next} notice={params.reason ?? null} />
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-700/25 bg-amber-100 px-4 py-3 text-sm leading-6 text-amber-700">
                <p className="font-semibold">Supabase is not configured.</p>
                <p className="mt-1">
                  Add <code className="font-mono text-[0.8rem]">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
                  <code className="font-mono text-[0.8rem]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to
                  your environment, then restart the server. See{' '}
                  <span className="font-mono text-[0.8rem]">docs/DEPLOYMENT.md</span>.
                </p>
              </div>
              <p className="text-[0.8rem] leading-6 text-muted">
                Until a Supabase project and an administrator account exist, the dashboard cannot be
                used. The public website still works and will show only clinic details that have
                been published.
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[0.75rem] text-muted">
          <Link href="/" className="link-underline">
            Return to the public website
          </Link>
        </p>
      </div>
    </main>
  );
}
