'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { submitAppointmentRequest } from '@/actions/public';
import { createAppointmentRequestSchema } from '@/lib/validation/forms';
import { ArrowRightIcon, CheckIcon } from '@/components/ui/icons';

interface ServiceOption {
  id: string;
  name: string;
}

interface AppointmentFormProps {
  services: ServiceOption[];
  minDate: string;
  timeZone: string;
  defaultServiceId?: string;
}

type AppointmentSchema = ReturnType<typeof createAppointmentRequestSchema>;
type FormInput = z.input<AppointmentSchema>;
type FormOutput = z.output<AppointmentSchema>;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error" role="alert">
      {message}
    </p>
  );
}

export function AppointmentForm({
  services,
  minDate,
  timeZone,
  defaultServiceId,
}: AppointmentFormProps) {
  const schema = useMemo(() => createAppointmentRequestSchema({ timeZone }), [timeZone]);
  const [reference, setReference] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      patientName: '',
      phone: '',
      email: '',
      serviceId: defaultServiceId ?? services[0]?.id ?? '',
      preferredDate: '',
      preferredTime: '',
      message: '',
      consent: false,
      website: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setReference(null);

    try {
      const result = await submitAppointmentRequest({
        ...values,
        formStartedAt: startedAt,
      });

      if (result.ok) {
        setReference(result.data.reference);
        reset();
        return;
      }

      setFormError(result.error);

      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages[0] && field in values) {
            setError(field as keyof FormInput, { message: messages[0] });
          }
        }
      }
    } catch {
      setFormError('Something went wrong. Please try again, or contact the clinic directly.');
    }
  });

  if (reference) {
    return (
      <div
        className="rounded-card border border-sage-600/25 bg-sage-100 p-7 sm:p-9"
        role="status"
        aria-live="polite"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-sage-600 text-white">
          <CheckIcon className="size-6" />
        </span>
        <h2 className="mt-6 font-display text-3xl text-forest-950">Request received.</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          The clinic will review your request and contact you to confirm the date and time. Your
          appointment is <strong className="font-semibold text-forest-900">not confirmed</strong>{' '}
          until the clinic tells you so.
        </p>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-sage-600/20 bg-white/60 px-4 py-2 text-sm text-forest-900">
          Reference
          <span className="font-mono font-semibold tracking-wide">{reference}</span>
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button type="button" className="btn-dark" onClick={() => setReference(null)}>
            Send another request
          </button>
          <Link href="/" className="btn-outline">
            Return home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError ? (
        <div
          role="alert"
          className="rounded-xl border border-clay-700/25 bg-clay-100 px-4 py-3 text-sm leading-6 text-clay-700"
        >
          {formError}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="patientName" className="field-label">
            Full name <span className="text-clay-700">*</span>
          </label>
          <input
            id="patientName"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            className="field-input"
            aria-invalid={Boolean(errors.patientName)}
            aria-describedby={errors.patientName ? 'patientName-error' : undefined}
            {...register('patientName')}
          />
          <FieldError id="patientName-error" message={errors.patientName?.message} />
        </div>

        <div>
          <label htmlFor="phone" className="field-label">
            Phone <span className="text-clay-700">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Include your country code"
            className="field-input"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
            {...register('phone')}
          />
          {errors.phone ? (
            <FieldError id="phone-error" message={errors.phone.message} />
          ) : (
            <p id="phone-hint" className="field-hint">
              Used only for this appointment.
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="field-label">
          Email <span className="text-clay-700">*</span>
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="field-input"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        <FieldError id="email-error" message={errors.email?.message} />
      </div>

      <div>
        <label htmlFor="serviceId" className="field-label">
          Service <span className="text-clay-700">*</span>
        </label>
        <select
          id="serviceId"
          className="field-input"
          aria-invalid={Boolean(errors.serviceId)}
          aria-describedby={errors.serviceId ? 'serviceId-error' : undefined}
          {...register('serviceId')}
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
        <FieldError id="serviceId-error" message={errors.serviceId?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="preferredDate" className="field-label">
            Preferred date <span className="text-clay-700">*</span>
          </label>
          <input
            id="preferredDate"
            type="date"
            min={minDate}
            className="field-input"
            aria-invalid={Boolean(errors.preferredDate)}
            aria-describedby={errors.preferredDate ? 'preferredDate-error' : undefined}
            {...register('preferredDate')}
          />
          <FieldError id="preferredDate-error" message={errors.preferredDate?.message} />
        </div>

        <div>
          <label htmlFor="preferredTime" className="field-label">
            Preferred time <span className="text-clay-700">*</span>
          </label>
          <input
            id="preferredTime"
            type="time"
            step={900}
            className="field-input"
            aria-invalid={Boolean(errors.preferredTime)}
            aria-describedby={errors.preferredTime ? 'preferredTime-error' : 'time-hint'}
            {...register('preferredTime')}
          />
          {errors.preferredTime ? (
            <FieldError id="preferredTime-error" message={errors.preferredTime.message} />
          ) : (
            <p id="time-hint" className="field-hint">
              The clinic will confirm the exact time.
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="message" className="field-label">
          Anything the clinic should know?{' '}
          <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="message"
          rows={4}
          maxLength={2000}
          placeholder="A short note about what you would like help with. Please avoid sensitive medical details."
          className="field-input resize-y"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-error' : 'message-hint'}
          {...register('message')}
        />
        {errors.message ? (
          <FieldError id="message-error" message={errors.message.message} />
        ) : (
          <p id="message-hint" className="field-hint">
            Do not include medical records or sensitive health information.
          </p>
        )}
      </div>

      {/* Anti-spam: hidden from people, attractive to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <div>
        <label htmlFor="consent" className="flex items-start gap-3 text-sm leading-6 text-muted">
          <input
            id="consent"
            type="checkbox"
            className="mt-1 size-4 shrink-0 rounded border-line accent-forest-800"
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? 'consent-error' : undefined}
            {...register('consent')}
          />
          <span>
            I agree to the clinic using the details above to respond to this appointment request, as
            described in the{' '}
            <Link href="/privacy" className="link-underline text-forest-800">
              privacy policy
            </Link>
            . <span className="text-clay-700">*</span>
          </span>
        </label>
        <FieldError id="consent-error" message={errors.consent?.message} />
      </div>

      <div className="rounded-xl bg-cream-100/80 px-4 py-3 text-[0.8rem] leading-6 text-muted">
        Sending this form does not confirm an appointment. The clinic will contact you to confirm
        the date and time.
      </div>

      <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Sending request…' : 'Send appointment request'}
        {!isSubmitting ? <ArrowRightIcon className="size-4" /> : null}
      </button>
    </form>
  );
}
