'use client';

import { saveAppointmentNotesAction } from '@/actions/admin/appointments';
import { FormMessage, SuccessMessage } from '@/components/admin/form-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { useTrackedAction } from '@/components/admin/use-tracked-action';

interface NotesFormProps {
  id: string;
  initialNotes: string;
}

export function AppointmentNotesForm({ id, initialNotes }: NotesFormProps) {
  const { state, formAction, saved } = useTrackedAction(saveAppointmentNotesAction);

  return (
    <form action={formAction} className="space-y-3">
      {!state.ok ? <FormMessage message={state.error} code={state.code} /> : null}
      {saved ? <SuccessMessage message="Note saved." /> : null}

      <input type="hidden" name="id" value={id} />

      <div>
        <label htmlFor="notes" className="admin-label">
          Private staff note
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={6}
          maxLength={4000}
          defaultValue={initialNotes}
          placeholder="Internal notes for clinic staff. Visible only in this dashboard."
          className="admin-input resize-y"
          aria-describedby="notes-hint"
        />
        <p id="notes-hint" className="field-hint">
          Do not paste clinical records here. Notes are stored with the appointment and are only
          visible to signed-in staff.
        </p>
      </div>

      <SubmitButton className="btn-dark btn-sm" pendingLabel="Saving…">
        Save note
      </SubmitButton>
    </form>
  );
}
