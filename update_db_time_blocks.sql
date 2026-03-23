-- Script SQL para soportar Bloqueos de Horario

-- 1. Hacer que Paciente sea Opcional en Citas
ALTER TABLE "Appointment" ALTER COLUMN "patientId" DROP NOT NULL;

-- 2. Hacer que Servicio sea Opcional en Citas
ALTER TABLE "Appointment" ALTER COLUMN "serviceId" DROP NOT NULL;

-- 3. Añadir columna isBlocker a las citas
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "isBlocker" BOOLEAN NOT NULL DEFAULT false;

-- 4. Añadir subaccountId a AvailabilityRule para manejar los horarios semanales cerrados por Sede
ALTER TABLE "AvailabilityRule" ADD COLUMN IF NOT EXISTS "subaccountId" text;

-- 5. Añadir ForeignKey para relacionar AvailabilityRule con la Sede (Subaccount)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AvailabilityRule_subaccountId_fkey') THEN
        ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_subaccountId_fkey" FOREIGN KEY ("subaccountId") REFERENCES "Subaccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
