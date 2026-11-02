'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginAction } from '@/actions/auth';
import { initialActionState } from '@/lib/result';
import { FormMessage } from '@/components/admin/form-message';
import { SubmitButton } from '@/components/ui/submit-button';

interface LoginFormProps {
  next: string;
  notice?: string | null;
}

const NOTICES: Record<string, string> = {
  'signed-out': 'You have been signed out.',
  auth: 'Please sign in to continue.',
  'link-invalid': 'That link is no longer valid. Request a new one below.',
  configuration: 'Sign-in is not configured yet. See the deployment notes.',
};

export function LoginForm({ next, notice }: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, initialActionState);
  const message = notice ? (NOTICES[notice] ?? null) : null;
  const fieldErrors = state.ok ? undefined : state.fieldErrors;

  return (
    <form action={formAction} className="space-y-5">
      {message ? (
        <div className="rounded-xl border border-line bg-cream-100 px-4 py-3 text-sm text-muted">
          {message}
        </div>
      ) : null}

      {!state.ok ? <FormMessage message={state.error} code={state.code} /> : null}

      <input type="hidden" name="next" value={next} />

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
          aria-invalid={Boolean(fieldErrors?.email)}
          aria-describedby={fieldErrors?.email ? 'email-error' : undefined}
        />
        {fieldErrors?.email?.[0] ? (
          <p id="email-error" className="field-error" role="alert">
            {fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="password" className="admin-label">
            Password
          </label>
          <Link
            href="/admin/forgot-password"
            className="mb-1.5 text-[0.72rem] font-medium text-forest-700 underline underline-offset-2"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="admin-input"
          aria-invalid={Boolean(fieldErrors?.password)}
          aria-describedby={fieldErrors?.password ? 'password-error' : undefined}
        />
        {fieldErrors?.password?.[0] ? (
          <p id="password-error" className="field-error" role="alert">
            {fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      <SubmitButton className="btn-dark w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
