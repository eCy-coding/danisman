-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "blog_posts" ADD COLUMN "categoryId" TEXT;

-- CreateTable
CREATE TABLE "insight_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "slugEn" TEXT,
    "nameTr" TEXT NOT NULL,
    "nameEn" TEXT,
    "descTr" TEXT,
    "descEn" TEXT,
    "domain" "Domain" NOT NULL,
    "parentId" TEXT,
    "iconName" TEXT,
    "colorAccent" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insight_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insight_categories_slug_key" ON "insight_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "insight_categories_slugEn_key" ON "insight_categories"("slugEn");

-- CreateIndex
CREATE INDEX "insight_categories_domain_status_displayOrder_idx" ON "insight_categories"("domain", "status", "displayOrder");

-- CreateIndex
CREATE INDEX "insight_categories_parentId_idx" ON "insight_categories"("parentId");

-- CreateIndex
CREATE INDEX "insight_categories_slug_idx" ON "insight_categories"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_categoryId_publishedAt_idx" ON "blog_posts"("categoryId", "publishedAt" DESC);

-- AddForeignKey
ALTER TABLE "insight_categories" ADD CONSTRAINT "insight_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "insight_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "insight_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
