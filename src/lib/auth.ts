import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getServerSession } from 'next-auth/next';
import argon2 from 'argon2';
import { z } from 'zod';

import prisma from '@/lib/db';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';
import { Role } from '@prisma/client';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: Role;
  branchId: string | null;
};

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<AuthUser>;
  return typeof candidate.id === 'string' && typeof candidate.email === 'string' && candidate.role !== undefined;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) {
          return null;
        }
        const isValid = await argon2.verify(user.passwordHash, password).catch(() => false);
        if (!isValid) {
          return null;
        }
        const result: AuthUser = {
          id: user.id,
          email: user.email,
          name: user.fullName ?? undefined,
          role: user.role,
          branchId: user.branchId ?? null,
        };
        return result;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (isAuthUser(user)) {
        token.id = user.id;
        token.role = user.role;
        token.branchId = user.branchId;
        token.name = user.name ?? token.name;
        token.email = user.email;
      }
      const userId = (token.id ?? token.sub) as string | undefined;
      if (userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            branchId: true,
          },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.fullName ?? undefined;
          token.role = dbUser.role;
          token.branchId = dbUser.branchId ?? null;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.name = (token.name as string | null) ?? session.user.name;
        session.user.role = token.role as Role;
        session.user.branchId = (token.branchId as string | null) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
};

export async function getSession() {
  return getServerSession(authOptions);
}

async function requireRole(role: Role) {
  const session = await getSession();
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  if (session.user.role !== role) {
    throw new ForbiddenError();
  }
  return session;
}

export async function requireAuthenticatedUser() {
  const session = await getSession();
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  return session;
}

export async function requireOwner() {
  return requireRole(Role.OWNER);
}

export async function requireStaff() {
  return requireRole(Role.STAFF);
}

export async function requireBranchAccess(branchId: string) {
  const session = await requireAuthenticatedUser();
  if (session.user.role === Role.OWNER) {
    return session;
  }
  if (!session.user.branchId || session.user.branchId !== branchId) {
    throw new ForbiddenError('Branch access denied');
  }
  return session;
}
