# Security — Jishnu's Dentistry

Last updated: 2026-11-02

This is a description of what the code actually does, plus an honest list of what has **not** been
verified because no Supabase project, email provider or hosting account was available in the build
environment. Nothing here is a guarantee; it is a design and the checks that support it.

---

## 1. Threat model

| Asset | Why it matters | Primary controls |
| --- | --- | --- |
| Appointment requests (name, phone, email, message) | Personal data about a person's health interest | RLS, staff-only read, column grants, no PII logging, audit trail |
| Contact messages | Same | Same |
| Staff accounts and roles | A stolen admin account controls the site | Supabase Auth, no registration, out-of-band provisioning, role trigger |
| Clinic settings | Wrong contact details mislead patients | Admin-only writes, audited |
| Audit trail | Evidence of who changed what | Function-only writes, admin-only reads |
| Service-role key | Bypasses RLS entirely | Server-only module, narrow usage, secret scan, never `NEXT_PUBLIC_` |

Out of scope: physical security of the clinic, endpoint malware, clinician account hygiene, and any
system the clinic uses outside this website.

---

## 2. Authorisation

Layers, from cheapest to most authoritative:

1. **`src/proxy.ts`** — redirects unauthenticated visitors away from `/admin`. This is a convenience
   and a first filter, not a security boundary.
2. **Page guards** — `requireStaffPage()` in `admin/(dashboard)/layout.tsx` and again in each dashboard
   page. Both call `getUser()` (server-validated) and read `profiles.role`.
3. **Action guards** — every Server Action calls `requireStaff()` or `requireAdmin()` before touching
   data. The UI is never trusted.
4. **RLS** — the database refuses reads and writes that the policy set does not allow, whatever the
   application code believes.
5. **Column grants** — even an allowed `UPDATE` cannot rewrite identity fields.
6. **Triggers** — the status workflow and the "roles are immutable via the API" rule are enforced in
   PostgreSQL.

### Role matrix

| Capability | pending | staff | admin |
| --- | --- | --- | --- |
| Sign in | yes | yes | yes |
| Reach `/admin` | no | yes | yes |
| Read appointments / messages | no | yes | yes |
| Change status, add notes, triage messages | no | yes | yes |
| Create / edit / delete services | no | no | yes |
| Edit clinic settings | no | no | yes |
| Read the audit log | no | no | yes |
| Change a role | no | no | no (out-of-band only) |

`canChangeRoles()` returns `false` unconditionally and is unit-tested, so a future contributor cannot
accidentally wire role editing into the dashboard.

### Provisioning

```bash
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
  node scripts/create-admin.mjs --email=reception@example.com --name="Reception" --role=admin
```

The script creates (or finds) the Auth user, confirms the email, and sets the profile role using the
service-role key. The password is generated locally, printed once, and never written to disk. There is
no web route that creates users.

---

## 3. Public form protection

Appointment and contact submissions pass through, in order:

1. **Rate limiting** — a fixed-window in-memory limiter keyed by a **salted hash** of the client IP.
   The raw IP is never stored, never logged and never sent to the database.
2. **Zod validation** — length bounds, email shape, phone normalisation, ISO date + real-calendar
   check, "not in the past" evaluated in the clinic time zone, control characters rejected.
3. **Honeypot** — a visually hidden `website` field. A filled honeypot returns an ordinary success
   response (so a bot learns nothing) and writes nothing.
4. **Submission timing** — `formStartedAt` is set when the form mounts. Submissions faster than 2.5 s,
   or older than 24 hours, are treated as automated.
5. **Business checks** — booking must be enabled, the chosen service must be currently active.
6. **Duplicate check** — a narrow service-role query looks for an identical request in the last few
   minutes and returns a friendly "we already have this" message instead of creating noise.
7. **Database constraints and RLS** — the last line: `status` must be `pending`/`new`, consent is
   required, the service must be active, and booking must be enabled.

### Limits of the in-memory limiter

Vercel runs multiple serverless instances, and each has its own memory. The limiter therefore raises
the cost of casual abuse but does not guarantee a global cap. For a clinic-sized site that is an
acceptable trade-off; if stronger protection is needed, enable Vercel WAF rate limiting on
`/appointment` and `/contact` (documented in `docs/DEPLOYMENT.md` §8).

---

## 4. Secrets

| Secret | Where it may live | Where it must never live |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env var, `src/lib/supabase/service.ts`, offline scripts | Browser bundle, any `NEXT_PUBLIC_*`, logs, git |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser (by design) | — (public, protected by RLS) |
| `RESEND_API_KEY` | Server env only | Browser, logs |
| `RATE_LIMIT_SALT` | Server env | Browser |
| Staff passwords | Supabase Auth only | Anywhere in this repository |

Safeguards:

- `.gitignore` excludes `.env`, `.env.local` and every `.env.*` except `.env.example`.
- `npm run check:secrets` scans tracked files for JWTs, private keys, Resend/Stripe/AWS keys, Supabase
  personal access tokens, committed env files and hardcoded password assignments. Run it before every
  commit; it exits non-zero on a hit.
- The service-role client is imported by exactly one module (`src/lib/supabase/service.ts`), which
  begins with `import 'server-only'`. A client-component import fails the build.
- `/api/health` reports whether the key exists as a boolean, never the value.

