# Deployment — Jishnu's Dentistry

Last updated: 2026-11-02

This is an exact runbook. Every step was written against the code in this repository, but **no step that
needs a Supabase project, Vercel account, GitHub remote or email provider was executed** during the
build. Where that is the case it is stated.

Prerequisites:

- Node.js 20+ (built with 26.x), npm 10+.
- A Supabase account (project owner).
- A Vercel account connected to a GitHub account.
- Git installed locally.
- Optionally, a Resend account for clinic notification emails.

---

## 1. Create the Supabase project

1. Supabase dashboard → **New project**. Choose the region closest to the clinic; record the region in
   `docs/OPERATIONS.md`.
2. Save the database password in a password manager. It is not needed by the application.
3. **Project Settings → API** → copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` / publishable key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**server-only**)

> Never put the service-role key in a variable beginning with `NEXT_PUBLIC_`. It bypasses RLS.

## 2. Apply the migrations

In filename order:

1. `supabase/migrations/20261102090000_init_schema.sql`
2. `supabase/migrations/20261102090100_rls_policies.sql`
3. `supabase/migrations/20261102090200_seed_reference_data.sql`

Either paste each file into **SQL Editor → Run**, or use the CLI:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Afterwards, verify:

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
-- every row must show rowsecurity = true

select setting_key, setting_value from public.site_settings order by setting_key;
-- 8 rows, all empty except booking_enabled = true

select name, slug, is_active from public.services order by display_order;
-- 1 active (dental-consultation) + 3 inactive templates
```

## 3. Configure Supabase Auth

**Authentication → Providers → Email**

- Enable email/password.
- **Disable "Allow new users to sign up"**. Accounts are created only by the provisioning script.
- Minimum password length: 12.

**Authentication → URL Configuration**

- Site URL: `https://<production-domain>`
- Additional redirect URLs:
  - `https://<production-domain>/auth/callback`
  - `http://localhost:3000/auth/callback` (local development only)
  - any Vercel preview URL you intend to test with, e.g. `https://<project>-git-*.vercel.app/auth/callback`

**Authentication → Email templates**

- Confirm the recovery template links to `{{ .SiteURL }}/auth/callback?next=/admin/reset-password`.
  The application and `/auth/callback` support both the PKCE `?code=` flow and the
  `?token_hash=…&type=recovery` flow.
- If Supabase's built-in SMTP is rate-limited, configure a custom SMTP provider before launch.

**Authentication → Settings**

- Enable leaked-password protection if the plan provides it.
- Set the JWT expiry to the default (1 hour) unless the clinic asks otherwise.

## 4. Provision the first administrator

Run this locally (never in the browser):

```bash
SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
node scripts/create-admin.mjs --email=reception@example.com --name="Clinic Reception" --role=admin
```

The script prints a generated password **once**. Store it in the clinic's password manager and have the
user change it at first sign-in. Repeat with `--role=staff` for operational accounts.

Verify the role:

```sql
select id, email, role from public.profiles order by created_at;
```

If the profile row could not be updated, set it manually:

```sql
update public.profiles set role = 'admin' where email = 'reception@example.com';
```

Run this as the project owner (postgres). The API cannot perform it — by design.

## 5. Prepare the repository

```bash
git init
git add .
npm run check:secrets        # must print: no credentials or environment files found
git commit -m "Initial rebuild of Jishnu's Dentistry website"
```

Create an empty GitHub repository, then:

```bash
git remote add origin https://github.com/<owner>/<repo>.git
git branch -M main
git push -u origin main
```

Branch protection for `main` is recommended once the clinic has a maintainer: require a pull request,
require the `verify` workflow, and disallow force pushes.

## 6. Deploy to Vercel

1. Vercel → **Add New → Project** → import the GitHub repository.
2. Framework preset: **Next.js** (detected). Build command `npm run build`, install `npm ci` (already
   in `vercel.json`).
