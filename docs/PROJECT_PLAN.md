# Project Plan — Jishnu's Dentistry

Last updated: 2026-11-02
Status: source complete and verified locally; **not deployed** (see §7 and `docs/TESTING.md` §5)

## 1. Audit findings

The workspace (`C:\Users\HP\Documents\Default Project`) contained **no files at all** when the rebuild
started. There was therefore no existing application, framework, database, authentication, deployment
configuration, design asset, screenshot or Git history to preserve or migrate.

| Item inspected | Result |
| --- | --- |
| Source files / framework | None present |
| Pages / routes | None present |
| Design assets, photography, logo | None present |
| Forms / backend / APIs | None present |
| Database / migrations / RLS | None present |
| Auth / admin dashboard | None present |
| `.env`, Git repo, deployment config | None present |
| Verified clinic facts (address, phone, hours, dentist credentials, registration) | **Not supplied** |

Consequently:

- This is a greenfield build, not a migration. Nothing was deleted or discarded.
- Every clinic-specific fact is either a clearly marked placeholder or stored in an editable
  `site_settings` row. The definitive list of missing information is
  `docs/REQUIRED_CLINIC_INFORMATION.md`.
- No medical claims, prices, testimonials, review counts, credentials or treatment outcome statistics were
  invented. Marketing copy describes the *process* and the *experience* only.
- Photography was not supplied, so the design is intentionally image-light: typography, editorial layout,
  forest/champagne palette and SVG ornament carry the visual identity. Documented image slots let the
  clinic drop in real photography later without code changes (`docs/CLIENT_HANDOVER.md` §9).

## 2. Goals

1. A premium, fast, accessible public website for a nervous first-time patient.
2. A real appointment request workflow (not a mailto link and not a mock).
3. A secure, server-authorised admin dashboard that a non-technical clinic team can use.
4. A database that is safe by default (RLS, least privilege, audited).
5. A repository that another developer can pick up: migrations, tests, docs, no secrets.
6. Honest documentation of what is verified and what still needs client input or credentials.

## 3. Non-goals (explicit)

- Real-time slot availability / calendar sync. The site says, in plain language, that a request is not a
  confirmed booking. No false availability is shown.
- Payments, insurance claims, patient records, clinical images or prescriptions. Collecting them would add
  legal and security burden without a requirement.
- Public user accounts, reviews or testimonials. There is no public registration.
- Multi-clinic / multi-tenant support.
- SMS messaging (no provider configured).

## 4. Architecture summary

```
Browser
  │  HTTPS
  ▼
Vercel (Next.js 16 App Router)
  ├─ Public pages (RSC) ──────────────► Supabase PostgREST (anon key + RLS)
  ├─ Server Actions (Zod + authz) ────► Supabase (user session + RLS)
  ├─ /admin (protected) ──────────────► Supabase Auth (cookie session)
  └─ Service-role client (2 narrow uses) ─► duplicate-submission check
                                              │
                                              ▼
                                   Supabase PostgreSQL + RLS
                                   Supabase Auth (no sign-up)
```

- **Rendering:** nonce-based CSP requires dynamic rendering; the root layout reads the per-request nonce.
  Public data that is read more than once per render (active services, public settings) is deduplicated
  with React's `cache()`; there is no cross-request data cache, so a staff edit appears immediately.
- **Auth:** `@supabase/ssr` cookie sessions; `getUser()` (server-validated) on every protected render and
  every action. Roles: `pending` (no access), `staff` (operations), `admin` (operations + configuration +
  audit). Role changes happen only out-of-band.
- **Write path:** all mutations are server actions, validated with Zod, authorised in `src/lib/auth`, and
  audited via a `SECURITY DEFINER` SQL function so logs cannot be forged by clients.
- **Public write path:** appointment and contact inserts go through RLS policies that force
  `status = 'pending'/'new'`, forbid reading, and require an active service. Spam controls: honeypot,
  minimum fill time, in-memory rate limit, hashed-IP key, duplicate check via a narrowly scoped
  service-role query.

Full details: `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/SECURITY.md`.

## 5. Work breakdown

| Phase | Work | State |
| --- | --- | --- |
| A | Audit, plan, persistent agent instructions | complete |
| B | Next.js 16 + TS strict + Tailwind 4 scaffold, tooling, env schema | complete |
| C | Design system and all public pages (home, about, dentist, services, service detail, booking, contact, privacy, terms, 404, loading, error) | complete |
| D | SQL migrations: enums, tables, constraints, indexes, triggers, RLS, grants, seed services/settings | complete (written); execution pending a Supabase project |
| E | Supabase Auth wiring, proxy session refresh, admin guard, login/logout/password reset, admin provisioning script | complete (written); live sign-in pending credentials |
| F | Public server actions (appointment, contact), validation, rate limiting, duplicate protection, optional Resend notification, health route | complete (written); end-to-end insert pending a project |
| G | Admin dashboard: stats, appointments (search/filter/paginate/detail/status/notes), messages, services CRUD, settings, audit viewer | complete (written); authenticated walkthrough pending a project |
| H | Security hardening: CSP nonce, headers, cookie flags, error redaction, secret scan, dependency audit | complete and verified locally |
| I | Unit tests (validation, transitions, authz, rate limit, redaction), RLS SQL suite, Playwright E2E, build fixes | complete locally: 59 unit + 70 E2E passing, build passes; RLS suite written but not executed |
| J | Git repo, README, secret/PII scan, commit | local repository initialised and committed; no remote configured |
| K | Vercel config + manual deployment runbook (no credentials in this environment) | configuration and runbook complete; deployment not performed |
| L | Acceptance review, operations + handover docs, final report | complete |

