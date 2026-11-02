/**
 * Explicit domain errors. Server actions translate these into safe messages;
 * stack traces and database details never reach the browser.
 */

export type ErrorCode =
  | 'configuration'
  | 'unauthorized'
  | 'forbidden'
  | 'validation'
  | 'rate_limited'
  | 'duplicate'
  | 'not_found'
  | 'conflict'
  | 'database'
  | 'unknown';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly publicMessage: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    code: ErrorCode,
    publicMessage: string,
    options?: { cause?: unknown; fieldErrors?: Record<string, string[]> },
  ) {
    super(publicMessage, { cause: options?.cause });
    this.name = 'AppError';
    this.code = code;
    this.publicMessage = publicMessage;
    this.fieldErrors = options?.fieldErrors;
  }
}

export class ConfigurationError extends AppError {
  constructor(message = 'The site is not fully configured yet. Please try again later.') {
    super('configuration', message);
    this.name = 'ConfigurationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You are not authorised to perform this action.') {
    super('unauthorized', message);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends AppError {
  constructor(publicMessage: string, fieldErrors?: Record<string, string[]>) {
    super('validation', publicMessage, { fieldErrors });
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please wait a moment and try again.') {
    super('rate_limited', message);
    this.name = 'RateLimitError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'We could not find what you were looking for.') {
    super('not_found', message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'That action conflicts with the current state of the record.') {
    super('conflict', message);
    this.name = 'ConflictError';
  }
}

const SAFE_FALLBACK = 'Something went wrong. Please try again.';

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  return new AppError('unknown', SAFE_FALLBACK, { cause: error });
}
