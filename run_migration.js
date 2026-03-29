require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding calendarId to AvailabilityRule...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "AvailabilityRule" ADD COLUMN IF NOT EXISTS "calendarId" TEXT;`);
    
    console.log('Adding foreign key constraint...');
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AvailabilityRule_calendarId_fkey') THEN
          ALTER TABLE "AvailabilityRule" 
          ADD CONSTRAINT "AvailabilityRule_calendarId_fkey" 
          FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END
      $$;
    `);
    
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
