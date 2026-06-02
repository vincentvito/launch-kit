-- CreateTable
CREATE TABLE "rate_limit" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL
);
