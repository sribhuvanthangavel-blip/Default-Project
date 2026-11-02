#!/usr/bin/env node
/**
 * Secret and patient-data scan.
 *
 * Run before every commit:  npm run check:secrets
 *
 * Fails (exit code 1) when it finds:
 *   - a committed environment file
 *   - a Supabase service-role JWT or a key that looks like one
 *   - a private key block
 *   - a Resend / Stripe / AWS style API key
 *   - a hardcoded password assignment
 *
 * It is a safety net, not a substitute for review.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'coverage',
  'playwright-report',
  'test-results',
  'dist',
  'build',
]);

const SKIP_FILE_PATTERNS = [
  /^package-lock\.json$/,
  /^\.env\.example$/, // placeholders only, by design
  /^scripts\/check-secrets\.mjs$/, // this file contains the patterns
];

const PATTERNS = [
  {
    name: 'Supabase service-role key',
    // Service-role JWTs carry "role":"service_role" in the payload.
    test: (line) =>
      /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(line) &&
      /service_role/.test(decodeJwtPart(line)),
  },
  {
    name: 'Any JWT literal',
    test: (line) => /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/.test(line),
  },
  {
    name: 'Private key block',
    test: (line) => /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/.test(line),
  },
  {
    name: 'Resend API key',
    test: (line) => /\bre_[A-Za-z0-9]{16,}\b/.test(line),
  },
  {
    name: 'Stripe secret key',
    test: (line) => /\bsk_(live|test)_[A-Za-z0-9]{16,}\b/.test(line),
  },
  {
    name: 'AWS access key',
    test: (line) => /\bAKIA[0-9A-Z]{16}\b/.test(line),
  },
  {
    name: 'Supabase personal access token',
    test: (line) => /\bsbp_[a-f0-9]{40}\b/.test(line),
  },
  {
    name: 'Hardcoded password assignment',
    test: (line) =>
      /\b(password|passwd|secret)\s*[:=]\s*['"][^'"\s]{8,}['"]/i.test(line) &&
      !/#\s*example|placeholder|your-|xxx|changeme/i.test(line),
  },
];

function decodeJwtPart(line) {
  const match = line.match(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/);
  if (!match?.[1]) return '';
  try {
    return Buffer.from(match[1], 'base64url').toString('utf8');
  } catch {
    return '';
  }
}

function listFiles() {
  try {
    const output = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'buffer' });
    return output
      .toString('utf8')
      .split('\0')
      .filter(Boolean)
      .map((file) => path.join(ROOT, file));
  } catch {
    // No git repository yet: walk the tree.
    const found = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir)) {
        if (SKIP_DIRS.has(entry)) continue;
        const full = path.join(dir, entry);
        let stats;
        try {
          stats = statSync(full);
        } catch {
          continue;
        }
        if (stats.isDirectory()) walk(full);
        else found.push(full);
      }
    };
    walk(ROOT);
    return found;
  }
}

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.sql',
  '.toml',
  '.yml',
  '.yaml',
  '.css',
  '.html',
  '.example',
  '.txt',
  '.env',
  '.sh',
  '.ps1',
]);

const ENV_FILE_ALLOWLIST = new Set(['.env.example']);

const problems = [];

for (const file of listFiles()) {
  const relative = path.relative(ROOT, file).replaceAll('\\', '/');
  const base = path.basename(file);

  if (SKIP_FILE_PATTERNS.some((pattern) => pattern.test(relative))) continue;

  if (base === '.env' || (base.startsWith('.env.') && !ENV_FILE_ALLOWLIST.has(base))) {
    problems.push({ file: relative, line: 0, name: 'Committed environment file' });
    continue;
  }

  const extension = path.extname(file).toLowerCase();
  if (!TEXT_EXTENSIONS.has(extension) && !base.startsWith('.env')) continue;

  let content;
  try {
    if (statSync(file).size > 1_000_000) continue;
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of PATTERNS) {
      if (pattern.test(line)) {
        problems.push({ file: relative, line: index + 1, name: pattern.name });
      }
    }
  });
}

if (problems.length === 0) {
  console.log('check:secrets — no credentials or environment files found.');
  process.exit(0);
}

console.error('check:secrets — potential secrets detected:\n');
for (const problem of problems) {
  console.error(`  ${problem.file}:${problem.line}  ${problem.name}`);
}
console.error(
  '\nRemove the value, rotate the credential, and purge it from git history before pushing.\n',
);
process.exit(1);
