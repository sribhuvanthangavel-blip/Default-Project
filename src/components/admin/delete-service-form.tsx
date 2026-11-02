'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteServiceAction } from '@/actions/admin/services';
import { FormMessage } from '@/components/admin/form-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { useTrackedAction } from '@/components/admin/use-tracked-action';

export function DeleteServiceForm({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const { state, formAction, saved } = useTrackedAction(deleteServiceAction);

  useEffect(() => {
    if (saved) router.push('/admin/services');
  }, [saved, router]);

  return (
    <form action={formAction} className="space-y-2">
      {!state.ok ? <FormMessage message={state.error} code={state.code} /> : null}
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        className="btn-danger btn-sm"
        pendingLabel="Deleting…"
        confirmMessage={`Delete "${name}" permanently? If it has appointment requests attached, deactivate it instead.`}
      >
        Delete
      </SubmitButton>
    </form>
  );
}
