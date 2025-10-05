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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-xl backdrop-blur">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Đăng nhập</h1>
          <p className="text-sm text-slate-500">Quản lý ví tiền và ngân quỹ cho mọi chi nhánh trong một nơi.</p>
        </div>
        <SignInForm />
        <p className="mt-6 text-center text-sm text-slate-500">
          Lần đầu sử dụng?{' '}
          <Link href="/sign-up" className="font-semibold text-emerald-600 hover:underline">
            Tạo tài khoản đầu tiên
          </Link>
        </p>
      </div>
    </div>
  );
}
