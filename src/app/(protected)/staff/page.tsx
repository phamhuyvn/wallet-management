import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { StaffQuickActions } from '@/components/staff/staff-quick-actions';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TBody, TCell, THead, THeadCell, TRow } from '@/components/ui/table';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { formatVnd } from '@/lib/money';
import { getMetricsSummary } from '@/lib/services/metrics';

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.STAFF) {
    redirect('/owner');
  }
  if (!session.user.branchId) {
    redirect('/');
  }

  const branch = await prisma.branch.findUnique({
    where: { id: session.user.branchId },
    select: {
      id: true,
      name: true,
      accounts: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          type: true,
        },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!branch) {
    redirect('/');
  }

  const balances = await prisma.transaction.groupBy({
    by: ['accountId'],
    where: { accountId: { in: branch.accounts.map((a) => a.id) } },
    _sum: { amount: true },
  });
  const balanceMap = new Map(balances.map((entry) => [entry.accountId, entry._sum.amount ?? 0n]));

  const summary = await getMetricsSummary({
    filters: { groupBy: 'day' },
    user: session.user,
  });

  const todayIncome = summary.highlights.todaysIncome;
  const monthNet = summary.highlights.thisMonthNet;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${session.user.name ?? session.user.email}`}
        description={`Branch: ${branch.name}`}
        actions={<StaffQuickActions accounts={branch.accounts.map((account) => ({ id: account.id, name: account.name }))} />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Today?s income" description="Deposits and incoming transfers" />
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{formatVnd(todayIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="This month net" description="Net movement for your branch" />
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{formatVnd(monthNet)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Accounts" description="Live balances for your branch" />
        <CardContent>
          <Table>
            <THead>
              <TRow>
                <THeadCell>Account</THeadCell>
                <THeadCell>Type</THeadCell>
                <THeadCell className="text-right">Balance</THeadCell>
              </TRow>
            </THead>
            <TBody>
              {branch.accounts.length === 0 ? (
                <TRow>
                  <TCell colSpan={3} className="py-6 text-center text-sm text-slate-500">
                    No accounts available yet.
                  </TCell>
                </TRow>
              ) : (
                branch.accounts.map((account) => (
                  <TRow key={account.id}>
                    <TCell>{account.name}</TCell>
                    <TCell className="uppercase tracking-wide text-xs text-slate-500">{account.type}</TCell>
                    <TCell className="text-right font-medium text-slate-900">{formatVnd(balanceMap.get(account.id) ?? 0n)}</TCell>
                  </TRow>
                ))
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
