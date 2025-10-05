import { describe, it, expect, vi } from 'vitest';

import { PrismaClient, Role } from '@prisma/client';
import type { Session } from 'next-auth';

import { AppError, ForbiddenError } from '@/lib/errors';
import {
  createDeposit,
  createOrderPayment,
  createTransfer,
  createWithdraw,
} from '@/lib/services/transactions';

const ownerUser = {
  id: 'owner-1',
  email: 'owner@example.com',
  role: Role.OWNER,
  branchId: null,
  name: 'Demo Owner',
} satisfies Session['user'];

const staffUser = {
  id: 'staff-1',
  email: 'staff@example.com',
  role: Role.STAFF,
  branchId: 'branch-1',
  name: 'Demo Staff',
} satisfies Session['user'];

describe('transaction services', () => {
  it('prevents staff deposits into other branches', async () => {
    const accountFindUnique = vi.fn().mockResolvedValue({
      id: 'acc-2',
      branchId: 'branch-2',
      isActive: true,
    });

    const mockClient = {
      $transaction: vi.fn(async (callback: Parameters<PrismaClient['$transaction']>[0]) =>
        callback({
          account: {
            findUnique: accountFindUnique,
          },
          transaction: {
            create: vi.fn(),
            aggregate: vi.fn(),
          },
        } as unknown as Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]),
      ),
    } as unknown as PrismaClient;

    await expect(
      createDeposit({
        input: { accountId: 'acc-2', amount: 100_000n, note: undefined },
        user: staffUser,
        client: mockClient,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(accountFindUnique).toHaveBeenCalled();
  });

  it('creates balanced transfer entries with link and updated balances', async () => {
    const debit = { id: 'tx-out', amount: -150_000n };
    const credit = { id: 'tx-in', amount: 150_000n };

    const aggregate = vi
      .fn()
      .mockResolvedValueOnce({ _sum: { amount: 200_000n } })
      .mockResolvedValueOnce({ _sum: { amount: 100_000n } });

    const transactionCreate = vi
      .fn()
      .mockResolvedValueOnce(debit)
      .mockResolvedValueOnce(credit);

    const txLinkCreate = vi.fn().mockResolvedValue({ id: 'link-1' });

    const mockClient = {
      account: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'acc-1', branchId: 'branch-1', isActive: true },
          { id: 'acc-2', branchId: 'branch-1', isActive: true },
        ]),
      },
      $transaction: vi.fn(async (callback: Parameters<PrismaClient['$transaction']>[0]) =>
        callback({
          transaction: {
            aggregate,
            create: transactionCreate,
          },
          txLink: {
            create: txLinkCreate,
          },
        } as unknown as Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]),
      ),
    } as unknown as PrismaClient;

    const result = await createTransfer({
      input: {
        fromAccountId: 'acc-1',
        toAccountId: 'acc-2',
        amount: 150_000n,
        note: 'move funds',
        allowCrossBranch: false,
      },
      user: ownerUser,
      client: mockClient,
    });

    expect(mockClient.$transaction).toHaveBeenCalledTimes(1);
    expect(transactionCreate).toHaveBeenCalledTimes(2);
    expect(txLinkCreate).toHaveBeenCalledWith({ data: { txFromId: debit.id, txToId: credit.id } });
    expect(result.debit.amount + result.credit.amount).toBe(0n);
    expect(result.balances['acc-1']).toBe(50_000n);
    expect(result.balances['acc-2']).toBe(250_000n);
  });

  it('rejects withdrawals that would overdraft the account', async () => {
    const accountFindUnique = vi.fn().mockResolvedValue({
      id: 'acc-1',
      branchId: 'branch-1',
      isActive: true,
    });

    const aggregate = vi.fn().mockResolvedValue({ _sum: { amount: 50_000n } });
    const transactionCreate = vi.fn();

    const mockClient = {
      $transaction: vi.fn(async (callback: Parameters<PrismaClient['$transaction']>[0]) =>
        callback({
          account: {
            findUnique: accountFindUnique,
          },
          transaction: {
            aggregate,
            create: transactionCreate,
          },
        } as unknown as Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]),
      ),
    } as unknown as PrismaClient;

    await expect(
      createWithdraw({
        input: { accountId: 'acc-1', amount: 100_000n, note: 'cash out' },
        user: ownerUser,
        client: mockClient,
      }),
    ).rejects.toBeInstanceOf(AppError);

    expect(transactionCreate).not.toHaveBeenCalled();
  });

  it('records order payments and returns the updated balance', async () => {
    const accountFindUnique = vi.fn().mockResolvedValue({
      id: 'acc-1',
      branchId: 'branch-1',
      isActive: true,
    });

    const aggregate = vi.fn().mockResolvedValue({ _sum: { amount: 300_000n } });
    const createdTx = { id: 'tx-order', amount: -150_000n };
    const transactionCreate = vi.fn().mockResolvedValue(createdTx);

    const mockClient = {
      $transaction: vi.fn(async (callback: Parameters<PrismaClient['$transaction']>[0]) =>
        callback({
          account: {
            findUnique: accountFindUnique,
          },
          transaction: {
            aggregate,
            create: transactionCreate,
          },
        } as unknown as Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]),
      ),
    } as unknown as PrismaClient;

    const result = await createOrderPayment({
      input: { accountId: 'acc-1', amount: 150_000n, orderId: 'ORD-1', note: 'supplier' },
      user: ownerUser,
      client: mockClient,
    });

    expect(transactionCreate).toHaveBeenCalledWith({
      data: {
        accountId: 'acc-1',
        branchId: 'branch-1',
        userId: ownerUser.id,
        type: 'ORDER_PAYMENT',
        amount: -150_000n,
        note: 'supplier',
        meta: {
          orderId: 'ORD-1',
        },
      },
    });
    expect(result.transaction).toBe(createdTx);
    expect(result.balance).toBe(150_000n);
  });
});
