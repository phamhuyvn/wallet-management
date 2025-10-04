import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { SignInForm } from '@/components/forms/sign-in-form';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect(session.user.role === Role.OWNER ? '/owner' : '/staff');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
          <p className="text-sm text-slate-500">Manage wallets and cash balances across your branches.</p>
        </div>
        <SignInForm />
        <p className="mt-6 text-center text-sm text-slate-500">
          First time here?{' '}
          <Link href="/sign-up" className="font-medium text-slate-900 hover:underline">
            Create the first account
          </Link>
        </p>
      </div>
    </div>
  );
}
