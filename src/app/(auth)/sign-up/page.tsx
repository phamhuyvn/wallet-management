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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-xl backdrop-blur">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            {isFirstUser ? 'Tạo tài khoản chủ sở hữu' : 'Mời thành viên mới'}
          </h1>
          <p className="text-sm text-slate-500">
            {isFirstUser
              ? 'Tài khoản này sẽ giữ vai trò chủ sở hữu và được tạo sẵn chi nhánh mặc định.'
              : 'Chỉ chủ sở hữu mới có thể thêm chủ sở hữu hoặc nhân viên.'}
          </p>
        </div>
        <SignUpForm branches={branches} isFirstUser={isFirstUser} />
        {!isFirstUser ? (
          <p className="mt-6 text-center text-sm text-slate-500">
            Hoàn tất lời mời?{' '}
            <Link href="/owner" className="font-semibold text-emerald-600 hover:underline">
              Quay lại bảng điều khiển
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
