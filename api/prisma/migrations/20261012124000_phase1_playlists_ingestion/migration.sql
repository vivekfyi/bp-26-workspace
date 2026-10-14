-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "sources" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "feed_url" TEXT NOT NULL,
    "site_url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "last_polled_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "original_url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL,
    "lead_image_url" TEXT,
    "full_text" TEXT,
    "summary_short" TEXT,
    "summary_bullets" JSONB,
    "tags" JSONB,
    "reading_time_minutes" INTEGER,
    "status" "ArticleStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sources_feed_url_key" ON "sources"("feed_url");

-- CreateIndex
CREATE UNIQUE INDEX "articles_original_url_key" ON "articles"("original_url");

-- CreateIndex
CREATE INDEX "idx_articles_source_id" ON "articles"("source_id");

-- CreateIndex
CREATE INDEX "idx_articles_status_published_at" ON "articles"("status", "published_at" DESC);

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
