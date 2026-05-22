-- CreateTable
CREATE TABLE "integration_outbox" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "traceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "integration_outbox_status_attempts_idx" ON "integration_outbox"("status", "attempts");

-- CreateIndex
CREATE INDEX "integration_outbox_service_status_idx" ON "integration_outbox"("service", "status");

-- CreateIndex
CREATE INDEX "integration_outbox_createdAt_idx" ON "integration_outbox"("createdAt");
