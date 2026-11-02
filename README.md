# Jishnu's Dentistry — website & appointment desk

A complete rebuild of the Jishnu's Dentistry website: a premium public site, a real appointment-request
workflow, and a private dashboard for clinic staff. Built with Next.js 16 (App Router), React 19,
TypeScript in strict mode, Tailwind CSS v4 and Supabase (PostgreSQL + Auth + Row Level Security).

> **Status: source complete, not deployed.** Everything that can be verified without credentials was
> verified locally: typecheck, lint, unit tests, browser tests, production build, dependency audit and
> secret scan. A live Supabase project, SMTP provider, Vercel account and GitHub remote were **not**
> available, so RLS execution, password-reset delivery and deployed headers remain outstanding. The
> exact steps are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md); the honest scorecard is
> [`docs/TESTING.md`](docs/TESTING.md) §5.

---

## What is in the box

- **Public site** — home, clinic, dentist, services, service detail, appointment request, contact,
  privacy, terms, custom 404, loading and error states. Responsive, keyboard-accessible, reduced-motion
  aware, nonce-based CSP, structured data, Open Graph image generated at build time.
- **Appointment workflow** — a request is stored in Supabase, rate-limited, validated on both sides and
  visible instantly in the dashboard. **A request is never presented as a confirmed booking.**
- **Staff dashboard** — overview, appointment search/filter/detail, status workflow, private notes,
  contact-message triage, service management, clinic settings, audit log.
- **Security by default** — deny-by-default RLS on every table, column-level grants, roles provisioned
  out-of-band, audit entries written only by a `SECURITY DEFINER` function, no public registration.
- **Docs** — architecture, schema, security, deployment, operations, testing, client handover and the
  list of clinic facts that are still missing.

## Quick start

```bash
npm install
cp .env.example .env.local     # fill in values; never commit this file
npm run dev                    # http://localhost:3000
```

The site runs **without** Supabase credentials. Pages render honest empty states, the appointment form
explains that requests are paused, and `/admin` shows a sign-in screen that says what is missing. This
is deliberate: the build and the test suite must not depend on secrets.

To run the database locally (requires Docker):

```bash
npx supabase start
npx supabase db reset          # applies migrations + seed
```

## Scripts

| Command                 | Purpose                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| `npm run dev`           | Development server                                                        |
| `npm run build`         | Production build                                                          |
| `npm run start`         | Serve the production build                                                |
| `npm run lint`          | ESLint (zero warnings expected)                                           |
| `npm run typecheck`     | `tsc --noEmit`, strict                                                    |
| `npm run test`          | Vitest unit suite                                                         |
| `npm run test:watch`    | Vitest in watch mode                                                      |
| `npm run test:e2e`      | Playwright, desktop + mobile                                              |
| `npm run verify`        | lint + typecheck + unit tests + build                                     |
| `npm run check:secrets` | Scan tracked files for credentials and committed env files                |
| `npm run admin:create`  | Provision a staff/admin account (needs the service-role key; run locally) |

Windows: use `npm.cmd` if PowerShell script execution is disabled.

## Project layout

```
src/
  app/            routes only — (site) public, admin auth + (dashboard), api, auth callback
  actions/        server actions: validate → authorise → mutate → audit → typed result
  components/     ui/ primitives, site/ public chrome, admin/ dashboard, forms/ client forms
  content/        version-controlled copy: brand, navigation, legal scaffolding
  lib/            Supabase clients, authz, validation, dates, status, logging, email, SEO
  proxy.ts        CSP nonce, session refresh, /admin gate
  types/          hand-maintained database types
supabase/
  migrations/     schema, RLS, seed — the only source of schema truth
  tests/          RLS verification suite (staging only)
tests/
  unit/           Vitest
  e2e/            Playwright
scripts/          secret scan, admin provisioning
docs/             full documentation set
```

## Documentation

| Document                                                                     | Read it when                                          |
| ---------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)                               | You need to understand or change how it fits together |
| [`docs/DATABASE.md`](docs/DATABASE.md)                                       | You are touching the schema, policies, or retention   |
| [`docs/SECURITY.md`](docs/SECURITY.md)                                       | You are reviewing security, headers or auth           |
| [`docs/SECURITY_CHECKLIST.md`](docs/SECURITY_CHECKLIST.md)                   | Before a commit and before a deploy                   |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)                                   | You are creating the Supabase project or deploying    |
| [`docs/OPERATIONS.md`](docs/OPERATIONS.md)                                   | You are running the site, backups or an incident      |
| [`docs/TESTING.md`](docs/TESTING.md)                                         | You want the test map and the verified results        |
| [`docs/CLIENT_HANDOVER.md`](docs/CLIENT_HANDOVER.md)                         | You are training clinic staff                         |
| [`docs/REQUIRED_CLINIC_INFORMATION.md`](docs/REQUIRED_CLINIC_INFORMATION.md) | You need to know what the clinic still must supply    |
| [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md)                               | You want the plan, scope and acceptance checklist     |
| [`AGENTS.md`](AGENTS.md)                                                     | You are an agent or developer picking this up         |

## Security rules that must not be relaxed

1. **RLS stays on** for every table. No `USING (true)` policy for private data.
2. **The service-role key stays server-side** and is used only in `src/lib/supabase/service.ts` and
   offline scripts. It must never appear in a `NEXT_PUBLIC_*` variable.
3. **Roles are provisioned out-of-band** with SQL or `scripts/create-admin.mjs`. There is no
   registration route and no in-app role editing.
4. **Every server action authorises on the server** before touching data. The proxy and page guards are
   defence in depth, not the only check.
5. **Never log patient names, emails, phones or message bodies.** `src/lib/logger.ts` redacts by key.
6. **No third-party script** without updating the CSP in `src/proxy.ts`.
7. **Never publish a clinic fact the clinic has not verified.** Blank beats invented.

## Environment variables

See [`.env.example`](.env.example). Required for the full experience:

- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `CLINIC_TIMEZONE`, `RATE_LIMIT_SALT`

Optional: `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL`.

## Outstanding before launch

- Supabase project, migrations applied, RLS suite executed.
- First administrator provisioned; staff accounts agreed.
- Clinic phone, email, address, opening hours, map link, time zone.
- Dentist name, qualifications, registration number, approved biography.
- Treatment list reviewed (one active service and three templates are seeded).
- Legal review of `src/content/legal.ts` (visible bracketed placeholders).
- Domain, Vercel project, environment variables, GitHub remote.
- Backup restore drill.

The full, itemised list is [`docs/REQUIRED_CLINIC_INFORMATION.md`](docs/REQUIRED_CLINIC_INFORMATION.md).
