-- Research Bridge (P82) — ResearchJob şema değişikliği (referans).
-- Prod uygulama mekanizması: `npm run db:push` (deploy hook). Bu dosya
-- inceleme/rollback referansıdır; kanonik kaynak prisma/schema.prisma.
-- Doğrulandı (dev): `prisma db push` → "Your database is now in sync" (research_jobs + ResearchJobStatus).

CREATE TYPE "ResearchJobStatus" AS ENUM (
  'QUEUED','CLAIMED','RESEARCHING','IMPORTING','DRAFTING','DONE','FAILED','CANCELLED'
);

CREATE TABLE "research_jobs" (
  "id" TEXT NOT NULL,
  "status" "ResearchJobStatus" NOT NULL DEFAULT 'QUEUED',
  "topic" TEXT NOT NULL,
  "lang" TEXT NOT NULL DEFAULT 'tr',
  "mode" TEXT NOT NULL DEFAULT 'fast',
  "contentType" TEXT NOT NULL DEFAULT 'blog',
  "primaryDomain" "Domain" NOT NULL DEFAULT 'M_A',
  "stageDetail" TEXT,
  "notebookId" TEXT,
  "sourceCount" INTEGER,
  "reportTitle" TEXT,
  "postId" TEXT,
  "error" TEXT,
  "requestedById" TEXT NOT NULL,
  "claimedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "research_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "research_jobs_status_createdAt_idx" ON "research_jobs"("status","createdAt");
CREATE INDEX "research_jobs_requestedById_createdAt_idx" ON "research_jobs"("requestedById","createdAt" DESC);
