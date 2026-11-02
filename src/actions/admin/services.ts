'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/authorize';
import { recordAudit } from '@/lib/db/audit';
import { getServiceById } from '@/lib/db/services';
import { AppError, ConflictError, NotFoundError } from '@/lib/errors';
import { actionFail, actionOk, type ActionState } from '@/lib/result';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { serviceFormSchema } from '@/lib/validation/admin';
import { fieldErrorsFromZod } from '@/lib/validation/errors';
import { uuidSchema } from '@/lib/validation/forms';
import { failFromError } from '../helpers';

function revalidateServicePages(): void {
  revalidatePath('/', 'layout');
  revalidatePath('/services');
  revalidatePath('/admin/services');
  revalidatePath('/admin');
}

export async function saveServiceAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireAdmin();

    const parsed = serviceFormSchema.safeParse({
      id: formData.get('id') ?? '',
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description') ?? '',
      displayOrder: formData.get('displayOrder') ?? 0,
      isActive: formData.get('isActive'),
    });

    if (!parsed.success) {
      return actionFail('Please check the service details.', {
        code: 'validation',
        fieldErrors: fieldErrorsFromZod(parsed.error),
      });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new AppError('configuration', 'The database is not configured yet.');

    const values = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      display_order: parsed.data.displayOrder,
      is_active: parsed.data.isActive,
    };

    const isUpdate = Boolean(parsed.data.id);

    const { data, error } = isUpdate
      ? await supabase
          .from('services')
          .update(values)
          .eq('id', parsed.data.id as string)
          .select('id')
          .maybeSingle()
      : await supabase.from('services').insert(values).select('id').single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictError('Another service already uses that URL slug.');
      }
      throw new AppError('database', 'The service could not be saved.', { cause: error });
    }

    if (!data) throw new NotFoundError('That service no longer exists.');

    await recordAudit({
      action: isUpdate ? 'service.updated' : 'service.created',
      resourceType: 'service',
      resourceId: data.id,
      metadata: { slug: parsed.data.slug, isActive: parsed.data.isActive, by: user.id },
    });

    revalidateServicePages();
    revalidatePath(`/services/${parsed.data.slug}`);

    return actionOk(undefined);
  } catch (error) {
    return failFromError(error);
  }
}

const deleteSchema = z.object({ id: uuidSchema });

export async function deleteServiceAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireAdmin();

    const parsed = deleteSchema.safeParse({ id: formData.get('id') });
    if (!parsed.success) {
      return actionFail('That service could not be identified.', {
        code: 'validation',
        fieldErrors: fieldErrorsFromZod(parsed.error),
      });
    }

    const service = await getServiceById(parsed.data.id);
    if (!service) throw new NotFoundError('That service no longer exists.');

    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new AppError('configuration', 'The database is not configured yet.');

    const { error } = await supabase.from('services').delete().eq('id', parsed.data.id);

    if (error) {
      if (error.code === '23503') {
        throw new ConflictError(
          'This service has appointment requests attached. Deactivate it instead of deleting it.',
        );
      }
      throw new AppError('database', 'The service could not be deleted.', { cause: error });
    }

    await recordAudit({
      action: 'service.deleted',
      resourceType: 'service',
      resourceId: parsed.data.id,
      metadata: { slug: service.slug, by: user.id },
    });

    revalidateServicePages();

    return actionOk(undefined);
  } catch (error) {
    return failFromError(error);
  }
}
