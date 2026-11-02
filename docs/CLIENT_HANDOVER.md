# Client handover — Jishnu's Dentistry website

Last updated: 2026-11-02

This guide is for the clinic. It explains what the website does, how to run it day to day, what was
delivered, and what still needs the clinic's input. No technical knowledge is assumed for §1–§5.

A separate developer handover is unnecessary: the repository, `README.md` and `docs/` are the
developer handover.

---

## 1. What the website does

- Presents the practice, the dentist, the treatment list, contact details and legal pages.
- Lets a visitor **request** an appointment. A request is **not** a booking: the clinic reviews it and
  contacts the patient to agree a time.
- Lets a visitor send a general enquiry.
- Gives clinic staff a private dashboard at `/admin` to read requests and messages, confirm or cancel
  appointments, keep internal notes, edit the treatment list and publish clinic details.
- Keeps a record of who changed what, in an audit log only administrators can read.
- Does **not** take payments, show live availability, send SMS, or create patient accounts. Those were
  deliberately left out (see `docs/PROJECT_PLAN.md` §3).

## 2. Signing in

1. Go to `https://<your-domain>/admin`.
2. Enter the email address and password supplied by whoever set up your account.
3. If you forget the password, use **Forgot password?** and check your inbox (and spam folder).

There is no "sign up" button, by design. New accounts are created by the developer only when the clinic
asks in writing.

Two kinds of account exist:

| Role | Can do |
| --- | --- |
| **staff** | See and action appointments and messages |
| **admin** | Everything staff can do, plus services, clinic settings and the audit log |

If a button is missing, your account probably does not have the admin role.

## 3. Daily work in the dashboard

### Overview

The first screen after signing in. It shows:

- **Pending requests** — appointments waiting for the clinic to confirm.
- **New messages** — unread enquiries.
- **Confirmed** and **Upcoming** counts.
- The five most recent pending requests.
- A reminder if the clinic's contact details have not been published yet.

### Appointments

1. Open **Appointments**. Use the search box (name, email or phone) and the status/date filters.
2. Click **Open** on a row to see the full request.
3. Phone the patient. Only after you have agreed a time, press **Mark confirmed**.
4. After the visit, press **Mark completed**.
5. If it cannot go ahead, press **Mark cancelled** — and tell the patient directly. The website does
   not notify them.
6. **Staff notes** are visible only to signed-in staff. Use them for internal context; do not paste
   clinical records or full patient histories.

Statuses move in one direction:

```
pending ──► confirmed ──► completed
   │            │
   └────────────┴────────► cancelled
```

Completed and cancelled are final. If something was marked by mistake, contact the developer; there is
no undo button.

### Messages

Open **Messages**, read the enquiry, reply using the patient's email or phone, then set the message to
**Read** or **Archived** to keep the list tidy.

### Services (admin only)

- **Add a service**, or **Edit** an existing one.
- Tick **Visible on the public website** only when the wording has been approved.
- **Deactivate** rather than delete a service that already has requests — deleting is blocked in that
  case so that history stays intact.
- Keep descriptions factual. Describe the process, not promised outcomes.

### Clinic settings (admin only)

This is where the phone number, WhatsApp, email, address, opening hours, map link and announcement are
published. Leave a field **blank** if the clinic has not confirmed it — the public site hides blank
fields rather than showing something invented.

The **Accept online appointment requests** switch pauses the public form immediately. Use it during a
closure or a spam flood. Visitors see a message asking them to contact the clinic directly.

### Audit log (admin only)

A read-only list of administrative changes: who changed an appointment status, saved a note, edited a
service or changed settings, and when. It never contains patient message text.

## 4. What staff should never do

- Do not share an account. Each person should have their own; ask the developer for one.
- Do not paste patient records, clinical images or payment details into notes or messages.
- Do not publish a phone number, address, price, qualification or claim that the clinic has not
  verified.
- Do not try to "fix" the database directly. Ask the developer.

## 5. What the clinic must still provide

The full list is `docs/REQUIRED_CLINIC_INFORMATION.md`. In short:

1. Phone, WhatsApp, email, address, opening hours, map link.
2. Confirmation of the time zone.
3. Dentist name, qualifications, registration number and approved biography.
4. Review of the treatment list (one active service and three templates are seeded).
5. Legal review and completion of the bracketed placeholders in the privacy policy and terms.
6. Retention period and who receives notifications.
7. Named administrator and staff accounts.
8. Domain name and DNS access.

