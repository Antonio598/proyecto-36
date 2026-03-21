-- CreateTable "Subaccount"
CREATE TABLE IF NOT EXISTS "Subaccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subaccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable "Doctor"
CREATE TABLE IF NOT EXISTS "Doctor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subaccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable "Calendar"
CREATE TABLE IF NOT EXISTS "Calendar" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subaccountId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable "ServiceConfiguration"
CREATE TABLE IF NOT EXISTS "ServiceConfiguration" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "subaccountId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceConfiguration_serviceId_calendarId_key" ON "ServiceConfiguration"("serviceId", "calendarId");

-- AlterTable "Appointment"
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "subaccountId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "doctorId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "calendarId" TEXT;

-- AlterTable "Service"
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "subaccountId" TEXT;

-- AddForeignKeys
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_subaccountId_fkey" FOREIGN KEY ("subaccountId") REFERENCES "Subaccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_subaccountId_fkey" FOREIGN KEY ("subaccountId") REFERENCES "Subaccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Service" ADD CONSTRAINT "Service_subaccountId_fkey" FOREIGN KEY ("subaccountId") REFERENCES "Subaccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ServiceConfiguration" ADD CONSTRAINT "ServiceConfig_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceConfiguration" ADD CONSTRAINT "ServiceConfig_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceConfiguration" ADD CONSTRAINT "ServiceConfig_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceConfiguration" ADD CONSTRAINT "ServiceConfig_subaccountId_fkey" FOREIGN KEY ("subaccountId") REFERENCES "Subaccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Appointment" ADD CONSTRAINT "Appt_subaccountId_fkey" FOREIGN KEY ("subaccountId") REFERENCES "Subaccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appt_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appt_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
