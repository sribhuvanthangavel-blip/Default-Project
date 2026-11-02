-- ============================================================================
-- Jishnu's Dentistry — initial schema
-- Migration: 20261102090000_init_schema.sql
--
-- Design notes
--  * UUID primary keys generated in the database (gen_random_uuid()).
--  * Enumerated types for roles and workflow states prevent invalid values.
--  * Only the personal data required to answer an appointment request is stored.
--  * No passwords are stored in application tables; Supabase Auth owns credentials.
--  * updated_at is maintained by trigger, never by the client.
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('pending', 'staff', 'admin');
create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
create type public.contact_message_status as enum ('new', 'read', 'archived');

-- ---------------------------------------------------------------------------
-- Shared trigger: updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- One row per Supabase Auth user. Credentials live in auth.users, never here.
-- Role defaults to 'pending' (no access) and is provisioned out-of-band.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  role public.app_role not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_length check (char_length(email) between 0 and 320),
  constraint profiles_full_name_length check (char_length(full_name) between 0 and 120)
);

create index profiles_role_idx on public.profiles (role);
create unique index profiles_email_unique_idx on public.profiles (lower(email)) where email <> '';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Mirror new auth users into profiles with the least-privileged role.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Keep the profile email mirror in sync when an Auth email changes.
create or replace function public.handle_auth_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
       set email = coalesce(new.email, '')
     where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_auth_user_email_change();

-- Roles are never editable through the API. Only a superuser/service role
-- (migrations, provisioning script) may change them.
create or replace function public.prevent_profile_privilege_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'Profile id cannot be changed' using errcode = '42501';
  end if;

  if new.role is distinct from old.role
     and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'Changing a profile role is not permitted' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_privilege_change
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_change();

-- ---------------------------------------------------------------------------
-- services
-- Public treatment list, editable in the admin dashboard.
-- ---------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text not null default '',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_name_length check (char_length(name) between 2 and 120),
  constraint services_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint services_slug_length check (char_length(slug) between 2 and 80),
  constraint services_description_length check (char_length(description) <= 4000),
  constraint services_display_order_range check (display_order between 0 and 10000)
);

create unique index services_slug_unique_idx on public.services (slug);
create index services_active_order_idx on public.services (is_active, display_order, name);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- appointments
-- A request only. It is never a confirmed booking until clinic staff confirm it.
-- ---------------------------------------------------------------------------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  phone text not null,
  email text not null,
  service_id uuid not null references public.services (id) on delete restrict,
  preferred_date date not null,
  preferred_time time without time zone not null,
  message text not null default '',
  status public.appointment_status not null default 'pending',
  admin_notes text not null default '',
  consent_given boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_patient_name_length check (char_length(patient_name) between 2 and 120),
  constraint appointments_phone_length check (char_length(phone) between 7 and 24),
  constraint appointments_email_length check (char_length(email) between 5 and 320),
  constraint appointments_email_shape check (position('@' in email) > 1),
  constraint appointments_message_length check (char_length(message) <= 2000),
  constraint appointments_admin_notes_length check (char_length(admin_notes) <= 4000),
  constraint appointments_date_sane check (preferred_date >= date '2024-01-01'),
  constraint appointments_consent_required check (consent_given)
);

create index appointments_status_created_idx
  on public.appointments (status, created_at desc);
create index appointments_preferred_date_idx on public.appointments (preferred_date);
create index appointments_created_at_idx on public.appointments (created_at desc);
create index appointments_service_idx on public.appointments (service_id);
create index appointments_search_trgm_idx
  on public.appointments
  using gin ((patient_name || ' ' || email || ' ' || phone) gin_trgm_ops);

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- Enforce the documented workflow in the database, not only in the UI:
--   pending -> confirmed | cancelled
--   confirmed -> completed | cancelled
--   completed / cancelled are terminal
create or replace function public.enforce_appointment_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'pending' and new.status in ('confirmed', 'cancelled'))
      or (old.status = 'confirmed' and new.status in ('completed', 'cancelled'))
    ) then
      raise exception 'Invalid appointment status transition: % -> %', old.status, new.status
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger appointments_status_transition
  before update of status on public.appointments
  for each row execute function public.enforce_appointment_status_transition();

-- ---------------------------------------------------------------------------
-- contact_messages
-- ---------------------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  message text not null,
  status public.contact_message_status not null default 'new',
  created_at timestamptz not null default now(),
  constraint contact_messages_name_length check (char_length(name) between 2 and 120),
  constraint contact_messages_email_length check (char_length(email) between 5 and 320),
  constraint contact_messages_email_shape check (position('@' in email) > 1),
  constraint contact_messages_phone_length check (char_length(phone) <= 24),
  constraint contact_messages_message_length check (char_length(message) between 10 and 3000)
);

create index contact_messages_status_created_idx
  on public.contact_messages (status, created_at desc);
create index contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index contact_messages_search_trgm_idx
  on public.contact_messages
  using gin ((name || ' ' || email || ' ' || phone || ' ' || message) gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- site_settings
-- Operationally editable content only (contact details, hours, announcement).
-- Static brand/marketing copy lives in version-controlled src/content.
-- ---------------------------------------------------------------------------
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null,
  setting_value jsonb not null default 'null'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint site_settings_key_format check (setting_key ~ '^[a-z0-9_]{2,64}$')
);

create unique index site_settings_key_unique_idx on public.site_settings (setting_key);
create index site_settings_public_idx on public.site_settings (is_public);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- audit_logs
-- Append-only record of sensitive administrative actions. Never stores patient
-- message bodies, only identifiers and action names.
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_email text not null default '',
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_length check (char_length(action) between 2 and 80),
  constraint audit_logs_resource_type_length check (char_length(resource_type) between 2 and 60),
  constraint audit_logs_resource_id_length check (resource_id is null or char_length(resource_id) <= 120),
  constraint audit_logs_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint audit_logs_metadata_size check (char_length(metadata::text) <= 4000)
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id);
create index audit_logs_resource_idx on public.audit_logs (resource_type, resource_id);

-- The only supported way to write an audit record: a definer function that
-- attributes the entry to the authenticated caller. Direct inserts are revoked.
create or replace function public.record_audit_log(
  p_action text,
  p_resource_type text,
  p_resource_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_email text := '';
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select p.email into v_email from public.profiles p where p.id = v_actor;

  insert into public.audit_logs (actor_id, actor_email, action, resource_type, resource_id, metadata)
  values (
    v_actor,
    coalesce(v_email, ''),
    left(p_action, 80),
    left(p_resource_type, 60),
    left(p_resource_id, 120),
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Business helper: has the clinic enabled appointment requests?
-- ---------------------------------------------------------------------------
create or replace function public.booking_is_enabled()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select (setting_value)::text = 'true'
       from public.site_settings
      where setting_key = 'booking_enabled'
      limit 1),
    true
  );
$$;

revoke all on function public.booking_is_enabled() from public;
grant execute on function public.booking_is_enabled() to anon, authenticated;

revoke all on function public.record_audit_log(text, text, text, jsonb) from public;
grant execute on function public.record_audit_log(text, text, text, jsonb) to authenticated;

revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.handle_auth_user_email_change() from public;
