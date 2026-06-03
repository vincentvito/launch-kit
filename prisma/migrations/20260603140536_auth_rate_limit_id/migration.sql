/*
  Warnings:

  - The primary key for the `rate_limit` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `id` to the `rate_limit` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_rate_limit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL
);
INSERT INTO "new_rate_limit" ("id", "count", "key", "lastRequest")
SELECT lower(hex(randomblob(16))), "count", "key", "lastRequest" FROM "rate_limit";
DROP TABLE "rate_limit";
ALTER TABLE "new_rate_limit" RENAME TO "rate_limit";
CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
