/**
 * Static, editorially controlled copy.
 *
 * IMPORTANT: every sentence here is brand/process copy, not a clinical claim.
 * It deliberately contains no qualifications, prices, reviews, outcome
 * statistics or opening hours. The clinic must approve this copy before launch
 * (see docs/REQUIRED_CLINIC_INFORMATION.md).
 */

export const HOME_COPY = {
  eyebrow: 'Dental care · By appointment',
  titleLead: 'A calmer kind of',
  titleEmphasis: 'dental care.',
  body: 'A considered practice for people who want to understand what is happening, why it matters and what comes next. Appointments are arranged personally with the clinic.',
  primaryCta: 'Request an appointment',
  secondaryCta: 'Explore the clinic',
  trustPoints: ['No account needed', 'Clinic confirms personally', 'Your details kept minimal'],
};

export const PRINCIPLES = [
  {
    title: 'Clear explanations',
    body: 'Plain language, not jargon. You should leave understanding what was discussed and what happens next.',
  },
  {
    title: 'Unhurried appointments',
    body: 'Requests are reviewed by the clinic before a time is confirmed, so the schedule stays realistic.',
  },
  {
    title: 'Privacy by default',
    body: 'We collect only what is needed to arrange your appointment, and staff access is restricted and audited.',
  },
] as const;

export const PROCESS_STEPS = [
  {
    number: '01',
    title: 'Send a request',
    body: 'Choose a service, a preferred day and a time that suits you. It takes a couple of minutes and no account is needed.',
  },
  {
    number: '02',
    title: 'The clinic confirms',
    body: 'Your request is reviewed by the clinic, which contacts you directly to confirm the appointment. A request is not a booking until then.',
  },
  {
    number: '03',
    title: 'Come in and talk',
    body: 'The first visit is a conversation. Raise your concerns, ask questions and agree on a next step that makes sense to you.',
  },
] as const;

export const FAQS = [
  {
    question: 'Is my appointment confirmed when I submit the form?',
    answer:
      'No. The form sends a request. The clinic reviews it and contacts you to confirm the date and time. Please treat the appointment as confirmed only when the clinic has told you so.',
  },
  {
    question: 'Do I need to create an account?',
    answer:
      'No. Appointment requests and enquiries do not require an account. Accounts exist only for clinic staff who manage the website.',
  },
  {
    question: 'How do I change or cancel a request?',
    answer:
      'Contact the clinic as soon as you can using the phone number or contact form published on this site. The clinic will update the appointment with you directly.',
  },
  {
    question: 'What information do you collect?',
    answer:
      'For an appointment: your name, phone number, email address, the service you are interested in, your preferred date and time, an optional message and your consent. For an enquiry: your name, email, optional phone number and message. The privacy policy explains this in full.',
  },
  {
    question: 'Can I ask about a treatment that is not listed?',
    answer:
      'Yes. The treatment list is managed by the clinic and may not cover everything. Send an enquiry or choose a consultation and describe what you would like help with.',
  },
  {
    question: 'What should I do in an emergency?',
    answer:
      'This website is not an emergency service and requests are not monitored around the clock. If you have an urgent concern, contact the clinic directly using its published phone number, or seek appropriate urgent medical care.',
  },
] as const;

export const ABOUT_COPY = {
  eyebrow: 'The clinic',
  title: 'Care begins with listening.',
  paragraphs: [
    'At Jishnu\u2019s Dentistry, care begins with listening. Before anything is recommended, there is time to explain what you are feeling, what you are worried about and what you would like to change.',
    'Appointments are arranged personally. You send a request; the clinic reviews it and confirms the time with you. That small step keeps the schedule realistic and the conversation unhurried.',
    'The practice is intentionally straightforward: clear communication, a calm environment and a plan you can understand. The clinic\u2019s verified profile, address and opening hours are published here once supplied.',
  ],
  quote: 'You should never leave an appointment wondering what was decided, or why.',
};

export const DENTIST_COPY = {
  eyebrow: 'Your dentist',
  title: 'A profile, published only when verified.',
  body: 'The clinic has not yet supplied the dentist\u2019s name, qualifications and registration details for publication. Rather than publish unverified information, this page will be completed by the clinic. You can still request an appointment, and the clinic will answer any questions about who will see you.',
  questions: [
    'Who will I see at my appointment?',
    'What are your qualifications and registration details?',
    'What will happen at the first visit?',
    'What are my options, and what does each involve?',
    'What happens if I decide to wait?',
  ],
} as const;

export const CONTACT_COPY = {
  eyebrow: 'Contact',
  title: 'Ask, or arrange a visit.',
  body: 'Send a message and the clinic will respond directly. Please do not include sensitive medical details in this form. If your concern is urgent, contact the clinic by phone.',
} as const;

export const SERVICES_COPY = {
  eyebrow: 'Services',
  title: 'Care, considered.',
  body: 'The clinic manages this treatment list directly. If you are unsure which service to choose, select a consultation or send an enquiry and describe what you need help with.',
} as const;

export const THINGS_TO_KNOW = [
  'A request is not a confirmed booking.',
  'No payment is taken through this website.',
  'The clinic will confirm the time with you directly.',
] as const;
