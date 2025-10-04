import argon2 from 'argon2';
import { Role } from '@prisma/client';

import prisma from '@/lib/db';
import { requireOwner } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { errorResponse, jsonResponse } from '@/lib/api';
import { registerSchema } from '@/lib/schema';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = registerSchema.parse(payload);

    const totalUsers = await prisma.user.count();

    if (totalUsers === 0) {
      const result = await prisma.$transaction(async (tx) => {
        const branch = await tx.branch.create({
          data: {
            name: 'Main Branch',
          },
        });
        const passwordHash = await argon2.hash(data.password);
        const user = await tx.user.create({
          data: {
            email: data.email.toLowerCase(),
            passwordHash,
            fullName: data.fullName,
            role: Role.OWNER,
          },
        });

        await tx.account.createMany({
          data: [
            {
              branchId: branch.id,
              name: 'Cash',
              type: 'CASH',
              createdById: user.id,
            },
            {
              branchId: branch.id,
              name: 'Bank Transfer',
              type: 'BANK_TRANSFER',
              createdById: user.id,
            },
          ],
        });

        return { user, branch };
      });

      return jsonResponse(
        {
          userId: result.user.id,
          branchId: result.branch.id,
          role: Role.OWNER,
        },
        { status: 201 },
      );
    }

    const session = await requireOwner();
    if (data.role === Role.OWNER && session.user.role !== Role.OWNER) {
      throw new AppError('Only owners can create another owner', 403);
    }

    const targetRole = data.role ?? Role.STAFF;

    if (targetRole === Role.STAFF && !data.branchId) {
      throw new AppError('branchId is required for staff users', 400);
    }

    const branchId = data.branchId ?? null;
    if (branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch) {
        throw new AppError('Branch not found', 404);
      }
    }

    const passwordHash = await argon2.hash(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        fullName: data.fullName,
        role: targetRole,
        branchId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        branchId: true,
      },
    });

    return jsonResponse({ user }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

