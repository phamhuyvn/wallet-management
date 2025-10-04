import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TBody, TCell, THead, THeadCell, TRow } from '@/components/ui/table';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { formatVnd } from '@/lib/money';

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

  const balances = await prisma.transaction.groupBy({
    by: ['accountId'],
    where: { accountId: { in: accounts.map((account) => account.id) } },
    _sum: { amount: true },
  });
  const balanceMap = new Map(balances.map((entry) => [entry.accountId, entry._sum.amount ?? 0n]));

  return (
    <div className="space-y-6">
      <PageHeader title="Accounts" description="Wallets and bank accounts grouped by branch." />

      <Card>
        <CardHeader title="Account list" description="Balances are derived from the immutable ledger." />
        <CardContent>
          <Table>
            <THead>
              <TRow>
                <THeadCell>Account</THeadCell>
                <THeadCell>Branch</THeadCell>
                <THeadCell>Type</THeadCell>
                <THeadCell className="text-right">Balance</THeadCell>
                <THeadCell className="text-right">Transactions</THeadCell>
              </TRow>
            </THead>
            <TBody>
              {accounts.length === 0 ? (
                <TRow>
                  <TCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                    No accounts yet.
                  </TCell>
                </TRow>
              ) : (
                accounts.map((account) => (
                  <TRow key={account.id}>
                    <TCell>
                      <div className="font-medium text-slate-900">{account.name}</div>
                      <div className="text-xs text-slate-500">Created by {account.createdBy.fullName ?? account.createdBy.email}</div>
                    </TCell>
                    <TCell>{account.branch.name}</TCell>
                    <TCell className="uppercase text-xs text-slate-500">{account.type}</TCell>
                    <TCell className="text-right font-medium text-slate-900">{formatVnd(balanceMap.get(account.id) ?? 0n)}</TCell>
                    <TCell className="text-right text-sm text-slate-600">{account._count.transactions}</TCell>
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
