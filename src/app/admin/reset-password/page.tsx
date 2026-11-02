import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { ResetPasswordForm } from '@/components/admin/reset-password-form';
import { getSessionUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  // Reached only via the recovery link, which the /auth/callback route has
  // already exchanged for a session.
  const user = await getSessionUser();
  if (!user) {
    redirect('/admin/forgot-password?expired=1');
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-14">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-8 font-display text-3xl text-forest-950">Choose a new password</h1>
          <p className="mt-2 text-sm text-muted">Signed in as {user.email}</p>
        </div>

        <div className="admin-card mt-8 p-6 sm:p-8">
          <ResetPasswordForm />
        </div>

        <p className="mt-6 text-center text-[0.75rem] text-muted">
          <Link href="/admin/login" className="link-underline">
            Return to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
