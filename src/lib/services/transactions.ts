import { PrismaClient, Role, TxType } from '@prisma/client';
import { Session } from 'next-auth';

import prisma from '@/lib/db';
import { AppError, ForbiddenError, NotFoundError } from '@/lib/errors';
import {
  DepositInput,
  OrderPaymentInput,
  TransferInput,
  WithdrawInput,
} from '@/lib/schema';

function getClient(client?: PrismaClient) {
  return client ?? prisma;
}

async function requireAccount(client: PrismaClient, accountId: string) {
  const account = await client.account.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      name: true,
      branchId: true,
      isActive: true,
    },
  });
  if (!account) {
    throw new NotFoundError('Account not found');
  }
  if (!account.isActive) {
    throw new AppError('Account is inactive', 400);
  }
  return account;
}

function assertStaffBranch(user: Session['user'], branchId: string) {
  if (user.role === Role.STAFF) {
    if (!user.branchId || user.branchId !== branchId) {
      throw new ForbiddenError('Staff can only operate within their branch');
    }
  }
}

export async function createDeposit({
  input,
  user,
  client,
}: {
  input: DepositInput;
  user: Session['user'];
  client?: PrismaClient;
}) {
  const prismaClient = getClient(client);
  const account = await requireAccount(prismaClient, input.accountId);
  assertStaffBranch(user, account.branchId);

  const transaction = await prismaClient.transaction.create({
    data: {
      accountId: account.id,
      branchId: account.branchId,
      userId: user.id,
      type: TxType.DEPOSIT,
      amount: input.amount,
      note: input.note,
    },
  });

  const balance = await prismaClient.transaction.aggregate({
    _sum: { amount: true },
    where: { accountId: account.id },
  });

  return {
    transaction,
    balance: balance._sum.amount ?? 0n,
  };
}

export async function createWithdraw({
  input,
  user,
  client,
}: {
  input: WithdrawInput;
  user: Session['user'];
  client?: PrismaClient;
}) {
  const prismaClient = getClient(client);
  const account = await requireAccount(prismaClient, input.accountId);
  if (user.role !== Role.OWNER) {
    throw new ForbiddenError('Only owners can withdraw');
  }

  const transaction = await prismaClient.transaction.create({
    data: {
      accountId: account.id,
      branchId: account.branchId,
      userId: user.id,
      type: TxType.WITHDRAW,
      amount: -input.amount,
      note: input.note,
    },
  });

  const balance = await prismaClient.transaction.aggregate({
    _sum: { amount: true },
    where: { accountId: account.id },
  });

  return {
    transaction,
    balance: balance._sum.amount ?? 0n,
  };
}

export async function createOrderPayment({
  input,
  user,
  client,
}: {
  input: OrderPaymentInput;
  user: Session['user'];
  client?: PrismaClient;
}) {
  const prismaClient = getClient(client);
  const account = await requireAccount(prismaClient, input.accountId);
  if (user.role !== Role.OWNER) {
    throw new ForbiddenError('Only owners can record order payments');
  }

  const transaction = await prismaClient.transaction.create({
    data: {
      accountId: account.id,
      branchId: account.branchId,
      userId: user.id,
      type: TxType.ORDER_PAYMENT,
      amount: -input.amount,
      note: input.note,
      meta: {
        orderId: input.orderId,
      },
    },
  });

  const balance = await prismaClient.transaction.aggregate({
    _sum: { amount: true },
    where: { accountId: account.id },
  });

  return {
    transaction,
    balance: balance._sum.amount ?? 0n,
  };
}

export async function createTransfer({
  input,
  user,
  client,
}: {
  input: TransferInput;
  user: Session['user'];
  client?: PrismaClient;
}) {
  const prismaClient = getClient(client);
  if (user.role !== Role.OWNER) {
    throw new ForbiddenError('Only owners can transfer');
  }
  if (input.fromAccountId === input.toAccountId) {
    throw new AppError('Cannot transfer within the same account', 400);
  }

  const accounts = await prismaClient.account.findMany({
    where: { id: { in: [input.fromAccountId, input.toAccountId] } },
    select: {
      id: true,
      branchId: true,
      isActive: true,
    },
  });
  const fromAccount = accounts.find((account) => account.id === input.fromAccountId);
  const toAccount = accounts.find((account) => account.id === input.toAccountId);
  if (!fromAccount || !toAccount) {
    throw new NotFoundError('Accounts not found');
  }
  if (!fromAccount.isActive || !toAccount.isActive) {
    throw new AppError('Account inactive', 400);
  }

  const crossBranch = fromAccount.branchId !== toAccount.branchId;
  if (crossBranch && !input.allowCrossBranch) {
    throw new AppError('Cross-branch transfer requires explicit allowCrossBranch flag', 400);
  }

  const result = await prismaClient.$transaction(async (tx) => {
    const debit = await tx.transaction.create({
      data: {
        accountId: fromAccount.id,
        branchId: fromAccount.branchId,
        userId: user.id,
        type: TxType.TRANSFER,
        amount: -input.amount,
        note: input.note,
        meta: crossBranch
          ? {
              direction: 'outbound',
              crossBranch: true,
              toBranchId: toAccount.branchId,
            }
          : {
              direction: 'outbound',
            },
      },
    });

    const credit = await tx.transaction.create({
      data: {
        accountId: toAccount.id,
        branchId: toAccount.branchId,
        userId: user.id,
        type: TxType.TRANSFER,
        amount: input.amount,
        note: input.note,
        meta: crossBranch
          ? {
              direction: 'inbound',
              crossBranch: true,
              fromBranchId: fromAccount.branchId,
            }
          : {
              direction: 'inbound',
            },
      },
    });

    await tx.txLink.create({
      data: {
        txFromId: debit.id,
        txToId: credit.id,
      },
    });

    return { debit, credit };
  });

  const balances = await prismaClient.transaction.groupBy({
    by: ['accountId'],
    where: { accountId: { in: [input.fromAccountId, input.toAccountId] } },
    _sum: { amount: true },
  });
  const balanceMap = new Map(balances.map((entry) => [entry.accountId, entry._sum.amount ?? 0n]));

  return {
    debit: result.debit,
    credit: result.credit,
    balances: {
      [input.fromAccountId]: balanceMap.get(input.fromAccountId) ?? 0n,
      [input.toAccountId]: balanceMap.get(input.toAccountId) ?? 0n,
    },
  };
}
