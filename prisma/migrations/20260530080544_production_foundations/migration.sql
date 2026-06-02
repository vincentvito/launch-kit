-- AlterTable
ALTER TABLE "waitlist_entry" ADD COLUMN IF NOT EXISTS "ipHash" TEXT;
ALTER TABLE "waitlist_entry" ADD COLUMN IF NOT EXISTS "referrer" TEXT;
ALTER TABLE "waitlist_entry" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "waitlist_entry" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

-- CreateTable
CREATE TABLE "user_plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "provider" TEXT,
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "usage_event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "subjectKey" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 1,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usage_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rate_limit_bucket" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "launch_job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "subjectKey" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "inputJson" TEXT NOT NULL,
    "resultJson" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "launch_job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_plan_userId_key" ON "user_plan"("userId");

-- CreateIndex
CREATE INDEX "user_plan_plan_idx" ON "user_plan"("plan");

-- CreateIndex
CREATE INDEX "user_plan_status_idx" ON "user_plan"("status");

-- CreateIndex
CREATE INDEX "user_plan_providerCustomerId_idx" ON "user_plan"("providerCustomerId");

-- CreateIndex
CREATE INDEX "user_plan_providerSubscriptionId_idx" ON "user_plan"("providerSubscriptionId");

-- CreateIndex
CREATE INDEX "usage_event_userId_idx" ON "usage_event"("userId");

-- CreateIndex
CREATE INDEX "usage_event_subjectKey_idx" ON "usage_event"("subjectKey");

-- CreateIndex
CREATE INDEX "usage_event_action_idx" ON "usage_event"("action");

-- CreateIndex
CREATE INDEX "usage_event_createdAt_idx" ON "usage_event"("createdAt");

-- CreateIndex
CREATE INDEX "rate_limit_bucket_resetAt_idx" ON "rate_limit_bucket"("resetAt");

-- CreateIndex
CREATE INDEX "launch_job_userId_idx" ON "launch_job"("userId");

-- CreateIndex
CREATE INDEX "launch_job_subjectKey_idx" ON "launch_job"("subjectKey");

-- CreateIndex
CREATE INDEX "launch_job_action_idx" ON "launch_job"("action");

-- CreateIndex
CREATE INDEX "launch_job_status_idx" ON "launch_job"("status");

-- CreateIndex
CREATE INDEX "launch_job_createdAt_idx" ON "launch_job"("createdAt");
