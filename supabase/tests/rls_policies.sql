-- ============================================================================
-- RLS verification suite — Jishnu's Dentistry
--
-- WHAT THIS IS
--   A self-contained SQL script that simulates anonymous, staff and admin
--   sessions, then asserts that Row Level Security allows and denies exactly
--   the intended operations.
--
-- WHERE TO RUN IT
--   A LOCAL or STAGING Supabase project only. It creates three auth users and
--   rolls everything back at the end (BEGIN … ROLLBACK), so it leaves no data,
--   but it must never be pointed at production.
--
-- HOW TO RUN
--   1. Supabase dashboard → SQL Editor (staging project), paste this file, run.
--      OR: psql "$STAGING_DATABASE_URL" -f supabase/tests/rls_policies.sql
--   2. Expected result: "ALL RLS CHECKS PASSED" as the final row.
--      Any failure raises an exception naming the broken invariant.
--
-- NOTES
--   * The script inserts minimal auth.users rows directly, because Supabase
--     Auth's password/identity columns are nullable. If your project version
--     changed that schema, create the three users with the Admin API instead
--     and replace the INSERT block with SELECTs by email.
--   * Every assertion uses the real anon / authenticated roles and a synthetic
--     JWT claim, so `auth.uid()` behaves exactly as it does in production.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Fixtures: one active service, three users (anon visitor needs no user)
-- ---------------------------------------------------------------------------
insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'rls.staff@example.test', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a2', 'authenticated', 'authenticated', 'rls.admin@example.test', now(), now(), now())
on conflict (id) do nothing;

update public.profiles set role = 'staff', full_name = 'RLS Staff' where id = '00000000-0000-4000-8000-0000000000a1';
update public.profiles set role = 'admin', full_name = 'RLS Admin' where id = '00000000-0000-4000-8000-0000000000a2';

insert into public.services (name, slug, description, display_order, is_active)
values ('RLS Consultation', 'rls-consultation', 'Verification fixture.', 999, true)
on conflict (slug) do nothing;

-- Assertion helper
create or replace function pg_temp.assert_true(p_condition boolean, p_message text)
returns void
language plpgsql
as $$
begin
  if p_condition is not true then
    raise exception 'RLS ASSERTION FAILED: %', p_message;
  end if;
end;
$$;

-- ===========================================================================
-- 1. ANONYMOUS VISITOR
-- ===========================================================================
set local role anon;

select pg_temp.assert_true(
  (select count(*) from public.services where slug = 'rls-consultation') = 1,
  'anon should read active services'
);

select pg_temp.assert_true(
  (select count(*) from public.services where is_active = false) = 0,
  'anon must not read inactive services'
);

select pg_temp.assert_true(
  (select count(*) from public.appointments) = 0,
  'anon must not read appointments'
);

select pg_temp.assert_true(
  (select count(*) from public.contact_messages) = 0,
  'anon must not read contact messages'
);

select pg_temp.assert_true(
  (select count(*) from public.audit_logs) = 0,
  'anon must not read audit logs'
);

select pg_temp.assert_true(
  (select count(*) from public.profiles) = 0,
  'anon must not read profiles'
);

-- Valid booking request is accepted.
insert into public.appointments (patient_name, phone, email, service_id, preferred_date, preferred_time, message, consent_given)
select 'RLS Patient', '+910000000000', 'rls.patient@example.test', s.id, current_date + 7, '10:30', 'Verification request', true
from public.services s where s.slug = 'rls-consultation';

do $$
begin
  begin
    insert into public.appointments (patient_name, phone, email, service_id, preferred_date, preferred_time, consent_given, status)
    select 'Forger', '+910000000001', 'forger@example.test', s.id, current_date + 7, '11:00', true, 'confirmed'
    from public.services s where s.slug = 'rls-consultation';
    raise exception 'RLS ASSERTION FAILED: anon must not insert a confirmed appointment';
  exception when insufficient_privilege or check_violation or new_row_violation then
    null; -- expected
  end;

  begin
    insert into public.appointments (patient_name, phone, email, service_id, preferred_date, preferred_time, consent_given)
    select 'No Consent', '+910000000002', 'noconsent@example.test', s.id, current_date + 7, '12:00', false
    from public.services s where s.slug = 'rls-consultation';
    raise exception 'RLS ASSERTION FAILED: appointment without consent must be rejected';
  exception when insufficient_privilege or check_violation or new_row_violation then
    null; -- expected
  end;

  begin
    insert into public.audit_logs (action, resource_type) values ('forged', 'appointment');
    raise exception 'RLS ASSERTION FAILED: anon must not insert audit logs directly';
  exception when insufficient_privilege then
    null; -- expected
  end;

  begin
    update public.site_settings set setting_value = '"hacked"'::jsonb where setting_key = 'clinic_phone';
    raise exception 'RLS ASSERTION FAILED: anon must not modify site settings';
  exception when insufficient_privilege then
    null; -- expected
  end;

  begin
    update public.appointments set status = 'confirmed';
    raise exception 'RLS ASSERTION FAILED: anon must not update appointments';
  exception when insufficient_privilege then
    null; -- expected
  end;
