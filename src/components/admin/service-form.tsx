'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveServiceAction } from '@/actions/admin/services';
import { FormMessage } from '@/components/admin/form-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { useTrackedAction } from '@/components/admin/use-tracked-action';
import type { Service } from '@/types/database';

interface ServiceFormProps {
  service?: Service;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const { state, formAction, saved } = useTrackedAction(saveServiceAction);
  const [slug, setSlug] = useState(service?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(service?.slug));

  useEffect(() => {
    if (saved && !service) {
      router.push('/admin/services');
    }
  }, [saved, service, router]);

  const fieldErrors = state.ok ? undefined : state.fieldErrors;

  return (
    <form action={formAction} className="space-y-5">
      {!state.ok ? <FormMessage message={state.error} code={state.code} /> : null}
      {saved && service ? (
        <div
          role="status"
          className="rounded-xl border border-sage-600/25 bg-sage-100 px-4 py-3 text-sm text-forest-900"
        >
          Saved. The public website has been refreshed.
        </div>
      ) : null}

      {service ? <input type="hidden" name="id" value={service.id} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="admin-label">
            Service name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={120}
            defaultValue={service?.name ?? ''}
            className="admin-input"
            aria-invalid={Boolean(fieldErrors?.name)}
            onChange={(event) => {
              if (!slugTouched) setSlug(slugify(event.target.value));
            }}
          />
          {fieldErrors?.name?.[0] ? (
            <p className="field-error" role="alert">
              {fieldErrors.name[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="slug" className="admin-label">
            URL slug
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            maxLength={80}
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            className="admin-input font-mono"
            aria-invalid={Boolean(fieldErrors?.slug)}
            aria-describedby="slug-hint"
          />
          <p id="slug-hint" className="field-hint">
            Lowercase letters, numbers and hyphens. Becomes /services/{slug || 'your-slug'}.
          </p>
          {fieldErrors?.slug?.[0] ? (
            <p className="field-error" role="alert">
              {fieldErrors.slug[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="admin-label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          maxLength={4000}
          defaultValue={service?.description ?? ''}
          className="admin-input resize-y"
          aria-describedby="description-hint"
        />
        <p id="description-hint" className="field-hint">
          Shown on the services page and the service detail page. Avoid outcome claims and prices.
        </p>
        {fieldErrors?.description?.[0] ? (
          <p className="field-error" role="alert">
            {fieldErrors.description[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="displayOrder" className="admin-label">
            Display order
          </label>
          <input
            id="displayOrder"
            name="displayOrder"
            type="number"
            min={0}
            max={10000}
            step={1}
            required
            defaultValue={service?.display_order ?? 10}
            className="admin-input"
          />
          <p className="field-hint">Lower numbers appear first.</p>
          {fieldErrors?.displayOrder?.[0] ? (
            <p className="field-error" role="alert">
              {fieldErrors.displayOrder[0]}
            </p>
          ) : null}
        </div>

        <div className="flex items-start pt-7">
          <label
            htmlFor="isActive"
            className="flex items-start gap-3 text-sm leading-6 text-forest-900"
          >
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              defaultChecked={service?.is_active ?? true}
              className="mt-1 size-4 shrink-0 rounded border-line accent-forest-800"
            />
            <span>
              Visible on the public website
              <span className="mt-1 block text-[0.75rem] leading-5 text-muted">
                Inactive services are hidden from visitors and cannot be requested.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <SubmitButton className="btn-dark" pendingLabel="Saving…">
          {service ? 'Save changes' : 'Create service'}
        </SubmitButton>
        <Link href="/admin/services" className="btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
