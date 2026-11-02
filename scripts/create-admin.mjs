#!/usr/bin/env node
/**
 * Provision a clinic administrator.
 *
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/create-admin.mjs --email=reception@example.com --name="Reception" --role=admin
 *
 * The password is generated locally and printed once. It is never logged to a
 * file and never sent anywhere except Supabase Auth.
 *
 * Roles exist only in this script and in SQL. Nothing in the web application can
 * create a user or change a role, which is what prevents privilege escalation.
 */

import { randomInt } from 'node:crypto';

const args = new Map();
for (const raw of process.argv.slice(2)) {
  const [key, ...rest] = raw.replace(/^--/, '').split('=');
  if (key) args.set(key, rest.join('='));
}

const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(
  /\/$/,
  '',
);
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const email = (args.get('email') ?? '').trim().toLowerCase();
const fullName = (args.get('name') ?? '').trim();
const role = args.get('role') ?? 'admin';

function usage(message) {
  if (message) console.error(`\n✗ ${message}\n`);
  console.error(
    [
      'Usage:',
      '  SUPABASE_URL=https://<ref>.supabase.co \\',
      '  SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \\',
      '  node scripts/create-admin.mjs --email=<address> [--name="Full name"] [--role=admin|staff]',
      '',
      'Notes:',
      '  • The service-role key is server-side only. Never put it in a NEXT_PUBLIC_ variable.',
      '  • Delete the printed password after storing it in a password manager.',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

if (!url || !serviceKey) usage('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) usage('Provide a valid --email address.');
if (!['admin', 'staff'].includes(role)) usage('--role must be "admin" or "staff".');

const ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SYMBOLS = '!@#$%^&*';

function generatePassword() {
  const chars = [];
  for (let index = 0; index < 18; index += 1) {
    chars.push(ALPHABET[randomInt(ALPHABET.length)]);
  }
  chars.push(SYMBOLS[randomInt(SYMBOLS.length)]);
  chars.push(String(randomInt(10)));
  return chars.join('');
}

async function request(path, init) {
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { ok: response.ok, status: response.status, body };
}

async function main() {
  const password = generatePassword();

  console.log(`\nProvisioning ${role}: ${email}`);

  const created = await request('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : {},
    }),
  });

  let userId = created.body?.id ?? created.body?.user?.id ?? null;

  if (!created.ok) {
    // A user may already exist (for example after a failed earlier run).
    const list = await request(`/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
      method: 'GET',
    });
    const existing = Array.isArray(list.body?.users)
      ? list.body.users.find((user) => user.email?.toLowerCase() === email)
      : null;

    if (!existing) {
      console.error('\n✗ Could not create or find the user.');
      console.error(`  status ${created.status}: ${JSON.stringify(created.body)}`);
      process.exit(1);
    }

    userId = existing.id;
    console.log('  • Auth user already existed — reusing it (password unchanged).');

    const updated = await request(`/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        password,
        email_confirm: true,
        ...(fullName ? { user_metadata: { full_name: fullName } } : {}),
      }),
    });

    if (!updated.ok) {
      console.error('\n✗ Could not reset the password for the existing user.');
      console.error(`  status ${updated.status}: ${JSON.stringify(updated.body)}`);
      process.exit(1);
    }
    console.log('  • Password reset to the value printed below.');
  } else {
    console.log('  • Auth user created and email marked as confirmed.');
  }

  if (!userId) {
    console.error('\n✗ Auth did not return a user id.');
    process.exit(1);
  }

  const profile = await request(`/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ role, ...(fullName ? { full_name: fullName } : {}), email }),
  });

  const rows = Array.isArray(profile.body) ? profile.body : [];

  if (!profile.ok || rows.length === 0) {
    console.error('\n✗ The profile row could not be updated.');
    console.error(`  status ${profile.status}: ${JSON.stringify(profile.body)}`);
    console.error(
      '  Run the SQL from docs/DEPLOYMENT.md to grant the role manually, then try again.',
    );
    process.exit(1);
  }

  console.log(`  • Profile role set to "${role}".`);

  console.log('\n──────────────────────────────────────────────────────────────');
  console.log(' Store these in a password manager now. They are shown once.');
  console.log('──────────────────────────────────────────────────────────────');
  console.log(`  URL:      ${url.replace('.supabase.co', '.supabase.co')}`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log('──────────────────────────────────────────────────────────────');
  console.log(' Sign in at /admin/login. Change the password after first use.\n');
}

main().catch((error) => {
  console.error('\n✗ Unexpected failure:', error instanceof Error ? error.message : error);
  process.exit(1);
});
