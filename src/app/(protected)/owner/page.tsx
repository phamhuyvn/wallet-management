import { Prisma, Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { MetricsFilters } from '@/components/owner/metrics-filters';
import { OwnerQuickActions } from '@/components/owner/owner-quick-actions';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TBody, TCell, THead, THeadCell, TRow } from '@/components/ui/table';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { formatVnd } from '@/lib/money';
import { metricsSummarySchema } from '@/lib/schema';
import { getMetricsSummary } from '@/lib/services/metrics';

export default async function OwnerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.OWNER) {
    redirect('/staff');
  }

  const filtersInput = metricsSummarySchema.parse({
    branchId: typeof params.branchId === 'string' ? params.branchId : undefined,
    accountId: typeof params.accountId === 'string' ? params.accountId : undefined,
    from: typeof params.from === 'string' ? params.from : undefined,
    to: typeof params.to === 'string' ? params.to : undefined,
    groupBy: typeof params.groupBy === 'string' ? params.groupBy : undefined,
  });

  const summary = await getMetricsSummary({ filters: filtersInput, user: session.user });

  const branches = await prisma.branch.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: [{ branch: { name: 'asc' } }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      branchId: true,
      branch: { select: { name: true } },
      type: true,
    },
  });

  const branchBalances = await prisma.$queryRaw<
    { id: string; name: string; balance: bigint | null }[]
  >(Prisma.sql`
    select
      b.id,
      b.name,
      coalesce(sum(t.amount), 0) as balance
    from branches b
    left join accounts a on a.branch_id = b.id
    left join transactions t on t.account_id = a.id
    group by b.id, b.name
    order by b.name asc
  `);

  const accountTypeTotals = await prisma.$queryRaw<
    { type: string; balance: bigint | null }[]
  >(Prisma.sql`
    select
      a.type,
      coalesce(sum(t.amount), 0) as balance
    from accounts a
    left join transactions t on t.account_id = a.id
    group by a.type
    order by a.type asc
  `);

  const todayIncome = summary.highlights.todaysIncome;
  const monthIncome = summary.highlights.thisMonthIncome;
  const monthNet = summary.highlights.thisMonthNet;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Owner dashboard"
        description="Monitor cash positions across every branch and account."
        actions={<OwnerQuickActions accounts={accounts.map((acc) => ({ id: acc.id, name: acc.name, branchId: acc.branchId, branchName: acc.branch.name }))} branches={branches} />}
      />

      <MetricsFilters
        initialFrom={summary.range.from.slice(0, 10)}
        initialTo={summary.range.to.slice(0, 10)}
        initialGroupBy={summary.range.groupBy}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader title="Today's income" description="Incoming cash and transfers today" />
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{formatVnd(todayIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="This month income" description="Gross inflow this month" />
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{formatVnd(monthIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="This month net" description="Net change across all accounts" />
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{formatVnd(monthNet)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Branches" description="Balances per branch" />
          <CardContent>
            <Table>
              <THead>
                <TRow>
                  <THeadCell>Branch</THeadCell>
                  <THeadCell className="text-right">Balance</THeadCell>
                </TRow>
              </THead>
              <TBody>
                {branchBalances.map((branch) => (
                  <TRow key={branch.id}>
                    <TCell>{branch.name}</TCell>
                    <TCell className="text-right font-medium text-slate-900">{formatVnd(branch.balance ?? 0n)}</TCell>
                  </TRow>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Account types" description="Total balance by account type" />
          <CardContent>
            <Table>
              <THead>
                <TRow>
                  <THeadCell>Type</THeadCell>
                  <THeadCell className="text-right">Balance</THeadCell>
                </TRow>
              </THead>
              <TBody>
                {accountTypeTotals.map((item) => (
                  <TRow key={item.type}>
                    <TCell>{item.type.replace(/_/g, ' ')}</TCell>
                    <TCell className="text-right font-medium text-slate-900">{formatVnd(item.balance ?? 0n)}</TCell>
                  </TRow>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Period performance" description="Totals grouped by the selected interval" />
        <CardContent>
          <Table>
            <THead>
              <TRow>
                <THeadCell>Period</THeadCell>
                <THeadCell className="text-right">Income</THeadCell>
                <THeadCell className="text-right">Outflow</THeadCell>
                <THeadCell className="text-right">Net</THeadCell>
              </TRow>
            </THead>
            <TBody>
              {summary.periods.length === 0 ? (
                <TRow>
                  <TCell colSpan={4} className="py-6 text-center text-sm text-slate-500">
                    No transactions for the selected range.
                  </TCell>
                </TRow>
              ) : (
                summary.periods.map((period) => (
                  <TRow key={period.period}>
                    <TCell>{new Date(period.period).toLocaleString()}</TCell>
                    <TCell className="text-right">{formatVnd(period.income)}</TCell>
                    <TCell className="text-right">{formatVnd(period.outflow)}</TCell>
                    <TCell className="text-right font-medium text-slate-900">{formatVnd(period.net)}</TCell>
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
