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
  DEPLOY_PATH       Remote app path (default: /root/grasp-workspace/grasp-api)
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
DEPLOY_PATH=${DEPLOY_PATH:-/root/grasp-workspace/grasp-api}
PM2_APP=${PM2_APP:-scroll0}
HEALTH_URL=${HEALTH_URL:-http://127.0.0.1:3001/api/health}

if [[ ! -r "$DEPLOY_KEY" ]]; then
  printf '%s\n' "SSH key is not readable: $DEPLOY_KEY" >&2
  exit 1
fi

printf '%s\n' \
  "Deploying Scroll Zero" \
  "  host:    $DEPLOY_HOST" \
  "  path:    $DEPLOY_PATH" \
  "  branch:  $BRANCH" \
  "  process: $PM2_APP"

ssh \
  -i "$DEPLOY_KEY" \
  -o BatchMode=yes \
  -o IdentitiesOnly=yes \
  "$DEPLOY_HOST" \
  bash -s -- "$DEPLOY_PATH" "$BRANCH" "$PM2_APP" "$HEALTH_URL" <<'REMOTE_SCRIPT'
set -Eeuo pipefail

DEPLOY_PATH=$1
BRANCH=$2
PM2_APP=$3
HEALTH_URL=$4

cd "$DEPLOY_PATH"

if [[ ! -d .git ]]; then
  printf '%s\n' "Not a Git checkout: $DEPLOY_PATH" >&2
  exit 1
fi

printf '%s\n' "Checking production process before deployment..."
pm2 describe "$PM2_APP" >/dev/null
pm2 list

printf '%s\n' "Updating source with fast-forward pull..."
git fetch origin "$BRANCH"
git pull --ff-only origin "$BRANCH"

printf '%s\n' "Installing production dependencies..."
npm ci --legacy-peer-deps

printf '%s\n' "Generating Prisma client..."
npx prisma generate

printf '%s\n' "Applying pending database migrations..."
npx prisma migrate deploy

printf '%s\n' "Building API and web..."
npm run build

printf '%s\n' "Restarting only the Scroll Zero process..."
pm2 restart "$PM2_APP" --update-env
pm2 save

printf '%s\n' "Verifying process and health endpoint..."
pm2 list
curl --fail --silent --show-error --max-time 20 "$HEALTH_URL"
printf '\n%s\n' "Scroll Zero deployment completed successfully."
REMOTE_SCRIPT
