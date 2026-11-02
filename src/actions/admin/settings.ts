'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/authorize';
import { recordAudit } from '@/lib/db/audit';
import { AppError } from '@/lib/errors';
import { actionFail, actionOk, type ActionState } from '@/lib/result';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { settingsFormSchema } from '@/lib/validation/admin';
import { fieldErrorsFromZod } from '@/lib/validation/errors';
import { failFromError } from '../helpers';

const SETTING_KEY_MAP = {
  clinicPhone: 'clinic_phone',
  clinicWhatsapp: 'clinic_whatsapp',
  clinicEmail: 'clinic_email',
  clinicAddress: 'clinic_address',
  clinicHours: 'clinic_hours',
  clinicMapUrl: 'clinic_map_url',
  announcement: 'announcement',
  bookingEnabled: 'booking_enabled',
} as const;

export async function saveSettingsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireAdmin();

    const parsed = settingsFormSchema.safeParse({
      clinicPhone: formData.get('clinicPhone') ?? '',
      clinicWhatsapp: formData.get('clinicWhatsapp') ?? '',
      clinicEmail: formData.get('clinicEmail') ?? '',
      clinicAddress: formData.get('clinicAddress') ?? '',
      clinicHours: formData.get('clinicHours') ?? '',
      clinicMapUrl: formData.get('clinicMapUrl') ?? '',
      announcement: formData.get('announcement') ?? '',
      bookingEnabled: formData.get('bookingEnabled'),
    });

    if (!parsed.success) {
      return actionFail('Please check the clinic details.', {
        code: 'validation',
        fieldErrors: fieldErrorsFromZod(parsed.error),
      });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new AppError('configuration', 'The database is not configured yet.');

    const rows = (
      Object.entries(SETTING_KEY_MAP) as Array<
        [keyof typeof SETTING_KEY_MAP, (typeof SETTING_KEY_MAP)[keyof typeof SETTING_KEY_MAP]]
      >
    ).map(([field, settingKey]) => ({
      setting_key: settingKey,
      setting_value: parsed.data[field] as string | boolean,
      is_public: true,
      updated_by: user.id,
    }));

    const { error } = await supabase
      .from('site_settings')
      .upsert(rows, { onConflict: 'setting_key' });

    if (error) {
      throw new AppError('database', 'The clinic details could not be saved.', { cause: error });
    }

    await recordAudit({
      action: 'settings.updated',
      resourceType: 'site_settings',
      resourceId: 'public',
      metadata: { keys: rows.map((row) => row.setting_key), by: user.id },
    });

    revalidatePath('/', 'layout');
    revalidatePath('/admin/settings');

    return actionOk(undefined);
  } catch (error) {
    return failFromError(error);
  }
}
