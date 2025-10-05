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

  let branchName: string | null = null;
  if (session.user.branchId) {
    branchName = (
      await prisma.branch.findUnique({
        where: { id: session.user.branchId },
        select: { name: true },
      })
    )?.name ?? null;
  }

  const navItems =
    session.user.role === Role.OWNER
      ? [
          { href: '/owner', label: 'Tổng quan' },
          { href: '/branches', label: 'Chi nhánh' },
          { href: '/accounts', label: 'Tài khoản' },
          { href: '/transactions', label: 'Giao dịch' },
        ]
      : [
          { href: '/staff', label: 'Bảng điều khiển' },
          { href: '/transactions', label: 'Giao dịch' },
        ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-3">
            <Link href="/" className="text-xl font-semibold text-slate-900">
              Ví & Tiền mặt đa chi nhánh
            </Link>
            <MainNav items={navItems} />
          </div>
          <div className="flex w-full flex-col items-start gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            <div className="space-y-1 text-sm text-slate-600">
              <p className="text-base font-semibold text-slate-900">
                {session.user.name ?? session.user.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Badge>{session.user.role === Role.OWNER ? 'Chủ sở hữu' : 'Nhân viên'}</Badge>
                {branchName ? <span>Chi nhánh: {branchName}</span> : null}
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
}
