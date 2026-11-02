import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Staff dashboard',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-cream-100/60">{children}</div>;
}
