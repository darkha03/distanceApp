-- CreateTable
CREATE TABLE "public"."ActivityImage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityImage_userId_createdAt_idx" ON "public"."ActivityImage"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."ActivityImage" ADD CONSTRAINT "ActivityImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
