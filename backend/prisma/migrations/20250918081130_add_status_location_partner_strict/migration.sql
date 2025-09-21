/*
  Warnings:

  - A unique constraint covering the columns `[partnerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."User" 
ADD CONSTRAINT user_not_self_partner CHECK ("id" IS DISTINCT FROM "partnerId"),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "partnerId" TEXT,
ADD COLUMN     "status" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_partnerId_key" ON "public"."User"("partnerId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
