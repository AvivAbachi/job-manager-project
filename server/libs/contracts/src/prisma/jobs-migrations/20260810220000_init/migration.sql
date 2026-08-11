-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'FAILED');

CREATE TABLE "Job" (
    "id" TEXT NOT NULL, "key" TEXT NOT NULL, "userId" TEXT NOT NULL, "failStage" INTEGER,
    "totalTime" INTEGER NOT NULL, "totalStages" INTEGER NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, "completedAt" TIMESTAMP(3), "jobOutboxId" TEXT,
    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobOutbox" (
    "id" TEXT NOT NULL, "jobId" TEXT NOT NULL,
    CONSTRAINT "JobOutbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Job_userId_status_updatedAt_idx" ON "Job"("userId", "status", "updatedAt");
CREATE INDEX "Job_status_updatedAt_idx" ON "Job"("status", "updatedAt");
CREATE UNIQUE INDEX "Job_userId_key_key" ON "Job"("userId", "key");
CREATE UNIQUE INDEX "JobOutbox_jobId_key" ON "JobOutbox"("jobId");
ALTER TABLE "JobOutbox" ADD CONSTRAINT "JobOutbox_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
