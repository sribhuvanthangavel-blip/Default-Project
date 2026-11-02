'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth/authorize';
import { updateMessageStatus } from '@/lib/db/messages';
import { recordAudit } from '@/lib/db/audit';
import { actionFail, actionOk, type ActionState } from '@/lib/result';
import { fieldErrorsFromZod } from '@/lib/validation/errors';
import { uuidSchema } from '@/lib/validation/forms';
import { failFromError } from '../helpers';

const schema = z.object({
  id: uuidSchema,
  status: z.enum(['new', 'read', 'archived']),
});

export async function setMessageStatusAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireStaff();

    const parsed = schema.safeParse({
      id: formData.get('id'),
      status: formData.get('status'),
    });

    if (!parsed.success) {
      return actionFail('That message update was not valid.', {
        code: 'validation',
        fieldErrors: fieldErrorsFromZod(parsed.error),
      });
    }

    await updateMessageStatus(parsed.data.id, parsed.data.status);

    await recordAudit({
      action: 'contact_message.status_changed',
      resourceType: 'contact_message',
      resourceId: parsed.data.id,
      metadata: { to: parsed.data.status, by: user.id },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/messages');

    return actionOk(undefined);
  } catch (error) {
    return failFromError(error);
  }
}
