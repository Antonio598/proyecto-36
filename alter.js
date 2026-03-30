const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const res = await prisma.$executeRawUnsafe(`ALTER TABLE "AvailabilityRule" ADD COLUMN "calendarId" TEXT;`);
    console.log("Added column calendarId", res);
  } catch (e) {
    if (e.message.includes('already exists')) {
       console.log("Column calendarId already exists");
    } else {
       console.error("FAIL column", e.message);
    }
  }

  try {
    const res2 = await prisma.$executeRawUnsafe(`ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    console.log("Added constraint", res2);
  } catch (e) {
    if (e.message.includes('already exists')) {
       console.log("Constraint already exists");
    } else {
       console.error("FAIL constraint", e.message);
    }
  }
}
main().finally(() => prisma.$disconnect());
