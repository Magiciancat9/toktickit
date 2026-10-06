-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ActionTaken" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "performerId" INTEGER NOT NULL,
    "actionDateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionDescription" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followupNote" TEXT,
    "attachmentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionTaken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionTaken_ticketId_idx" ON "ActionTaken"("ticketId");

-- CreateIndex
CREATE INDEX "ActionTaken_performerId_idx" ON "ActionTaken"("performerId");

-- CreateIndex
CREATE INDEX "ActionTaken_actionDateTime_idx" ON "ActionTaken"("actionDateTime");

-- CreateIndex
CREATE INDEX "ActionTaken_followUpRequired_idx" ON "ActionTaken"("followUpRequired");

-- CreateIndex
CREATE INDEX "Ticket_resolvedAt_idx" ON "Ticket"("resolvedAt");

-- AddForeignKey
ALTER TABLE "ActionTaken" ADD CONSTRAINT "ActionTaken_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionTaken" ADD CONSTRAINT "ActionTaken_performerId_fkey" FOREIGN KEY ("performerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
