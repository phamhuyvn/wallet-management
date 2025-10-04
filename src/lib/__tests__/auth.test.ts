import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth/next';
import { Role } from '@prisma/client';

import { requireOwner, requireStaff, requireBranchAccess } from '@/lib/auth';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';

type MockSession = {
  user: {
    id: string;
    email: string;
    role: Role;
    branchId: string | null;
  };
};

const mockedGetServerSession = getServerSession as unknown as Mock;

describe('authorization helpers', () => {
  const ownerSession: MockSession = {
    user: {
      id: 'owner-1',
      email: 'owner@example.com',
      role: Role.OWNER,
      branchId: null,
    },
  };

  const staffSession: MockSession = {
    user: {
      id: 'staff-1',
      email: 'staff@example.com',
      role: Role.STAFF,
      branchId: 'branch-1',
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('allows owner access', async () => {
    mockedGetServerSession.mockResolvedValue(ownerSession);
    const result = await requireOwner();
    expect(result).toEqual(ownerSession);
  });

  it('blocks staff from owner only route', async () => {
    mockedGetServerSession.mockResolvedValue(staffSession);
    await expect(requireOwner()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('allows staff guard', async () => {
    mockedGetServerSession.mockResolvedValue(staffSession);
    const result = await requireStaff();
    expect(result).toEqual(staffSession);
  });

  it('rejects unauthenticated users', async () => {
    mockedGetServerSession.mockResolvedValue(null);
    await expect(requireStaff()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('allows owner branch access regardless of branch', async () => {
    mockedGetServerSession.mockResolvedValue(ownerSession);
    const result = await requireBranchAccess('branch-99');
    expect(result).toEqual(ownerSession);
  });

  it('allows staff when branch matches', async () => {
    mockedGetServerSession.mockResolvedValue(staffSession);
    const result = await requireBranchAccess('branch-1');
    expect(result).toEqual(staffSession);
  });

  it('rejects staff for other branches', async () => {
    mockedGetServerSession.mockResolvedValue(staffSession);
    await expect(requireBranchAccess('branch-2')).rejects.toBeInstanceOf(ForbiddenError);
  });
});
