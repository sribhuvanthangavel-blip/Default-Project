/** Result shape shared by every server action. */
import type { ErrorCode } from '@/lib/errors';

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      code?: ErrorCode;
      fieldErrors?: Record<string, string[]>;
    };

export type ActionState<T = undefined> = ActionResult<T>;

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionFail(
  error: string,
  options?: { code?: ErrorCode; fieldErrors?: Record<string, string[]> },
): ActionResult<never> {
  return {
    ok: false,
    error,
    ...(options?.code ? { code: options.code } : {}),
    ...(options?.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
  };
}

/**
 * Neutral starting state for `useActionState`. Forms treat `ok: true` as "no
 * message yet", so nothing is rendered until an action returns a failure.
 */
export const initialActionState: ActionState = { ok: true, data: undefined };
