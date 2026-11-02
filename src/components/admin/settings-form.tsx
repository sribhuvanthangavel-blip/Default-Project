'use client';

import { saveSettingsAction } from '@/actions/admin/settings';
import { FormMessage, SuccessMessage } from '@/components/admin/form-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { useTrackedAction } from '@/components/admin/use-tracked-action';
import type { PublicSettings } from '@/lib/settings';

export function SettingsForm({ settings }: { settings: PublicSettings }) {
  const { state, formAction, saved } = useTrackedAction(saveSettingsAction);
  const errors = state.ok ? undefined : state.fieldErrors;

  return (
    <form action={formAction} className="space-y-6">
      {!state.ok ? <FormMessage message={state.error} code={state.code} /> : null}
      {saved ? <SuccessMessage message="Clinic details saved and published." /> : null}

      <fieldset className="space-y-5">
        <legend className="font-display text-xl text-forest-950">Contact details</legend>
        <p className="text-[0.8rem] leading-6 text-muted">
          Leave a field blank if the clinic has not confirmed it. Blank fields are hidden on the
          public site rather than filled with placeholder text.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="clinicPhone" className="admin-label">
              Phone number
            </label>
            <input
              id="clinicPhone"
              name="clinicPhone"
              type="tel"
              defaultValue={settings.clinicPhone}
              placeholder="+91 00000 00000"
              className="admin-input"
            />
            {errors?.clinicPhone?.[0] ? (
              <p className="field-error" role="alert">
                {errors.clinicPhone[0]}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="clinicWhatsapp" className="admin-label">
              WhatsApp number
            </label>
            <input
              id="clinicWhatsapp"
              name="clinicWhatsapp"
              type="tel"
              defaultValue={settings.clinicWhatsapp}
              placeholder="Include the country code"
              className="admin-input"
            />
            <p className="field-hint">Used to build a wa.me link. Digits and + only.</p>
            {errors?.clinicWhatsapp?.[0] ? (
              <p className="field-error" role="alert">
                {errors.clinicWhatsapp[0]}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="clinicEmail" className="admin-label">
            Public email address
          </label>
          <input
            id="clinicEmail"
            name="clinicEmail"
            type="email"
            defaultValue={settings.clinicEmail}
            placeholder="reception@example.com"
            className="admin-input"
          />
          {errors?.clinicEmail?.[0] ? (
            <p className="field-error" role="alert">
              {errors.clinicEmail[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="clinicAddress" className="admin-label">
            Address
          </label>
          <textarea
            id="clinicAddress"
            name="clinicAddress"
            rows={3}
            maxLength={300}
            defaultValue={settings.clinicAddress}
            className="admin-input resize-y"
          />
          {errors?.clinicAddress?.[0] ? (
            <p className="field-error" role="alert">
              {errors.clinicAddress[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="clinicHours" className="admin-label">
            Opening hours
          </label>
          <textarea
            id="clinicHours"
            name="clinicHours"
            rows={3}
            maxLength={500}
            defaultValue={settings.clinicHours}
            placeholder={'Monday–Friday, 9:00–17:00\nSaturday, 9:00–13:00'}
            className="admin-input resize-y"
          />
          <p className="field-hint">Line breaks are preserved on the public site.</p>
          {errors?.clinicHours?.[0] ? (
            <p className="field-error" role="alert">
              {errors.clinicHours[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="clinicMapUrl" className="admin-label">
            Map link
          </label>
          <input
            id="clinicMapUrl"
            name="clinicMapUrl"
            type="url"
            defaultValue={settings.clinicMapUrl}
            placeholder="https://maps.example.com/…"
            className="admin-input"
          />
          <p className="field-hint">Must start with https://. Shown as a link, never embedded.</p>
          {errors?.clinicMapUrl?.[0] ? (
            <p className="field-error" role="alert">
              {errors.clinicMapUrl[0]}
            </p>
          ) : null}
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-6">
        <legend className="font-display text-xl text-forest-950">Site behaviour</legend>

        <div>
          <label htmlFor="announcement" className="admin-label">
            Announcement banner
          </label>
          <input
            id="announcement"
            name="announcement"
            type="text"
            maxLength={300}
            defaultValue={settings.announcement}
            placeholder="Leave blank to hide the banner"
            className="admin-input"
          />
          <p className="field-hint">
            Short, factual notices only (for example a temporary closure).
          </p>
          {errors?.announcement?.[0] ? (
            <p className="field-error" role="alert">
              {errors.announcement[0]}
            </p>
          ) : null}
        </div>

        <label
          htmlFor="bookingEnabled"
          className="flex items-start gap-3 text-sm leading-6 text-forest-900"
        >
          <input
            id="bookingEnabled"
            name="bookingEnabled"
            type="checkbox"
            defaultChecked={settings.bookingEnabled}
            className="mt-1 size-4 shrink-0 rounded border-line accent-forest-800"
          />
          <span>
            Accept online appointment requests
            <span className="mt-1 block text-[0.75rem] leading-5 text-muted">
              When off, the public form is replaced with a message asking visitors to contact the
              clinic directly. The database enforces this too.
            </span>
          </span>
        </label>
      </fieldset>

      <div className="border-t border-line pt-5">
        <SubmitButton className="btn-dark" pendingLabel="Saving…">
          Save clinic details
        </SubmitButton>
      </div>
    </form>
  );
}
