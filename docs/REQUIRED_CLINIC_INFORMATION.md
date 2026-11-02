# Required clinic information — Jishnu's Dentistry

Last updated: 2026-11-02

**Nothing in this document was supplied during the build.** Rather than invent a phone number, an
address, a qualification or a price, the site renders an explicit placeholder or hides the field.
This page is the single list of what the clinic must provide before launch.

Send the answers to the developer; most can be entered in **Admin → Clinic settings** without a code
change. Items marked **code** require a small reviewed change (they are static, versioned copy).

---

## 1. Contact details (Admin → Clinic settings)

| # | Item | Format | Where it appears | Status |
| --- | --- | --- | --- | --- |
| C1 | Clinic phone number | E.164 or local, e.g. `+91 98765 43210` | Header, footer, home, contact, appointment fallback | **Missing** |
| C2 | WhatsApp number | Digits and `+` only | Contact page | **Missing** (optional) |
| C3 | Public email address | Valid address the clinic monitors | Contact page, footer | **Missing** |
| C4 | Full address | Multi-line, as it should be posted publicly | Contact page, JSON-LD, footer | **Missing** |
| C5 | Opening hours | Multi-line, e.g. `Mon–Fri 9:00–17:00` | Contact page, JSON-LD, footer | **Missing** |
| C6 | Map link | `https://` URL (Google Maps or similar) | Contact page | **Missing** (optional) |
| C7 | Announcement | One short factual sentence, or blank | Site-wide banner | **Missing** (optional) |

Notes:

- A blank field is **hidden**, not filled with a guess. `checks` in `docs/DEPLOYMENT.md` §7 verify this.
- The time zone currently defaults to `Asia/Kolkata` (`CLINIC_TIMEZONE`). Confirm it, because it decides
  what "today" means when a patient picks a preferred date.

## 2. Dentist and team (code — `src/content/site.ts` and `/dentist`)

| # | Item | Why it matters | Status |
| --- | --- | --- | --- |
| D1 | Dentist's full name as it should be published | The dentist page currently states that the profile will be published only when verified | **Missing** |
| D2 | Qualifications, exactly as they should appear | Publishing unverified credentials is a regulatory and trust risk | **Missing** |
| D3 | Registration / licence number and issuing council | Often legally required on a clinic website | **Missing** |
| D4 | Short professional biography (2–4 sentences, no outcome claims) | Replaces the placeholder | **Missing** |
| D5 | Whether other clinicians work at the practice and how they should be described | Avoids implying a single-handed practice if it is not | **Missing** |
| D6 | A professional photograph (optional) | Design is image-light so this is not blocking | **Missing** |

## 3. Treatment list (Admin → Services)

The seed contains one active service (`Dental consultation`) and three **inactive templates**
(`Preventive care`, `Restorative care`, `Urgent dental concerns`). Inactive services are invisible to
visitors and cannot be requested.

| # | Item | Status |
| --- | --- | --- |
| S1 | Confirm the wording of "Dental consultation" | **Needs review** |
| S2 | For each template: keep, rename, rewrite or delete | **Needs review** |
| S3 | Any additional treatments the clinic actually offers | **Missing** |
| S4 | For each service: a plain description of the process, with no outcome promises | **Missing** for new services |
| S5 | Prices or "from" pricing — **only if the clinic wants them published** | Not published by design |
| S6 | Whether online appointment requests should be on at launch (`booking_enabled`) | Defaults to on |

Guidance: describe **what happens**, not what it achieves. "A conversation about your dental health and
the options available" is safe; "painless treatment guaranteed" is not.

## 4. Legal and compliance (code — `src/content/legal.ts`)

`src/content/legal.ts` currently contains visible bracketed placeholders. A legal adviser must review
the whole privacy policy and terms, not just fill the brackets.

| # | Item | Placeholder in code | Status |
| --- | --- | --- | --- |
| L1 | Registered legal entity name | `[Registered legal entity — to be supplied]` | **Missing** |
| L2 | Registered address | `[Registered address — to be supplied]` | **Missing** |
| L3 | Governing jurisdiction | `[Governing jurisdiction — to be supplied]` | **Missing** |
| L4 | Privacy contact email (may be the clinic email) | `[Privacy contact email — to be supplied]` | **Missing** |
| L5 | Data retention period for appointment requests and messages | `[Retention period — to be confirmed by the clinic]` | **Missing** |
| L6 | Professional indemnity insurer (if it must be named) | `[Professional indemnity insurer — to be supplied]` | **Missing** |
| L7 | Effective date of the published policies | Currently `2 November 2026` | **Needs confirmation** |
| L8 | Any jurisdiction-specific patient privacy notice required by local law | Not drafted | **Missing** |
| L9 | Registration / licence display requirement | Depends on L3 | **Missing** |

The surrounding paragraphs describe what the code actually does (what is collected, who can see it,
which processors are used, how long audit entries live). They should not need to change unless the
behaviour changes — if it does, update the code and the policy together.

## 5. Operational decisions

| # | Decision | Default in the build | Status |
| --- | --- | --- | --- |
| O1 | Clinic time zone | `Asia/Kolkata` | **Confirm** |
| O2 | Who receives new-request notification emails | none until `ADMIN_NOTIFICATION_EMAIL` is set | **Missing** |
| O3 | Sender address for notifications | none until `EMAIL_FROM` and `RESEND_API_KEY` are set | **Missing** |
| O4 | Retention period (see L5) | nothing deleted automatically | **Missing** |
| O5 | Named administrator(s) and their email addresses | none provisioned | **Missing** |
| O6 | Who may edit services and settings (`admin`) vs. handle requests (`staff`) | roles exist, nobody assigned | **Missing** |
| O7 | Uptime alert recipient | none | **Missing** |
| O8 | What staff should do when a request cannot be honoured | described in `docs/OPERATIONS.md`, needs clinic sign-off | **Needs approval** |
| O9 | Whether photography will be supplied later | design works without it | **Optional** |
| O10 | Domain name and DNS control | not supplied | **Missing** |

## 6. Approvals

| # | Approval | Status |
| --- | --- | --- |
| A1 | Sign-off on all public copy (`src/content/site.ts`) | **Not given** |
| A2 | Sign-off on the privacy policy and terms after legal review | **Not given** |
| A3 | Confirmation that no claim, price or credential is published without evidence | **Not given** |
| A4 | Written approval of the retention and deletion process | **Not given** |
| A5 | Written request before any staff account is created, changed or removed | **Not given** |

---

## How to supply the information

1. **Clinic settings** items (C1–C7, S1–S6) — sign in as an administrator and enter them at
   `/admin/settings` and `/admin/services`. No deployment required.
2. **Code** items (D1–D6, L1–L9, A1) — send them to the developer. They live in `src/content`, are
   reviewed in a pull request, and are deployed through Vercel.
3. **Secrets / operational** items (O2, O3, O5, O7) — send through a password manager or a secure
   channel, never in a public issue or chat.

Anything not supplied stays blank or visibly marked as pending. That is deliberate: a blank field is
recoverable, a wrong phone number is not.
