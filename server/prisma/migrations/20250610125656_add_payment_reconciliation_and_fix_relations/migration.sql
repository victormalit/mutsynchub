/*
  Warnings:

  - A unique constraint covering the columns `[checkoutRequestId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orgId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Payment_checkoutRequestId_idx";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "orgId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "MpesaCallback" (
    "id" TEXT NOT NULL,
    "checkoutRequestId" TEXT NOT NULL,
    "merchantRequestId" TEXT NOT NULL,
    "resultCode" TEXT NOT NULL,
    "resultDesc" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "mpesaReceiptNumber" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MpesaCallback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReconciliation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalTransactions" INTEGER NOT NULL,
    "successfulTransactions" INTEGER NOT NULL,
    "failedTransactions" INTEGER NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "PaymentReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MpesaCallback_checkoutRequestId_idx" ON "MpesaCallback"("checkoutRequestId");

-- CreateIndex
CREATE INDEX "MpesaCallback_transactionDate_idx" ON "MpesaCallback"("transactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReconciliation_date_key" ON "PaymentReconciliation"("date");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_date_idx" ON "PaymentReconciliation"("date");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_orgId_idx" ON "PaymentReconciliation"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_checkoutRequestId_key" ON "Payment"("checkoutRequestId");

-- CreateIndex
CREATE INDEX "Payment_orgId_idx" ON "Payment"("orgId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpesaCallback" ADD CONSTRAINT "MpesaCallback_checkoutRequestId_fkey" FOREIGN KEY ("checkoutRequestId") REFERENCES "Payment"("checkoutRequestId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReconciliation" ADD CONSTRAINT "PaymentReconciliation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