end;
$$;

-- ===========================================================================
-- 2. STAFF
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}';

select pg_temp.assert_true((select public.is_staff()) = true, 'staff helper should return true');
select pg_temp.assert_true((select public.is_admin()) = false, 'staff must not be admin');

select pg_temp.assert_true(
  (select count(*) from public.appointments) >= 1,
  'staff should read appointments'
);

select pg_temp.assert_true(
  (select count(*) from public.services where is_active = false) >= 1,
  'staff should read inactive services'
);

select pg_temp.assert_true(
  (select count(*) from public.audit_logs) = 0,
  'staff must not read audit logs'
);

update public.appointments
   set status = 'confirmed', admin_notes = 'Confirmed by RLS test'
 where email = 'rls.patient@example.test';

do $$
begin
  begin
    update public.appointments set patient_name = 'Tampered' where email = 'rls.patient@example.test';
    raise exception 'RLS ASSERTION FAILED: staff must not edit patient identity fields';
  exception when insufficient_privilege then
    null; -- expected
  end;

  begin
    update public.appointments set status = 'pending' where email = 'rls.patient@example.test';
    raise exception 'RLS ASSERTION FAILED: invalid status transition must be rejected by trigger';
  exception when check_violation then
    null; -- expected
  end;

  begin
    insert into public.services (name, slug) values ('Staff Service', 'staff-service');
    raise exception 'RLS ASSERTION FAILED: staff must not create services';
  exception when insufficient_privilege then
    null; -- expected
  end;

  begin
    update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-0000000000a1';
    raise exception 'RLS ASSERTION FAILED: staff must not escalate their own role';
  exception when insufficient_privilege then
    null; -- expected
  end;
end;
$$;

-- ===========================================================================
-- 3. ADMIN
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}';

select pg_temp.assert_true((select public.is_admin()) = true, 'admin helper should return true');

update public.appointments
   set status = 'completed'
 where email = 'rls.patient@example.test';

insert into public.services (name, slug, description, display_order, is_active)
values ('Admin Test Service', 'admin-test-service', 'Verification fixture.', 998, false);

update public.site_settings
   set setting_value = '"0000000000"'::jsonb,
       updated_by = '00000000-0000-4000-8000-0000000000a2'
 where setting_key = 'clinic_phone';

select public.record_audit_log('rls.test', 'appointment', 'fixture', '{"source":"rls-suite"}'::jsonb);

select pg_temp.assert_true(
  (select count(*) from public.audit_logs where action = 'rls.test') = 1,
  'admin audit entry should be written by the definer function'
);

do $$
begin
  begin
    update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-0000000000a2';
    raise exception 'RLS ASSERTION FAILED: roles must never be editable through the API';
  exception when insufficient_privilege then
    null; -- expected
  end;
end;
$$;

-- ===========================================================================
-- 4. BOOKING DISABLED
-- ===========================================================================
update public.site_settings set setting_value = 'false'::jsonb where setting_key = 'booking_enabled';

reset role;
set local role anon;

do $$
begin
  begin
    insert into public.appointments (patient_name, phone, email, service_id, preferred_date, preferred_time, consent_given)
    select 'Closed', '+910000000003', 'closed@example.test', s.id, current_date + 7, '13:00', true
    from public.services s where s.slug = 'rls-consultation';
    raise exception 'RLS ASSERTION FAILED: booking must be rejected while booking_enabled = false';
  exception when insufficient_privilege or check_violation or new_row_violation then
    null; -- expected
  end;
end;
$$;

reset role;

-- Everything above ran inside this transaction; discard all fixtures.
rollback;

select 'ALL RLS CHECKS PASSED' as result;
