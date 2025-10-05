import { Prisma, Role, TxType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { TransactionsFilters } from '@/components/transactions/transactions-filters';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableContainer, TBody, TCell, THead, THeadCell, TRow } from '@/components/ui/table';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { formatVnd } from '@/lib/money';
import { transactionQuerySchema } from '@/lib/schema';

const TYPE_LABELS: Record<TxType, string> = {
  DEPOSIT: 'Nạp tiền',
  TRANSFER: 'Chuyển khoản',
  WITHDRAW: 'Xuất quỹ',
  ORDER_PAYMENT: 'Thanh toán đơn hàng',
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/sign-in');
  }

  const params = await searchParams;
  const parsedQuery = transactionQuerySchema.safeParse({
    branchId: typeof params.branchId === 'string' ? params.branchId : undefined,
    accountId: typeof params.accountId === 'string' ? params.accountId : undefined,
    type: typeof params.type === 'string' ? params.type : undefined,
    from: typeof params.from === 'string' ? params.from : undefined,
    to: typeof params.to === 'string' ? params.to : undefined,
    userId: typeof params.userId === 'string' ? params.userId : undefined,
    limit: 50,
  });
  const filters = parsedQuery.success ? parsedQuery.data : { limit: 50 };

  const where: Prisma.TransactionWhereInput = {};
  if (session.user.role === Role.STAFF) {
    where.branchId = session.user.branchId ?? undefined;
  } else if (filters.branchId) {
    where.branchId = filters.branchId;
  }
  if (filters.accountId) {
    where.accountId = filters.accountId;
  }
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.userId) {
    where.userId = filters.userId;
  }
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }

  const accountWhere = session.user.role === Role.OWNER ? {} : { branchId: session.user.branchId ?? undefined };

  const [transactions, branches, accounts] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 50,
      include: {
        account: { select: { name: true, branchId: true } },
        user: { select: { fullName: true, email: true } },
        branch: { select: { name: true } },
      },
    }),
    prisma.branch.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.account.findMany({
      where: accountWhere,
      select: { id: true, name: true, branchId: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Giao dịch" description="Sổ cái ghi nhận đầy đủ mọi biến động tiền tệ." />

      <TransactionsFilters
        branches={branches}
        accounts={accounts}
        role={session.user.role === Role.OWNER ? 'OWNER' : 'STAFF'}
        currentBranchId={session.user.branchId}
      />

      <Card>
        <CardHeader title="Giao dịch gần đây" description="Hiển thị tối đa 50 bản ghi mới nhất." />
        <CardContent>
          <TableContainer>
            <Table>
              <THead>
                <TRow>
                  <THeadCell>Thời gian</THeadCell>
                  <THeadCell>Chi nhánh</THeadCell>
                  <THeadCell>Tài khoản</THeadCell>
                  <THeadCell>Loại</THeadCell>
                  <THeadCell className="text-right">Số tiền</THeadCell>
                  <THeadCell>Người thao tác</THeadCell>
                  <THeadCell>Ghi chú</THeadCell>
                </TRow>
              </THead>
              <TBody>
                {transactions.length === 0 ? (
                  <TRow>
                    <TCell colSpan={7} className="py-6 text-center text-sm text-slate-500">
                      Không tìm thấy giao dịch nào phù hợp bộ lọc.
                    </TCell>
                  </TRow>
                ) : (
                  transactions.map((transaction) => (
                    <TRow key={transaction.id}>
                      <TCell className="text-sm text-slate-600">
                        {transaction.createdAt.toLocaleString('vi-VN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </TCell>
                      <TCell>{transaction.branch.name}</TCell>
                      <TCell>{transaction.account.name}</TCell>
                      <TCell>{TYPE_LABELS[transaction.type]}</TCell>
                      <TCell className={`text-right font-semibold ${transaction.amount >= 0n ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatVnd(transaction.amount)}
                      </TCell>
                      <TCell>{transaction.user.fullName ?? transaction.user.email}</TCell>
                      <TCell className="text-xs text-slate-500">
                        {transaction.note && transaction.note.trim().length > 0 ? transaction.note : 'Không có'}
                      </TCell>
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
