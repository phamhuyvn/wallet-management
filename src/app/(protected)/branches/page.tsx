import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { BranchCreateButton } from '@/components/branches/branch-create-button';
import { BranchRowActions } from '@/components/branches/branch-row-actions';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableContainer, TBody, TCell, THead, THeadCell, TRow } from '@/components/ui/table';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { formatVnd } from '@/lib/money';
import { Role } from '@prisma/client';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(value);
}

export default async function BranchesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/sign-in');
  }
  if (session.user.role !== Role.OWNER) {
    redirect('/staff');
  }

  const branches = await prisma.branch.findMany({
    orderBy: { name: 'asc' },
    include: {
      accounts: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      _count: {
        select: {
          accounts: true,
          users: true,
        },
      },
    },
  });

  const branchIds = branches.map((branch) => branch.id);
  const balances = branchIds.length
    ? await prisma.transaction.groupBy({
        by: ['branchId'],
        where: { branchId: { in: branchIds } },
        _sum: { amount: true },
      })
    : [];
  const totals = new Map(balances.map((item) => [item.branchId, item._sum.amount ?? 0n]));

  const users = branchIds.length
    ? await prisma.user.findMany({
        where: { branchId: { in: branchIds } },
        select: { id: true, branchId: true, role: true },
      })
    : [];
  const usersGrouped = users.reduce<Record<string, { owners: number; staff: number }>>((acc, user) => {
    if (!user.branchId) {
      return acc;
    }
    if (!acc[user.branchId]) {
      acc[user.branchId] = { owners: 0, staff: 0 };
    }
    if (user.role === Role.OWNER) {
      acc[user.branchId].owners += 1;
    } else {
      acc[user.branchId].staff += 1;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý chi nhánh"
        description="Theo dõi số dư, nhân sự và tạo tài khoản cho từng chi nhánh."
        actions={<BranchCreateButton />}
      />

      <Card>
        <CardHeader title="Danh sách chi nhánh" description="Chỉ chủ sở hữu mới có quyền chỉnh sửa các chi nhánh." />
        <CardContent>
          <TableContainer>
            <Table>
              <THead>
                <TRow>
                  <THeadCell>Chi nhánh</THeadCell>
                  <THeadCell>Ngày tạo</THeadCell>
                  <THeadCell>Tài khoản</THeadCell>
                  <THeadCell>Nhân sự</THeadCell>
                  <THeadCell className="text-right">Số dư</THeadCell>
                  <THeadCell className="text-right">Thao tác</THeadCell>
                </TRow>
              </THead>
              <TBody>
                {branches.length === 0 ? (
                  <TRow>
                    <TCell colSpan={6} className="py-6 text-center text-sm text-slate-500">
                      Chưa có chi nhánh nào được tạo.
                    </TCell>
                  </TRow>
                ) : (
                  branches.map((branch) => {
                    const balance = totals.get(branch.id) ?? 0n;
                    const userCount = usersGrouped[branch.id] ?? { owners: 0, staff: 0 };
                    return (
                      <TRow key={branch.id}>
                        <TCell>
                          <div className="font-semibold text-slate-900">{branch.name}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                            <Badge className="bg-emerald-100 text-emerald-700">{branch.accounts.length} tài khoản</Badge>
                            <Badge className="bg-slate-100 text-slate-600">
                              {userCount.owners} chủ sở hữu · {userCount.staff} nhân viên
                            </Badge>
                          </div>
                        </TCell>
                        <TCell>{formatDate(branch.createdAt)}</TCell>
                        <TCell>
                          {branch.accounts.length === 0 ? (
                            <span className="text-xs text-slate-500">Chưa có tài khoản</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {branch.accounts.slice(0, 3).map((account) => (
                                <Badge key={account.id}>{account.name}</Badge>
                              ))}
                              {branch.accounts.length > 3 ? (
                                <span className="text-xs text-slate-500">+{branch.accounts.length - 3}</span>
                              ) : null}
                            </div>
                          )}
                        </TCell>
                        <TCell>
                          <div className="text-sm text-slate-600">
                            <p>Owner: {userCount.owners}</p>
                            <p>Staff: {userCount.staff}</p>
                          </div>
                        </TCell>
                        <TCell className="text-right font-semibold text-slate-900">{formatVnd(balance)}</TCell>
                        <TCell className="text-right">
                          <BranchRowActions branchId={branch.id} branchName={branch.name} />
                        </TCell>
                      </TRow>
                    );
                  })
                )}
              </TBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  );
}
