import type { ErrorCode } from '@/lib/errors';

interface FormMessageProps {
  message?: string | null;
  code?: ErrorCode;
  className?: string;
}

const TONE: Partial<Record<ErrorCode, string>> = {
  rate_limited: 'border-amber-700/25 bg-amber-100 text-amber-700',
  duplicate: 'border-amber-700/25 bg-amber-100 text-amber-700',
  conflict: 'border-amber-700/25 bg-amber-100 text-amber-700',
  validation: 'border-clay-700/25 bg-clay-100 text-clay-700',
  unauthorized: 'border-clay-700/25 bg-clay-100 text-clay-700',
  forbidden: 'border-clay-700/25 bg-clay-100 text-clay-700',
  not_found: 'border-clay-700/25 bg-clay-100 text-clay-700',
};

export function FormMessage({ message, code, className = '' }: FormMessageProps) {
  if (!message) return null;
  const tone = (code && TONE[code]) ?? 'border-clay-700/25 bg-clay-100 text-clay-700';

  return (
    <div
      role="alert"
      className={`rounded-xl border px-4 py-3 text-sm leading-6 ${tone} ${className}`}
    >
      {message}
    </div>
  );
}

export function SuccessMessage({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="rounded-xl border border-sage-600/25 bg-sage-100 px-4 py-3 text-sm leading-6 text-forest-900"
    >
      {message}
    </div>
  );
}
