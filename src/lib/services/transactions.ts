import { Prisma, PrismaClient, Role, TxType } from '@prisma/client';
import { Session } from 'next-auth';

import prisma from '@/lib/db';
import { AppError, ForbiddenError, NotFoundError } from '@/lib/errors';
import {
  DepositInput,
  OrderPaymentInput,
  TransferInput,
  WithdrawInput,
} from '@/lib/schema';

type DbClient = PrismaClient | Prisma.TransactionClient;

function getClient(client?: PrismaClient) {
  return client ?? prisma;
}

async function requireAccount(client: DbClient, accountId: string) {
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

async function getAccountBalance(client: DbClient, accountId: string) {
  const balance = await client.transaction.aggregate({
    _sum: { amount: true },
    where: { accountId },
  });
  return balance._sum.amount ?? 0n;
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

  return prismaClient.$transaction(async (tx) => {
    const account = await requireAccount(tx, input.accountId);
    assertStaffBranch(user, account.branchId);

    const transaction = await tx.transaction.create({
      data: {
        accountId: account.id,
        branchId: account.branchId,
        userId: user.id,
        type: TxType.DEPOSIT,
        amount: input.amount,
        note: input.note,
      },
    });

    const balance = await getAccountBalance(tx, account.id);

    return {
      transaction,
      balance,
    };
  });
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
  if (user.role !== Role.OWNER) {
    throw new ForbiddenError('Only owners can withdraw');
  }

  return prismaClient.$transaction(async (tx) => {
    const account = await requireAccount(tx, input.accountId);
    const currentBalance = await getAccountBalance(tx, account.id);
    if (currentBalance < input.amount) {
      throw new AppError('Insufficient funds', 400);
    }

    const transaction = await tx.transaction.create({
      data: {
        accountId: account.id,
        branchId: account.branchId,
        userId: user.id,
        type: TxType.WITHDRAW,
        amount: -input.amount,
        note: input.note,
      },
    });

    return {
      transaction,
      balance: currentBalance - input.amount,
    };
  });
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
  if (user.role !== Role.OWNER) {
    throw new ForbiddenError('Only owners can record order payments');
  }

  return prismaClient.$transaction(async (tx) => {
    const account = await requireAccount(tx, input.accountId);
    const currentBalance = await getAccountBalance(tx, account.id);
    if (currentBalance < input.amount) {
      throw new AppError('Insufficient funds', 400);
    }

    const transaction = await tx.transaction.create({
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

    return {
      transaction,
      balance: currentBalance - input.amount,
    };
  });
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
    const fromBalance = await getAccountBalance(tx, fromAccount.id);
    if (fromBalance < input.amount) {
      throw new AppError('Insufficient funds in source account', 400);
    }
    const toBalance = await getAccountBalance(tx, toAccount.id);

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

    return {
      debit,
      credit,
      balances: {
        from: fromBalance - input.amount,
        to: toBalance + input.amount,
      },
    };
  });

  return {
    debit: result.debit,
    credit: result.credit,
    balances: {
      [input.fromAccountId]: result.balances.from,
      [input.toAccountId]: result.balances.to,
    },
  };
}
