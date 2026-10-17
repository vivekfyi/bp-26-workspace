#!/bin/sh

# Scroll Zero Kindle extension. POSIX sh; no package manager is required.

set -u

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
EXTENSION_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
KINDLE_ROOT=${KINDLE_ROOT:-/mnt/us}
STATE_DIR="$KINDLE_ROOT/scrollzero-sample"
CACHE_DIR="$STATE_DIR/cache"
CACHE_FILE="$CACHE_DIR/articles.json"
OUTPUT_FILE="$STATE_DIR/scrollzero.txt"
LOG_FILE="$STATE_DIR/scrollzero.log"
LOCK_DIR="$STATE_DIR/.lock"
LOCK_PID_FILE="$LOCK_DIR/pid"
LOCK_STARTED_FILE="$LOCK_DIR/started"
LOCK_TTL=120
CONFIG_FILE="$EXTENSION_DIR/config.env"
EIPS_BIN=""
FBINK_BIN=""

mkdir -p "$CACHE_DIR" 2>/dev/null || exit 1

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$*" >> "$LOG_FILE" 2>/dev/null || true
}

cleanup() {
  rm -f "$LOCK_PID_FILE" 2>/dev/null || true
  rm -f "$LOCK_STARTED_FILE" 2>/dev/null || true
  rmdir "$LOCK_DIR" 2>/dev/null || true
}

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  existing_pid=$(cat "$LOCK_PID_FILE" 2>/dev/null || true)
  existing_started=$(cat "$LOCK_STARTED_FILE" 2>/dev/null || true)
  now=$(date +%s)
  lock_is_recent=0
  case "$existing_started" in
    ''|*[!0-9]*) ;;
    *)
      if [ "$now" -ge "$existing_started" ] && [ "$((now - existing_started))" -lt "$LOCK_TTL" ]; then
        lock_is_recent=1
      fi
      ;;
  esac
  if [ "$lock_is_recent" -eq 1 ] && [ -n "$existing_pid" ] && kill -0 "$existing_pid" 2>/dev/null; then
    log "another invocation is already running (pid $existing_pid)"
    exit 0
  fi
  # A power loss, forced reboot, or reused PID can leave a stale lock behind.
  # The short TTL prevents an old Kindle PID from blocking future launches.
  rm -f "$LOCK_PID_FILE" 2>/dev/null || true
  rm -f "$LOCK_STARTED_FILE" 2>/dev/null || true
  rmdir "$LOCK_DIR" 2>/dev/null || {
    log "stale lock could not be removed"
    exit 1
  }
  mkdir "$LOCK_DIR" 2>/dev/null || exit 1
fi
printf '%s\n' "$$" > "$LOCK_PID_FILE" 2>/dev/null || true
date +%s > "$LOCK_STARTED_FILE" 2>/dev/null || true
trap cleanup EXIT INT TERM

# Launcher-provided environment variables win over the configuration file.
configured_url=${SCROLLZERO_API_BASE_URL-}
configured_limit=${SCROLLZERO_LIMIT-}
configured_timeout=${SCROLLZERO_TIMEOUT-}
if [ -f "$CONFIG_FILE" ]; then
  # shellcheck disable=SC1090
  . "$CONFIG_FILE"
fi
[ -n "$configured_url" ] && SCROLLZERO_API_BASE_URL=$configured_url
[ -n "$configured_limit" ] && SCROLLZERO_LIMIT=$configured_limit
[ -n "$configured_timeout" ] && SCROLLZERO_TIMEOUT=$configured_timeout

: "${SCROLLZERO_API_BASE_URL:=}"
: "${SCROLLZERO_LIMIT:=5}"
: "${SCROLLZERO_TIMEOUT:=12}"

if [ -x /usr/sbin/eips ]; then
  EIPS_BIN=/usr/sbin/eips
elif command -v eips >/dev/null 2>&1; then
  EIPS_BIN=$(command -v eips)
fi
if [ -x /mnt/us/linkss/bin/fbink ]; then
  FBINK_BIN=/mnt/us/linkss/bin/fbink
elif command -v fbink >/dev/null 2>&1; then
  FBINK_BIN=$(command -v fbink)
fi

valid_config() {
  case "$SCROLLZERO_API_BASE_URL" in
    http://*|https://*) : ;;
    *) return 1 ;;
  esac
  case "$SCROLLZERO_LIMIT" in
    ''|*[!0-9]*) return 1 ;;
  esac
  [ "$SCROLLZERO_LIMIT" -ge 1 ] && [ "$SCROLLZERO_LIMIT" -le 20 ] || return 1
  case "$SCROLLZERO_TIMEOUT" in
    ''|*[!0-9]*) return 1 ;;
  esac
  [ "$SCROLLZERO_TIMEOUT" -ge 2 ] && [ "$SCROLLZERO_TIMEOUT" -le 60 ]
}

