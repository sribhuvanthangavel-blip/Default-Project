# Database — Jishnu's Dentistry

Last updated: 2026-11-02

Supabase PostgreSQL. All schema changes ship as migrations in `supabase/migrations`; no table is ever
created by hand in the dashboard.

| Migration | Purpose |
| --- | --- |
| `20261102090000_init_schema.sql` | Enums, tables, constraints, indexes, triggers, `record_audit_log`, `booking_is_enabled` |
| `20261102090100_rls_policies.sql` | RLS enablement, policies, column-level grants, authorisation helpers |
| `20261102090200_seed_reference_data.sql` | One active service, three inactive templates, empty settings rows |

`supabase/seed.sql` is a thin convenience wrapper for local `supabase db reset`. `supabase/tests/rls_policies.sql`
is the RLS verification suite (§9).

---

## 1. Enumerated types

```sql
create type public.app_role as enum ('pending', 'staff', 'admin');
create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
create type public.contact_message_status as enum ('new', 'read', 'archived');
```

Enums make invalid states unrepresentable and keep the TypeScript union types honest.

---

## 2. Tables

### 2.1 `profiles`

One row per Supabase Auth user. **No credentials are stored here** — passwords and sessions belong to
`auth.users`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | `references auth.users(id) on delete cascade` |
| `email` | `text` | Mirror of the auth email, `''` default, unique when non-empty |
| `full_name` | `text` | `''` default, max 120 chars |
| `role` | `app_role` | **default `pending`** (no access) |
| `created_at` / `updated_at` | `timestamptz` | `updated_at` maintained by trigger |

Triggers:

- `on_auth_user_created` — inserts a profile with `role = 'pending'` when Supabase Auth creates a user.
  A new account therefore has *no* dashboard access until someone grants a role out-of-band.
- `on_auth_user_email_changed` — keeps the mirror in sync.
- `profiles_prevent_privilege_change` — rejects any role change unless the current database role is
  `postgres`, `service_role` or `supabase_admin`, and rejects changing `id`.

There is no `INSERT`/`UPDATE`/`DELETE` grant on `profiles` for `anon` or `authenticated`. Roles are
provisioned with `scripts/create-admin.mjs` or SQL.

### 2.2 `services`

The public treatment list, editable in the dashboard.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | `gen_random_uuid()` |
| `name` | `text` | 2–120 chars |
| `slug` | `text` | unique, `^[a-z0-9]+(-[a-z0-9]+)*$`, 2–80 chars |
| `description` | `text` | `''` default, ≤ 4000 chars |
| `display_order` | `integer` | 0–10000, lower first |
| `is_active` | `boolean` | `true` default; inactive services are invisible to visitors |
| `created_at` / `updated_at` | `timestamptz` | |

Indexes: unique `services_slug_unique_idx`, `services_active_order_idx (is_active, display_order, name)`.

### 2.3 `appointments`

A **request**, never a confirmed booking until a staff member changes the status.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | Displayed in the dashboard as `JD-XXXXXXXX` |
| `patient_name` | `text` | 2–120 chars |
| `phone` | `text` | 7–24 chars, normalised by the app |
| `email` | `text` | 5–320 chars, must contain `@` |
| `service_id` | `uuid` | `references services(id) on delete restrict` |
| `preferred_date` | `date` | ≥ `2024-01-01` |
| `preferred_time` | `time` | Patient's preference, not a slot |
| `message` | `text` | `''` default, ≤ 2000 chars |
| `status` | `appointment_status` | `pending` default |
| `admin_notes` | `text` | `''` default, ≤ 4000 chars, staff only |
| `consent_given` | `boolean` | `CHECK (consent_given)` — a request cannot be stored without consent |
| `created_at` / `updated_at` | `timestamptz` | |

Indexes: `(status, created_at desc)`, `preferred_date`, `(created_at desc)`, `service_id`, and a GIN
trigram index over `patient_name || email || phone` for the dashboard search box.

Trigger `enforce_appointment_status_transition` — the authoritative workflow:

```
pending   → confirmed | cancelled
confirmed → completed | cancelled
completed → (terminal)
cancelled → (terminal)
```

`on delete restrict` on `service_id` is why the dashboard offers "deactivate" instead of "delete" for
a service that already has requests: history must survive.

### 2.4 `contact_messages`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `name` | `text` | 2–120 chars |
| `email` | `text` | 5–320 chars |
| `phone` | `text` | `''` default, ≤ 24 chars |
| `message` | `text` | 10–3000 chars |
| `status` | `contact_message_status` | `new` default |
| `created_at` | `timestamptz` | |

Indexes: `(status, created_at desc)`, `(created_at desc)`, and a GIN trigram index over the searchable
concatenation.

