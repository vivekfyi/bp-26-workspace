# Phase 2: Boilerplate Editions and Optional Capability Matrix

Date: 2026-10-12

Source plan: `/Users/vivex/bp-26-workspace/api-boilerplate-plan.md`

Target workspace: `/Users/vivex/bp-26-workspace/api`

## Phase 2 objective

Define one reusable repository model with a stable core and explicit optional capability boundaries, so Phase 3 scaffolding can implement predictable feature composition.

## Decision summary

1. Use **one repository** for all starter variants.
2. Keep **Core** as the default runtime profile.
3. Enable optional capability groups through module registration + config gating.
4. Avoid hidden transitive dependencies between optional groups.
5. Keep domain/product logic out of every edition.

## Edition catalog

| Edition | Includes | Excludes by default | Intended use |
| --- | --- | --- | --- |
| Core | NestJS app bootstrap, config validation, Prisma 7, PostgreSQL, logger, global filters/pipes/interceptors, rate limiting, Swagger, health, tests, Docker | Auth, mail, OTP, storage, worker, realtime, API keys, push notifications, OAuth providers | Base internal API services |
| Core + Auth | Core + users + JWT/password auth + guards + role hooks | Mail/OTP/storage/worker/realtime and third-party OAuth | Most authenticated CRUD APIs |
| Core + Communications | Core + mail abstraction + OTP abstraction | Storage/worker/realtime/api keys/push/OAuth | Transactional messaging APIs |
| Core + Storage | Core + provider-neutral storage module + local/S3-compatible provider | Mail/OTP/worker/realtime/api keys/push/OAuth | File/media handling services |
| Core + Async | Core + worker runtime integration + CLI command wiring | Mail/OTP/storage/realtime/api keys/push/OAuth | APIs with scheduled/background processing |
| Full starter | Core + all approved optional groups that pass compatibility checks | Product/domain-specific modules | Teams that want broad prewiring |

## Capability boundaries

Each optional capability must satisfy all boundary rules below before being marked “boilerplate-ready”:

1. **Independent enable/disable:** Disabling the capability does not break app startup.
2. **Config namespace isolation:** Uses only its own configuration namespace plus shared `app`/`database` primitives.
3. **Contract-first integration:** Depends on interfaces/tokens, not concrete product services.
4. **No domain imports:** Does not import Fitnook-specific modules, DTOs, models, or templates.
5. **Test isolation:** Has unit/integration coverage runnable without non-required external providers.

## Module ownership map

| Scope | Modules |
| --- | --- |
| Core foundation | `app`, `config`, `common`, `filters`, `prisma`, `health`, `example` |
| Optional: Auth | `users`, `auth` |
| Optional: Communications | `mail`, `otp` |
| Optional: Storage | `storage` |
| Optional: Async | `worker`, `commands` |
| Optional: Realtime | `realtime` |
| Optional: Platform access | `api-keys`, `fcm`, `notifications` (provider-neutral only) |

## Configuration model for editions

Baseline namespaces (always present):

- `app`
- `database`
- `rateLimit`
- `observability`

Optional namespaces (enabled only with corresponding module):

- `auth`
- `mail`
- `otp`
- `storage`
- `worker`
- `realtime`
- `apiKeys`
- `push`

## Feature toggling strategy

Phase 3 implementation should use both:

1. **Build-time composition** via module import arrays.
2. **Runtime guards** via validated config flags.

Required behavior:

- Optional modules must no-op when disabled.
- Missing optional env vars must not fail startup unless module is enabled.
- Enabling a module without required env vars must fail fast with a clear error.

## Out-of-scope enforcement for Phase 2

The following stay excluded from all editions at this stage:

- Fitness/workout/nutrition/social/referral/subscription/support domains
- Fitnook mail templates and seed data
- Product-specific reviewer/admin flows
- MCP/product-integrated tool surfaces

## Handoff contract for Phase 3

Phase 3 scaffolding must now implement:

1. Core project skeleton in `/Users/vivex/bp-26-workspace/api`.
2. Native ESM + NodeNext baseline.
3. Prisma 7 + PostgreSQL integration for Core.
4. A minimal `ExampleModule` in Core.
5. Optional-module stubs/interfaces for Auth, Communications, Storage, and Async boundaries.

## Phase 2 completion checklist

- [x] Confirmed single-repo edition strategy.
- [x] Defined all target editions and their included capabilities.
- [x] Defined optional capability boundary rules.
- [x] Mapped module ownership by core vs optional scopes.
- [x] Defined configuration namespaces aligned to edition composition.
- [x] Defined feature-toggle behavior and startup guarantees.
- [x] Produced Phase 3 handoff contract for implementation.
