-- CreateEnum
CREATE TYPE "ContentLicense" AS ENUM (
  'PUBLIC_DOMAIN',
  'CC0',
  'CC_BY',
  'CC_BY_SA',
  'CC_BY_NC',
  'CC_BY_NC_SA',
  'CC_BY_ND',
  'OPEN_GOV',
  'MIXED_UNKNOWN'
);

-- AlterTable
ALTER TABLE "sources"
ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN "license_type" "ContentLicense" NOT NULL DEFAULT 'MIXED_UNKNOWN',
ADD COLUMN "trust_score" INTEGER NOT NULL DEFAULT 50;

-- CreateTable
CREATE TABLE "topics" (
  "id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_topics" (
  "source_id" UUID NOT NULL,
  "topic_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "source_topics_pkey" PRIMARY KEY ("source_id","topic_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topics_slug_key" ON "topics"("slug");

-- CreateIndex
CREATE INDEX "idx_source_topics_topic_id" ON "source_topics"("topic_id");

-- AddForeignKey
ALTER TABLE "source_topics" ADD CONSTRAINT "source_topics_source_id_fkey"
FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_topics" ADD CONSTRAINT "source_topics_topic_id_fkey"
FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
