/**
 * Legal page scaffolding.
 *
 * Everything in square brackets is a placeholder that the clinic's legal adviser
 * must replace. The surrounding text describes what the website actually does
 * (verified by reading the code), so it should not need to change.
 */

export const LEGAL_PLACEHOLDERS = {
  legalEntity: '[Registered legal entity — to be supplied]',
  registeredAddress: '[Registered address — to be supplied]',
  jurisdiction: '[Governing jurisdiction — to be supplied]',
  contactEmail: '[Privacy contact email — to be supplied]',
  retentionPeriod: '[Retention period — to be confirmed by the clinic]',
  insurer: '[Professional indemnity insurer — to be supplied]',
} as const;

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: 'Who is responsible for your information',
    paragraphs: [
      `This website is operated for Jishnu's Dentistry by ${LEGAL_PLACEHOLDERS.legalEntity}, whose registered address is ${LEGAL_PLACEHOLDERS.registeredAddress}. The clinic is the data controller for the information described below.`,
      `Questions about privacy can be sent to ${LEGAL_PLACEHOLDERS.contactEmail} or through the contact form on this website.`,
    ],
  },
  {
    heading: 'What the website collects',
    paragraphs: [
      'The website collects only what is needed to respond to you. There is no public account system, no advertising tracker and no payment processing.',
    ],
    list: [
      'Appointment requests: your name, phone number, email address, the service you selected, your preferred date and time, an optional message and your consent confirmation.',
      'Contact enquiries: your name, email address, an optional phone number and your message.',
      'Technical logs: the hosting platform records standard request information such as the requested URL, response status and approximate region. The application itself does not log your name, email address, phone number or message content.',
      'Rate-limiting data: a one-way hash derived from your IP address is held in server memory for a few minutes to prevent automated abuse. The raw address is not stored and the hash is discarded when the process restarts.',
    ],
  },
  {
    heading: 'Why it is used',
    paragraphs: [
      'Appointment requests and enquiries are used to reply to you and to arrange or discuss your care. Consent is recorded with each appointment request. Enquiries are sent on the basis of your request for a response.',
      'Technical logs and rate-limiting data are used to keep the website secure and available. This is a legitimate interest in protecting the service.',
      'The clinic does not use your information for marketing, does not sell it and does not share it with advertisers.',
    ],
  },
  {
    heading: 'Who can see it',
    paragraphs: [
      'Appointment requests and contact messages are visible only to authorised clinic staff signed in to the administration dashboard. Database access rules enforce this at the database level, not only in the interface.',
      'The website uses the following service providers, each of which processes data on the clinic\u2019s behalf:',
    ],
    list: [
      'Supabase — database, authentication and file storage infrastructure.',
      'Vercel — application hosting and delivery.',
      'Resend — optional email notifications to the clinic. Used only if the clinic enables it.',
    ],
  },
  {
    heading: 'How long it is kept',
    paragraphs: [
      `Records are kept for ${LEGAL_PLACEHOLDERS.retentionPeriod}. When a record is no longer needed it is deleted from the database. Deletion schedules are documented for the clinic in the handover pack.`,
      'Administrative audit records, which record that a staff member changed an appointment or a setting, are retained for accountability. They record identifiers and actions, not the content of patient messages.',
    ],
  },
  {
    heading: 'Your choices',
    paragraphs: [
      'You can ask the clinic what information it holds about you, ask for a correction, or ask for it to be deleted where the law allows. Use the contact form or the published contact details.',
      `Depending on where you live, you may have additional rights, including a right to object to processing or to complain to a supervisory authority. The governing jurisdiction for this policy is ${LEGAL_PLACEHOLDERS.jurisdiction}.`,
    ],
  },
  {
    heading: 'Security',
    paragraphs: [
      'All traffic is served over HTTPS. Access to the administration dashboard requires a verified account and an assigned staff role; there is no public registration. Administrative actions are recorded in an audit trail. Database access is restricted by row-level security policies so that anonymous visitors cannot read appointment or message data.',
      'No system is perfectly secure. If you believe you have found a security issue, please report it using the contact details above rather than testing it against real patient data.',
    ],
  },
  {
    heading: 'Cookies',
    paragraphs: [
      'The public website does not set advertising or analytics cookies. When a staff member signs in, a secure, HTTP-only session cookie is set so the dashboard can keep them signed in. That cookie is not used for tracking.',
    ],
  },
  {
    heading: 'Children',
    paragraphs: [
      'Appointment requests should be made by a parent or guardian on behalf of a child. The clinic does not knowingly collect information directly from children through this website.',
    ],
  },
  {
    heading: 'Changes to this policy',
    paragraphs: [
      'If this policy changes materially, the updated version will be published on this page with a new effective date. The effective date is shown at the top of the page.',
    ],
  },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: 'About these terms',
    paragraphs: [
      `These terms govern your use of this website, which is operated for Jishnu's Dentistry by ${LEGAL_PLACEHOLDERS.legalEntity}. By using the website you accept them.`,
    ],
  },
  {
    heading: 'Information on this website is general',
    paragraphs: [
      'The content on this website describes the practice and its services in general terms. It is not dental advice, a diagnosis or a treatment recommendation, and it is not a substitute for an appointment with a qualified clinician.',
      'Nothing on this website should be read as a promise of a particular outcome. Suitability, risks, alternatives and costs are discussed with you in person before any treatment is agreed.',
    ],
  },
  {
    heading: 'Appointment requests are not bookings',
    paragraphs: [
      'Submitting the appointment form sends a request to the clinic. It does not create a confirmed appointment and it does not reserve a time slot. The website does not display live availability.',
      'An appointment exists only once the clinic has contacted you and confirmed the date and time. The clinic may need to offer a different time.',
      'If you need to change or cancel, contact the clinic as soon as possible using the published contact details.',
    ],
  },
  {
    heading: 'Emergencies',
    paragraphs: [
      'This website is not an emergency service. Messages and requests are not monitored continuously. If you have an urgent dental or medical concern, contact the clinic directly or seek appropriate urgent care.',
    ],
  },
  {
    heading: 'Acceptable use',
    paragraphs: [
      'You agree not to submit false information, to impersonate another person, to attempt to access parts of the website you are not authorised to use, or to interfere with its operation. Automated submission of forms is not permitted.',
    ],
  },
  {
    heading: 'Fees',
    paragraphs: [
      'No payment is taken through this website. Any fees for treatment are discussed with you by the clinic directly. Prices are not published here because they depend on your individual circumstances.',
    ],
  },
  {
    heading: 'Third-party links',
    paragraphs: [
      'Where the website links to an external service, such as a map provider or WhatsApp, that service has its own terms and privacy policy. The clinic is not responsible for its content.',
    ],
  },
  {
    heading: 'Liability',
    paragraphs: [
      `Nothing in these terms excludes liability that cannot lawfully be excluded. Subject to that, the clinic\u2019s liability in connection with this website is limited as set out by ${LEGAL_PLACEHOLDERS.jurisdiction} law. ${LEGAL_PLACEHOLDERS.insurer} is the clinic\u2019s professional indemnity insurer.`,
      'The clinic aims to keep the website accurate and available but does not guarantee uninterrupted access.',
    ],
  },
  {
    heading: 'Governing law',
    paragraphs: [`These terms are governed by the law of ${LEGAL_PLACEHOLDERS.jurisdiction}.`],
  },
];
