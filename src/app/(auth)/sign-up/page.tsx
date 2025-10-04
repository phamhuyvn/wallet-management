import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { SignUpForm } from '@/components/forms/sign-up-form';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { Role } from '@prisma/client';

export default async function SignUpPage() {
  const session = await getServerSession(authOptions);
  const totalUsers = await prisma.user.count();
  const isFirstUser = totalUsers === 0;

  if (!isFirstUser && (!session?.user || session.user.role !== Role.OWNER)) {
    redirect('/sign-in');
  }

  const branches = await prisma.branch.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            {isFirstUser ? 'Create owner account' : 'Invite a team member'}
          </h1>
          <p className="text-sm text-slate-500">
            {isFirstUser
              ? 'This account will become the owner and receive a default branch and wallets.'
              : 'Owners can create additional owners or staff members.'}
          </p>
        </div>
        <SignUpForm branches={branches} isFirstUser={isFirstUser} />
        {!isFirstUser ? (
          <p className="mt-6 text-center text-sm text-slate-500">
            Done inviting?{' '}
            <Link href="/owner" className="font-medium text-slate-900 hover:underline">
              Back to dashboard
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
