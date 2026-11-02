import type { AppointmentStatus, ContactMessageStatus } from '@/types/database';
import { STATUS_LABELS } from '@/lib/appointments/status';

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: 'border-amber-700/25 bg-amber-100 text-amber-700',
  confirmed: 'border-sage-600/25 bg-sage-100 text-forest-900',
  completed: 'border-forest-200 bg-forest-50 text-forest-700',
  cancelled: 'border-line bg-cream-200 text-muted',
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-semibold tracking-wide uppercase ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const MESSAGE_STYLES: Record<ContactMessageStatus, string> = {
  new: 'border-amber-700/25 bg-amber-100 text-amber-700',
  read: 'border-forest-200 bg-forest-50 text-forest-700',
  archived: 'border-line bg-cream-200 text-muted',
};

const MESSAGE_LABELS: Record<ContactMessageStatus, string> = {
  new: 'New',
  read: 'Read',
  archived: 'Archived',
};

export function MessageStatusBadge({ status }: { status: ContactMessageStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-semibold tracking-wide uppercase ${MESSAGE_STYLES[status]}`}
    >
      {MESSAGE_LABELS[status]}
    </span>
  );
}
