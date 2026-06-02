-- AlterTable
ALTER TABLE "rate_limit" DROP CONSTRAINT "rate_limit_pkey";
ALTER TABLE "rate_limit" ADD COLUMN "id" TEXT;
UPDATE "rate_limit" SET "id" = "key";
ALTER TABLE "rate_limit" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "rate_limit" ADD CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key");
