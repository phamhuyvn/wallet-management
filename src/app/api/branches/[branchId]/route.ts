import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { errorResponse, jsonResponse } from '@/lib/api';
import { requireOwner } from '@/lib/auth';
import prisma from '@/lib/db';
import { AppError, NotFoundError } from '@/lib/errors';
import { branchUpdateSchema } from '@/lib/schema';

const branchIdSchema = z.string().uuid();

export async function PATCH(request: Request, context: { params: Promise<{ branchId: string }> }) {
  try {
    await requireOwner();
    const params = await context.params;
    const branchIdResult = branchIdSchema.safeParse(params.branchId);
    if (!branchIdResult.success) {
      return errorResponse(new AppError('Mã chi nhánh không hợp lệ', 400));
    }

    const body = await request.json();
    const parsed = branchUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }

    const branch = await prisma.branch.update({
      where: { id: branchIdResult.data },
      data: { name: parsed.data.name },
      select: { id: true, name: true, createdAt: true },
    });

    return jsonResponse({ branch });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return errorResponse(new NotFoundError('Không tìm thấy chi nhánh'));
      }
      if (error.code === 'P2002') {
        return errorResponse(new AppError('Tên chi nhánh đã tồn tại', 409));
      }
    }
    return errorResponse(error);
  }
}
