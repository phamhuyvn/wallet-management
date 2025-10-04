import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { MainNav } from '@/components/navigation/main-nav';
import { Badge } from '@/components/ui/badge';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { Role } from '@prisma/client';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/sign-in');
  }

  const branchName = session.user.branchId
    ? (
        await prisma.branch.findUnique({
          where: { id: session.user.branchId },
          select: { name: true },
        })
      )?.name
    : null;

  const navItems =
    session.user.role === Role.OWNER
      ? [
          { href: '/owner', label: 'Owner Dashboard' },
          { href: '/accounts', label: 'Accounts' },
          { href: '/transactions', label: 'Transactions' },
        ]
      : [
          { href: '/staff', label: 'Staff Dashboard' },
          { href: '/transactions', label: 'Transactions' },
        ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <Link href="/" className="text-xl font-semibold text-slate-900">
              Cash & Wallet Manager
            </Link>
            <MainNav items={navItems} />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{session.user.name ?? session.user.email}</p>
              <div className="flex items-center gap-2">
                <Badge>{session.user.role === Role.OWNER ? 'Owner' : 'Staff'}</Badge>
                {branchName ? <span className="text-xs text-slate-500">{branchName}</span> : null}
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
}
