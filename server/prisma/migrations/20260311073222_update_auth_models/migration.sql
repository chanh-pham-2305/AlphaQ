-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "typeLogin" TEXT NOT NULL DEFAULT 'LOCAL';

-- CreateTable
CREATE TABLE "AccessTokenGoogle" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessTokenGoogle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessTokenGoogle_accessToken_key" ON "AccessTokenGoogle"("accessToken");

-- AddForeignKey
ALTER TABLE "AccessTokenGoogle" ADD CONSTRAINT "AccessTokenGoogle_googleId_fkey" FOREIGN KEY ("googleId") REFERENCES "User"("googleId") ON DELETE RESTRICT ON UPDATE CASCADE;
