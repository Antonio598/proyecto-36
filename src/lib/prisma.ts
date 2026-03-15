import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;
  
  if (!url) {
    console.error('❌ FATAL: DATABASE_URL is not defined in process.env');
  } else {
    // Log partial URL for debugging (safe, masks password)
    const maskedUrl = url.replace(/:([^@]+)@/, ':****@');
    console.log(`📡 Prisma initializing with URL: ${maskedUrl}`);
  }

  return new PrismaClient({
    // @ts-ignore
    datasources: {
      db: {
        url: url
      }
    }
  });
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = new Proxy({} as ReturnType<typeof prismaClientSingleton>, {
  get(target, prop) {
    if (!globalThis.prismaGlobal) {
      globalThis.prismaGlobal = prismaClientSingleton();
    }
    // @ts-ignore
    return globalThis.prismaGlobal[prop];
  }
});

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
