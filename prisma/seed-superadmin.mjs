/**
 * seed-superadmin.mjs
 * Run with: node prisma/seed-superadmin.mjs
 * 
 * Creates the SUPERADMIN user in the database.
 * Requires DATABASE_URL to be set in your environment.
 */

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMAIL = 'admin@medsaas.com';      // Change this
const PASSWORD = 'SuperAdmin2026!';      // Change this
const NAME = 'Super Admin';

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { role: 'SUPERADMIN', passwordHash: hash },
    create: {
      email: EMAIL,
      name: NAME,
      passwordHash: hash,
      role: 'SUPERADMIN',
    },
  });

  console.log('✅ SUPERADMIN created/updated:');
  console.log('   Email:', user.email);
  console.log('   Role:', user.role);
  console.log('\n🔐 Login at /login and you will be redirected to /superadmin');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