screen_clear() {
  if [ -n "$EIPS_BIN" ] && [ "$KINDLE_ROOT" = "/mnt/us" ]; then
    "$EIPS_BIN" -c >/dev/null 2>&1 || true
  elif [ -n "$FBINK_BIN" ] && [ "$KINDLE_ROOT" = "/mnt/us" ]; then
    "$FBINK_BIN" --cls >/dev/null 2>&1 || true
  fi
}

screen_line() {
  line_number=$1
  text=$2
  clean_text=$(printf '%s' "$text" | tr -d '\000-\010\013\014\016-\037')
  if [ -n "$EIPS_BIN" ] && [ "$KINDLE_ROOT" = "/mnt/us" ]; then
    # eips uses character-column, character-row, text arguments.
    "$EIPS_BIN" 0 "$((line_number - 1))" "$clean_text" >/dev/null 2>&1 || true
  elif [ -n "$FBINK_BIN" ] && [ "$KINDLE_ROOT" = "/mnt/us" ]; then
    "$FBINK_BIN" --row "$((line_number - 1))" "$clean_text" >/dev/null 2>&1 || true
  fi
  printf '%s\n' "$clean_text" >> "$OUTPUT_FILE"
}

show_message_from_stdin() {
  : > "$OUTPUT_FILE"
  screen_clear
  line=1
  while IFS= read -r message; do
    remaining=$message
    while [ "${#remaining}" -gt 48 ]; do
      chunk=$(printf '%s' "$remaining" | cut -c1-48)
      screen_line "$line" "$chunk"
      line=$((line + 1))
      remaining=$(printf '%s' "$remaining" | cut -c49-)
    done
    screen_line "$line" "$remaining"
    line=$((line + 1))
    [ "$line" -gt 28 ] && break
  done
  return 0
}

show_message() {
  printf '%s\n' "$@" | show_message_from_stdin
  return 0
}

curl_get() {
  command -v curl >/dev/null 2>&1 || return 127
  curl -fsSL --proto '=http,https' --tlsv1.2 \
    --connect-timeout "$SCROLLZERO_TIMEOUT" \
    --max-time "$SCROLLZERO_TIMEOUT" \
    --max-filesize 524288 \
    "$1"
}

valid_articles_response() {
  case "$1" in
    *'"items"'*|*'"items":'*) : ;;
    *) return 1 ;;
  esac
  printf '%s' "$1" | grep -q '"title"' 2>/dev/null
}

fetch() {
  url="${SCROLLZERO_API_BASE_URL%/}/articles?page=1&limit=$SCROLLZERO_LIMIT"
  tmp_file="$CACHE_FILE.tmp.$$"
  response=$(curl_get "$url" 2>/dev/null) || {
    log "article request failed"
    return 1
  }
  valid_articles_response "$response" || {
    log "article response failed validation"
    return 1
  }
  printf '%s' "$response" > "$tmp_file" || return 1
  mv "$tmp_file" "$CACHE_FILE"
  log "article cache updated"
}

extract_titles() {
  if command -v jq >/dev/null 2>&1; then
    jq -r '.items[]?.title // empty' "$CACHE_FILE" 2>/dev/null | head -n "$SCROLLZERO_LIMIT"
    return
  fi
  # Dependency-free fallback for minimal Kindle environments.
  tr '{' '\n' < "$CACHE_FILE" |
    sed -n 's/.*"title":"\([^"\\]*\).*/\1/p' |
    head -n "$SCROLLZERO_LIMIT"
}

render_articles() {
  [ -s "$CACHE_FILE" ] || {
    show_message "Scroll Zero" "No cached articles" "Choose Refresh feed first"
    return 1
  }
  titles=$(extract_titles)
  [ -n "$titles" ] || {
    show_message "Scroll Zero" "No article titles found" "Check the API response"
    return 1
  }
  {
    printf '%s\n' "SCROLL ZERO" "Latest articles" ""
    number=1
    printf '%s\n' "$titles" | while IFS= read -r title; do
      [ -n "$title" ] || continue
      printf '%s. %s\n' "$number" "$title"
      number=$((number + 1))
    done
    printf '%s\n' "" "Updated: $(date '+%Y-%m-%d %H:%M')"
  } | show_message_from_stdin
  return 0
}

health() {
  response=$(curl_get "${SCROLLZERO_API_BASE_URL%/}/health" 2>/dev/null) || {
    log "health request failed"
    show_message "Scroll Zero API" "Unavailable" "$SCROLLZERO_API_BASE_URL"
    return 1
  }
  show_message "Scroll Zero API" "Reachable" "$response"
}

if ! valid_config; then
  log "invalid configuration"
  show_message "Scroll Zero" "Invalid config.env" "Set API URL, limit, timeout"
  exit 1
fi

case "${1:-refresh}" in
  refresh)
    if fetch; then
      render_articles
    else
      show_message "Scroll Zero" "Refresh failed" "Showing cached feed"
      render_articles
    fi
    ;;
  show) render_articles ;;
  health) health ;;
  *) show_message "Usage" "refresh | show | health"; exit 2 ;;
esac
