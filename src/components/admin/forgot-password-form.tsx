'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { requestPasswordResetAction } from '@/actions/auth';
import { initialActionState } from '@/lib/result';
import { FormMessage } from '@/components/admin/form-message';
import { SubmitButton } from '@/components/ui/submit-button';

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialActionState);

  return (
    <form action={formAction} className="space-y-5">
      {state.ok ? (
        <p className="rounded-xl border border-line bg-cream-100 px-4 py-3 text-sm leading-6 text-muted">
          Enter the email address used for your staff account. If it exists, a reset link will be
          sent. We do not confirm whether an address is registered.
        </p>
      ) : (
        <FormMessage message={state.error} code={state.code} />
      )}

      <div>
        <label htmlFor="email" className="admin-label">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="admin-input"
        />
      </div>

      <SubmitButton className="btn-dark w-full" pendingLabel="Sending…">
        Send reset link
      </SubmitButton>

      <p className="text-center text-[0.75rem] text-muted">
        <Link href="/admin/login" className="link-underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
