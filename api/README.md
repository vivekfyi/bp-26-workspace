# API Boilerplate (Phase 3 Scaffold)

This is the Phase 3 scaffold for the reusable API boilerplate using:

- NestJS 12
- Prisma 7
- PostgreSQL
- Native ESM (`NodeNext`)

## Included in this scaffold

- Core app bootstrap and module composition
- Environment validation and config namespaces
- Prisma module/service lifecycle management
- Global validation, exception filter, serializer, and throttling
- Winston logger wiring
- Swagger setup
- Health endpoint (`/api/health`)
- Example module (`/api/examples`)
- Optional module stubs (auth/users, mail/otp, storage, worker/commands)

## Quick start

1. Copy `.env.example` to `.env`.
   - Keep `.env` local-only and never commit real credentials.
2. Start PostgreSQL:

   ```bash
   docker compose up -d
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Generate Prisma client and run migrations:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. Start development server:

   ```bash
   npm run start:dev
   ```

Swagger is available at `/api/docs` when `SWAGGER_ENABLED=true`.

## Testing (Jest + ESM)

- Unit tests run via `jest.config.mjs`.
- E2E tests run via `jest.e2e.config.mjs`.
- Scripts use Node's ESM vm-modules mode for NestJS 12 compatibility.

## Phase alignment

- Phase 1: Inventory and extraction boundary (completed)
- Phase 2: Edition matrix and capability boundaries (completed)
- Phase 3: Core scaffold with optional capability stubs (this deliverable)
