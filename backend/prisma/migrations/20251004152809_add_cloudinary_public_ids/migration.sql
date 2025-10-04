/*
  Warnings:

  - Added the required column `publicId` to the `ActivityImage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ActivityImage" ADD COLUMN     "publicId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "avatarPublicId" TEXT;
