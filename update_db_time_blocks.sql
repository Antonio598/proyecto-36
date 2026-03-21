-- Script SQL para soportar Bloqueos de Horario

-- 1. Hacer que Paciente sea Opcional en Citas
ALTER TABLE "Appointment" ALTER COLUMN "patientId" DROP NOT NULL;

-- 2. Hacer que Servicio sea Opcional en Citas
ALTER TABLE "Appointment" ALTER COLUMN "serviceId" DROP NOT NULL;

-- 3. Añadir columna isBlocker a las citas
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "isBlocker" BOOLEAN NOT NULL DEFAULT false;
