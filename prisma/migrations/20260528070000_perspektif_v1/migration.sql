-- Perspektif Blog System — PB-1 Migration v1
-- Wave-1: 9 yeni model + 7 enum + FTS GIN index
-- Safe additive append — mevcut tablolara dokunulmaz

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

CREATE TYPE "Domain" AS ENUM ('M_A', 'ESG', 'FINTECH', 'AILE_SIRKETI');

CREATE TYPE "PostStatus" AS ENUM (
  'DRAFT', 'IN_REVIEW', 'COPY_EDIT', 'SEO_REVIEW',
  'LEGAL_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'
);

CREATE TYPE "Language" AS ENUM ('TR_ONLY', 'EN_ONLY', 'BOTH');

CREATE TYPE "ArticleType" AS ENUM (
  'ANALYSIS', 'OPINION', 'CASE_STUDY', 'FRAMEWORK', 'CHECKLIST',
  'INTERVIEW', 'DATA_DEEP_DIVE', 'TUTORIAL', 'NEWSLETTER_RECAP',
  'REGULATORY_ALERT', 'BOOK_SUMMARY', 'EVENT_RECAP'
);

CREATE TYPE "TagAxis" AS ENUM ('FORMAT', 'AUDIENCE', 'GEO', 'SECTOR', 'REG', 'TREND');

CREATE TYPE "SeriesStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ON_HIATUS');

CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SPAM');

-- ─── AUTHOR ──────────────────────────────────────────────────────────────────

CREATE TABLE "authors" (
  "id"          TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "bioTr"       TEXT NOT NULL,
  "bioEn"       TEXT,
  "avatarUrl"   TEXT NOT NULL,
  "linkedinUrl" TEXT,
  "twitterUrl"  TEXT,
  "isFounder"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "authors_slug_key" ON "authors"("slug");

-- ─── GUEST AUTHOR ────────────────────────────────────────────────────────────

CREATE TABLE "guest_authors" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "affiliation" TEXT,
  "bio"         TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "guest_authors_pkey" PRIMARY KEY ("id")
);

-- ─── SERIES ──────────────────────────────────────────────────────────────────