---

## 5. Sessions and cookies

- `@supabase/ssr` cookie sessions, set by the server.
- Cookie options: `httpOnly: true`, `sameSite: 'lax'`, `secure: true` in production, `path: '/'`.
- Every protected render validates with `supabase.auth.getUser()`, which asks the Auth server; the
  cookie payload alone is never trusted.
- The proxy refreshes expiring tokens on navigation so a staff member is not signed out mid-task.
- Sign-out clears the session server-side and redirects with `?reason=signed-out`.

---

## 6. Headers and Content Security Policy

`src/proxy.ts` sets, per request:

```
default-src 'self';
script-src 'self' 'nonce-<random>' 'strict-dynamic';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self' <supabase-url> wss://<supabase-host>;
media-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
frame-src 'none';
worker-src 'self' blob:;
manifest-src 'self';
upgrade-insecure-requests
```

Notes:

- A fresh nonce is generated for every request (`crypto.randomUUID()` without dashes), so the policy
  is not cacheable — which is why public pages render dynamically.
- `'strict-dynamic'` lets Next.js load its own chunks once a nonce-signed script runs, without
  allow-listing every chunk URL.
- `style-src 'unsafe-inline'` is required because Next.js injects critical CSS inline. It is the one
  pragmatic relaxation; scripts are strictly nonce-gated.
- `'unsafe-eval'` is added **only** in development, for the dev-mode runtime.
- No third-party script is allowed. Adding analytics or a chat widget means editing the CSP in
  `src/proxy.ts`, which is deliberate friction — see `AGENTS.md` §4.

`next.config.ts` adds the static companion headers (`X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy`, `X-Frame-Options`, and HSTS in production). Confirm them on the deployed URL with
the command in `docs/DEPLOYMENT.md` §9.

---

## 7. Injection, XSS and CSRF

- **SQL injection**: no string-built SQL in the application. All reads/writes go through PostgREST via
  the Supabase client, which parameterises. Dashboard search terms are sanitised
  (`sanitizeSearchTerm`) so a visitor cannot inject PostgREST filter syntax such as `,` `(` `)`.
- **XSS**: React escapes by default. The only two `dangerouslySetInnerHTML` usages
  (`src/app/layout.tsx` for organisation JSON-LD, `src/app/(site)/services/[slug]/page.tsx` for
  per-service structured data) both pass through `safeJsonLd()`, which escapes `<`, `>` and `&` so the
  payload cannot close the script tag. No `innerHTML`, no `eval`, no user-supplied HTML.
- **Open redirects**: the auth callback and login form only accept `next` values that are relative and
  start with `/admin`; anything else falls back to `/admin`.
- **CSRF**: state changes are Server Actions (POST, origin-checked by Next.js) and there are no
  state-changing `GET` requests. Session cookies are `SameSite=Lax`.
- **Clickjacking**: `frame-ancestors 'none'` plus `X-Frame-Options: DENY`.
- **Prototype pollution / mass assignment**: actions read named fields from `FormData` and parse them
  with explicit Zod object schemas, so unexpected keys are dropped.

---

## 8. Logging and error handling

- `src/lib/logger.ts` writes one-line JSON and redacts any field whose key matches
  `email|phone|name|message|notes|token|key|authorization|cookie|password|secret|address`, replacing the
  value with `[redacted]`. The `event` key is exempt because it is a fixed, developer-authored
  identifier. The redaction is covered by a unit test.
- Actions log event names and identifiers, not payloads. Example: `appointment.status_changed` with
  the appointment id and the new status.
- `toAppError()` maps unknown failures to a generic message; stack traces and Postgres error text never
  reach the browser. Server-side, the original error is attached as `cause` for the platform logs.
- The error boundary shows a digest reference, not the message.
- The audit log deliberately excludes patient message bodies and appointment notes (tested by review of
  `src/actions/admin/*`).

---

## 9. Dependency and supply-chain hygiene

- Versions are pinned in `package.json`; no `^` drift for the runtime-critical packages.
- `npm audit` is part of the release checklist (`docs/DEPLOYMENT.md` §9), not an automatic fix.
- `next/font/google` self-hosts fonts at build time, so the browser never contacts Google.
- No `<script src="https://…">` anywhere in the codebase. If one is ever added, the CSP blocks it until
  someone updates the policy — which is the point.

---

## 10. What is verified, and what is not

| Control | Status |
| --- | --- |
| TypeScript strict, ESLint clean, production build | **Verified locally** (§ `docs/TESTING.md`) |
| Unit tests for authz, validation, workflow, rate limiter, redaction, JSON-LD escaping | **Verified locally** |
| CSP nonce present and different per request | **Verified locally** by Playwright |
| Anonymous `/admin` access redirects to sign-in | **Verified locally** by Playwright |
| RLS policies and grants | Written and reviewed; suite ready — **not executed** (no Supabase project) |
| Password reset email delivery | Implemented — **not executed** (no SMTP/project) |
| Live session cookie flags over HTTPS | Configured — **not observed** on a deployed host |
| Vercel platform headers / WAF | Configured — **not deployed** |
| Backup and restore | Documented — **not exercised** |

Anything marked "not executed" must be completed during the deployment in `docs/DEPLOYMENT.md` §10
and recorded in `docs/OPERATIONS.md`.
