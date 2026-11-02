'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

interface SubmitButtonProps {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
  confirmMessage?: string;
}

export function SubmitButton({
  children,
  pendingLabel = 'Saving…',
  className = 'btn-primary',
  disabled = false,
  confirmMessage,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      disabled={pending || disabled}
      onClick={
        confirmMessage
          ? (event) => {
              if (!window.confirm(confirmMessage)) event.preventDefault();
            }
          : undefined
      }
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
