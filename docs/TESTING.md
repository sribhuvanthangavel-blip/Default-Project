# Testing — Jishnu's Dentistry

Last updated: 2026-11-02

Three layers: unit tests (business rules), browser tests (what a visitor actually sees), and a SQL
suite (what the database actually refuses). The SQL suite cannot run without a Supabase project; that
is stated plainly rather than skipped quietly.

---

## 1. Commands

```bash
npm run typecheck      # tsc --noEmit, strict
npm run lint           # eslint, zero warnings tolerated
npm run format:check   # prettier, no unformatted files
npm run test           # Vitest unit suite
npm run test:e2e       # Playwright; starts the dev server automatically
npm run build          # production build
npm run check:secrets  # credential / env-file scan
npm run verify         # lint + typecheck + test + build
```

First-time browser setup:

```bash
npx playwright install chromium
```

Windows: if PowerShell blocks npm's shim, run `npm.cmd run <script>`. In PowerShell, piping stderr can
make a passing command look like a failure — check `$LASTEXITCODE` if in doubt.

---

## 2. Unit tests (Vitest)

Location: `tests/unit`. Environment: node. No Supabase connection is needed; the modules under test are
pure.

| File | Tests | What it protects |
| --- | --- | --- |
| `dates.test.ts` | 12 | Clinic-day calculation across UTC offsets, real-calendar date validation, leap years, past-date rule, time normalisation and formatting, booking reference |
| `status.test.ts` | 6 | The appointment workflow: allowed transitions, terminal states, "confirmed booking" semantics, unknown status rejection |
| `roles.test.ts` | 6 | Role capability matrix, rank comparison, and the guarantee that no code path can change a role |
| `validation.test.ts` | 16 | Appointment and contact schemas: normalisation, past dates, impossible dates, consent, honeypot, UUID shape, message bounds, control characters, field-level schemas, slug rules |
| `security.test.ts` | 16 | Rate limiter windows/limits/eviction, PostgREST search sanitisation, pagination clamps, settings parsing, link builders, JSON-LD escaping, error redaction |
| `logger.test.ts` | 3 | Structured logging keeps the event name but redacts patient identifiers |

Design notes:

- Time-dependent tests inject `now` rather than relying on the wall clock.
- The status tests assert the same transition table that the SQL trigger enforces, so a drift between
  TypeScript and PostgreSQL becomes a failing test rather than a production surprise.
- The rate-limiter tests drive the clock explicitly, so they are fast and deterministic.

---

## 3. Browser tests (Playwright)

Location: `tests/e2e`. Two projects run every spec: `chromium` (desktop) and `mobile` (Pixel 7), so
each scenario is exercised at both breakpoints.

The suite runs **without a Supabase project**, which is the point: it proves the site degrades honestly
rather than crashing when configuration is absent.

### `public.spec.ts`

- Home page returns 200, has a single `<h1>`, shows the hero and primary call to action, and displays
  the "an appointment request is not a confirmed booking" disclaimer.
- A skip link exists for keyboard users.
- Clinic, dentist, services, privacy and terms pages render their headings; the dentist page explicitly
  refuses to invent credentials; the privacy page shows unreviewed legal placeholders rather than
  hiding them.
- The appointment page pauses online requests when no services are published, and offers the contact
  route instead.
- The contact page renders labelled inputs and the submit button.
- Unknown routes return a 404 status with a helpful page.
- `robots.txt` disallows `/admin` and advertises the sitemap.
- `sitemap.xml` lists public routes and never lists `/admin`.
- `/api/health` returns `no-store`, reports configuration as booleans, and contains no JWT or key.

### `forms.spec.ts`

- An empty contact submission shows field-level errors for name, email and message, and does not show
  the success panel.
- A malformed email is rejected.
- The honeypot input is out of the tab order and has autocomplete disabled.
- `<html lang>`, a viewport meta, and an `alt` attribute on every image.
- The mobile navigation opens, shows a close control, and closes again.

