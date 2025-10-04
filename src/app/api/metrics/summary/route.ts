import { NextRequest } from 'next/server';

import { errorResponse, jsonResponse } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import { metricsSummarySchema } from '@/lib/schema';
import { getMetricsSummary } from '@/lib/services/metrics';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const searchParams = request.nextUrl.searchParams;
    const raw = {
      branchId: searchParams.get('branchId') ?? undefined,
      accountId: searchParams.get('accountId') ?? undefined,
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      groupBy: searchParams.get('groupBy') ?? undefined,
    };
    const filters = metricsSummarySchema.parse(raw);

    const summary = await getMetricsSummary({ filters, user: session.user });

    return jsonResponse(summary);
  } catch (error) {
    return errorResponse(error);
  }
}
