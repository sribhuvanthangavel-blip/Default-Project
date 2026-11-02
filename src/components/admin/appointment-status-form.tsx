'use client';

import { useActionState } from 'react';
import { setAppointmentStatusAction } from '@/actions/admin/appointments';
import { initialActionState } from '@/lib/result';
import { FormMessage } from '@/components/admin/form-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { STATUS_LABELS } from '@/lib/appointments/status';
import type { AppointmentStatus } from '@/types/database';

interface StatusFormProps {
  id: string;
  options: readonly AppointmentStatus[];
}

const BUTTON_STYLES: Record<AppointmentStatus, string> = {
  pending: 'btn-outline',
  confirmed: 'btn-dark',
  completed: 'btn-outline',
  cancelled: 'btn-danger',
};

const CONFIRM: Partial<Record<AppointmentStatus, string>> = {
  cancelled: 'Cancel this appointment? The patient will still need to be told directly.',
  completed: 'Mark this appointment as completed? This cannot be changed afterwards.',
};

export function AppointmentStatusForm({ id, options }: StatusFormProps) {
  const [state, formAction] = useActionState(setAppointmentStatusAction, initialActionState);

  if (options.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-cream-100 px-4 py-3 text-[0.8rem] leading-6 text-muted">
        This appointment is in a final state. No further status changes are possible.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {!state.ok ? <FormMessage message={state.error} code={state.code} /> : null}

      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <form key={option} action={formAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value={option} />
            <SubmitButton
              className={`${BUTTON_STYLES[option]} btn-sm`}
              pendingLabel="Updating…"
              confirmMessage={CONFIRM[option]}
            >
              Mark {STATUS_LABELS[option].toLowerCase()}
            </SubmitButton>
          </form>
        ))}
      </div>

      <p className="text-[0.7rem] leading-5 text-muted">
        Changing the status is recorded in the audit log. The patient is not notified automatically
        — contact them directly.
      </p>
    </div>
  );
}
