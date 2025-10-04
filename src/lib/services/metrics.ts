import { Role } from '@prisma/client';
import { Session } from 'next-auth';

import prisma from '@/lib/db';
import { MetricsSummaryInput } from '@/lib/schema';

type Condition = {
  text: string;
  value: unknown;
};

const groupUnits = {
  day: 'day',
  month: 'month',
  year: 'year',
} as const;

function composeClause(conditions: Condition[]) {
  if (conditions.length === 0) {
    return { clause: '', values: [] as unknown[] };
  }
  const values = conditions.map((condition) => condition.value);
  const parts = conditions.map((condition, index) => `${condition.text} $${index + 1}`);
  return {
    clause: `WHERE ${parts.join(' AND ')}`,
    values,
  };
}

export async function getMetricsSummary({
  filters,
  user,
}: {
  filters: MetricsSummaryInput;
  user: Session['user'];
}) {
  const now = new Date();
  const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const effectiveFrom = filters.from ?? defaultFrom;
  const effectiveTo = filters.to ?? now;

  const baseConditions: Condition[] = [];
  if (user.role === Role.STAFF) {
    if (user.branchId) {
      baseConditions.push({ text: 't.branch_id =', value: user.branchId });
    }
  } else if (filters.branchId) {
    baseConditions.push({ text: 't.branch_id =', value: filters.branchId });
  }

  if (filters.accountId) {
    baseConditions.push({ text: 't.account_id =', value: filters.accountId });
  }

  const rangeConditions: Condition[] = [
    { text: 't.created_at >=', value: effectiveFrom },
    { text: 't.created_at <=', value: effectiveTo },
  ];

  const totalsClause = composeClause([...baseConditions, ...rangeConditions]);

  const totalsRows = (await prisma.$queryRawUnsafe<
    { income: bigint | null; outflow: bigint | null; net: bigint | null }[]
  >(
    `
    select
      coalesce(sum(case when t.amount > 0 then t.amount else 0 end), 0) as income,
      coalesce(sum(case when t.amount < 0 then t.amount else 0 end), 0) as outflow,
      coalesce(sum(t.amount), 0) as net
    from transactions t
    ${totalsClause.clause}
  `,
    ...totalsClause.values,
  )) as Array<{ income: bigint | null; outflow: bigint | null; net: bigint | null }>;

  const totals = totalsRows[0] ?? { income: 0n, outflow: 0n, net: 0n };

  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  const todayClause = composeClause([
    ...baseConditions,
    { text: 't.created_at >=', value: todayStart },
    { text: 't.created_at <', value: tomorrowStart },
  ]);

  const todayRows = (await prisma.$queryRawUnsafe<{ income: bigint | null }[]>(
    `
    select coalesce(sum(case when t.amount > 0 then t.amount else 0 end), 0) as income
    from transactions t
    ${todayClause.clause}
  `,
    ...todayClause.values,
  )) as Array<{ income: bigint | null }>;

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(monthStart);
  nextMonthStart.setUTCMonth(nextMonthStart.getUTCMonth() + 1);

  const monthClause = composeClause([
    ...baseConditions,
    { text: 't.created_at >=', value: monthStart },
    { text: 't.created_at <', value: nextMonthStart },
  ]);

  const monthRows = (await prisma.$queryRawUnsafe<{ net: bigint | null; income: bigint | null }[]>(
    `
    select
      coalesce(sum(t.amount), 0) as net,
      coalesce(sum(case when t.amount > 0 then t.amount else 0 end), 0) as income
    from transactions t
    ${monthClause.clause}
  `,
    ...monthClause.values,
  )) as Array<{ net: bigint | null; income: bigint | null }>;

  const periods: Array<{ period: string; income: bigint; outflow: bigint; net: bigint }> = [];
  if (filters.groupBy !== 'custom') {
    const unit = groupUnits[filters.groupBy];
    const periodClause = composeClause([...baseConditions, ...rangeConditions]);
    const rows = (await prisma.$queryRawUnsafe<
      { period: Date; income: bigint | null; outflow: bigint | null; net: bigint | null }[]
    >(
      `
      select
        date_trunc('${unit}', t.created_at) as period,
        coalesce(sum(case when t.amount > 0 then t.amount else 0 end), 0) as income,
        coalesce(sum(case when t.amount < 0 then t.amount else 0 end), 0) as outflow,
        coalesce(sum(t.amount), 0) as net
      from transactions t
      ${periodClause.clause}
      group by 1
      order by 1 desc
      limit 90
    `,
      ...periodClause.values,
    )) as Array<{ period: Date; income: bigint | null; outflow: bigint | null; net: bigint | null }>;

    rows.forEach((row) => {
      periods.push({
        period: row.period.toISOString(),
        income: row.income ?? 0n,
        outflow: row.outflow ?? 0n,
        net: row.net ?? 0n,
      });
    });
  }

  return {
    totals: {
      income: totals.income ?? 0n,
      outflow: totals.outflow ?? 0n,
      net: totals.net ?? 0n,
    },
    highlights: {
      todaysIncome: todayRows[0]?.income ?? 0n,
      thisMonthIncome: monthRows[0]?.income ?? 0n,
      thisMonthNet: monthRows[0]?.net ?? 0n,
    },
    periods,
    range: {
      from: effectiveFrom.toISOString(),
      to: effectiveTo.toISOString(),
      groupBy: filters.groupBy,
    },
  };
}
