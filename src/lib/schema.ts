import { z } from 'zod';
import { AccountType, Role, TxType } from '@prisma/client';

const uuid = z.string().uuid();

const baseAmount = z.union([z.string(), z.number(), z.bigint()]).transform((value, ctx) => {
  try {
    const normalized =
      typeof value === 'bigint'
        ? value
        : typeof value === 'number'
        ? BigInt(Math.trunc(value))
        : BigInt(value.trim());
    return normalized;
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid amount',
    });
    return z.NEVER;
  }
});

export const positiveAmount = baseAmount.pipe(
  z.bigint().refine((val) => val > 0n, { message: 'Amount must be positive' }),
);

export const nonZeroAmount = baseAmount.pipe(
  z.bigint().refine((val) => val !== 0n, { message: 'Amount must be non-zero' }),
);

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.nativeEnum(Role).optional(),
  branchId: uuid.optional(),
});

export const accountCreateSchema = z.object({
  branchId: uuid,
  name: z.string().min(2).max(120),
  type: z.nativeEnum(AccountType),
});

export const depositSchema = z.object({
  accountId: uuid,
  amount: positiveAmount,
  note: z.string().max(500).optional(),
});

export const withdrawSchema = z.object({
  accountId: uuid,
  amount: positiveAmount,
  note: z.string().max(500).optional(),
});

export const orderPaymentSchema = z.object({
  accountId: uuid,
  amount: positiveAmount,
  orderId: z.string().min(1),
  note: z.string().max(500).optional(),
});

export const transferSchema = z.object({
  fromAccountId: uuid,
  toAccountId: uuid,
  amount: positiveAmount,
  note: z.string().max(500).optional(),
  allowCrossBranch: z.boolean().optional(),
});

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const transactionQuerySchema = z.object({
  branchId: uuid.optional(),
  accountId: uuid.optional(),
  type: z.nativeEnum(TxType).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  userId: uuid.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
});

export const metricsSummarySchema = z.object({
  branchId: uuid.optional(),
  accountId: uuid.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  groupBy: z.enum(['day', 'month', 'year', 'custom']).default('day'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type AccountCreateInput = z.infer<typeof accountCreateSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
export type OrderPaymentInput = z.infer<typeof orderPaymentSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;
export type MetricsSummaryInput = z.infer<typeof metricsSummarySchema>;

