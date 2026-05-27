-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('SELL_SIDE', 'BUY_SIDE', 'DD_ONLY', 'PMI', 'ADVISORY', 'OTHER');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('DISCOVERY', 'DD', 'NEGOTIATION', 'SPA_SIGNING', 'CLOSING', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'TRY', 'EUR');

-- CreateEnum
CREATE TYPE "RetainerStatus" AS ENUM ('ACTIVE', 'PAUSED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'INVOICED', 'PAID', 'DELAYED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WaveStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'LIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProspectStatus" AS ENUM ('SENT', 'OPENED', 'REPLIED', 'MEETING', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "DSARType" AS ENUM ('ACCESS', 'RECTIFICATION', 'ERASURE', 'RESTRICTION', 'PORTABILITY', 'OBJECTION', 'AUTOMATED_DECISION');

-- CreateEnum
CREATE TYPE "DSARStatus" AS ENUM ('RECEIVED', 'UNDER_REVIEW', 'RESPONDED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BreachStatus" AS ENUM ('DETECTED', 'INVESTIGATING', 'REPORTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ROPAStatus" AS ENUM ('ACTIVE', 'DEPRECATED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "LetterStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SuccessionStatus" AS ENUM ('ASSESSMENT', 'PLANNING', 'EXECUTION', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SuccessionMilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED');

-- CreateEnum
CREATE TYPE "ESGPillar" AS ENUM ('ENVIRONMENTAL', 'SOCIAL', 'GOVERNANCE');

-- CreateEnum
CREATE TYPE "ESGStatus" AS ENUM ('GAP_ANALYSIS', 'DATA_COLLECTION', 'REVIEW', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "Regulator" AS ENUM ('SPK', 'MASAK', 'KVKK', 'TCMB', 'BDDK');

-- CreateEnum
CREATE TYPE "ComplianceItemStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ResidencyLocation" AS ENUM ('TR_LOCAL', 'EU_GDPR', 'US_SCC', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'BLOG_AUTHOR';
ALTER TYPE "UserRole" ADD VALUE 'EDITOR';
ALTER TYPE "UserRole" ADD VALUE 'VIEWER';

-- DropIndex
DROP INDEX "bookings_status_idx";

-- DropIndex
DROP INDEX "bookings_userId_idx";

-- DropIndex
DROP INDEX "contact_submissions_isRead_idx";

-- DropIndex
DROP INDEX "newsletter_subscribers_email_idx";

-- DropIndex
DROP INDEX "services_slug_idx";

-- DropIndex
DROP INDEX "users_email_idx";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "calcomUid" TEXT,
ADD COLUMN     "feedbackEmailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminder1hSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminder24hSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "contact_submissions" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "searchVectorEn" tsvector,
ADD COLUMN     "searchVectorTr" tsvector;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "backupCodes" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totpSecret" TEXT;

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "label" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "site_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_feedbacks" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token" TEXT NOT NULL,
    "tokenUsed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "booking_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "signature" TEXT,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "secret" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastSuccess" TIMESTAMP(3),
    "lastFailure" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "responseStatus" INTEGER,
    "responseBodySnip" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "hashedKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scopes" TEXT[],
    "userId" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "hash" TEXT NOT NULL,
    "variants" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archived_audit_logs" (
    "id" TEXT NOT NULL,
    "coldKey" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "rowsArchived" INTEGER NOT NULL,
    "bytesCompressed" INTEGER NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archived_audit_logs_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "consentType" TEXT NOT NULL,
    "givenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "formVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "withdrawnAt" TIMESTAMP(3),

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DealType" NOT NULL,
    "stage" "DealStage" NOT NULL DEFAULT 'DISCOVERY',
    "clientId" TEXT,
    "transactionValueUsd" DECIMAL(65,30),
    "successFeePct" DECIMAL(65,30) NOT NULL DEFAULT 0.02,
    "successFeeUsd" DECIMAL(65,30),
    "expectedCloseDate" TIMESTAMP(3),
    "actualCloseDate" TIMESTAMP(3),
    "closedLostReason" TEXT,
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retainers" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "monthlyAmount" DECIMAL(65,30) NOT NULL,
    "kdvRate" DECIMAL(65,30) NOT NULL DEFAULT 0.20,
    "stopajRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "RetainerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retainers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expectedDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "amountPct" DECIMAL(65,30) NOT NULL,
    "amountUsd" DECIMAL(65,30),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "retainerId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "subtotal" DECIMAL(65,30) NOT NULL,
    "kdv" DECIMAL(65,30) NOT NULL,
    "stopaj" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "currency" "Currency" NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_waves" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "WaveStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "targetRevenueUsd" DECIMAL(65,30),
    "realizedRevenueUsd" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_waves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_prospects" (
    "id" TEXT NOT NULL,
    "waveId" TEXT NOT NULL,
    "adayId" TEXT,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactRole" TEXT,
    "status" "ProspectStatus" NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "estimatedValueUsd" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_prospects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dsar_requests" (
    "id" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterIdentityVerified" BOOLEAN NOT NULL DEFAULT false,
    "requestType" "DSARType" NOT NULL,
    "description" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slaDeadline" TIMESTAMP(3) NOT NULL,
    "extendedOnce" BOOLEAN NOT NULL DEFAULT false,
    "status" "DSARStatus" NOT NULL DEFAULT 'RECEIVED',
    "assignedTo" TEXT,
    "respondedAt" TIMESTAMP(3),
    "responseText" TEXT,
    "closureReason" TEXT,

    CONSTRAINT "dsar_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dsar_audit_entries" (
    "id" TEXT NOT NULL,
    "dsarId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dsar_audit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breach_incidents" (
    "id" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "detectionSource" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affectedDataCategories" TEXT[],
    "affectedSubjectsCount" INTEGER NOT NULL,
    "notificationDeadline" TIMESTAMP(3) NOT NULL,
    "reportedToKurul" BOOLEAN NOT NULL DEFAULT false,
    "reportedAt" TIMESTAMP(3),
    "kurulFormDraft" TEXT,
    "affectedSubjectsNotified" BOOLEAN NOT NULL DEFAULT false,
    "status" "BreachStatus" NOT NULL DEFAULT 'DETECTED',
    "postMortemUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "breach_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ropa_processes" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "dataCategories" TEXT[],
    "retentionPeriod" TEXT NOT NULL,
    "retentionPeriodDays" INTEGER NOT NULL,
    "retentionLegalSource" TEXT NOT NULL,
    "transferLocation" TEXT NOT NULL,
    "transferMechanism" TEXT,
    "dpoApproved" BOOLEAN NOT NULL DEFAULT false,
    "lastReviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextReviewDue" TIMESTAMP(3) NOT NULL,
    "status" "ROPAStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ropa_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_policies" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "lastEnforced" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "independence_checks" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auditFirmConflicts" TEXT[],
    "pureAdvisoryConfirmed" BOOLEAN NOT NULL,
    "signatoryUserId" TEXT NOT NULL,
    "declarationDocUrl" TEXT,
    "validUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "independence_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_change_audit" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetRole" "UserRole" NOT NULL,
    "targetPermissionKey" TEXT NOT NULL,
    "previousValue" BOOLEAN NOT NULL,
    "newValue" BOOLEAN NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_change_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "view_as_sessions" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "viewingAsRole" "UserRole" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "view_as_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT,
    "sector" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founder_letters" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleTr" TEXT NOT NULL,
    "titleEn" TEXT,
    "contentMdTr" TEXT NOT NULL,
    "contentMdEn" TEXT,
    "authorId" TEXT NOT NULL,
    "status" "LetterStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "subscriberCount" INTEGER NOT NULL DEFAULT 0,
    "openRate" DECIMAL(65,30),
    "clickRate" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "founder_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "succession_roadmaps" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "generationFrom" INTEGER NOT NULL,
    "generationTo" INTEGER NOT NULL,
    "estimatedYear" INTEGER,
    "status" "SuccessionStatus" NOT NULL DEFAULT 'ASSESSMENT',
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "succession_roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "succession_milestones" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expectedDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "status" "SuccessionMilestoneStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "succession_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "succession_kpis" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "baselineValue" TEXT NOT NULL,
    "targetValue" TEXT NOT NULL,
    "currentValue" TEXT,
    "measuredAt" TIMESTAMP(3),

    CONSTRAINT "succession_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esg_datapoints" (
    "id" TEXT NOT NULL,
    "esrsCode" TEXT NOT NULL,
    "pillar" "ESGPillar" NOT NULL,
    "category" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "unit" TEXT,
    "isDoubleMaterial" BOOLEAN NOT NULL,
    "isMandatory" BOOLEAN NOT NULL,

    CONSTRAINT "esg_datapoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esg_assessments" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "reportingYear" INTEGER NOT NULL,
    "status" "ESGStatus" NOT NULL DEFAULT 'GAP_ANALYSIS',
    "doubleMaterialityMatrix" JSONB NOT NULL,
    "datapointValues" JSONB NOT NULL DEFAULT '{}',
    "completionPct" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "esg_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fintech_compliance_items" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "regulator" "Regulator" NOT NULL,
    "category" TEXT NOT NULL,
    "status" "ComplianceItemStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "riskScore" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "fintech_compliance_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_residency_tags" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "location" "ResidencyLocation" NOT NULL,
    "transferMechanism" TEXT,
    "documentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_residency_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens"("family");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_tokenHash_key" ON "email_verifications"("tokenHash");

-- CreateIndex
CREATE INDEX "email_verifications_userId_idx" ON "email_verifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_jti_key" ON "sessions"("jti");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "audit_logs_adminId_createdAt_idx" ON "audit_logs"("adminId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "site_configs_key_key" ON "site_configs"("key");

-- CreateIndex
CREATE UNIQUE INDEX "booking_feedbacks_bookingId_key" ON "booking_feedbacks"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_feedbacks_token_key" ON "booking_feedbacks"("token");

-- CreateIndex
CREATE INDEX "booking_feedbacks_submittedAt_idx" ON "booking_feedbacks"("submittedAt");

-- CreateIndex
CREATE INDEX "webhook_events_source_receivedAt_idx" ON "webhook_events"("source", "receivedAt");

-- CreateIndex
CREATE INDEX "webhook_events_processedAt_idx" ON "webhook_events"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_source_externalId_key" ON "webhook_events"("source", "externalId");

-- CreateIndex
CREATE INDEX "webhook_subscriptions_userId_idx" ON "webhook_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "webhook_subscriptions_active_idx" ON "webhook_subscriptions"("active");

-- CreateIndex
CREATE INDEX "webhook_deliveries_subscriptionId_createdAt_idx" ON "webhook_deliveries"("subscriptionId", "createdAt");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_createdAt_idx" ON "webhook_deliveries"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_hashedKey_key" ON "api_keys"("hashedKey");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE INDEX "api_keys_revokedAt_idx" ON "api_keys"("revokedAt");

-- CreateIndex
CREATE INDEX "api_keys_expiresAt_idx" ON "api_keys"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "images_storageKey_key" ON "images"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "images_hash_key" ON "images"("hash");

-- CreateIndex
CREATE INDEX "images_ownerId_idx" ON "images"("ownerId");

-- CreateIndex
CREATE INDEX "images_status_idx" ON "images"("status");

-- CreateIndex
CREATE INDEX "images_createdAt_idx" ON "images"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "archived_audit_logs_coldKey_key" ON "archived_audit_logs"("coldKey");

-- CreateIndex
CREATE INDEX "archived_audit_logs_windowStart_idx" ON "archived_audit_logs"("windowStart");

-- CreateIndex
CREATE INDEX "archived_audit_logs_windowEnd_idx" ON "archived_audit_logs"("windowEnd");

-- CreateIndex
CREATE INDEX "archived_audit_logs_archivedAt_idx" ON "archived_audit_logs"("archivedAt");

-- CreateIndex
CREATE INDEX "integration_outbox_status_attempts_idx" ON "integration_outbox"("status", "attempts");

-- CreateIndex
CREATE INDEX "integration_outbox_service_status_idx" ON "integration_outbox"("service", "status");

-- CreateIndex
CREATE INDEX "integration_outbox_createdAt_idx" ON "integration_outbox"("createdAt");

-- CreateIndex
CREATE INDEX "consent_records_leadId_idx" ON "consent_records"("leadId");

-- CreateIndex
CREATE INDEX "consent_records_consentType_givenAt_idx" ON "consent_records"("consentType", "givenAt");

-- CreateIndex
CREATE INDEX "deals_stage_idx" ON "deals"("stage");

-- CreateIndex
CREATE INDEX "deals_ownerId_idx" ON "deals"("ownerId");

-- CreateIndex
CREATE INDEX "deals_expectedCloseDate_idx" ON "deals"("expectedCloseDate");

-- CreateIndex
CREATE UNIQUE INDEX "retainers_dealId_key" ON "retainers"("dealId");

-- CreateIndex
CREATE INDEX "retainers_status_idx" ON "retainers"("status");

-- CreateIndex
CREATE INDEX "milestones_dealId_expectedDate_idx" ON "milestones"("dealId", "expectedDate");

-- CreateIndex
CREATE INDEX "milestones_status_idx" ON "milestones"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_status_dueDate_idx" ON "invoices"("status", "dueDate");

-- CreateIndex
CREATE INDEX "invoices_retainerId_idx" ON "invoices"("retainerId");

-- CreateIndex
CREATE INDEX "outreach_waves_status_idx" ON "outreach_waves"("status");

-- CreateIndex
CREATE INDEX "outreach_prospects_waveId_status_idx" ON "outreach_prospects"("waveId", "status");

-- CreateIndex
CREATE INDEX "outreach_prospects_status_idx" ON "outreach_prospects"("status");

-- CreateIndex
CREATE INDEX "dsar_requests_status_slaDeadline_idx" ON "dsar_requests"("status", "slaDeadline");

-- CreateIndex
CREATE INDEX "dsar_requests_requesterEmail_idx" ON "dsar_requests"("requesterEmail");

-- CreateIndex
CREATE INDEX "dsar_audit_entries_dsarId_idx" ON "dsar_audit_entries"("dsarId");

-- CreateIndex
CREATE INDEX "dsar_audit_entries_actorId_createdAt_idx" ON "dsar_audit_entries"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "breach_incidents_status_notificationDeadline_idx" ON "breach_incidents"("status", "notificationDeadline");

-- CreateIndex
CREATE UNIQUE INDEX "ropa_processes_processId_key" ON "ropa_processes"("processId");

-- CreateIndex
CREATE INDEX "ropa_processes_status_idx" ON "ropa_processes"("status");

-- CreateIndex
CREATE INDEX "ropa_processes_processId_idx" ON "ropa_processes"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "retention_policies_resourceType_key" ON "retention_policies"("resourceType");

-- CreateIndex
CREATE INDEX "independence_checks_clientId_idx" ON "independence_checks"("clientId");

-- CreateIndex
CREATE INDEX "independence_checks_validUntil_idx" ON "independence_checks"("validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permissionId_key" ON "role_permissions"("role", "permissionId");

-- CreateIndex
CREATE INDEX "role_change_audit_targetRole_idx" ON "role_change_audit"("targetRole");

-- CreateIndex
CREATE INDEX "role_change_audit_createdAt_idx" ON "role_change_audit"("createdAt");

-- CreateIndex
CREATE INDEX "view_as_sessions_actorId_idx" ON "view_as_sessions"("actorId");

-- CreateIndex
CREATE INDEX "view_as_sessions_startedAt_idx" ON "view_as_sessions"("startedAt");

-- CreateIndex
CREATE INDEX "clients_isActive_idx" ON "clients"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "founder_letters_slug_key" ON "founder_letters"("slug");

-- CreateIndex
CREATE INDEX "founder_letters_status_publishedAt_idx" ON "founder_letters"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "succession_roadmaps_clientId_idx" ON "succession_roadmaps"("clientId");

-- CreateIndex
CREATE INDEX "succession_roadmaps_status_idx" ON "succession_roadmaps"("status");

-- CreateIndex
CREATE INDEX "succession_milestones_roadmapId_idx" ON "succession_milestones"("roadmapId");

-- CreateIndex
CREATE INDEX "succession_kpis_roadmapId_idx" ON "succession_kpis"("roadmapId");

-- CreateIndex
CREATE UNIQUE INDEX "esg_datapoints_esrsCode_key" ON "esg_datapoints"("esrsCode");

-- CreateIndex
CREATE INDEX "esg_datapoints_pillar_idx" ON "esg_datapoints"("pillar");

-- CreateIndex
CREATE INDEX "esg_datapoints_isMandatory_idx" ON "esg_datapoints"("isMandatory");

-- CreateIndex
CREATE INDEX "esg_assessments_clientId_idx" ON "esg_assessments"("clientId");

-- CreateIndex
CREATE INDEX "esg_assessments_status_idx" ON "esg_assessments"("status");

-- CreateIndex
CREATE INDEX "fintech_compliance_items_clientId_idx" ON "fintech_compliance_items"("clientId");

-- CreateIndex
CREATE INDEX "fintech_compliance_items_regulator_idx" ON "fintech_compliance_items"("regulator");

-- CreateIndex
CREATE INDEX "fintech_compliance_items_status_idx" ON "fintech_compliance_items"("status");

-- CreateIndex
CREATE INDEX "data_residency_tags_resourceType_resourceId_idx" ON "data_residency_tags"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "data_residency_tags_location_idx" ON "data_residency_tags"("location");

-- CreateIndex
CREATE INDEX "analytics_userId_createdAt_idx" ON "analytics"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_calcomUid_key" ON "bookings"("calcomUid");

-- CreateIndex
CREATE INDEX "bookings_status_scheduledAt_reminder24hSent_idx" ON "bookings"("status", "scheduledAt", "reminder24hSent");

-- CreateIndex
CREATE INDEX "bookings_status_scheduledAt_reminder1hSent_idx" ON "bookings"("status", "scheduledAt", "reminder1hSent");

-- CreateIndex
CREATE INDEX "bookings_status_scheduledAt_feedbackEmailSent_idx" ON "bookings"("status", "scheduledAt", "feedbackEmailSent");

-- CreateIndex
CREATE INDEX "bookings_userId_status_scheduledAt_idx" ON "bookings"("userId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "contact_submissions_isRead_createdAt_idx" ON "contact_submissions"("isRead", "createdAt");

-- CreateIndex
CREATE INDEX "contact_submissions_createdAt_idx" ON "contact_submissions"("createdAt");

-- CreateIndex
CREATE INDEX "contact_submissions_deletedAt_idx" ON "contact_submissions"("deletedAt");

-- CreateIndex
CREATE INDEX "interactions_userId_type_createdAt_idx" ON "interactions"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_unsubscribedAt_idx" ON "newsletter_subscribers"("unsubscribedAt");

-- CreateIndex
CREATE INDEX "services_isActive_sortOrder_idx" ON "services"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "users_lastLoginAt_idx" ON "users"("lastLoginAt");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_feedbacks" ADD CONSTRAINT "booking_feedbacks_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "webhook_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retainers" ADD CONSTRAINT "retainers_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_retainerId_fkey" FOREIGN KEY ("retainerId") REFERENCES "retainers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_prospects" ADD CONSTRAINT "outreach_prospects_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "outreach_waves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dsar_audit_entries" ADD CONSTRAINT "dsar_audit_entries_dsarId_fkey" FOREIGN KEY ("dsarId") REFERENCES "dsar_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "succession_roadmaps" ADD CONSTRAINT "succession_roadmaps_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "succession_milestones" ADD CONSTRAINT "succession_milestones_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "succession_roadmaps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "succession_kpis" ADD CONSTRAINT "succession_kpis_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "succession_roadmaps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esg_assessments" ADD CONSTRAINT "esg_assessments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fintech_compliance_items" ADD CONSTRAINT "fintech_compliance_items_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

