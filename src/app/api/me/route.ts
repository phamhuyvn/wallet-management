import { errorResponse, jsonResponse } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const session = await requireAuthenticatedUser();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return jsonResponse({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
