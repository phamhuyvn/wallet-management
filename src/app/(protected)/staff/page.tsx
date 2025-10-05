import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { StaffQuickActions } from '@/components/staff/staff-quick-actions';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableContainer, TBody, TCell, THead, THeadCell, TRow } from '@/components/ui/table';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { formatVnd } from '@/lib/money';
import { getMetricsSummary } from '@/lib/services/metrics';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
};

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.STAFF) {
    redirect('/owner');
  }
  if (!session.user.branchId) {
    redirect('/');
  }

  const [branch, summary] = await Promise.all([
    prisma.branch.findUnique({
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
    }),
    getMetricsSummary({
      filters: { groupBy: 'day' },
      user: session.user,
    }),
  ]);

  if (!branch) {
    redirect('/');
  }

  const balances = await prisma.transaction.groupBy({
    by: ['accountId'],
    where: { accountId: { in: branch.accounts.map((a) => a.id) } },
    _sum: { amount: true },
  });
  const balanceMap = new Map(balances.map((entry) => [entry.accountId, entry._sum.amount ?? 0n]));

  const todayIncome = summary.highlights.todaysIncome;
  const monthNet = summary.highlights.thisMonthNet;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Xin chào, ${session.user.name ?? session.user.email}`}
        description={`Chi nhánh đang quản lý: ${branch.name}`}
        actions={<StaffQuickActions accounts={branch.accounts.map((account) => ({ id: account.id, name: account.name }))} />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Thu hôm nay" description="Tất cả khoản nạp và chuyển vào chi nhánh trong ngày." />
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{formatVnd(todayIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Dòng tiền ròng tháng" description="Chênh lệch thu chi tháng hiện tại của chi nhánh." />
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{formatVnd(monthNet)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Danh sách tài khoản" description="Số dư cập nhật theo thời gian thực của chi nhánh." />
        <CardContent>
          <TableContainer>
            <Table>
              <THead>
                <TRow>
                  <THeadCell>Tài khoản</THeadCell>
                  <THeadCell>Loại</THeadCell>
                  <THeadCell className="text-right">Số dư</THeadCell>
                </TRow>
              </THead>
              <TBody>
                {branch.accounts.length === 0 ? (
                  <TRow>
                    <TCell colSpan={3} className="py-6 text-center text-sm text-slate-500">
                      Chưa có tài khoản nào được tạo.
                    </TCell>
                  </TRow>
                ) : (
                  branch.accounts.map((account) => (
                    <TRow key={account.id}>
                      <TCell>{account.name}</TCell>
                      <TCell className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                      </TCell>
                      <TCell className="text-right font-semibold text-slate-900">{formatVnd(balanceMap.get(account.id) ?? 0n)}</TCell>
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
