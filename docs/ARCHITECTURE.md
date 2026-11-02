# Architecture — Jishnu's Dentistry

Last updated: 2026-11-02

This document describes how the application is put together, why each boundary exists, and where to
make a change. It reflects the code in this repository, not an aspiration.

---

## 1. Runtime shape

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Browser                                                                      │
│  Public pages: static text + RSC-rendered content, hydrated form components   │
│  Admin pages: cookie session, no client-side authorisation decisions          │
└───────────────┬──────────────────────────────────────────────────────────────┘
                │ HTTPS (CSP with per-request nonce)
┌───────────────▼──────────────────────────────────────────────────────────────┐
│ Next.js 16 App Router on Vercel                                              │
│                                                                              │
│  src/proxy.ts            CSP nonce • Supabase session refresh • /admin gate   │
│  src/app/(site)/…        Public routes (all dynamic; see §4)                  │
│  src/app/admin/…         Auth screens + protected dashboard                  │
│  src/app/auth/callback   PKCE / OTP exchange for recovery links              │
│  src/app/api/health      Uptime probe (configuration booleans only)          │
│  src/actions/*           Server Actions: validate → authorise → write → audit │
│  src/lib/db/*            The only modules that talk to Supabase              │
│  src/lib/supabase/*      Client factories (server / public / service-role)    │
└───────────────┬──────────────────────────────────────────────────────────────┘
                │ PostgREST over HTTPS (anon key + RLS, or user JWT + RLS)
┌───────────────▼──────────────────────────────────────────────────────────────┐
│ Supabase                                                                     │
│  PostgreSQL  •  RLS on every table  •  SECURITY DEFINER helpers              │
│  Auth        •  email/password for staff, no public sign-up                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

Optional outbound call: Resend, only when `RESEND_API_KEY` is set. Failure to send never blocks a
stored request.

---

## 2. Directory responsibilities

| Path | Owns | Must not |
| --- | --- | --- |
| `src/app` | Routing, metadata, composition of sections | Contain business rules or direct Supabase queries |
| `src/components/ui` | Generic primitives (icons, logo, reveal, submit button) | Know about appointments or auth |
| `src/components/site` | Public chrome and sections | Read cookies or query the database |
| `src/components/forms` | Public form UX, client-side Zod validation | Authorise anything; the server always re-validates |
| `src/components/admin` | Dashboard interactions | Decide whether the caller is an admin |
| `src/actions` | Server Actions: validation, authorisation, mutation, audit | Return raw errors or stack traces |
| `src/lib` | Supabase access, authz helpers, validation, formatting, logging | Render JSX |
| `src/content` | Human-reviewed static copy (brand, process, legal scaffolding) | Store clinic facts that change at runtime |
| `supabase/migrations` | The only source of schema truth | Be edited after being applied |
| `scripts` | Pre-commit secret scan, out-of-band admin provisioning | Run in the browser or at request time |

The rule of thumb: **if it can be wrong at runtime, it lives behind `src/lib` and is re-checked on the
server.**

---

## 3. Rendering strategy

All public routes are server components rendered per request. This is deliberate: the root layout
reads a per-request CSP nonce from `x-nonce` to sign its inline JSON-LD script, and a nonce cannot be
baked into a statically cached page.

Consequences:

- `export const dynamic = 'force-dynamic'` is used on admin pages and wherever a cookie read is
  implied. Public pages inherit dynamic rendering from the nonce read in the root layout.
- Public data that is read repeatedly within one render (active services, public settings) is
  deduplicated with React's `cache()` in `src/lib/db`. There is no cross-request data cache: every
  request reads current data, which is the right trade-off for a clinic dashboard where a staff edit
  must appear immediately. Admin mutations call `revalidatePath` so the router cache is refreshed.
- `sitemap.xml` is generated hourly (`revalidate = 3600`), so a newly activated service appears
  without a redeploy. `robots.txt` is static.

### Degradation without configuration

`getPublicSupabaseConfig()` returns `null` when the environment is incomplete. Every data module
checks it and returns an empty result instead of throwing:

- pages render their honest empty state ("the treatment list is being prepared");
- the appointment form is replaced by a "requests are paused" panel;
- `/admin` redirects to a sign-in screen that explains what is missing and links to
  `docs/DEPLOYMENT.md`.

This is why `npm run build` succeeds on a machine with no Supabase project, and why the site can be
demoed safely before launch.

---

## 4. Request lifecycle

### 4.1 Reading a public page

1. `src/proxy.ts` generates a nonce, builds the CSP, forwards `x-nonce`, and (for `/admin`) refreshes
   the Supabase session.
2. The root layout reads `x-nonce` and `site_settings`; it injects Dentist/LocalBusiness JSON-LD with
   `safeJsonLd()` (escapes `<`).
3. The page calls `src/lib/db/*`, which uses the **public** client (anon key) so RLS applies.
4. Missing or blank settings are hidden, never replaced with invented values.

### 4.2 Submitting an appointment request

1. The client validates with the shared Zod schema (`mode: 'onBlur'`) for fast feedback.
2. `submitAppointmentRequest` (in `src/actions/public.ts`) runs on the server and:
   1. resolves the caller IP from proxy headers and checks the in-memory rate limiter using a
      salted hash of the IP;
   2. rejects submissions that arrive faster than the minimum fill time (`formStartedAt`);
   3. rejects a filled honeypot field;
   4. re-validates with Zod (including "not in the past" in the clinic time zone);
   5. inserts through the anon client, where RLS forces `status = 'pending'`, requires
      `consent_given`, an active service and `booking_is_enabled()`;
   6. optionally performs a narrow duplicate check with the service-role client;
   7. optionally sends a Resend notification; a failure there is logged and ignored;
   8. returns a typed `ActionResult` (never an exception or a stack).
3. The form renders either a success panel or a mapped, human-readable error.

### 4.3 An administrative change

1. The page calls `requireStaffPage()` / `requireAdminPage()`. Both consult the Supabase user (via
   `getUser()`, not the cookie payload) and the `profiles.role` column.
2. The form posts to a Server Action. **The action calls `requireStaff()` / `requireAdmin()` again** —
   the page guard is never trusted as the only check.
3. Input is parsed with Zod; failures return `fieldErrors`.
4. The mutation uses the user-session client, so RLS and column grants apply even if the action has a
   bug.
5. `recordAuditLog()` calls the `record_audit_log` SQL function, a `SECURITY DEFINER` routine that
   takes the actor from `auth.uid()`. Direct inserts into `audit_logs` are revoked, so an audit entry
   cannot be forged or imputed to someone else.
6. `revalidatePath` / `revalidateTag` refreshes the affected public and dashboard routes.

---

## 5. Authentication and authorisation

| Concern | Implementation |
| --- | --- |
| Session storage | `@supabase/ssr` HTTP-only, SameSite=Lax, Secure-in-production cookies |
| Session validation | `supabase.auth.getUser()` on every protected render and action |
| Role source | `public.profiles.role`, read server-side |
| Roles | `pending` (no access), `staff` (appointments + messages), `admin` (all + configuration + audit) |
| Provisioning | Out-of-band only: `scripts/create-admin.mjs` or SQL. No registration route |
| Escalation defence | No `UPDATE` grant on `profiles`; trigger rejects role changes from API roles |
| Password reset | Supabase recovery email → `/auth/callback` → `/admin/reset-password` |
| Open redirects | `next` parameters are rejected unless they are relative and start with `/admin` |

Defence in depth: `src/proxy.ts` (cheap redirect) → layout guard → per-action guard → RLS → column
grants → database triggers. Any single layer can fail without exposing data.

---

## 6. Design system

- Tailwind CSS v4, CSS-first configuration. Design tokens live in `@theme` in
  `src/app/globals.css`: forest greens, champagne golds, warm creams, `--radius-card`, `--shadow-*`.
- `btn` is registered with `@utility` (not `@layer components`) so the `btn-primary` / `btn-dark` /
  `btn-outline` / `btn-danger` variants can compose it with `@apply`. Tailwind v4 only resolves
  `@apply` against real utilities.
- Typography: Cormorant Garamond (display) and Manrope (UI), loaded with `next/font/google`, which
  self-hosts the files — no third-party font request, so `font-src 'self'` holds.
- Motion: `Reveal` uses `IntersectionObserver` and a CSS transition; `prefers-reduced-motion`
  disables animation globally in `globals.css`.
- Imagery: intentionally image-light because no photography was supplied. Slots are described in
  `docs/CLIENT_HANDOVER.md` §9.

---

## 7. SEO and metadata

- `metadataBase` from `NEXT_PUBLIC_SITE_URL`; per-page `title`/`description`/`canonical`.
- `src/app/opengraph-image.tsx` generates a 1200×630 card with `next/og` and the built-in font stack
  (no network fetch during build).
- Structured data: `Dentist`/`LocalBusiness` JSON-LD built from `site_settings`, omitting fields that
  are blank rather than emitting empty values.
- `robots.ts` disallows `/admin`, `/auth/` and `/api/`; `sitemap.ts` lists public routes and active
  services.
- Admin pages set `robots: { index: false, follow: false }`.

---

## 8. Error handling and logging

- `src/lib/errors.ts` defines `AppError` subclasses (`ValidationError`, `AuthorizationError`,
  `NotFoundError`, `ConflictError`, `RateLimitError`, `ConfigurationError`) and `toAppError()`, which
  collapses unknown failures to a generic message.
- `src/actions/helpers.ts` maps thrown errors to `ActionResult` without leaking internals.
- `src/lib/logger.ts` emits single-line JSON and redacts keys that look like personal data
  (`email`, `phone`, `name`, `message`, `notes`, `token`, `key`, `authorization`, `cookie`).
- Nothing logs a patient's name, contact details or message body.

---

## 9. Where to change things

| Task | File(s) |
| --- | --- |
| Marketing copy | `src/content/site.ts` |
| Legal wording / placeholders | `src/content/legal.ts` |
| Navigation labels | `src/content/navigation.ts` |
| Colours, radii, shadows | `@theme` in `src/app/globals.css` |
| Clinic phone, hours, address | Admin → Clinic settings (database), not code |
| Treatment list | Admin → Services (database) |
| Appointment workflow rules | `src/lib/appointments/status.ts` **and** the SQL trigger |
| Validation rules | `src/lib/validation/forms.ts` **and** the SQL `CHECK` constraints |
| CSP / headers | `src/proxy.ts`, `next.config.ts` |
| Audit actions | `src/lib/db/audit.ts` + calling action |
| Email notification | `src/lib/email.ts` |

When changing a rule, change both sides: the TypeScript guard and the database constraint. The
database is the last line of defence and is the one that survives a bug in the application.
