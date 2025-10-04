import { errorResponse, jsonResponse } from '@/lib/api';
import { requireOwner } from '@/lib/auth';
import { orderPaymentSchema } from '@/lib/schema';
import { createOrderPayment } from '@/lib/services/transactions';

export async function POST(request: Request) {
  try {
    const session = await requireOwner();
    const payload = await request.json();
    const data = orderPaymentSchema.parse(payload);

    const result = await createOrderPayment({ input: data, user: session.user });

    return jsonResponse(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