### 2.5 `site_settings`

Operationally editable content only. Brand and marketing copy stays in version control.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `setting_key` | `text` | unique, `^[a-z0-9_]{2,64}$` |
| `setting_value` | `jsonb` | `null` default; strings are stored as JSON strings |
| `is_public` | `boolean` | `false` default |
| `updated_at` | `timestamptz` | Trigger-maintained |
| `updated_by` | `uuid` | `references profiles(id) on delete set null` |

Seeded keys (all intentionally blank except `booking_enabled`):

| Key | Meaning |
| --- | --- |
| `clinic_phone` | Published phone number |
| `clinic_whatsapp` | WhatsApp number (digits and `+` only) |
| `clinic_email` | Public email address |
| `clinic_address` | Multi-line address |
| `clinic_hours` | Multi-line opening hours |
| `clinic_map_url` | `https://` map link (rendered as a link, never embedded) |
| `announcement` | Short factual banner; blank hides it |
| `booking_enabled` | `true`/`false`; also enforced by RLS on insert |

### 2.6 `audit_logs`

Append-only administrative trail. It stores identifiers and action names, **never** patient message
bodies or appointment notes.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `actor_id` | `uuid` | `references profiles(id) on delete set null` |
| `actor_email` | `text` | Snapshot so the trail survives account deletion |
| `action` | `text` | 2–80 chars, e.g. `appointment.status_changed` |
| `resource_type` | `text` | 2–60 chars |
| `resource_id` | `text` | ≤ 120 chars, nullable |
| `metadata` | `jsonb` | Object, ≤ 4000 chars serialised |
| `created_at` | `timestamptz` | |

Indexes: `(created_at desc)`, `actor_id`, `(resource_type, resource_id)`.

Writes go exclusively through `public.record_audit_log(...)`; `INSERT` is revoked from every API role.

---

## 3. Functions

| Function | Security | Purpose |
| --- | --- | --- |
| `set_updated_at()` | invoker (trigger) | Maintains `updated_at` |
| `handle_new_auth_user()` | definer | Creates the `pending` profile on sign-up |
| `handle_auth_user_email_change()` | definer | Keeps the profile email mirror current |
| `prevent_profile_privilege_change()` | invoker (trigger) | Blocks role/id changes from API roles |
| `enforce_appointment_status_transition()` | invoker (trigger) | Enforces the workflow |
| `current_profile_role()` | definer, stable | `app_role` of `auth.uid()`, avoids recursive RLS |
| `is_staff()` / `is_admin()` | definer, stable | Policy helpers |
| `record_audit_log(text, text, text, jsonb)` | definer | The only audited write path; requires `auth.uid()` |
| `booking_is_enabled()` | definer, stable | Reads `booking_enabled`, defaults to `true` |

All `SECURITY DEFINER` functions use `set search_path = ''` and schema-qualified names, which closes
the classic search-path hijack.

---

## 4. Row Level Security

RLS is enabled on **every** application table, and all inherited grants are revoked first. The result
is deny-by-default: a policy must exist *and* a grant must exist.

### Policies in full

| Table | Policy | Role | Command | Rule |
| --- | --- | --- | --- | --- |
| `profiles` | `profiles_select_own_or_staff` | authenticated | SELECT | `id = auth.uid() OR is_staff()` |
| `services` | `services_select_active_public` | anon, authenticated | SELECT | `is_active = true` |
| `services` | `services_select_all_staff` | authenticated | SELECT | `is_staff()` |
| `services` | `services_insert_admin` | authenticated | INSERT | `is_admin()` |
| `services` | `services_update_admin` | authenticated | UPDATE | `is_admin()` |
| `services` | `services_delete_admin` | authenticated | DELETE | `is_admin()` |
| `appointments` | `appointments_insert_public` | anon, authenticated | INSERT | `status = 'pending' AND admin_notes = '' AND consent_given AND booking_is_enabled() AND service is active` |
| `appointments` | `appointments_select_staff` | authenticated | SELECT | `is_staff()` |
| `appointments` | `appointments_update_staff` | authenticated | UPDATE | `is_staff()` |
| `contact_messages` | `contact_messages_insert_public` | anon, authenticated | INSERT | `status = 'new'` |
| `contact_messages` | `contact_messages_select_staff` | authenticated | SELECT | `is_staff()` |
| `contact_messages` | `contact_messages_update_staff` | authenticated | UPDATE | `is_staff()` |
| `site_settings` | `site_settings_select_public` | anon, authenticated | SELECT | `is_public = true` |
| `site_settings` | `site_settings_select_admin` | authenticated | SELECT | `is_admin()` |
| `site_settings` | `site_settings_insert_admin` | authenticated | INSERT | `is_admin()` |
| `site_settings` | `site_settings_update_admin` | authenticated | UPDATE | `is_admin()` |
| `site_settings` | `site_settings_delete_admin` | authenticated | DELETE | `is_admin()` |
| `audit_logs` | `audit_logs_select_admin` | authenticated | SELECT | `is_admin()` |

