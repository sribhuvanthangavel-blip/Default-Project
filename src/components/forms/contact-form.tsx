'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { submitContactMessage } from '@/actions/public';
import { contactMessageSchema } from '@/lib/validation/forms';
import { ArrowRightIcon, CheckIcon } from '@/components/ui/icons';

type ContactSchema = typeof contactMessageSchema;
type FormInput = z.input<ContactSchema>;
type FormOutput = z.output<ContactSchema>;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error" role="alert">
      {message}
    </p>
  );
}

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(contactMessageSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
      website: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const result = await submitContactMessage({ ...values, formStartedAt: startedAt });

      if (result.ok) {
        reset();
        setSent(true);
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
      setFormError('Something went wrong. Please try again, or contact the clinic by phone.');
    }
  });

  if (sent) {
    return (
      <div className="rounded-card border border-sage-600/25 bg-sage-100 p-7 sm:p-9" role="status">
        <span className="flex size-12 items-center justify-center rounded-full bg-sage-600 text-white">
          <CheckIcon className="size-6" />
        </span>
        <h2 className="mt-6 font-display text-3xl text-forest-950">Message sent.</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          The clinic will respond using the contact details you provided. If your concern is urgent,
          please contact the clinic by phone instead of waiting for a reply.
        </p>
        <button type="button" className="btn-dark mt-7" onClick={() => setSent(false)}>
          Send another message
        </button>
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
          <label htmlFor="contact-name" className="field-label">
            Name <span className="text-clay-700">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            className="field-input"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            {...register('name')}
          />
          <FieldError id="contact-name-error" message={errors.name?.message} />
        </div>

        <div>
          <label htmlFor="contact-email" className="field-label">
            Email <span className="text-clay-700">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="field-input"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            {...register('email')}
          />
          <FieldError id="contact-email-error" message={errors.email?.message} />
        </div>
      </div>

      <div>
        <label htmlFor="contact-phone" className="field-label">
          Phone <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="contact-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="field-input"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
          {...register('phone')}
        />
        <FieldError id="contact-phone-error" message={errors.phone?.message} />
      </div>

      <div>
        <label htmlFor="contact-message" className="field-label">
          Message <span className="text-clay-700">*</span>
        </label>
        <textarea
          id="contact-message"
          rows={5}
          maxLength={3000}
          placeholder="How can the clinic help? Please avoid sensitive medical details."
          className="field-input resize-y"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'contact-message-error' : 'contact-message-hint'}
          {...register('message')}
        />
        {errors.message ? (
          <FieldError id="contact-message-error" message={errors.message.message} />
        ) : (
          <p id="contact-message-hint" className="field-hint">
            At least 10 characters. Do not send medical records through this form.
          </p>
        )}
      </div>

      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('website')}
        />
      </div>

      <p className="text-[0.8rem] leading-6 text-muted">
        By sending this message you agree to the clinic using your details to respond, as described
        in the{' '}
        <Link href="/privacy" className="link-underline text-forest-800">
          privacy policy
        </Link>
        .
      </p>

      <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send message'}
        {!isSubmitting ? <ArrowRightIcon className="size-4" /> : null}
      </button>
    </form>
  );
}
