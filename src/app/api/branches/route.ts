import { errorResponse, jsonResponse } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const session = await requireAuthenticatedUser();

    const where = session.user.role === 'OWNER' ? {} : { id: session.user.branchId ?? undefined };

    const branches = await prisma.branch.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        accounts: {
          select: {
            id: true,
            type: true,
          },
        },
      },
    });

    const branchIds = branches.map((branch) => branch.id);
    const balances = branchIds.length
      ? await prisma.transaction.groupBy({
          by: ['branchId'],
          where: {
            branchId: { in: branchIds },
          },
          _sum: { amount: true },
        })
      : [];

    const totals = new Map(balances.map((item) => [item.branchId, item._sum.amount ?? 0n]));

    const result = branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      createdAt: branch.createdAt,
      balance: totals.get(branch.id) ?? 0n,
      accounts: branch.accounts,
    }));

    return jsonResponse({ branches: result });
  } catch (error) {
    return errorResponse(error);
  }
}