3. Environment variables (Production and Preview):

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://<production-domain>`; no trailing slash |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-only; **not** `NEXT_PUBLIC_` |
| `CLINIC_TIMEZONE` | yes | e.g. `Asia/Kolkata`; confirm with the clinic |
| `RATE_LIMIT_SALT` | yes | 32+ random characters |
| `RESEND_API_KEY` | optional | Enables clinic notification email |
| `EMAIL_FROM` | optional | Verified Resend sender |
| `ADMIN_NOTIFICATION_EMAIL` | optional | Where notifications go |

Generate a salt:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

4. Deploy. Vercel runs `npm ci && npm run build`.
5. Add the production domain under **Settings → Domains**, then update:
   - `NEXT_PUBLIC_SITE_URL` in Vercel and redeploy (it is read at build time);
   - the Supabase Site URL and redirect allow-list from §3.

## 7. First-run verification

| Check | Expected |
| --- | --- |
| `https://<domain>/` | Home page renders, hero visible |
| `https://<domain>/api/health` | `{"status":"ok", "configuration":{"supabase":true,...}}` |
| `https://<domain>/admin` signed out | Redirects to `/admin/login?reason=auth` |
| Sign in with the provisioned account | Dashboard overview loads |
| Clinic settings saved with a real phone number | Phone appears in the footer and contact page |
| One appointment submitted on production | Row appears in `/admin/appointments` as `pending` |
| Password reset | Email arrives; link opens `/admin/reset-password` |
| `https://<domain>/sitemap.xml` | Lists public routes and active services |
| `https://<domain>/robots.txt` | Disallows `/admin` |

Delete the test appointment afterwards with the dashboard status flow or SQL; it contains no real
patient data.

## 8. Recommended hardening

- **Vercel WAF** → rate limit POST requests to `/appointment` and `/contact` (for example 10 requests
  per IP per minute). The in-memory limiter is per instance, so this is the global backstop.
- **Vercel Firewall** → challenge requests to `/admin/login` from unexpected countries if the clinic
  is single-region.
- Disable Vercel preview deployments for the `main`-only workflow if staff might otherwise land on a
  preview build with a different database.
- Keep the Supabase project on a plan with daily backups; enable PITR if offered.

## 9. Header and CSP verification

```bash
curl -sI https://<domain>/ | tr -d '\r'
```

Expect:

```
content-security-policy: default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic'; …
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=(), payment=()
```

Request twice and confirm the nonce changes:

```bash
curl -sI https://<domain>/ | grep -o "'nonce-[a-f0-9]*'"
curl -sI https://<domain>/ | grep -o "'nonce-[a-f0-9]*'"
```

## 10. Release checklist

Run from a clean clone:

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npm run check:secrets
npx playwright install --with-deps chromium
npm run test:e2e
```

Then complete the environment-specific items in `docs/SECURITY_CHECKLIST.md`, especially:

- [ ] RLS suite executed on staging (`docs/DATABASE.md` §9)
- [ ] Password reset delivered
- [ ] Backup restore tested
- [ ] `npm audit` reviewed
- [ ] Production headers inspected

Record the results and the date in `docs/OPERATIONS.md`.

## 11. Rollback

| Situation | Action |
| --- | --- |
| A bad application deploy | Vercel → Deployments → previous deployment → **Promote to Production** |
| A bad migration | Do **not** edit it. Write a new forward migration that reverts the change, test on staging, then apply |
| Accidental data loss | Restore from the Supabase backup/PITR into a new project, verify, then point the app at it |
| Compromised service-role key | Rotate in Supabase → update Vercel env → redeploy → review `audit_logs` and Auth sessions |
| Compromised staff account | Remove the role (`update profiles set role='pending'`), revoke sessions in Supabase Auth, re-provision |

## 12. What still needs a human

- Clinic facts (see `docs/REQUIRED_CLINIC_INFORMATION.md`).
- Legal review of `src/content/legal.ts`.
- Confirmation of the time zone, opening hours and notification recipients.
- A named person at the clinic who can approve copy and hold the administrator account.
