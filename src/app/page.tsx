import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

export default async function IndexPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/sign-in');
  }
  if (session.user.role === Role.OWNER) {
    redirect('/owner');
  }
  redirect('/staff');
}