CREATE TABLE "series" (
  "id"            TEXT NOT NULL,
  "slug"          TEXT NOT NULL,
  "titleTr"       TEXT NOT NULL,
  "titleEn"       TEXT,
  "descriptionTr" TEXT NOT NULL,
  "descriptionEn" TEXT,
  "coverImageUrl" TEXT NOT NULL,
  "totalParts"    INTEGER NOT NULL,
  "status"        "SeriesStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "series_slug_key" ON "series"("slug");

-- ─── BLOG POST ───────────────────────────────────────────────────────────────

CREATE TABLE "blog_posts" (
  "id"                          TEXT NOT NULL,
  "slug"                        TEXT NOT NULL,
  "slugEn"                      TEXT,
  "type"                        "ArticleType" NOT NULL,
  "status"                      "PostStatus" NOT NULL DEFAULT 'DRAFT',
  "language"                    "Language" NOT NULL DEFAULT 'TR_ONLY',
  "titleTr"                     TEXT NOT NULL,
  "titleEn"                     TEXT,
  "excerptTr"                   TEXT NOT NULL,
  "excerptEn"                   TEXT,
  "bodyTrMdx"                   TEXT NOT NULL,
  "bodyEnMdx"                   TEXT,
  "primaryDomain"               "Domain" NOT NULL,
  "subDomain"                   TEXT NOT NULL,
  "topic"                       TEXT,
  "seriesId"                    TEXT,
  "seriesOrder"                 INTEGER,
  "authorId"                    TEXT NOT NULL,
  "coverImageUrl"               TEXT NOT NULL,
  "coverImageAlt"               TEXT NOT NULL,
  "ogImageUrl"                  TEXT,
  "videoEmbedUrl"               TEXT,
  "metaTitleTr"                 VARCHAR(60),
  "metaTitleEn"                 VARCHAR(60),
  "metaDescTr"                  VARCHAR(160),
  "metaDescEn"                  VARCHAR(160),
  "canonicalUrl"                TEXT,
  "noindex"                     BOOLEAN NOT NULL DEFAULT false,
  "readingTimeMin"              INTEGER NOT NULL DEFAULT 5,
  "viewCount"                   INTEGER NOT NULL DEFAULT 0,
  "uniqueViewCount"             INTEGER NOT NULL DEFAULT 0,
  "shareCount"                  INTEGER NOT NULL DEFAULT 0,
  "bookmarkCount"               INTEGER NOT NULL DEFAULT 0,
  "commentCount"                INTEGER NOT NULL DEFAULT 0,
  "avgScrollDepth"              DOUBLE PRECISION,
  "newsletterSignupsFromPost"   INTEGER NOT NULL DEFAULT 0,
  "discoveryClicksFromPost"     INTEGER NOT NULL DEFAULT 0,
  "publishedAt"                 TIMESTAMP(3),
  "scheduledAt"                 TIMESTAMP(3),
  "createdAt"                   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                   TIMESTAMP(3) NOT NULL,
  "copyEditedBy"                TEXT,
  "seoApprovedBy"               TEXT,
  "legalApprovedBy"             TEXT,
  "publishedBy"                 TEXT,
  "isFeatured"                  BOOLEAN NOT NULL DEFAULT false,
  "isEditorsPick"               BOOLEAN NOT NULL DEFAULT false,
  "featureOrder"                INTEGER,
  "feedPinned"                  BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blog_posts_slug_key"   ON "blog_posts"("slug");
CREATE UNIQUE INDEX "blog_posts_slugEn_key" ON "blog_posts"("slugEn");

-- Domain + subDomain + publishedAt (most common listing query)
CREATE INDEX "idx_post_primary_published"
  ON "blog_posts"("primaryDomain", "subDomain", "publishedAt" DESC)
  WHERE "status" = 'PUBLISHED';

CREATE INDEX "idx_post_author_published"
  ON "blog_posts"("authorId", "publishedAt" DESC);

CREATE INDEX "idx_post_status_schedule"
  ON "blog_posts"("status", "scheduledAt");

CREATE INDEX "idx_post_view_count"
  ON "blog_posts"("viewCount" DESC)
  WHERE "status" = 'PUBLISHED';

CREATE INDEX "idx_post_featured"
  ON "blog_posts"("publishedAt" DESC, "isFeatured")
  WHERE "status" = 'PUBLISHED';

CREATE INDEX "idx_post_status_domain"
  ON "blog_posts"("status", "primaryDomain");

-- Postgres FTS — Turkish dictionary
CREATE INDEX "idx_post_search_tr"
  ON "blog_posts"
  USING GIN(to_tsvector('simple', "titleTr" || ' ' || "excerptTr" || ' ' || "bodyTrMdx"));

-- Postgres FTS — English dictionary (optional articles only)
CREATE INDEX "idx_post_search_en"
  ON "blog_posts"
  USING GIN(to_tsvector('english',
    COALESCE("titleEn", '') || ' ' ||
    COALESCE("excerptEn", '') || ' ' ||
    COALESCE("bodyEnMdx", '')
  ));

-- ─── FOREIGN KEYS — BlogPost ─────────────────────────────────────────────────

ALTER TABLE "blog_posts"
  ADD CONSTRAINT "blog_posts_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "blog_posts"
  ADD CONSTRAINT "blog_posts_seriesId_fkey"
    FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── TAG ─────────────────────────────────────────────────────────────────────

CREATE TABLE "tags" (
  "id"        TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "labelTr"   TEXT NOT NULL,
  "labelEn"   TEXT,
  "axis"      "TagAxis" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");
CREATE INDEX "idx_tags_axis" ON "tags"("axis");

-- ─── M2M — BlogPost ↔ Tag ────────────────────────────────────────────────────

CREATE TABLE "_BlogPostTags" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_BlogPostTags_AB_unique" ON "_BlogPostTags"("A", "B");
CREATE INDEX "_BlogPostTags_B_index"         ON "_BlogPostTags"("B");

ALTER TABLE "_BlogPostTags"
  ADD CONSTRAINT "_BlogPostTags_A_fkey"
    FOREIGN KEY ("A") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_BlogPostTags"
  ADD CONSTRAINT "_BlogPostTags_B_fkey"
    FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── M2M — BlogPost ↔ GuestAuthor ────────────────────────────────────────────

CREATE TABLE "_BlogPostToGuestAuthor" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_BlogPostToGuestAuthor_AB_unique" ON "_BlogPostToGuestAuthor"("A", "B");
CREATE INDEX "_BlogPostToGuestAuthor_B_index"          ON "_BlogPostToGuestAuthor"("B");

ALTER TABLE "_BlogPostToGuestAuthor"
  ADD CONSTRAINT "_BlogPostToGuestAuthor_A_fkey"
    FOREIGN KEY ("A") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_BlogPostToGuestAuthor"
  ADD CONSTRAINT "_BlogPostToGuestAuthor_B_fkey"
    FOREIGN KEY ("B") REFERENCES "guest_authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── M2M — BlogPost ↔ BlogPost (Manual Related) ──────────────────────────────

CREATE TABLE "_ManualRelated" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_ManualRelated_AB_unique" ON "_ManualRelated"("A", "B");
CREATE INDEX "_ManualRelated_B_index"          ON "_ManualRelated"("B");

ALTER TABLE "_ManualRelated"
  ADD CONSTRAINT "_ManualRelated_A_fkey"
    FOREIGN KEY ("A") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_ManualRelated"
  ADD CONSTRAINT "_ManualRelated_B_fkey"
    FOREIGN KEY ("B") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── DRAFT REVISION ──────────────────────────────────────────────────────────

CREATE TABLE "draft_revisions" (
  "id"              TEXT NOT NULL,
  "postId"          TEXT NOT NULL,
  "bodyMdxSnapshot" TEXT NOT NULL,
  "authorId"        TEXT NOT NULL,
  "message"         TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "draft_revisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_draft_revisions_post_date"
  ON "draft_revisions"("postId", "createdAt" DESC);

ALTER TABLE "draft_revisions"
  ADD CONSTRAINT "draft_revisions_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── EDITOR COMMENT ──────────────────────────────────────────────────────────

CREATE TABLE "editor_comments" (
  "id"        TEXT NOT NULL,
  "postId"    TEXT NOT NULL,
  "authorId"  TEXT NOT NULL,
  "contentMd" TEXT NOT NULL,
  "resolved"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "editor_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_editor_comments_post_resolved"
  ON "editor_comments"("postId", "resolved");

ALTER TABLE "editor_comments"
  ADD CONSTRAINT "editor_comments_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── COMMENT ─────────────────────────────────────────────────────────────────

CREATE TABLE "comments" (
  "id"          TEXT NOT NULL,
  "postId"      TEXT NOT NULL,
  "authorName"  TEXT NOT NULL,
  "authorEmail" TEXT NOT NULL,
  "bodyMd"      TEXT NOT NULL,
  "status"      "CommentStatus" NOT NULL DEFAULT 'PENDING',
  "parentId"    TEXT,
  "ipHash"      TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_comments_post_status_date"
  ON "comments"("postId", "status", "createdAt" DESC);

CREATE INDEX "idx_comments_date"
  ON "comments"("createdAt" DESC);

ALTER TABLE "comments"
  ADD CONSTRAINT "comments_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comments"
  ADD CONSTRAINT "comments_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ─── VIEW LOG ────────────────────────────────────────────────────────────────

CREATE TABLE "view_logs" (
  "id"          TEXT NOT NULL,
  "postId"      TEXT NOT NULL,
  "userHash"    TEXT,
  "referrer"    TEXT,
  "duration"    INTEGER,
  "scrollDepth" DOUBLE PRECISION,
  "device"      TEXT,
  "geo"         TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "view_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_view_logs_post_date"
  ON "view_logs"("postId", "createdAt" DESC);

CREATE INDEX "idx_view_logs_date"
  ON "view_logs"("createdAt" DESC);

ALTER TABLE "view_logs"
  ADD CONSTRAINT "view_logs_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
