import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash('Galenus.AI.1987', 10);
  
  try {
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@medsaas.com' },
      data: {
        email: 'Galenus17@gmail.com',
        passwordHash: hash
      }
    });
    console.log('User updated:', updatedUser.email);
  } catch (error) {
    if (error.code === 'P2025') {
       console.log('Old user not found. Finding if new user already exists...');
       const newU = await prisma.user.findUnique({ where: { email: 'Galenus17@gmail.com' } });
       if (newU) {
          console.log('User already updated.');
          await prisma.user.update({
            where: { email: 'Galenus17@gmail.com' },
            data: { passwordHash: hash }
          });
       } else {
          console.log('Neither old nor new user exists. Please run the seed-superadmin.mjs properly.');
       }
    } else {
       console.error(error);
    }
  }
}

main().finally(() => prisma.$disconnect());
