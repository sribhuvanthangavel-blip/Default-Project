-- ============================================================================
-- Jishnu's Dentistry — Row Level Security
-- Migration: 20261102090100_rls_policies.sql
--
-- Principles
--  * RLS is enabled on every application table.
--  * Access is denied by default: no grant + no policy = no access.
--  * Anonymous visitors may read active services and public settings, and may
--    INSERT appointment requests / contact messages with a forced pending state.
--  * Authenticated staff may operate on appointments and messages; only admins
--    may change services, settings and read audit logs.
--  * Roles cannot be edited through the API at all (see init migration trigger).
--  * Column-level grants prevent staff from rewriting patient identity fields,
--    and prevent anyone from inserting forged audit entries.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Authorisation helpers (SECURITY DEFINER avoids recursive RLS on profiles)
-- ---------------------------------------------------------------------------
create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_profile_role() = 'admin', false);
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_profile_role() in ('staff', 'admin'), false);
$$;

revoke all on function public.current_profile_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_staff() from public;
grant execute on function public.current_profile_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere and remove inherited grants
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.appointments from anon, authenticated;
revoke all on table public.contact_messages from anon, authenticated;
revoke all on table public.site_settings from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- A user may read their own profile; staff may read all profiles (needed for
-- the admin shell). No client may update, insert or delete profiles.
-- ---------------------------------------------------------------------------
create policy profiles_select_own_or_staff
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()) or public.is_staff());

grant select on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
create policy services_select_active_public
  on public.services
  for select
  to anon, authenticated
  using (is_active = true);

create policy services_select_all_staff
  on public.services
  for select
  to authenticated
  using (public.is_staff());

create policy services_insert_admin
  on public.services
  for insert
  to authenticated
  with check (public.is_admin());

create policy services_update_admin
  on public.services
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy services_delete_admin
  on public.services
  for delete
  to authenticated
  using (public.is_admin());

grant select on table public.services to anon, authenticated;
grant insert, update, delete on table public.services to authenticated;

-- ---------------------------------------------------------------------------
-- appointments
-- Public: INSERT only, pending, consented, active service, booking enabled.
-- Staff: read and update status/notes only (column grants below).
-- ---------------------------------------------------------------------------
create policy appointments_insert_public
  on public.appointments
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and admin_notes = ''
    and consent_given = true
    and public.booking_is_enabled()
    and exists (
      select 1
        from public.services s
       where s.id = service_id
         and s.is_active = true
    )
  );

create policy appointments_select_staff
  on public.appointments
  for select
  to authenticated
  using (public.is_staff());

create policy appointments_update_staff
  on public.appointments
  for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Public visitors may only supply these columns; status is forced by default
-- and validated by the policy above.
grant insert (patient_name, phone, email, service_id, preferred_date, preferred_time, message, consent_given)
  on table public.appointments to anon;
grant select on table public.appointments to authenticated;
grant update (status, admin_notes) on table public.appointments to authenticated;

-- ---------------------------------------------------------------------------
-- contact_messages
-- Public: INSERT only with status 'new'. Staff: read and triage status.
-- ---------------------------------------------------------------------------
create policy contact_messages_insert_public
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (status = 'new');

create policy contact_messages_select_staff
  on public.contact_messages
  for select
  to authenticated
  using (public.is_staff());

create policy contact_messages_update_staff
  on public.contact_messages
  for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

grant insert (name, email, phone, message)
  on table public.contact_messages to anon;
grant select on table public.contact_messages to authenticated;
grant update (status) on table public.contact_messages to authenticated;

-- ---------------------------------------------------------------------------
-- site_settings
-- Public may read whitelisted public rows only, and only the value columns.
-- ---------------------------------------------------------------------------
create policy site_settings_select_public
  on public.site_settings
  for select
  to anon, authenticated
  using (is_public = true);

create policy site_settings_select_admin
  on public.site_settings
  for select
  to authenticated
  using (public.is_admin());

create policy site_settings_insert_admin
  on public.site_settings
  for insert
  to authenticated
  with check (public.is_admin());

create policy site_settings_update_admin
  on public.site_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy site_settings_delete_admin
  on public.site_settings
  for delete
  to authenticated
  using (public.is_admin());

grant select (id, setting_key, setting_value, is_public, updated_at)
  on table public.site_settings to anon, authenticated;
grant insert, update, delete on table public.site_settings to authenticated;

-- ---------------------------------------------------------------------------
-- audit_logs
-- Append-only via public.record_audit_log(). Readable by admins only.
-- ---------------------------------------------------------------------------
create policy audit_logs_select_admin
  on public.audit_logs
  for select
  to authenticated
  using (public.is_admin());

grant select on table public.audit_logs to authenticated;

-- ---------------------------------------------------------------------------
-- Table-level comment documentation for the Supabase dashboard
-- ---------------------------------------------------------------------------
comment on table public.profiles is 'One row per Supabase Auth user. Roles are provisioned out-of-band; never editable via the API.';
comment on table public.services is 'Public treatment list. Inactive services are hidden from visitors.';
comment on table public.appointments is 'Patient appointment requests. Public insert-only; staff update status and notes only.';
comment on table public.contact_messages is 'Contact form submissions. Public insert-only; staff read and triage.';
comment on table public.site_settings is 'Operational clinic content. Public rows are readable by anonymous visitors.';
comment on table public.audit_logs is 'Append-only administrative audit trail. Admin-readable, function-written.';
