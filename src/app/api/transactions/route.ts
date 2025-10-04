import { NextRequest } from 'next/server';

import { errorResponse, jsonResponse } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { transactionQuerySchema } from '@/lib/schema';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const searchParams = request.nextUrl.searchParams;
    const raw = {
      branchId: searchParams.get('branchId') ?? undefined,
      accountId: searchParams.get('accountId') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      userId: searchParams.get('userId') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      cursor: searchParams.get('cursor') ?? undefined,
    };

    const params = transactionQuerySchema.parse(raw);

    const where: Prisma.TransactionWhereInput = {};

    if (session.user.role === 'STAFF') {
      where.branchId = session.user.branchId ?? undefined;
    } else if (params.branchId) {
      where.branchId = params.branchId;
    }
    if (params.accountId) {
      where.accountId = params.accountId;
    }
    if (params.type) {
      where.type = params.type;
    }
    if (params.userId) {
      where.userId = params.userId;
    }
    if (params.from || params.to) {
      where.createdAt = {
        ...(params.from ? { gte: params.from } : {}),
        ...(params.to ? { lte: params.to } : {}),
      };
    }

    const limit = params.limit ?? 20;

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      take: limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      skip: params.cursor ? 1 : undefined,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            branchId: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (transactions.length > limit) {
      const nextItem = transactions.pop();
      nextCursor = nextItem?.id ?? null;
    }

    return jsonResponse({ transactions, nextCursor });
  } catch (error) {
    return errorResponse(error);
  }
}
