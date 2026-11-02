'use client';

import { useActionState } from 'react';
import { updatePasswordAction } from '@/actions/auth';
import { initialActionState } from '@/lib/result';
import { FormMessage } from '@/components/admin/form-message';
import { SubmitButton } from '@/components/ui/submit-button';

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, initialActionState);
  const fieldErrors = state.ok ? undefined : state.fieldErrors;

  return (
    <form action={formAction} className="space-y-5">
      {!state.ok ? <FormMessage message={state.error} code={state.code} /> : null}

      <div>
        <label htmlFor="password" className="admin-label">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className="admin-input"
          aria-invalid={Boolean(fieldErrors?.password)}
          aria-describedby="password-hint"
        />
        <p id="password-hint" className="field-hint">
          At least 12 characters, including letters and numbers.
        </p>
        {fieldErrors?.password?.[0] ? (
          <p className="field-error" role="alert">
            {fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="admin-label">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="admin-input"
          aria-invalid={Boolean(fieldErrors?.confirmPassword)}
        />
        {fieldErrors?.confirmPassword?.[0] ? (
          <p className="field-error" role="alert">
            {fieldErrors.confirmPassword[0]}
          </p>
        ) : null}
      </div>

      <SubmitButton className="btn-dark w-full" pendingLabel="Updating…">
        Update password
      </SubmitButton>
    </form>
  );
}
