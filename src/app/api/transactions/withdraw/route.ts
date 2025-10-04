import { errorResponse, jsonResponse } from '@/lib/api';
import { requireOwner } from '@/lib/auth';
import { withdrawSchema } from '@/lib/schema';
import { createWithdraw } from '@/lib/services/transactions';

export async function POST(request: Request) {
  try {
    const session = await requireOwner();
    const payload = await request.json();
    const data = withdrawSchema.parse(payload);

    const result = await createWithdraw({ input: data, user: session.user });

    return jsonResponse(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
