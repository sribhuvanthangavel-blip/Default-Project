'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSiteUrl } from '@/lib/env';
import { getSessionUser } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { actionFail, type ActionState } from '@/lib/result';
import { hashClientIp, getClientIp } from '@/lib/security/ip';
import { loginRateLimiter } from '@/lib/security/rate-limit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { loginSchema, resetRequestSchema, updatePasswordSchema } from '@/lib/validation/admin';
import { fieldErrorsFromZod } from '@/lib/validation/errors';
import { failFromError } from './helpers';

/** Only allow same-application admin redirects (no open redirects). */
function safeAdminDestination(candidate: string | undefined): string {
  if (!candidate) return '/admin';
  if (!candidate.startsWith('/admin') || candidate.startsWith('//')) return '/admin';
  return candidate;
}

export async function loginAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let destination = '/admin';

  try {
    const headerList = await headers();
    const limit = loginRateLimiter.check(hashClientIp(getClientIp(headerList)));
    if (!limit.ok) {
      return actionFail('Too many sign-in attempts. Please wait a few minutes and try again.', {
        code: 'rate_limited',
      });
    }

    const parsed = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      next: formData.get('next') ?? '',
    });

    if (!parsed.success) {
      return actionFail('Enter your email address and password.', {
        code: 'validation',
        fieldErrors: fieldErrorsFromZod(parsed.error),
      });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return actionFail('Sign-in is not configured yet. Please contact the site administrator.', {
        code: 'configuration',
      });
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      logger.warn({ event: 'auth.login_failed' });
      // Deliberately identical for unknown email and wrong password.
      return actionFail('Those sign-in details are not correct.', { code: 'unauthorized' });
    }

    logger.info({ event: 'auth.login_succeeded' });
    destination = safeAdminDestination(parsed.data.next);
  } catch (error) {
    return failFromError(error);
  }

  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut({ scope: 'local' });
  }
  redirect('/admin/login?reason=signed-out');
}

export async function requestPasswordResetAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const headerList = await headers();
    const limit = loginRateLimiter.check(hashClientIp(getClientIp(headerList)));
    if (!limit.ok) {
      return actionFail('Too many requests. Please wait a few minutes and try again.', {
        code: 'rate_limited',
      });
    }

    const parsed = resetRequestSchema.safeParse({ email: formData.get('email') });
    if (!parsed.success) {
      return actionFail('Enter the email address used for your admin account.', {
        code: 'validation',
        fieldErrors: fieldErrorsFromZod(parsed.error),
      });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return actionFail('Sign-in is not configured yet. Please contact the site administrator.', {
        code: 'configuration',
      });
    }

    // Always report success to avoid revealing which addresses have accounts.
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/admin/reset-password`,
    });

    logger.info({ event: 'auth.password_reset_requested' });
  } catch (error) {
    return failFromError(error);
  }

  redirect('/admin/forgot-password?sent=1');
}

export async function updatePasswordAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return actionFail('Your reset link has expired. Please request a new one.', {
        code: 'unauthorized',
      });
    }

    const parsed = updatePasswordSchema.safeParse({
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    if (!parsed.success) {
      return actionFail('Please check the password requirements.', {
        code: 'validation',
        fieldErrors: fieldErrorsFromZod(parsed.error),
      });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return actionFail('Sign-in is not configured yet. Please contact the site administrator.', {
        code: 'configuration',
      });
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) {
      logger.warn({ event: 'auth.password_update_failed' });
      return actionFail(
        'The password could not be updated. Request a new reset link and try again.',
        { code: 'unknown' },
      );
    }

    logger.info({ event: 'auth.password_updated' });
  } catch (error) {
    return failFromError(error);
  }

  redirect('/admin?reason=password-updated');
}
