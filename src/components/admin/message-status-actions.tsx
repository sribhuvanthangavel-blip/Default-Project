'use client';

import { useActionState } from 'react';
import { setMessageStatusAction } from '@/actions/admin/messages';
import { initialActionState } from '@/lib/result';
import { FormMessage } from '@/components/admin/form-message';
import { SubmitButton } from '@/components/ui/submit-button';
import type { ContactMessageStatus } from '@/types/database';

const LABELS: Record<ContactMessageStatus, string> = {
  new: 'Mark unread',
  read: 'Mark read',
  archived: 'Archive',
};

export function MessageStatusActions({
  id,
  current,
}: {
  id: string;
  current: ContactMessageStatus;
}) {
  const [state, formAction] = useActionState(setMessageStatusAction, initialActionState);

  const options: ContactMessageStatus[] = (['new', 'read', 'archived'] as const).filter(
    (status) => status !== current,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!state.ok ? (
        <div className="w-full">
          <FormMessage message={state.error} code={state.code} />
        </div>
      ) : null}

      {options.map((status) => (
        <form key={status} action={formAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={status} />
          <SubmitButton className="btn-outline btn-sm" pendingLabel="…">
            {LABELS[status]}
          </SubmitButton>
        </form>
      ))}
    </div>
  );
}
