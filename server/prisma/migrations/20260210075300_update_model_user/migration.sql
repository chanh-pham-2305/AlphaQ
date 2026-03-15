/*
  Warnings:

  - A unique constraint covering the columns `[phoneNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "username" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_birthDate_idx" ON "User"("birthDate");
