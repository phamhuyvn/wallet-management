import { describe, it, expect, vi } from 'vitest';

import { PrismaClient, Role } from '@prisma/client';
import type { Session } from 'next-auth';

import { ForbiddenError } from '@/lib/errors';
import { createDeposit, createTransfer } from '@/lib/services/transactions';

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
    const mockClient = {
      account: {
        findUnique: vi.fn().mockResolvedValue({ id: 'acc-2', branchId: 'branch-2', isActive: true }),
      },
    } as unknown as PrismaClient;

    await expect(
      createDeposit({
        input: { accountId: 'acc-2', amount: 100_000n, note: undefined },
        user: staffUser,
        client: mockClient,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('creates balanced transfer entries with link', async () => {
    const debit = { id: 'tx-out', amount: -150_000n };
    const credit = { id: 'tx-in', amount: 150_000n };

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
      transaction: {
        groupBy: vi.fn().mockResolvedValue([
          { accountId: 'acc-1', _sum: { amount: -150_000n } },
          { accountId: 'acc-2', _sum: { amount: 250_000n } },
        ]),
      },
      $transaction: vi.fn(async (callback: Parameters<PrismaClient['$transaction']>[0]) =>
        callback({
          transaction: { create: transactionCreate },
          txLink: { create: txLinkCreate },
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

    const transactionSpy = (mockClient as unknown as { $transaction: ReturnType<typeof vi.fn> }).$transaction;

    expect(transactionSpy).toHaveBeenCalledTimes(1);
    expect(transactionCreate).toHaveBeenCalledTimes(2);
    expect(txLinkCreate).toHaveBeenCalledWith({ data: { txFromId: debit.id, txToId: credit.id } });
    expect(result.debit.amount + result.credit.amount).toBe(0n);
    expect(result.balances['acc-1']).toBe(-150_000n);
    expect(result.balances['acc-2']).toBe(250_000n);
  });
});