**Until these are supplied, the site shows only what is verified.** Placeholders are visible, not
hidden.

---

## 6. What was delivered

| Deliverable | Location |
| --- | --- |
| Public website (home, clinic, dentist, services, service detail, appointment, contact, privacy, terms, 404, error, loading) | `src/app/(site)` |
| Staff dashboard (overview, appointments, messages, services, settings, audit) | `src/app/admin` |
| Sign-in, forgot password, reset password | `src/app/admin/*` |
| Database schema, constraints, indexes, triggers | `supabase/migrations/20261102090000_init_schema.sql` |
| Row-level security policies and grants | `supabase/migrations/20261102090100_rls_policies.sql` |
| Seed data (1 active service, 3 templates, 8 empty settings) | `supabase/migrations/20261102090200_seed_reference_data.sql` |
| RLS verification suite | `supabase/tests/rls_policies.sql` |
| Unit tests (Vitest) | `tests/unit` |
| Browser tests (Playwright) | `tests/e2e` |
| Admin provisioning script | `scripts/create-admin.mjs` |
| Secret/PII scan | `scripts/check-secrets.mjs` |
| Documentation | `docs/` |

## 7. Editing text that is not in the dashboard

Page headings, process explanations, the dentist placeholder and legal scaffolding are stored in
version-controlled files:

| Content | File |
| --- | --- |
| Home page, about, dentist, contact, services copy | `src/content/site.ts` |
| Navigation labels | `src/content/navigation.ts` |
| Privacy policy and terms | `src/content/legal.ts` |

This is intentional: copy that makes a claim should be reviewed and versioned, not typed into a form.
Send changes to the developer. A change is deployed through Vercel after review.

Clinic contact facts belong in **Clinic settings**, not in code, because they change more often.

## 8. Accounts and access

| Task | Who |
| --- | --- |
| Create a staff or admin account | Developer, on written request from the clinic |
| Change someone's role | Developer, on written request |
| Remove a departed staff member | Developer; role set to `pending` and the Auth user deleted |
| Reset your own password | You, via **Forgot password** |
| Revoke a lost device | Developer, in the Supabase dashboard |

Never send a password by email or chat. Use a password manager or hand it over in person.

## 9. Photography and brand assets

No photography, logo file or brand guide was supplied. The current design is intentionally
typographic: forest green, champagne gold, warm cream, SVG ornament and generous spacing. It does not
depend on images, so it looks complete today.

If the clinic later supplies photography, the natural slots are:

| Slot | Where | Suggested treatment |
| --- | --- | --- |
| Hero portrait or interior | Home hero, right-hand panel | Replace the quote card; keep the arch shape and gold border |
| Practice interior | About page | Full-width band between copy sections |
| Dentist portrait | Dentist page | Square or 4:5 crop beside the (currently placeholder) biography |
| Detail shots | Services page | Optional; keep the grid image-light |

Adding images is a code change (an `<Image>` component plus the file under `public/`). Keep the
existing `alt` text discipline — every image needs a meaningful description or an explicit empty `alt`
if purely decorative.

## 10. Costs and services involved

| Service | Purpose | Notes |
| --- | --- | --- |
| Vercel | Hosting | Free tier is usually enough; a custom domain is extra |
| Supabase | Database, authentication | Free tier is enough to start; paid adds backups |
| Resend (optional) | Notification emails to the clinic | Only active if `RESEND_API_KEY` is set |
| Domain registrar | `jishnusdentistry…` domain | Clinic-owned |

The site works without Resend. Requests are still stored and visible in the dashboard; only the email
alert is skipped.

## 11. Support and escalation

| Situation | First step |
| --- | --- |
| Cannot sign in | **Forgot password**; if no email arrives, contact the developer |
| Website looks wrong | Note the page and take a screenshot; do not redeploy |
| Suspect someone accessed the dashboard | Contact the developer immediately; see `docs/OPERATIONS.md` §7 |
| A patient asks for their data to be deleted | Follow `docs/OPERATIONS.md` §6 |
| Need a new page or a copy change | Send the text to the developer; it is reviewed and deployed |
| Need a new staff account | Written request to the developer |

Keep this guide with the clinic's operational documents, and record any account changes in
`docs/OPERATIONS.md` §10.
