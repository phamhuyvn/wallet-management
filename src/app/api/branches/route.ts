import { Prisma } from '@prisma/client';

import { errorResponse, jsonResponse } from '@/lib/api';
import { requireAuthenticatedUser, requireOwner } from '@/lib/auth';
import prisma from '@/lib/db';
import { AppError } from '@/lib/errors';
import { branchCreateSchema } from '@/lib/schema';

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

export async function POST(request: Request) {
  try {
    await requireOwner();
    const body = await request.json();
    const data = branchCreateSchema.safeParse(body);
    if (!data.success) {
      return errorResponse(data.error);
    }

    const branch = await prisma.branch.create({
      data: { name: data.data.name },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return jsonResponse(
      {
        branch: {
          ...branch,
          balance: 0n,
          accounts: [],
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return errorResponse(new AppError('Tên chi nhánh đã tồn tại', 409));
    }
    return errorResponse(error);
  }
}
