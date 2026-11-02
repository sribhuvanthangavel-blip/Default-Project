-- ============================================================================
-- Jishnu's Dentistry — reference data
-- Migration: 20261102090200_seed_reference_data.sql
--
-- IMPORTANT — client review required:
--  * "Dental consultation" is the only bookable service seeded, because a
--    consultation is inherent to a dental practice. Its copy makes no clinical
--    claims.
--  * The remaining services are INACTIVE templates. The clinic must review,
--    rename, rewrite or delete them before activating. They are invisible to
--    the public while is_active = false.
--  * All site_settings values are intentionally empty. Nothing about the clinic
--    (phone, address, hours, email) is invented. The admin fills these in after
--    launch; empty values are hidden from the public UI.
-- ============================================================================

insert into public.services (name, slug, description, display_order, is_active)
values
  (
    'Dental consultation',
    'dental-consultation',
    'A conversation about your dental health, your concerns and the options available to you. The clinic will confirm what is appropriate for your situation before any treatment is planned.',
    10,
    true
  ),
  (
    'Preventive care',
    'preventive-care',
    'Template content — review before activating. Describe the clinic''s preventive appointments, examinations and hygiene guidance here without making outcome claims.',
    20,
    false
  ),
  (
    'Restorative care',
    'restorative-care',
    'Template content — review before activating. Describe the restorative treatments the clinic actually provides, and the assessment process that precedes them.',
    30,
    false
  ),
  (
    'Urgent dental concerns',
    'urgent-dental-concerns',
    'Template content — review before activating. Explain how the clinic handles urgent concerns, including any limits on same-day availability.',
    40,
    false
  )
on conflict (slug) do nothing;

insert into public.site_settings (setting_key, setting_value, is_public)
values
  ('clinic_phone', '""'::jsonb, true),
  ('clinic_whatsapp', '""'::jsonb, true),
  ('clinic_email', '""'::jsonb, true),
  ('clinic_address', '""'::jsonb, true),
  ('clinic_hours', '""'::jsonb, true),
  ('clinic_map_url', '""'::jsonb, true),
  ('announcement', '""'::jsonb, true),
  ('booking_enabled', 'true'::jsonb, true)
on conflict (setting_key) do nothing;