## 6. Security requirements register

| # | Requirement | Implementation | Verified |
| --- | --- | --- | --- |
| S1 | RLS on every table, deny by default | `supabase/migrations/…_rls_policies.sql` | Written and reviewed; SQL suite **not executed** (no project) |
| S2 | No anon read of appointments/messages/audit | RLS policies + revoked grants | Written and reviewed; SQL suite **not executed** |
| S3 | Server-side authz on every admin action | `requireAdmin()/requireStaff()` in each action | unit tests + code review |
| S4 | No privilege escalation | no in-app role updates; column-level `UPDATE` grants; trigger blocks role change | unit test for `canChangeRoles()`; SQL suite pending |
| S5 | Secure sessions | `@supabase/ssr`, `getUser()`, httpOnly/SameSite=Lax/Secure cookies | code review; needs live Supabase to exercise |
| S6 | Password reset | Supabase recovery flow + `/auth/callback` | implemented; needs live Supabase + SMTP |
| S7 | Input validation | Zod schemas shared server/client | unit tests |
| S8 | Rate limiting / spam | in-memory limiter, honeypot, timing check, duplicate query | unit tests; distributed limit requires Vercel WAF |
| S9 | Security headers + CSP | `next.config.ts`, `src/proxy.ts` (nonce) | Playwright asserts CSP, nonce rotation, `strict-dynamic`; deployed headers not inspected |
| S10 | No secrets in repo | `.gitignore`, `.env.example`, `npm run check:secrets` | scan passes |
| S11 | Safe errors / no PII logging | `AppError`, `logger` redaction | unit tests |
| S12 | SQL injection | PostgREST parameterised queries only, sanitised search filter | code review + unit tests |
| S13 | XSS | React escaping, two `dangerouslySetInnerHTML` uses both via `safeJsonLd()`, strict CSP | unit test for escaping; code review |
| S14 | CSRF | Server Actions origin check + SameSite cookies; no state-changing GETs | code review |
| S15 | Dependency risk | `npm audit`, pinned versions | `npm audit --omit=dev` → 0 vulnerabilities |

## 7. Acceptance checklist

- [x] Design complete and responsive (mobile / tablet / desktop) — visually reviewed and exercised at
      desktop and Pixel 7 breakpoints in Playwright
- [x] All required pages exist, including custom 404, loading and error boundaries
- [x] Appointment + contact forms implemented end-to-end in code; **not exercised against a live
      database** (no Supabase project available)
- [x] Migrations committed and documented
- [x] Authentication, RBAC and password reset implemented; live sign-in and reset delivery **not
      exercised** (no project/SMTP)
- [x] Admin dashboard implemented and protected; authenticated walkthrough **not exercised**
- [x] RLS policies written and a verification suite provided; suite **not executed**
- [x] No credentials or patient data committed (`npm run check:secrets` passes)
- [x] Security headers, CSP and rate limiting in place; CSP verified locally by Playwright
- [x] Unit tests pass — 59 tests, 6 files
- [x] E2E tests pass — 70 tests (35 × chromium + mobile); authenticated E2E documented as gated on
      credentials
- [x] Production build succeeds — 28 routes
- [x] Dependency audit reviewed — `npm audit --omit=dev` reports 0 vulnerabilities
- [x] Local Git repository initialised with the verified tree (no remote configured)
- [x] Vercel configuration + deployment runbook complete; **not deployed**
- [x] Backup, recovery and operations documentation complete; restore drill **not performed**
- [x] Client handover guide complete
- [x] Outstanding items listed for the client (`docs/REQUIRED_CLINIC_INFORMATION.md`)

## 8. Known constraints of the build environment

- No Supabase project credentials were available, so no live database, Auth configuration, email delivery
  or Vercel deployment could be exercised. The code path is implemented and the runbook is exact; results
  are reported honestly in the final summary.
- GitHub/Vercel credentials were not available. A local Git repository is initialised; publishing is a
  documented manual step.
- Clinic facts (address, phone, hours, dentist credentials, registration) were not supplied. Placeholders are
  used and listed in `docs/REQUIRED_CLINIC_INFORMATION.md`.
