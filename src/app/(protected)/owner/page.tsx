import { Prisma, Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { MetricsFilters } from '@/components/owner/metrics-filters';
import { OwnerQuickActions } from '@/components/owner/owner-quick-actions';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableContainer, TBody, TCell, THead, THeadCell, TRow } from '@/components/ui/table';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { formatVnd } from '@/lib/money';
import { metricsSummarySchema } from '@/lib/schema';
import { getMetricsSummary } from '@/lib/services/metrics';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
};

function formatPeriodLabel(value: string, groupBy: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  if (groupBy === 'year') {
    return new Intl.DateTimeFormat('vi-VN', { year: 'numeric' }).format(date);
  }
  if (groupBy === 'month') {
    return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(date);
  }
  if (groupBy === 'custom') {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

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

  const [summary, branches, accounts, branchBalances, accountTypeTotals] = await Promise.all([
    getMetricsSummary({ filters: filtersInput, user: session.user }),
    prisma.branch.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.account.findMany({
      where: { isActive: true },
      orderBy: [{ branch: { name: 'asc' } }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        branchId: true,
        branch: { select: { name: true } },
        type: true,
      },
    }),
    prisma.$queryRaw<
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
    `),
    prisma.$queryRaw<
      { type: string; balance: bigint | null }[]
    >(Prisma.sql`
      select
        a.type,
        coalesce(sum(t.amount), 0) as balance
      from accounts a
      left join transactions t on t.account_id = a.id
      group by a.type
      order by a.type asc
    `),
  ]);

  const todayIncome = summary.highlights.todaysIncome;
  const monthIncome = summary.highlights.thisMonthIncome;
  const monthNet = summary.highlights.thisMonthNet;

  const quickActionAccounts = accounts.map((acc) => ({
    id: acc.id,
    name: acc.name,
    branchId: acc.branchId,
    branchName: acc.branch.name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan chủ sở hữu"
        description="Xem tức thời tình hình tiền mặt tại mọi chi nhánh và tài khoản."
        actions={<OwnerQuickActions accounts={quickActionAccounts} branches={branches} />}
      />

      <MetricsFilters
        initialFrom={summary.range.from.slice(0, 10)}
        initialTo={summary.range.to.slice(0, 10)}
        initialGroupBy={summary.range.groupBy}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader title="Thu trong ngày" description="Tiền mặt và chuyển khoản ghi nhận hôm nay." />
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{formatVnd(todayIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Tổng thu tháng này" description="Tổng dòng tiền vào theo tháng hiện tại." />
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{formatVnd(monthIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Dòng tiền ròng tháng" description="Chênh lệch thu - chi toàn hệ thống." />
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{formatVnd(monthNet)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Số dư theo chi nhánh" description="Theo dõi số dư hiện tại ở từng địa điểm." />
          <CardContent>
            <TableContainer>
              <Table>
                <THead>
                  <TRow>
                    <THeadCell>Chi nhánh</THeadCell>
                    <THeadCell className="text-right">Số dư</THeadCell>
                  </TRow>
                </THead>
                <TBody>
                  {branchBalances.map((branch) => (
                    <TRow key={branch.id}>
                      <TCell>{branch.name}</TCell>
                      <TCell className="text-right font-semibold text-slate-900">{formatVnd(branch.balance ?? 0n)}</TCell>
                    </TRow>
                  ))}
                </TBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Số dư theo loại tài khoản" description="Nhìn nhanh loại tài khoản nào chiếm tỷ trọng cao." />
          <CardContent>
            <TableContainer>
              <Table>
                <THead>
                  <TRow>
                    <THeadCell>Loại tài khoản</THeadCell>
                    <THeadCell className="text-right">Số dư</THeadCell>
                  </TRow>
                </THead>
                <TBody>
                  {accountTypeTotals.map((item) => (
                    <TRow key={item.type}>
                      <TCell>{ACCOUNT_TYPE_LABELS[item.type] ?? item.type}</TCell>
                      <TCell className="text-right font-semibold text-slate-900">{formatVnd(item.balance ?? 0n)}</TCell>
                    </TRow>
                  ))}
                </TBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Hiệu suất theo kỳ" description="Các chỉ số tổng hợp dựa trên bộ lọc hiện tại." />
        <CardContent>
          <TableContainer>
            <Table>
              <THead>
                <TRow>
                  <THeadCell>Kỳ</THeadCell>
                  <THeadCell className="text-right">Thu</THeadCell>
                  <THeadCell className="text-right">Chi</THeadCell>
                  <THeadCell className="text-right">Dòng tiền ròng</THeadCell>
                </TRow>
              </THead>
              <TBody>
                {summary.periods.length === 0 ? (
                  <TRow>
                    <TCell colSpan={4} className="py-6 text-center text-sm text-slate-500">
                      Không có giao dịch trong phạm vi đã chọn.
                    </TCell>
                  </TRow>
                ) : (
                  summary.periods.map((period) => (
                    <TRow key={period.period}>
                      <TCell>{formatPeriodLabel(period.period, summary.range.groupBy)}</TCell>
                      <TCell className="text-right">{formatVnd(period.income)}</TCell>
                      <TCell className="text-right">{formatVnd(period.outflow)}</TCell>
                      <TCell className="text-right font-semibold text-slate-900">{formatVnd(period.net)}</TCell>
                    </TRow>
                  ))
                )}
              </TBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  );
}
