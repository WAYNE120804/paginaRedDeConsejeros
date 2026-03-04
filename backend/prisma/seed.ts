import { PrismaClient, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const seedUsers = [
  { email: 'admin.ti@umanizales.edu.co', password: 'Admin123!', role: AdminRole.SUPERADMIN },
  { email: 'secretario@umanizales.edu.co', password: 'Secretario123!', role: AdminRole.SECRETARIO },
  { email: 'comunicaciones@umanizales.edu.co', password: 'Comms123!', role: AdminRole.COMUNICACIONES },
];

async function main() {
  for (const user of seedUsers) {
    const hash = await bcrypt.hash(user.password, 10);
    await prisma.adminUser.upsert({
      where: { email: user.email },
      update: { passwordHash: hash, role: user.role, isActive: true },
      create: { email: user.email, passwordHash: hash, role: user.role, isActive: true },
    });
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
