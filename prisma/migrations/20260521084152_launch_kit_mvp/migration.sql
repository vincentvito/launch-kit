-- CreateTable
CREATE TABLE "launch_project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "briefJson" TEXT NOT NULL,
    "kitJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "launch_project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_launch_profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "founderName" TEXT,
    "founderBio" TEXT,
    "companyName" TEXT,
    "companyBio" TEXT,
    "website" TEXT,
    "email" TEXT,
    "contactPhone" TEXT,
    "socialX" TEXT,
    "socialLinkedIn" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_launch_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "launch_project_userId_idx" ON "launch_project"("userId");

-- CreateIndex
CREATE INDEX "launch_project_createdAt_idx" ON "launch_project"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_launch_profile_userId_key" ON "user_launch_profile"("userId");
