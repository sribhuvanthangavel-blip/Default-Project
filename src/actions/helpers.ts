import 'server-only';
import { AppError, toAppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { actionFail, type ActionResult } from '@/lib/result';

/**
 * Converts any thrown error into a safe action result. Unknown errors are
 * logged without payloads (no names, emails, phones or message bodies).
 */
export function failFromError(error: unknown): ActionResult<never> {
  const appError = toAppError(error);

  if (!(error instanceof AppError)) {
    logger.error({ event: 'action.unhandled_error' });
  }

  return actionFail(appError.publicMessage, {
    code: appError.code,
    ...(appError.fieldErrors ? { fieldErrors: appError.fieldErrors } : {}),
  });
}
