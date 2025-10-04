import 'dotenv/config';
import argon2 from 'argon2';
import { PrismaClient, Role, AccountType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingBranch = await prisma.branch.findFirst();
  if (existingBranch) {
    console.info('Seed skipped: database already contains data.');
    return;
  }

  const branch = await prisma.branch.create({
    data: {
      name: 'Main Branch',
    },
  });

  const ownerPassword = await argon2.hash('Owner123!');
  const staffPassword = await argon2.hash('Staff123!');

  const owner = await prisma.user.create({
    data: {
      email: 'owner@example.com',
      passwordHash: ownerPassword,
      fullName: 'Demo Owner',
      role: Role.OWNER,
    },
  });

  await prisma.user.create({
    data: {
      email: 'staff@example.com',
      passwordHash: staffPassword,
      fullName: 'Demo Staff',
      role: Role.STAFF,
      branchId: branch.id,
    },
  });

  const cashAccount = await prisma.account.create({
    data: {
      branchId: branch.id,
      name: 'Cash',
      type: AccountType.CASH,
      createdById: owner.id,
    },
  });

  const bankAccount = await prisma.account.create({
    data: {
      branchId: branch.id,
      name: 'Bank Transfer',
      type: AccountType.BANK_TRANSFER,
      createdById: owner.id,
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        accountId: cashAccount.id,
        branchId: branch.id,
        userId: owner.id,
        type: 'DEPOSIT',
        amount: 5_000_000n,
        note: 'Initial cash float',
      },
      {
        accountId: bankAccount.id,
        branchId: branch.id,
        userId: owner.id,
        type: 'DEPOSIT',
        amount: 20_000_000n,
        note: 'Initial bank deposit',
      },
    ],
  });

  console.info('Database seeded. Owner login: owner@example.com / Owner123!');
  console.info('Staff login: staff@example.com / Staff123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

