-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'CLIENT', 'CONSULTANT', 'ADMIN', 'PREMIUM', 'BLOG_AUTHOR', 'EDITOR');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('PAGE_VIEW', 'CTA_CLICK', 'FORM_SUBMIT', 'BOOKING_START', 'DOWNLOAD', 'SCROLL_DEPTH');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backupCodes" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleTr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descTr" TEXT NOT NULL,
    "descEn" TEXT NOT NULL,
    "iconName" TEXT NOT NULL DEFAULT 'Briefcase',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "searchVectorTr" tsvector,
    "searchVectorEn" tsvector,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "notesTr" TEXT,
    "notesEn" TEXT,
    "meetingUrl" TEXT,
    "cancellationReason" TEXT,
    "calcomUid" TEXT,
    "reminder24hSent" BOOLEAN NOT NULL DEFAULT false,
    "reminder1hSent" BOOLEAN NOT NULL DEFAULT false,
    "feedbackEmailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "referrer" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "deviceType" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "target" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_submissions" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "service" TEXT,
    "messageTr" TEXT,
    "messageEn" TEXT,
    "source" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "newsletter_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_lastLoginAt_idx" ON "users"("lastLoginAt");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE INDEX "services_isActive_sortOrder_idx" ON "services"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_calcomUid_key" ON "bookings"("calcomUid");

-- CreateIndex
CREATE INDEX "bookings_scheduledAt_idx" ON "bookings"("scheduledAt");

-- CreateIndex
CREATE INDEX "bookings_status_scheduledAt_reminder24hSent_idx" ON "bookings"("status", "scheduledAt", "reminder24hSent");

-- CreateIndex
CREATE INDEX "bookings_status_scheduledAt_reminder1hSent_idx" ON "bookings"("status", "scheduledAt", "reminder1hSent");

-- CreateIndex
CREATE INDEX "bookings_status_scheduledAt_feedbackEmailSent_idx" ON "bookings"("status", "scheduledAt", "feedbackEmailSent");

-- CreateIndex
CREATE INDEX "bookings_userId_status_scheduledAt_idx" ON "bookings"("userId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "analytics_sessionId_idx" ON "analytics"("sessionId");

-- CreateIndex
CREATE INDEX "analytics_page_idx" ON "analytics"("page");

-- CreateIndex
CREATE INDEX "analytics_createdAt_idx" ON "analytics"("createdAt");

-- CreateIndex
CREATE INDEX "analytics_userId_createdAt_idx" ON "analytics"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "interactions_sessionId_idx" ON "interactions"("sessionId");

-- CreateIndex
CREATE INDEX "interactions_type_idx" ON "interactions"("type");

-- CreateIndex
CREATE INDEX "interactions_createdAt_idx" ON "interactions"("createdAt");

-- CreateIndex
CREATE INDEX "interactions_userId_type_createdAt_idx" ON "interactions"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "contact_submissions_email_idx" ON "contact_submissions"("email");

-- CreateIndex
CREATE INDEX "contact_submissions_isRead_createdAt_idx" ON "contact_submissions"("isRead", "createdAt");

-- CreateIndex
CREATE INDEX "contact_submissions_createdAt_idx" ON "contact_submissions"("createdAt");

-- CreateIndex
CREATE INDEX "contact_submissions_deletedAt_idx" ON "contact_submissions"("deletedAt");

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
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_subscribedAt_idx" ON "newsletter_subscribers"("subscribedAt");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_unsubscribedAt_idx" ON "newsletter_subscribers"("unsubscribedAt");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

