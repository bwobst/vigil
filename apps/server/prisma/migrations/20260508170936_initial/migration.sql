-- CreateEnum
CREATE TYPE "ResponseType" AS ENUM ('HTML', 'JSON');

-- CreateEnum
CREATE TYPE "ConditionOperator" AS ENUM ('EQUALS', 'CHANGED', 'LESS_THAN', 'GREATER_THAN');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('PASS', 'FAIL', 'ERROR');

-- CreateTable
CREATE TABLE "watches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "responseType" "ResponseType" NOT NULL,
    "extractorExpression" TEXT NOT NULL,
    "conditionOperator" "ConditionOperator" NOT NULL,
    "expectedValue" TEXT,
    "scheduleExpression" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watch_runs" (
    "id" TEXT NOT NULL,
    "watchId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "status" "RunStatus" NOT NULL,
    "extractedValue" TEXT,
    "conditionMet" BOOLEAN,
    "error" TEXT,

    CONSTRAINT "watch_runs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "watch_runs" ADD CONSTRAINT "watch_runs_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
