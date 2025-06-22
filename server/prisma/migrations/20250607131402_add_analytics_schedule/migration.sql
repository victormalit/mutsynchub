-- CreateTable
CREATE TABLE "AnalyticsSchedule" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "interval" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsSchedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AnalyticsSchedule" ADD CONSTRAINT "AnalyticsSchedule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
