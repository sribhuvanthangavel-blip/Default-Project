# Security checklist — Jishnu's Dentistry

Last updated: 2026-11-02

Use this file twice: once while reviewing a change, and once before every production deploy. Tick a box
only when the evidence exists. Items marked **blocked** could not be exercised in the build environment
because no Supabase project, mail provider or hosting account was available.

Legend: `[x]` verified locally · `[ ]` to do · `[!]` cannot be verified here (see note).

---

## 1. Before every commit

- [x] `npm run typecheck` passes with no errors.
- [x] `npm run lint` passes with no errors or warnings.
- [x] `npm run test` passes.
- [x] `npm run check:secrets` reports no credentials or committed env files.
- [x] No `.env`, `.env.local` or `.env.*` file is staged (only `.env.example` is tracked).
- [x] No patient data, real names, phone numbers or email addresses appear in fixtures, tests or docs.
- [x] New user-facing strings are real copy or an explicit placeholder — never an invented clinic fact.

## 2. Authorisation

- [x] Every dashboard page calls `requireStaffPage()` or `requireAdminPage()`.
- [x] Every Server Action calls `requireStaff()` or `requireAdmin()` **before** reading or writing.
- [x] Admin-only features (services, settings, audit) are gated on the `admin` role in both UI and action.
- [x] There is no route, action or RPC that creates a user or changes a role.
- [x] `canChangeRoles()` returns `false` and is unit-tested.
- [x] The proxy redirect is treated as convenience only; it is never the sole check.
- [x] `next`/redirect parameters are relative and constrained to `/admin`.
- [!] Live session validation with `getUser()` observed against a real Supabase project — **blocked**.

## 3. Database access

- [x] RLS is enabled on `profiles`, `services`, `appointments`, `contact_messages`, `site_settings`,
  `audit_logs`.
- [x] All inherited grants are revoked before policies are created (deny-by-default).
- [x] Anonymous read of appointments, messages, audit logs and profiles is impossible by policy and by
  grant.
- [x] Anonymous inserts are column-limited, status-forced, consent-required, service-active and
  booking-enabled.
- [x] Staff `UPDATE` is column-limited to `status` and `admin_notes` (appointments) and `status`
  (messages).
- [x] `audit_logs` has no `INSERT` grant for any API role; writes go through `record_audit_log`.
- [x] All `SECURITY DEFINER` functions set `search_path = ''` and use schema-qualified names.
- [x] Status transitions are enforced by a trigger, not only by the UI.
- [x] Role changes are rejected by a trigger for API roles.
- [!] `supabase/tests/rls_policies.sql` executed against a staging project — **blocked** (no project).
- [ ] Point-in-time recovery or daily backups confirmed on the production project.

## 4. Secrets and configuration

- [x] `SUPABASE_SERVICE_ROLE_KEY` is read only in `src/lib/supabase/service.ts` and offline scripts.
- [x] No secret is exposed through a `NEXT_PUBLIC_*` variable.
- [x] `.gitignore` excludes every env file except `.env.example`.
- [x] `/api/health` returns booleans, never key values.
- [x] `npm run check:secrets` covers JWTs, private keys, Resend/Stripe/AWS keys and committed env files.
- [ ] Production env vars set in Vercel (not in the repository) — deployment step.
- [ ] `RATE_LIMIT_SALT` set to a long random value in production.
- [ ] Keys rotated if a value was ever pasted into a chat, ticket or commit.

## 5. Transport and headers

- [x] CSP is set per request with a random nonce and `strict-dynamic`.
- [x] `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`.
- [x] `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  `X-Frame-Options: DENY` are set in `next.config.ts`.
- [x] HSTS is emitted only in production.
- [x] `poweredByHeader: false`.
- [x] CSP nonces differ between requests (Playwright assertion).
- [ ] Deployed response headers inspected with `curl -I` — deployment step (`docs/DEPLOYMENT.md` §9).

## 6. Sessions and authentication

- [x] Session cookies are `httpOnly`, `SameSite=Lax`, `Secure` in production, `path=/`.
- [x] Sign-in errors are generic (no "user exists" enumeration).
- [x] Password reset always reports the same outcome, whether or not the address exists.
- [x] The recovery link is exchanged server-side in `/auth/callback`; no token is stored in the client.
- [x] New Auth users default to `pending` and therefore cannot reach the dashboard.
- [x] Sign-out uses a POST Server Action, not a GET link.
- [!] Password reset email delivered end to end — **blocked** (no SMTP).
- [ ] Supabase Auth: disable public sign-up; set the Site URL and redirect allow-list.
- [ ] Supabase Auth: enable leaked-password protection and a minimum password length of 12.

## 7. Input handling and output

- [x] All public and admin input is parsed with Zod on the server.
- [x] Dashboard search input is sanitised before being used in a PostgREST filter.
- [x] No string-concatenated SQL anywhere in the application.
- [x] The only `dangerouslySetInnerHTML` uses pass through `safeJsonLd()` (unit-tested escaping).
- [x] No third-party scripts, iframes or embeds.
- [x] Fonts are self-hosted by `next/font/google`.
- [x] File uploads are not accepted anywhere.

## 8. Abuse resistance

- [x] Honeypot field present on both public forms.
- [x] Minimum fill time and maximum form age enforced server-side.
- [x] In-memory rate limiting with a salted IP hash.
- [x] Duplicate-submission check.
- [x] Server Action body size limited to 256 kb.
- [ ] Vercel WAF rate-limit rule on `/appointment` and `/contact` (recommended, see
  `docs/DEPLOYMENT.md` §8).

## 9. Privacy and logging

- [x] Logger redacts keys matching `email|phone|name|message|notes|token|key|authorization|cookie|password|secret|address`.
- [x] Logger redaction is unit-tested.
- [x] Audit metadata contains identifiers and status changes, never message bodies or notes.
- [x] Error boundaries show a digest, not the exception message.
- [x] Unknown errors are collapsed to a generic public message.
- [ ] Retention period agreed with the clinic and reflected in `docs/DATABASE.md` §5.
- [ ] Legal entity, registered address, jurisdiction and privacy contact supplied.

## 10. Dependencies and build

- [x] Version pins are exact for runtime-critical packages.
- [x] `npm run build` completes with the App Router route table.
- [ ] `npm audit` reviewed with no unresolved high/critical advisory.
- [ ] Dependabot or a scheduled `npm audit` is enabled after the repository is published.

## 11. Operations

- [ ] `docs/OPERATIONS.md` backup/restore section completed with a real restore test date.
- [ ] Uptime monitor pointed at `/api/health`.
- [ ] Staff accounts provisioned, roles confirmed, first sign-in exercised.
- [ ] Emergency contact and escalation path agreed with the clinic.
- [ ] Incident response steps rehearsed (revoke session, rotate key, restore backup).

---

## Recording a review

Append a line to this table when the checklist is run against a real environment. Do not overwrite
previous rows; the history is the point.

| Date | Environment | Reviewer | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-11-02 | Local build (no Supabase) | Build agent | Partial | Typecheck, lint, unit tests, build and CSP/redirect E2E verified; everything requiring credentials is marked blocked above |
