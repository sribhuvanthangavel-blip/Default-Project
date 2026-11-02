'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { logoutAction } from '@/actions/auth';
import { Logo } from '@/components/ui/logo';
import { CloseIcon, MenuIcon } from '@/components/ui/icons';
import type { AppRole } from '@/types/database';

interface NavItem {
  href: string;
  label: string;
  adminOnly: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Overview', adminOnly: false },
  { href: '/admin/appointments', label: 'Appointments', adminOnly: false },
  { href: '/admin/messages', label: 'Messages', adminOnly: false },
  { href: '/admin/services', label: 'Services', adminOnly: true },
  { href: '/admin/settings', label: 'Clinic settings', adminOnly: true },
  { href: '/admin/audit', label: 'Audit log', adminOnly: true },
];

interface AdminNavProps {
  role: AppRole;
  name: string;
  email: string;
  pendingCount: number;
  newMessageCount: number;
}

export function AdminNav({ role, name, email, pendingCount, newMessageCount }: AdminNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = role === 'admin';

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const badge = (href: string) => {
    if (href === '/admin/appointments' && pendingCount > 0) return pendingCount;
    if (href === '/admin/messages' && newMessageCount > 0) return newMessageCount;
    return 0;
  };

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <>
      <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-[0.6rem] font-semibold tracking-[0.2em] text-muted uppercase">
            Dashboard
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="admin-nav"
          className="inline-flex size-10 items-center justify-center rounded-lg border border-line text-forest-900"
          aria-label={open ? 'Close dashboard menu' : 'Open dashboard menu'}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <aside
        id="admin-nav"
        className={`${open ? 'block' : 'hidden'} border-b border-line bg-white lg:block lg:h-dvh lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0`}
      >
        <div className="flex h-full flex-col">
          <div className="hidden px-6 pt-7 pb-6 lg:block">
            <Logo />
            <p className="mt-3 text-[0.6rem] font-semibold tracking-[0.22em] text-muted uppercase">
              Staff dashboard
            </p>
          </div>

          <nav aria-label="Dashboard" className="px-3 py-4 lg:flex-1 lg:overflow-y-auto">
            <ul className="space-y-1">
              {items.map((item) => {
                const count = badge(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        isActive(item.href)
                          ? 'bg-forest-50 text-forest-900'
                          : 'text-muted hover:bg-cream-100/70 hover:text-forest-900'
                      }`}
                    >
                      <span>{item.label}</span>
                      {count > 0 ? (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-gold-400 px-1.5 text-[0.65rem] font-semibold text-forest-950">
                          {count > 99 ? '99+' : count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 border-t border-line pt-4">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-cream-100/70 hover:text-forest-900"
              >
                View public site
              </Link>
            </div>
          </nav>

          <div className="border-t border-line px-4 py-4">
            <p className="truncate text-sm font-medium text-forest-900">{name || email}</p>
            <p className="truncate text-[0.72rem] text-muted">{email}</p>
            <p className="mt-1 inline-flex rounded-full bg-forest-50 px-2 py-0.5 text-[0.62rem] font-semibold tracking-[0.14em] text-forest-700 uppercase">
              {role}
            </p>
            <form action={logoutAction} className="mt-3">
              <button type="submit" className="btn-outline btn-sm w-full">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
