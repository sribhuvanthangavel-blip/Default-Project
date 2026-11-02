import Link from 'next/link';
import type { Metadata } from 'next';
import { Logo } from '@/components/ui/logo';
import { ForgotPasswordForm } from '@/components/admin/forgot-password-form';
import { SuccessMessage } from '@/components/admin/form-message';

export const metadata: Metadata = {
  title: 'Reset your password',
  robots: { index: false, follow: false },
};

interface ForgotPasswordPageProps {
  searchParams: Promise<{ sent?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const { sent } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-14">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-8 font-display text-3xl text-forest-950">Reset your password</h1>
          <p className="mt-2 text-sm text-muted">
            Staff accounts only. A reset link is emailed to the address on file.
          </p>
        </div>

        <div className="admin-card mt-8 p-6 sm:p-8">
          {sent ? (
            <div className="space-y-4">
              <SuccessMessage message="Request received. If that address belongs to a staff account, a reset link is on its way. Check the inbox and the spam folder." />
              <p className="text-[0.8rem] leading-6 text-muted">
                The link expires after a short time. If it does not arrive, ask the site
                administrator to confirm your account email address in Supabase.
              </p>
              <Link href="/admin/login" className="btn-outline btn-sm w-full">
                Back to sign in
              </Link>
            </div>
          ) : (
            <ForgotPasswordForm />
          )}
        </div>
      </div>
    </main>
  );
}
