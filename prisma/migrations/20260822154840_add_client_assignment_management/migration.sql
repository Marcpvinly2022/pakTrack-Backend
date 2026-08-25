-- CreateEnum
CREATE TYPE "ClientAssignmentReason" AS ENUM ('INITIAL_ASSIGNMENT', 'DESK_AGENT_DEACTIVATED', 'PERFORMANCE_ISSUE', 'WORKLOAD_REDISTRIBUTION', 'ADMIN_REASSIGNMENT');

-- CreateTable
CREATE TABLE "ClientAssignment" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "previousDeskAgentId" UUID,
    "newDeskAgentId" UUID NOT NULL,
    "reassignedById" UUID NOT NULL,
    "reason" "ClientAssignmentReason" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientAssignment_tenantId_idx" ON "ClientAssignment"("tenantId");

-- CreateIndex
CREATE INDEX "ClientAssignment_clientId_idx" ON "ClientAssignment"("clientId");

-- CreateIndex
CREATE INDEX "ClientAssignment_previousDeskAgentId_idx" ON "ClientAssignment"("previousDeskAgentId");

-- CreateIndex
CREATE INDEX "ClientAssignment_newDeskAgentId_idx" ON "ClientAssignment"("newDeskAgentId");

-- CreateIndex
CREATE INDEX "ClientAssignment_reassignedById_idx" ON "ClientAssignment"("reassignedById");

-- CreateIndex
CREATE INDEX "ClientAssignment_createdAt_idx" ON "ClientAssignment"("createdAt");

-- AddForeignKey
ALTER TABLE "ClientAssignment" ADD CONSTRAINT "ClientAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAssignment" ADD CONSTRAINT "ClientAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAssignment" ADD CONSTRAINT "ClientAssignment_previousDeskAgentId_fkey" FOREIGN KEY ("previousDeskAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAssignment" ADD CONSTRAINT "ClientAssignment_newDeskAgentId_fkey" FOREIGN KEY ("newDeskAgentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAssignment" ADD CONSTRAINT "ClientAssignment_reassignedById_fkey" FOREIGN KEY ("reassignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
