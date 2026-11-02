# Operations — Jishnu's Dentistry

Last updated: 2026-11-02

Written for two audiences:

- **Clinic staff** — what to do day to day in the dashboard.
- **The developer/maintainer** — monitoring, backups, incidents, upgrades.

---

## 1. Who does what

| Task | Owner | Frequency |
| --- | --- | --- |
| Read and action appointment requests | Clinic staff (staff role) | Daily |
| Reply to contact messages | Clinic staff | Daily |
| Confirm or cancel appointments | Clinic staff | As needed |
| Update phone, hours, address, announcement | Clinic admin | When it changes |
| Edit the treatment list | Clinic admin | When it changes |
| Approve new page copy or legal text | Clinic owner | Before launch and on change |
| Deploy, migrate, rotate keys | Developer | On change / on incident |
| Provision or remove staff accounts | Developer, on the clinic's written request | On change |
| Restore a backup | Developer | On incident, tested yearly |

---

## 2. Daily routine for clinic staff

1. Sign in at `https://<domain>/admin`.
2. **Overview** shows pending requests and new messages — the two numbers with a gold outline.
3. Open **Appointments**:
   - phone the patient using the number on the record;
   - agree a date and time;
   - only then use **Mark confirmed**;
   - after the visit, **Mark completed**;
   - if it falls through, **Mark cancelled** and tell the patient directly.
4. Use **Staff notes** for internal context. Do not paste clinical records or full patient history.
5. Open **Messages**, read, reply by email or phone, then set the message to **Read** or **Archived**.
6. Keep **Clinic settings** accurate. If a detail is not verified, leave it blank — the public site
   hides blank fields rather than showing a guess.

### What the dashboard deliberately cannot do

- It cannot send SMS or automatically email the patient. Confirmation is a human conversation.
- It cannot show live slot availability, because the site never claims any.
- It cannot create users or change roles. Ask the developer.
- It cannot delete an appointment or a message. If a record must be erased, use the retention process
  in §6.

---

## 3. Monitoring

| What | Where | Reaction |
| --- | --- | --- |
| Uptime | Any monitor pointed at `/api/health` | Investigate a non-200 or a `supabase: false` flag |
| Errors | Vercel → Project → Logs | Look for repeated `action.unhandled_error` or `render.error_boundary` |
| Auth problems | Supabase → Authentication → Logs | Check for failed sign-ins or blocked emails |
| Abuse | Vercel → Firewall/WAF (if enabled) | Raise the rate limit or block the source |
| Database size | Supabase → Reports | Review before it approaches the plan limit |

`/api/health` returns `configuration.supabase`, `configuration.serviceRole` and
`configuration.emailNotifications` as booleans. It never returns a key.

### Suggested alert thresholds

- Health check fails twice in a row (2 minutes apart).
- More than 20 appointment requests in an hour (possible spam).
- More than 10 failed admin sign-ins in 15 minutes.

---

## 4. Backups and restore

- Supabase provides daily backups on paid plans. Confirm the retention window and record it here:

  > Backup plan: _to be recorded after the project is created_
  > Retention: _to be recorded_
  > PITR enabled: _yes / no_

- **Restore drill** (do this once before launch and yearly):
  1. Create a new Supabase project.
  2. Restore the latest backup into it (dashboard → Database → Backups → Restore, or PITR).
  3. Run `supabase/tests/rls_policies.sql` against the restored project.
  4. Check that row counts for `appointments`, `contact_messages`, `services` and `site_settings` match
     production.
  5. Record the date and outcome in §10.

- Application code can always be redeployed from Git; the database is the only irreplaceable asset.

---

## 5. Routine maintenance

| Frequency | Task |
| --- | --- |
| Weekly | Skim `/admin/audit` for unexpected role or settings changes |
| Monthly | `npm audit`; apply patch updates and redeploy after `npm run verify` |
| Monthly | Review Supabase Auth users; remove anyone who has left the clinic |
| Quarterly | Re-read `docs/SECURITY_CHECKLIST.md` and tick/refresh it |
| Yearly | Restore drill; review retention policy with the clinic |
| On change | Any clinic fact changed → update Clinic settings, not code |

### Updating dependencies

