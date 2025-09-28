-- AlterTable
ALTER TABLE "public"."Invite" ADD COLUMN     "anniversary" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "activityImageUrl" TEXT,
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "birthday" TIMESTAMP(3);
