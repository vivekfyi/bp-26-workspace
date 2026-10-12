# Phase 1: API Module Inventory and Extraction Boundary

Date: 2026-10-12

Source project: `/Users/vivex/grasp-app/grasp-api`

Target boilerplate directory: `/Users/vivex/bp-26-workspace/api`

## Phase 1 outcome

The existing API is a NestJS application with a reusable infrastructure layer and a large Fitnook product domain layer. The boilerplate should be built from the infrastructure layer, then add reusable capabilities behind explicit optional boundaries.

The source project remains unchanged by this phase.

## Classification rules

| Category | Meaning | Boilerplate treatment |
| --- | --- | --- |
| Foundation | Required for almost every API project | Extract into the core starter |
| Optional capability | Reusable, but not required by every API | Extract behind an optional module/configuration boundary |
| Domain-specific | Represents Fitnook business concepts or workflows | Exclude from the initial boilerplate |
| Operational/project-specific | Deployment, debugging, data repair, or one-off content | Recreate generically only when useful; otherwise exclude |

## Foundation candidates

| Source area | Classification | Notes |
| --- | --- | --- |
| `src/main.ts` | Foundation | Bootstrap, CORS, global pipes, filters, interceptors, Swagger, and server startup. Requires NestJS 12/ESM redesign. |
| `src/app.module.ts` | Foundation | Application composition root. Must be reduced to generic modules. |
| `src/app.controller.ts` | Foundation | Keep only generic root/status endpoints. |
| `src/app.service.ts` | Foundation | Keep only generic application metadata or Swagger document support. |
| `src/config` | Foundation | Refactor into validated generic configuration sections. |
| `src/common` | Foundation | Preserve generic logger, pagination, upload constants, and utilities after review. |
| `src/filters` | Foundation | Preserve the HTTP exception filter and tests, making the response contract generic. |
| `src/prisma` | Foundation | Preserve Prisma lifecycle/module patterns, then migrate to Prisma 7. |
| `src/instrument.ts` | Foundation/optional | Keep as an observability integration point; make Sentry optional. |
| `tsconfig.json` and `tsconfig.build.json` | Foundation | Rework for NestJS 12, Prisma 7, and the selected ESM strategy. |
| `eslint.config.mjs` | Foundation | Preserve and update for the new source layout. |
| Jest configuration | Foundation | Preserve unit/e2e conventions and make them ESM-compatible. |
| `package.json` scripts | Foundation | Keep generic build, start, lint, test, Prisma, and Docker workflows. |
| `docker-compose.test.yml` | Foundation | Convert to a generic PostgreSQL test stack. |
| `docker-compose.yml` | Foundation | Keep PostgreSQL; include MailHog only if communications is enabled. |
| `Dockerfile` | Foundation | Recreate as a generic production image after the ESM migration. |
| `nest-cli.json` | Foundation | Recreate for the target project layout. |

## Optional reusable capabilities

| Source area | Classification | Extraction notes |
| --- | --- | --- |
| `src/auth` | Optional capability | Strong candidate, but remove Fitnook reviewer login, avatar, referral, notification, and profile dependencies. Target JWT/password auth first; OAuth, OTP, and WebAuthn should be separately selectable. |
| `src/users` | Optional capability | Provide a minimal generic user model/service for the auth edition. Do not carry over product profile fields. |
| `src/api-keys` | Optional capability | Reusable API-key authentication and management; audit security behavior before extraction. |
| `src/otp` | Optional capability | Preserve provider interface and rate limits; remove provider-specific assumptions. |
| `src/mail` | Optional capability | Extract mail abstraction, templates, and local MailHog setup. Keep Fitnook templates out. |
| `src/storage` | Optional capability | Preserve provider interface and local/S3-compatible implementation first. Cloudinary, Backblaze, Bunny, and ImageKit adapters should be independently enabled. |
| `src/realtime` | Optional capability | Generic Socket.IO gateway/service pattern; remove product event names. |
| `src/worker` | Optional capability | Preserve Graphile Worker integration and lifecycle handling, but exclude Fitnook task implementations. |
| `src/commands` | Optional capability | Preserve generic CLI wiring; exclude the superadmin command. |
| `src/fcm` | Optional capability | Reusable push-notification adapter, but should not be part of the core starter. |
| `src/notifications` | Optional capability | Extract only as a provider-neutral notification abstraction. Current implementation is coupled to product behavior. |
| `src/superadmin` | Optional capability | Replace with generic roles/permissions; do not copy the current admin workflows. |
| `src/assets/mail-templates` | Optional capability/content | Keep only generic transactional templates, if needed. |
| `src/types` | Optional/shared | Review each type individually; only generic shared types belong in the starter. |

## Domain-specific modules to exclude initially

| Source area | Reason for exclusion |
| --- | --- |
| `src/assistant` | Fitnook assistant flows, tools, capabilities, and AI usage rules. |
| `src/bunny-stream` | Workout/video delivery integration tied to the product domain. |
| `src/content` | Product content and summarization domain. |
| `src/equipment` | Fitness equipment domain. |
| `src/exercises` | Exercise catalog and video domain. |
| `src/fitness-profile` | Fitness-specific user profile domain. |
| `src/forms` | Product form definitions and response workflows. |
| `src/forum` | Community forum domain. |
| `src/gamification` | XP, badges, and fitness rewards domain. |
| `src/goal-notifications` | Goal-specific scheduled notifications. |
| `src/goals` | Fitness goals domain. |
| `src/habits` | Habit tracking domain. |
| `src/health-data` | Fitness and health-provider data domain. |
| `src/meal-plan-reminders` | Meal-plan-specific scheduling. |
| `src/meal-plans` | Meal-plan domain and AI generation. |
| `src/meals` | Nutrition and meal tracking domain. |
| `src/messages` | Current product conversation and messaging domain. |
| `src/nook-insights` | Fitnook post-workout insights and coaching. |
| `src/nook-notifications` | Fitnook-specific notifications. |
| `src/referrals` | Referral rewards and attribution. |
| `src/squads` | Social fitness groups and activities. |
| `src/stats` | Fitness statistics and trend calculations. |
| `src/subscriptions` | Product billing and entitlement logic. |
| `src/sync-reminders` | Fitness synchronization reminders. |
| `src/tickets` | Current support-ticket workflow and product templates. |
| `src/workout-schedule` | Workout scheduling domain. |
| `src/workout-sessions` | Workout execution/session domain. |
| `src/workouts` | Workout plans, programs, templates, and AI generation. |

