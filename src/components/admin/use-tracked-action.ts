'use client';

import { useActionState, useCallback, useState } from 'react';
import { initialActionState, type ActionState } from '@/lib/result';

type ServerAction = (previous: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Wraps a server action so a form can tell "nothing has been submitted yet"
 * apart from "the last submission succeeded". Comparing state objects would
 * mean touching a ref during render, which React forbids; flipping a state flag
 * inside the async action is safe and equivalent.
 */
export function useTrackedAction(action: ServerAction) {
  const [saved, setSaved] = useState(false);

  const wrapped = useCallback(
    async (previous: ActionState, formData: FormData): Promise<ActionState> => {
      setSaved(false);
      // Do not catch: a redirect thrown by the action must propagate to Next.js.
      const result = await action(previous, formData);
      if (result.ok) setSaved(true);
      return result;
    },
    [action],
  );

  const [state, formAction] = useActionState(wrapped, initialActionState);

  return { state, formAction, saved } as const;
}
