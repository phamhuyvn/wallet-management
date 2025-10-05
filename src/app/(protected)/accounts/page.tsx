import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableContainer, TBody, TCell, THead, THeadCell, TRow } from '@/components/ui/table';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { formatVnd } from '@/lib/money';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
};

export default async function AccountsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/sign-in');
  }

  const where = session.user.role === Role.OWNER ? {} : { branchId: session.user.branchId ?? undefined };

  const accounts = await prisma.account.findMany({
    where,
    orderBy: [{ branch: { name: 'asc' } }, { name: 'asc' }],
    include: {
      branch: { select: { name: true } },
      createdBy: { select: { fullName: true, email: true } },
      _count: { select: { transactions: true } },
    },
  });

  const accountIds = accounts.map((account) => account.id);
  const balances = accountIds.length
    ? await prisma.transaction.groupBy({
        by: ['accountId'],
        where: { accountId: { in: accountIds } },
        _sum: { amount: true },
      })
    : [];
  const balanceMap = new Map(balances.map((entry) => [entry.accountId, entry._sum.amount ?? 0n]));

  return (
    <div className="space-y-6">
      <PageHeader title="Tài khoản" description="Tổng hợp ví tiền mặt và tài khoản ngân hàng theo từng chi nhánh." />

      <Card>
        <CardHeader title="Danh sách tài khoản" description="Số dư được tính từ sổ cái giao dịch." />
        <CardContent>
          <TableContainer>
            <Table>
              <THead>
                <TRow>
                  <THeadCell>Tài khoản</THeadCell>
                  <THeadCell>Chi nhánh</THeadCell>
                  <THeadCell>Loại</THeadCell>
                  <THeadCell className="text-right">Số dư</THeadCell>
                  <THeadCell className="text-right">Số giao dịch</THeadCell>
                </TRow>
              </THead>
              <TBody>
                {accounts.length === 0 ? (
                  <TRow>
                    <TCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                      Chưa có tài khoản nào.
                    </TCell>
                  </TRow>
                ) : (
                  accounts.map((account) => (
                    <TRow key={account.id}>
                      <TCell>
                        <div className="font-semibold text-slate-900">{account.name}</div>
                        <div className="text-xs text-slate-500">
                          Tạo bởi {account.createdBy.fullName ?? account.createdBy.email}
                        </div>
                      </TCell>
                      <TCell>{account.branch.name}</TCell>
                      <TCell className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                      </TCell>
                      <TCell className="text-right font-semibold text-slate-900">{formatVnd(balanceMap.get(account.id) ?? 0n)}</TCell>
                      <TCell className="text-right text-sm text-slate-600">{account._count.transactions}</TCell>
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
