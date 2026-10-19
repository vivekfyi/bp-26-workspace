#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Usage: ./deploy.sh prod [branch]

Deploys the combined Scroll Zero NestJS + Next.js app to the Hetzner VPS.
The production database is synchronized with `prisma migrate deploy`.

Environment overrides:
  DEPLOY_HOST       SSH target (default: root@78.47.47.164)
  DEPLOY_KEY        SSH key (default: ~/grasp-app/hetzner_key.pem)
  DEPLOY_REPO_URL   Git remote (default: git@github.com:vivekfyi/bp-26-workspace.git)
  DEPLOY_REPO_PATH  Remote Git checkout (default: /root/grasp-workspace/scroll0workspace)
  DEPLOY_PATH       Remote app path (default: /root/grasp-workspace/scroll0workspace/api)
  PM2_APP           PM2 process name (default: scroll0)
  HEALTH_URL        Remote health URL (default: http://127.0.0.1:3001/api/health)
USAGE
  exit 0
fi

if [[ "${1:-}" != "prod" ]]; then
  printf '%s\n' "Usage: ./deploy.sh prod [branch]" >&2
  exit 2
fi

BRANCH=${2:-main}
if [[ ! "$BRANCH" =~ ^[A-Za-z0-9._/-]+$ ]]; then
  printf '%s\n' "Invalid branch name: $BRANCH" >&2
  exit 2
fi

DEPLOY_HOST=${DEPLOY_HOST:-root@78.47.47.164}
DEPLOY_KEY=${DEPLOY_KEY:-$HOME/grasp-app/hetzner_key.pem}
DEPLOY_REPO_URL=${DEPLOY_REPO_URL:-git@github.com:vivekfyi/bp-26-workspace.git}
DEPLOY_REPO_PATH=${DEPLOY_REPO_PATH:-/root/grasp-workspace/scroll0workspace}
DEPLOY_PATH=${DEPLOY_PATH:-/root/grasp-workspace/scroll0workspace/api}
PM2_APP=${PM2_APP:-scroll0}
HEALTH_URL=${HEALTH_URL:-http://127.0.0.1:3001/api/health}

if [[ ! -r "$DEPLOY_KEY" ]]; then
  printf '%s\n' "SSH key is not readable: $DEPLOY_KEY" >&2
  exit 1
fi

printf '%s\n' \
  "Deploying Scroll Zero" \
  "  host:    $DEPLOY_HOST" \
  "  repo:    $DEPLOY_REPO_PATH" \
  "  path:    $DEPLOY_PATH" \
  "  branch:  $BRANCH" \
  "  process: $PM2_APP"

ssh \
  -i "$DEPLOY_KEY" \
  -o BatchMode=yes \
  -o IdentitiesOnly=yes \
  "$DEPLOY_HOST" \
  bash -s -- "$DEPLOY_REPO_URL" "$DEPLOY_REPO_PATH" "$DEPLOY_PATH" "$BRANCH" "$PM2_APP" "$HEALTH_URL" <<'REMOTE_SCRIPT'
set -Eeuo pipefail

DEPLOY_REPO_URL=$1
DEPLOY_REPO_PATH=$2
DEPLOY_PATH=$3
BRANCH=$4
PM2_APP=$5
HEALTH_URL=$6

if [[ ! -e "$DEPLOY_REPO_PATH" ]]; then
  printf '%s\n' "Bootstrapping Scroll Zero checkout at $DEPLOY_REPO_PATH..."
  mkdir -p "$(dirname "$DEPLOY_REPO_PATH")"
  git clone --branch "$BRANCH" "$DEPLOY_REPO_URL" "$DEPLOY_REPO_PATH"
fi

cd "$DEPLOY_REPO_PATH"

if [[ ! -d .git ]]; then
  printf '%s\n' "Not a Git checkout: $DEPLOY_REPO_PATH" >&2
  exit 1
fi

if [[ ! -d "$DEPLOY_PATH" || ! -f "$DEPLOY_PATH/package.json" ]]; then
  printf '%s\n' "Scroll Zero app directory is incomplete: $DEPLOY_PATH" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  printf '%s\n' "Production checkout has uncommitted changes; refusing to pull or overwrite it." >&2
  git status --short | sed -n '1,80p' >&2
  exit 1
fi

printf '%s\n' "Checking production process before deployment..."
pm2 describe "$PM2_APP" >/dev/null
pm2 list

CURRENT_CWD=$(pm2 describe "$PM2_APP" | awk -F'│' '/exec cwd/ {gsub(/^[[:space:]]+|[[:space:]]+$/, "", $3); print $3; exit}')
if [[ "$CURRENT_CWD" != "$DEPLOY_PATH" ]]; then
  printf '%s\n' \
    "PM2 process $PM2_APP points to $CURRENT_CWD, not $DEPLOY_PATH." \
    "Complete the one-time PM2 path migration before deploying." >&2
  exit 1
fi

printf '%s\n' "Updating source with fast-forward pull..."
git fetch origin "$BRANCH"
git pull --ff-only origin "$BRANCH"

cd "$DEPLOY_PATH"

printf '%s\n' "Installing production dependencies..."
npm ci --legacy-peer-deps

printf '%s\n' "Generating Prisma client..."
npx prisma generate

printf '%s\n' "Applying pending database migrations..."
npx prisma migrate deploy

printf '%s\n' "Building API and web..."
npm run build

# Next.js 16 rewrites this generated file during `next build`; keep the
# production checkout clean so the next fast-forward deployment can proceed.
if ! git -C "$DEPLOY_REPO_PATH" diff --quiet -- api/web/next-env.d.ts; then
  git -C "$DEPLOY_REPO_PATH" restore -- api/web/next-env.d.ts
fi

printf '%s\n' "Restarting only the Scroll Zero process..."
# PM2 does not read the app's .env file automatically; export the Clerk keys
# so runtime server components receive the same values used during the build.
while IFS='=' read -r env_key env_value; do
  export "$env_key=$env_value"
done < <(grep -E '^(NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY|CLERK_SECRET_KEY|CLERK_ADMIN_USER_IDS)=' "$DEPLOY_PATH/.env")
pm2 restart "$PM2_APP" --update-env
pm2 save

printf '%s\n' "Verifying process and health endpoint..."
pm2 list
curl --fail --silent --show-error --max-time 20 "$HEALTH_URL"
printf '\n%s\n' "Scroll Zero deployment completed successfully."
REMOTE_SCRIPT
