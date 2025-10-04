import { errorResponse, jsonResponse } from '@/lib/api';
import { requireOwner } from '@/lib/auth';
import { transferSchema } from '@/lib/schema';
import { createTransfer } from '@/lib/services/transactions';

export async function POST(request: Request) {
  try {
    const session = await requireOwner();
    const payload = await request.json();
    const data = transferSchema.parse(payload);

    const result = await createTransfer({ input: data, user: session.user });

    return jsonResponse(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
