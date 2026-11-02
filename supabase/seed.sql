-- Local development seed. Runs after migrations when using `supabase db reset`.
-- Contains reference data only — no users, no passwords, no patient data.
-- Admin accounts are created with `npm run admin:create` (see docs/DEPLOYMENT.md).

insert into public.services (name, slug, description, display_order, is_active)
values
  ('Dental consultation', 'dental-consultation', 'A conversation about your dental health, your concerns and the options available to you.', 10, true)
on conflict (slug) do nothing;
