# Playlists for Articles API (Phase 1)

Phase 1 implements an automated ingestion, extraction, and AI enrichment pipeline using:

- NestJS 12 + TypeScript
- Prisma 7 + PostgreSQL
- BullMQ + Redis
- RSS parsing via `rss-parser`
- Full article extraction via `@extractus/article-extractor`
- AI enrichment via OpenAI SDK (`gpt-4o-mini` by default)

## Features delivered

- `sources` + `articles` database schema with migration
- Source + topic seed script with curated multi-niche feeds and license metadata
- Queue-based RSS ingestion and per-article processing
- Deduplication by unique `articles.original_url`
- Full-text extraction + lead image + reading time estimation
- AI enrichment into:
  - ~50-word summary
  - 3 bullet key takeaways
  - category tags
- Topic-aware enrichment context (category + source topics + license + language)
- Graceful failure handling (`status = FAILED`) for extraction/enrichment issues
- API endpoints:
  - `GET /api/health` (DB + Redis)
  - `GET /api/sources` (list/filter by category/topic/license)
  - `POST /api/sources/sync`
  - `GET /api/articles?page=1&limit=20&category=...&topic=...&licenseType=...`
  - `GET /api/articles/:id` (full extracted article content)

## Environment

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL` (required)
- `REDIS_URL` (required)
- `OPENAI_API_KEY` (recommended; if missing, fallback enrichment is used)
- `OPENAI_MODEL` (default: `gpt-4o-mini`)
- `FEED_SYNC_INTERVAL_MINUTES` (default: `30`)
- `ARTICLE_EXTRACTION_TIMEOUT_MS` (default: `15000`)

## Local setup

```bash
docker compose up -d
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Run services

### API server

```bash
npm run start:dev
```

The API server also launches the Next.js web UI from the same process. Open `http://localhost:3000/` for the reading dashboard. NestJS routes remain under `/api/*`, and Swagger remains available at `/api/docs`.

### Production build

```bash
npm run build
npm start
```

The custom server delegates `/api/*` to NestJS and all other routes to the Next.js App Router. The UI lives in `web/` and uses the existing articles, sources, sync, and health endpoints.

### Worker (polling + processing)

Run worker in a separate terminal:

```bash
npm run start:worker:dev
```

The worker:

- periodically enqueues feed sync jobs
- consumes sync jobs
- enqueues article processing jobs
- consumes article processing jobs

## Manual verification flow

1. Explore seeded sources:

```bash
curl "http://localhost:3000/api/sources?page=1&limit=20"
```

2. Trigger sync:

```bash
curl -X POST http://localhost:3000/api/sources/sync
```

3. Check processed articles:

```bash
curl "http://localhost:3000/api/articles?page=1&limit=10&topic=ai"
```

To requeue existing articles that do not have extracted content:

```bash
REPROCESS_LIMIT=100 npm run articles:reprocess
```

4. Health check:

```bash
curl http://localhost:3000/api/health
```

## Notes

- Queue names:
  - `ingestion-sync`
  - `article-processing`
- Job names:
  - `sync-all-sources`
  - `process-article`
- Failed extractions/enrichments are persisted with `FAILED` status and do not crash workers.