### `admin.spec.ts`

- All seven protected routes (`/admin`, appointments, messages, services, new service, settings, audit)
  redirect an anonymous visitor to `/admin/login?reason=auth`.
- The login page is `noindex`, explains that Supabase is not configured, never renders a password field
  when the backend is unavailable, and links back to the public site.
- `/register` is a 404 — there is no public registration.
- The CSP header contains `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`,
  `strict-dynamic` and a nonce; two requests produce two different nonces.
- The admin response is not publicly cacheable.

### Deliberately not covered by browser tests

Anything that needs a signed-in session: creating an appointment against the database, changing a
status, editing a service, saving settings, reading the audit log, and the password-reset email. Those
require a Supabase project and an SMTP provider. The RUNBOOK for exercising them by hand is
`docs/DEPLOYMENT.md` §7.

---

## 4. SQL suite (RLS)

File: `supabase/tests/rls_policies.sql`. It creates synthetic staff and admin users, switches role and
JWT claims, asserts allowed and forbidden operations, and rolls everything back.

```bash
# staging project only
psql "$STAGING_DATABASE_URL" -f supabase/tests/rls_policies.sql
# expected final row: ALL RLS CHECKS PASSED
```

**Not executed in this environment**: no Supabase project was available. The assertions are listed in
`docs/DATABASE.md` §9; run them during the first deployment and record the result in
`docs/OPERATIONS.md` §10.

---

## 5. Results from this build

Recorded on 2026-11-02, Windows, Node 26.13.0, no Supabase credentials. Reproduce with the commands in
§1.

| Check | Result |
| --- | --- |
| `npm run typecheck` | **Pass** — no errors |
| `npm run lint` | **Pass** — 0 errors, 0 warnings |
| `npm run format:check` | **Pass** — all files match Prettier style |
| `npm run test` | **Pass** — 6 files, 59 tests |
| `npm run test:e2e` | **Pass** — 70 tests (35 × 2 projects) |
| `npm run build` | **Pass** — 28 routes, Turbopack production build |
| `npm audit --omit=dev` | **Pass** — 0 vulnerabilities |
| `npm run check:secrets` | **Pass** — no credentials or env files found |
| RLS SQL suite | **Not run** — no Supabase project |
| Password-reset email | **Not run** — no SMTP provider |
| Deployed headers | **Not inspected** — not deployed |

### Notes from the build

- The public pages render dynamically because the CSP nonce must be unique per request. Build output
  therefore shows `ƒ` for public routes, with `sitemap.xml` revalidating hourly and `icon.svg` /
  `opengraph-image` / `robots.txt` prerendered.
- Playwright must point at `http://localhost:3000`, not `127.0.0.1`. Next.js dev treats the latter as a
  cross-origin client and blocks its dev resources, which prevents hydration. This is a development-only
  constraint, encoded in `playwright.config.ts`.
- `btn` is declared with Tailwind's `@utility` rather than `@layer components`, because v4's `@apply`
  only resolves real utilities. A `@layer components` version fails the production build.

---

## 6. Adding tests

- **A new validation rule**: add it to `src/lib/validation/forms.ts`, mirror it in the SQL `CHECK` or
  policy, then add a case to `tests/unit/validation.test.ts`.
- **A new status transition**: update `src/lib/appointments/status.ts` **and** the trigger in the init
  migration (via a new migration), then extend `status.test.ts` and the SQL suite.
- **A new public page**: add it to `public.spec.ts` (status, single `h1`, heading) and to `sitemap.ts`.
- **A new admin route**: add it to `PROTECTED_ROUTES` in `admin.spec.ts`.
- **A new role capability**: update `src/lib/auth/roles.ts`, `roles.test.ts`, and the policy matrix in
  `docs/SECURITY.md` §2.

Tests must not require the network, a real clock, or a real database unless they are explicitly the
SQL suite.