No policy grants `DELETE` on `appointments`, `contact_messages` or `audit_logs`; there is no grant
either. Records are removed only by an operator with direct database access, which is the intended
retention behaviour.

### Column-level grants (least privilege)

Even where a policy allows `UPDATE`, the role may only write specific columns:

```sql
grant insert (patient_name, phone, email, service_id, preferred_date, preferred_time, message, consent_given)
  on public.appointments to anon;
grant update (status, admin_notes) on public.appointments to authenticated;

grant insert (name, email, phone, message) on public.contact_messages to anon;
grant update (status) on public.contact_messages to authenticated;

grant select (id, setting_key, setting_value, is_public, updated_at) on public.site_settings to anon, authenticated;
```

So a compromised staff session cannot rewrite a patient's email address, and `created_at`/`updated_at`
can never be set by a client.

---

## 5. Data retention

The application never hard-deletes patient data on a schedule; retention is a clinic policy decision
(see `docs/REQUIRED_CLINIC_INFORMATION.md`). When a retention period is agreed, delete with SQL as an
operator, for example:

```sql
-- Preview first. Replace the interval with the agreed retention period.
select id, created_at from public.appointments
 where created_at < now() - interval '24 months'
 order by created_at;

delete from public.appointments where created_at < now() - interval '24 months';
```

Audit entries about those records are intentionally kept: they contain identifiers, not patient
content. If the clinic requires audit rows to be purged as well, agree that in writing first.

---

## 6. Running migrations

### Local (Supabase CLI)

```bash
supabase start                     # requires Docker
supabase db reset                  # applies migrations + seed
supabase db push                   # push to the linked remote project
```

### Hosted project

```bash
supabase link --project-ref <ref>
supabase db push
```

Or paste each migration into the dashboard SQL editor, **in filename order**. Migrations are
idempotent only in the sense that the seed uses `on conflict do nothing`; the schema migrations are
intended to run exactly once.

Rules:

1. Never edit a migration that has been applied to any shared environment.
2. Add a new timestamped migration instead.
3. Update this document in the same change.
4. Add or adjust a test in `supabase/tests/rls_policies.sql` when a policy changes.

---

## 7. TypeScript types

`src/types/database.ts` is hand-maintained and mirrors the schema (`Database['public']['Tables'][…]`).
It is the type passed to every Supabase client, so a column rename in SQL without the matching type
change fails `npm run typecheck`.

If you prefer generated types:

```bash
npx supabase gen types typescript --project-id <ref> --schema public > src/types/database.ts
```

Either keep it generated in CI or keep it hand-written and reviewed; do not mix both approaches in one
file.

---

## 8. Backups and recovery

- Supabase takes daily automated backups on paid plans; verify the plan and retention in the dashboard.
- Enable Point-in-Time Recovery (PITR) for the production project if the plan offers it.
- **Test a restore into a staging project at least once** before launch and record the date in
  `docs/OPERATIONS.md`.
- `.env` files and service-role keys are stored in a password manager, not in the repository.

---

## 9. RLS verification suite

`supabase/tests/rls_policies.sql` simulates anonymous, staff and admin callers, then asserts that each
allowed operation succeeds and each forbidden one is refused. It runs inside `BEGIN … ROLLBACK`.

```bash
# staging only — it writes temporary auth users
psql "$STAGING_DATABASE_URL" -f supabase/tests/rls_policies.sql
```

Success prints `ALL RLS CHECKS PASSED`. A failure raises an exception naming the invariant that broke.

Where checks are covered:

| Invariant | Assertion |
| --- | --- |
| Anonymous cannot read appointments | `select` returns 0 rows / permission denied |
| Anonymous cannot read contact messages | same |
| Anonymous cannot read audit logs | same |
| Anonymous cannot insert with a non-pending status | insert rejected |
| Anonymous cannot insert without consent | insert rejected |
| Anonymous cannot insert against an inactive service | insert rejected |
| Anonymous cannot insert when `booking_enabled = false` | insert rejected |
| Staff can read appointments and change status | update succeeds |
| Staff cannot change `patient_name` | column grant denies |
| Staff cannot insert audit rows directly | permission denied |
| Staff cannot read audit logs | 0 rows |
| Admin can read audit logs and manage services | succeeds |
| No API role can change a profile role | trigger raises `42501` |
| Invalid status transitions are refused | trigger raises `23514` |
