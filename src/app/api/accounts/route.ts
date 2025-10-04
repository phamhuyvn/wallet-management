import { NextRequest } from 'next/server';

import { errorResponse, jsonResponse } from '@/lib/api';
import { requireAuthenticatedUser, requireOwner } from '@/lib/auth';
import prisma from '@/lib/db';
import { AppError } from '@/lib/errors';
import { accountCreateSchema } from '@/lib/schema';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const searchParams = request.nextUrl.searchParams;
    const branchIdParam = searchParams.get('branchId');

    const where: Prisma.AccountWhereInput = {};
    if (session.user.role === 'STAFF') {
      where.branchId = session.user.branchId ?? undefined;
    } else if (branchIdParam) {
      where.branchId = branchIdParam;
    }

    const accounts = await prisma.account.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const accountIds = accounts.map((account) => account.id);
    const balances = accountIds.length
      ? await prisma.transaction.groupBy({
          by: ['accountId'],
          where: {
            accountId: { in: accountIds },
          },
          _sum: { amount: true },
        })
      : [];

    const balanceMap = new Map(
      balances.map((item) => [item.accountId, item._sum.amount ?? 0n]),
    );

    const result = accounts.map((account) => ({
      ...account,
      balance: balanceMap.get(account.id) ?? 0n,
    }));

    return jsonResponse({ accounts: result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireOwner();
    const payload = await request.json();
    const data = accountCreateSchema.parse(payload);

    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) {
      throw new AppError('Branch not found', 404);
    }

    const account = await prisma.account.create({
      data: {
        branchId: data.branchId,
        name: data.name,
        type: data.type,
        createdById: session.user.id,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return jsonResponse({ account }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
