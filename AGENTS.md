# AGENTS.md — Jishnu's Dentistry

Persistent instructions for any developer or AI agent working on this repository.

## 1. Project identity

- Client: **Jishnu's Dentistry** (dental clinic).
- This repository is a **complete rebuild**. The workspace supplied for the rebuild was empty: no previous
  source code, screenshots, brand assets, analytics exports, or clinic data were available. See
  `docs/PROJECT_PLAN.md` → "Audit findings".
- Never invent clinic facts. Phone numbers, address, opening hours, dentist qualifications, prices,
  reviews, treatment outcomes and registration numbers must come from the clinic and live in
  `src/content/clinic.ts` or the `site_settings` table. Anything not supplied stays blank or is rendered
  as an explicit "to be confirmed" placeholder.
- The single source of truth for outstanding business information is
  `docs/REQUIRED_CLINIC_INFORMATION.md`.

## 2. Stack (do not swap casually)

| Layer            | Choice                                                               |
| ---------------- | -------------------------------------------------------------------- |
| Framework        | Next.js 16 App Router (`src/app`), React 19, TypeScript strict       |
| Styling          | Tailwind CSS v4 (CSS-first `@theme` tokens in `src/app/globals.css`) |
| Data / auth      | Supabase (PostgreSQL + Auth), `@supabase/ssr` cookie sessions        |
| Validation       | Zod v4, React Hook Form + `@hookform/resolvers`                      |
| Tests            | Vitest (unit), Playwright (E2E), SQL RLS test script                 |
| Hosting          | Vercel + GitHub                                                      |
| Email (optional) | Resend, only when `RESEND_API_KEY` is configured                     |

## 3. Architecture rules

- `src/app` — routes only. No business logic in page components beyond composition.
- `src/components` — presentational + small client interactions. `ui/` is generic, `site/` public,
  `admin/` dashboard.
- `src/lib` — the only place that talks to Supabase, validates input, authorises users or applies
  business rules. Server-only modules start with `import 'server-only'`.
- `src/actions` — server actions. Every action must:
  1. validate input with Zod,
  2. authorise on the server (never trust the UI or proxy alone),
  3. perform the database operation,
  4. write an audit record for state changes,
  5. return a typed `ActionResult` (never a raw error/stack).
- `src/content` — static, human-reviewed marketing copy and clinic facts.
- `supabase/migrations` — the only way schema changes ship. Never edit a deployed migration; add a new one.

## 4. Security invariants

- RLS is **enabled and deny-by-default on every table**. Do not disable RLS, do not add `USING (true)`
  policies for private data, and do not use the service-role key in the browser or in client components.
- `SUPABASE_SERVICE_ROLE_KEY` is used only in `src/lib/supabase/service.ts` (duplicate-submission checks)
  and in offline scripts. Never expose it through `NEXT_PUBLIC_*`.
- Admin access requires BOTH a valid Supabase user session AND `profiles.role ∈ {staff, admin}`.
  Admin-only operations additionally require `admin`.
- Roles are provisioned out-of-band (SQL / `scripts/create-admin.mjs`). There is no registration route and
  no in-app role editing.
- All public form endpoints use Zod validation, a honeypot, a submission-timing check and rate limiting.
- Never log patient names, emails, phone numbers or message bodies. Use `src/lib/logger.ts`, which redacts.
- Do not add third-party scripts without updating the CSP in `src/proxy.ts`.

## 5. Commands

```bash
npm run dev            # local dev server
npm run build          # production build (must pass before any deploy)
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm run test           # Vitest unit tests
npm run test:e2e       # Playwright (starts dev server automatically)
npm run verify         # lint + typecheck + unit tests + build
npm run check:secrets  # scans tracked files for leaked credentials
```

Windows note used during the build: `npm.cmd` may be required if PowerShell script execution is disabled.

## 6. Definition of done for a change

- Types, lint, unit tests and `npm run build` pass.
- New user-visible strings are real (or explicitly marked placeholders).
- New tables/columns come with a migration, indexes, RLS policies and a note in `docs/DATABASE.md`.
- New sensitive actions are audited and documented in `docs/SECURITY_CHECKLIST.md`.
- `docs/PROJECT_PLAN.md` checklist is updated.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