## Operational and project-specific items

These should not be copied into the core boilerplate:

| Source item | Treatment |
| --- | --- |
| `prisma/seed*.ts`, `prisma/popularity-tiers.ts`, and `seed-categories.sql` | Exclude. Create a minimal generic seed instead. |
| `prisma/schema.prisma` | Do not copy the Fitnook schema. Create a minimal generic schema and Prisma 7 setup. |
| `scripts/` | Review individually; exclude data repair, migration, and Fitnook synchronization scripts. |
| `scratch/` | Exclude. |
| `video-reframe/` | Out of scope and not part of the API boilerplate. |
| `deploy.sh`, `backup.sh`, `ecosystem.config.js`, and deployment docs | Recreate generic deployment/backup examples after the runtime is stable. |
| `build_output.txt`, `deploy_output.txt`, and similar logs | Exclude. |
| `README.md` | Rewrite for the boilerplate workflow. |
| Root test/debug scripts | Keep only generic smoke-test tooling after review. |
| `.env` | Never copy. Generate `.env.example` with placeholders only. |
| `.env.test` | Recreate with generic test values and no real credentials. |
| `src/mcp` | Exclude from the initial boilerplate; it is an integration surface with product-specific authenticated tools. |

## Dependency risks discovered

### Authentication coupling

The current auth module imports or relies on users, mail, OTP, referrals, notifications, avatars, and Fitnook-specific profile behavior. It cannot be copied as a standalone module without first defining interfaces for:

- User lookup and creation
- Email delivery
- OTP delivery and verification
- Profile/identity representation
- Optional post-registration actions
- Optional avatar/file handling

### Worker coupling

The worker module is reusable at the runtime level, but current tasks are domain-specific. The boilerplate should include a task registry example and lifecycle management, not the current notification, meal-plan, goal, or workout tasks.

### Prisma coupling

The current Prisma schema is almost entirely product-specific. The boilerplate needs a fresh Prisma 7 schema, generated client configuration, migrations, and seed workflow. No Fitnook models should be carried over as a hidden dependency.

### Configuration coupling

The current configuration contains authentication, storage, OAuth, referral, workout, OpenAI, PostHog, and product-reviewer settings together. The boilerplate should use independently validated configuration namespaces and avoid loading optional integrations unless enabled.

### ESM migration

NestJS 12 and Prisma 7 require an explicit ESM/runtime decision. This affects package metadata, TypeScript module settings, Jest, generated Prisma client imports, CLI commands, Docker startup, and PM2/deployment commands.

## Phase 1 extraction boundary

The initial boilerplate should contain:

1. Generic NestJS 12 application bootstrap.
2. Prisma 7 and PostgreSQL integration.
3. Configuration loading and validation.
4. Logging, exception handling, validation, serialization, and throttling.
5. Swagger and health checks.
6. Generic testing, Docker, linting, and build workflows.
7. A minimal example domain module.
8. Auth/users as the first optional capability.

The following should be added only after the core works independently:

- Mail and OTP
- Storage
- Realtime
- Background workers
- API keys
- Push notifications
- OAuth providers
- Generic roles/permissions

## Phase 1 implementation decisions

### Decision 1: Edition strategy

Use a single repository with a **core starter** plus **optional capability modules**, instead of creating separate duplicated repositories per edition.

Applied boundaries for this decision:

- Core includes NestJS 12 bootstrap, config/validation, Prisma 7 + PostgreSQL, logging/filtering/serialization/validation/throttling, Swagger, health checks, and standard test/build/lint/Docker workflows.
- Auth/users is the first optional capability, developed as an add-on boundary after the core is stable.
- Communications, storage, realtime, worker, API keys, push notifications, OAuth providers, and advanced roles/permissions remain out of scope for Phase 1.

This matches the recommended edition model in `api-boilerplate-plan.md` and keeps early extraction scope small enough to validate quickly.

### Decision 2: Runtime/module strategy

Adopt **native ESM with NodeNext** as the baseline strategy for the new boilerplate:

- Runtime: modern Node.js LTS in ESM mode.
- TypeScript: NodeNext module resolution/module target.
- Prisma 7 + NestJS 12 integration is validated against this baseline during scaffolding.
- Jest/test wiring and CLI commands must be configured to run under the selected ESM strategy.

This resolves the Phase 1 ESM decision gate so Phase 2 implementation can proceed with a single coherent runtime target.

## Phase 1 completion checklist

- [x] Created `/Users/vivex/bp-26-workspace/api`.
- [x] Created the Phase 1 documentation directory.
- [x] Inventoried the top-level source areas.
- [x] Classified source areas into foundation, optional, domain-specific, and operational groups.
- [x] Identified extraction dependency risks.
- [x] Defined the initial boilerplate boundary.
- [x] Confirmed the core/optional edition decision before Phase 2.
- [x] Confirmed native ESM versus supported interoperability strategy before implementation.
- [x] Finalized Phase 1 documentation for handoff into Phase 2 scaffolding.
