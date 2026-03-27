-- ============================================================
-- SaaS Migration Script
-- Run this in your Supabase SQL Editor (or psql)
-- Date: 2026-03-26
-- ============================================================

-- 1. Add SUPERADMIN to Role enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUPERADMIN' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')) THEN
    ALTER TYPE "Role" ADD VALUE 'SUPERADMIN';
  END IF;
END $$;

-- 2. Create Account table
CREATE TABLE IF NOT EXISTS "Account" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"      TEXT NOT NULL,
  "apiKey"    TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Account_apiKey_key" UNIQUE ("apiKey")
);

-- 3. Add accountId to Subaccount
ALTER TABLE "Subaccount" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "Subaccount" 
  DROP CONSTRAINT IF EXISTS "Subaccount_accountId_fkey",
  ADD CONSTRAINT "Subaccount_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Add accountId to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "User"
  DROP CONSTRAINT IF EXISTS "User_accountId_fkey",
  ADD CONSTRAINT "User_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Modify Patient table
--    First remove the old @unique constraint on phone if it exists
ALTER TABLE "Patient" DROP CONSTRAINT IF EXISTS "Patient_phone_key";

-- Add accountId column 
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "Patient"
  DROP CONSTRAINT IF EXISTS "Patient_accountId_fkey",
  ADD CONSTRAINT "Patient_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new composite unique constraint (phone + accountId)
ALTER TABLE "Patient" DROP CONSTRAINT IF EXISTS "Patient_phone_accountId_key";
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_phone_accountId_key" UNIQUE ("phone", "accountId");

-- ============================================================
-- OPTIONAL: Create a default Account for existing data
-- Un-comment the lines below if you have existing data that
-- needs to be migrated into an account automatically.
-- ============================================================
-- INSERT INTO "Account" ("id", "name", "apiKey")
-- VALUES ('default-account-id', 'Mi Clínica (default)', gen_random_uuid()::text)
-- ON CONFLICT DO NOTHING;
--
-- UPDATE "Subaccount" SET "accountId" = 'default-account-id' WHERE "accountId" IS NULL;
-- UPDATE "Patient"    SET "accountId" = 'default-account-id' WHERE "accountId" IS NULL;
-- UPDATE "User"       SET "accountId" = 'default-account-id' WHERE "accountId" IS NULL AND role != 'SUPERADMIN';


-- ============================================================
-- Create SUPERADMIN user (replace email/name/hash below)
-- To generate a bcrypt hash locally: run `node -e "const b=require('bcryptjs');b.hash('YOUR_PASSWORD',10).then(h=>console.log(h))"`
-- ============================================================
-- INSERT INTO "User" ("id","name","email","passwordHash","role","createdAt","updatedAt")
-- VALUES (
--   gen_random_uuid()::text,
--   'Super Admin',
--   'admin@tusaasnombre.com',
--   'REPLACE_WITH_BCRYPT_HASH',
--   'SUPERADMIN',
--   NOW(), NOW()
-- )
-- ON CONFLICT ("email") DO UPDATE SET "role" = 'SUPERADMIN';
