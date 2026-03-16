import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;
  
  if (!url) {
    console.error('❌ FATAL: DATABASE_URL is not defined in process.env');
    return new PrismaClient();
  }

  // Log partial URL for debugging
  const maskedUrl = url.replace(/:([^@]+)@/, ':****@');
  console.log(`📡 Prisma 7 initializing with Driver Adapter (pg) and URL: ${maskedUrl}`);

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
