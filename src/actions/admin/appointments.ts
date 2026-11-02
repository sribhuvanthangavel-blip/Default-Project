'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth/authorize';
import { updateAppointmentNotes, updateAppointmentStatus } from '@/lib/db/appointments';
import { recordAudit } from '@/lib/db/audit';
import { actionFail, actionOk, type ActionState } from '@/lib/result';
import { uuidSchema } from '@/lib/validation/forms';
import { fieldErrorsFromZod } from '@/lib/validation/errors';
import { failFromError } from '../helpers';

const statusSchema = z.object({
  id: uuidSchema,
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
});

export async function setAppointmentStatusAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireStaff();

    const parsed = statusSchema.safeParse({
      id: formData.get('id'),
      status: formData.get('status'),
    });

    if (!parsed.success) {
      return actionFail('That status update was not valid.', {
        code: 'validation',
        fieldErrors: fieldErrorsFromZod(parsed.error),
      });
    }

    const { id, status } = parsed.data;
    const result = await updateAppointmentStatus(id, status);

    await recordAudit({
      action: 'appointment.status_changed',
      resourceType: 'appointment',
      resourceId: id,
      metadata: { from: result.previousStatus, to: result.status, by: user.id },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/appointments');
    revalidatePath(`/admin/appointments/${id}`);

    return actionOk(undefined);
  } catch (error) {
    return failFromError(error);
  }
}

const notesSchema = z.object({
  id: uuidSchema,
  notes: z.string().trim().max(4000, 'Keep notes under 4000 characters.'),
});

export async function saveAppointmentNotesAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireStaff();

    const parsed = notesSchema.safeParse({
      id: formData.get('id'),
      notes: formData.get('notes') ?? '',
    });

    if (!parsed.success) {
      return actionFail('The note could not be saved.', {
        code: 'validation',
        fieldErrors: fieldErrorsFromZod(parsed.error),
      });
    }

    await updateAppointmentNotes(parsed.data.id, parsed.data.notes);

    await recordAudit({
      action: 'appointment.notes_updated',
      resourceType: 'appointment',
      resourceId: parsed.data.id,
      // Never store the note itself: it may contain health information.
      metadata: { length: parsed.data.notes.length, by: user.id },
    });

    revalidatePath(`/admin/appointments/${parsed.data.id}`);

    return actionOk(undefined);
  } catch (error) {
    return failFromError(error);
  }
}
