import { errorResponse, jsonResponse } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import { depositSchema } from '@/lib/schema';
import { createDeposit } from '@/lib/services/transactions';

export async function POST(request: Request) {
  try {
    const session = await requireAuthenticatedUser();
    const payload = await request.json();
    const data = depositSchema.parse(payload);

    const result = await createDeposit({ input: data, user: session.user });

    return jsonResponse(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
