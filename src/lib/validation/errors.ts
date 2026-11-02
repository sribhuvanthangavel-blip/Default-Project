import { z } from 'zod';

/**
 * Converts a Zod error into a serialisable field → messages map for forms.
 * Built from `issues` directly so it works with Zod v4's generic error types
 * and nested paths (`confirmPassword`, `items.0.name`, …).
 */
export function fieldErrorsFromZod(error: z.ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join('.') : '_form';
    const bucket = result[key];
    if (bucket) bucket.push(issue.message);
    else result[key] = [issue.message];
  }

  return result;
}

export function firstFieldError(error: z.ZodError): string {
  for (const issue of error.issues) {
    if (issue.message) return issue.message;
  }
  return 'Please check the information you entered.';
}