```bash
npm outdated
npm update <package>
npm run verify        # lint + typecheck + unit tests + build
npm run test:e2e
```

Pin runtime-critical versions (Next, React, Supabase, Zod) to exact versions; upgrade them deliberately,
one at a time, and re-run the RLS suite if `@supabase/*` changes.

---

## 6. Data retention and deletion requests

The retention period is a clinic decision and is still outstanding (see
`docs/REQUIRED_CLINIC_INFORMATION.md`). Until it is agreed, nothing is deleted automatically.

When a patient asks for their data to be removed:

1. Identify the record in the dashboard (name + date, or the `JD-XXXXXXXX` reference).
2. Have the clinic confirm the request in writing.
3. As the project owner, run a targeted delete:

   ```sql
   delete from public.appointments where id = '<uuid>';
   -- or
   delete from public.contact_messages where id = '<uuid>';
   ```

4. Keep the related `audit_logs` rows: they contain identifiers and actions, not the patient's message.
   If the clinic requires those removed too, get that in writing first and delete by `resource_id`.
5. Note the date and reason in the clinic's own record — this document is not a patient register.

---

## 7. Incident response

### Suspected unauthorised dashboard access

1. Set the account to no access immediately:

   ```sql
   update public.profiles set role = 'pending' where email = '<account>';
   ```

2. Revoke the user's sessions in Supabase → Authentication → Users.
3. Review `audit_logs` for the account's `actor_id`.
4. Rotate the service-role key if it may have been exposed, update Vercel, redeploy.
5. Tell the clinic; decide together whether patients must be informed.

### Suspected spam flood

1. Check Vercel logs for the submission pattern.
2. Enable or tighten a WAF rule on `/appointment` and `/contact`.
3. Set `booking_enabled` to `false` in Clinic settings to pause requests while the clinic catches up.
4. Delete the spam rows by SQL after exporting the reference IDs.

### Site down

1. Check Vercel status and the deployment log.
2. If the last deploy is at fault, promote the previous deployment (§ `docs/DEPLOYMENT.md` §11).
3. If Supabase is down, the public site still renders (data modules return empty states); the dashboard
   will not load. Say so on the clinic's social/phone channel if the outage is long.
4. Record the incident in §10.

### Accidental mass status change

There is no undo in the dashboard. Use the audit log to identify the affected IDs, then correct each
record through SQL with the clinic's approval. Do not disable the status trigger to "fix" it.

---

## 8. Account lifecycle

| Event | Action |
| --- | --- |
| New staff member | Developer runs `scripts/create-admin.mjs --role=staff`; password handed over in person or via a password manager |
| Promotion to admin | `update public.profiles set role='admin' where email='…'` (project owner only) |
| Staff member leaves | `update public.profiles set role='pending' where email='…'`, then delete the Auth user |
| Forgotten password | Staff uses **Forgot password**; developer verifies the account email if no mail arrives |
| Lost device | Revoke sessions in Supabase Auth, then reset the password |

There is no self-service registration and no in-app role editing, so these steps are the whole lifecycle.

---

## 9. Local development quick reference

```bash
npm install
cp .env.example .env.local     # fill in values; never commit it
npm run dev                    # http://localhost:3000

# Optional: full local Supabase (requires Docker)
npx supabase start
npx supabase db reset          # applies migrations + seed
npm run test                   # Vitest
npm run test:e2e               # Playwright (starts the dev server)
npm run verify                 # lint + typecheck + test + build
```

Windows note: if PowerShell blocks npm's script shim, use `npm.cmd run <script>`.

---

## 10. Operations log

Append entries; do not rewrite history.

| Date | Event | By | Notes |
| --- | --- | --- | --- |
| 2026-11-02 | Local build completed | Build agent | Typecheck, lint, formatting, 59 unit tests, 70 E2E tests, production build, audit and secret scan all pass. Local commit `ee33212`. No Supabase project available |
| _pending_ | Supabase project created | | Record region, plan, backup retention |
| _pending_ | Migrations applied | | Record the applied timestamps |
| _pending_ | First administrator provisioned | | Do **not** record the password here |
| _pending_ | Production deploy | | Record the deployment URL and commit SHA |
| _pending_ | Restore drill | | Record the project used and the result |
