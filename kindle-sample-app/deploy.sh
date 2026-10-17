#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
KINDLE_MOUNT=${KINDLE_MOUNT:-/Volumes/Kindle}
SOURCE="$ROOT/ScrollZero"
KO_SOURCE="$ROOT/koreader-plugin/scrollzero.koplugin"
TARGET="$KINDLE_MOUNT/extensions/ScrollZero"
KO_TARGET="$KINDLE_MOUNT/koreader/plugins/scrollzero.koplugin"

if [ "${1:-}" = "--help" ]; then
  printf '%s\n' "Usage: ./deploy.sh [--eject]" "" \
    "Builds the package and deploys ScrollZero to: $KINDLE_MOUNT" \
    "The Kindle's existing ScrollZero/config.env is preserved."
  exit 0
fi

if [ ! -d "$KINDLE_MOUNT" ] || [ ! -d "$KINDLE_MOUNT/documents" ]; then
  printf '%s\n' "Kindle is not mounted at $KINDLE_MOUNT" >&2
  exit 1
fi

if [ ! -d "$KINDLE_MOUNT/extensions" ]; then
  printf '%s\n' "Mounted device does not contain an extensions directory: $KINDLE_MOUNT" >&2
  exit 1
fi

if [ ! -f "$SOURCE/config.xml" ] || [ ! -f "$SOURCE/menu.json" ] || [ ! -f "$SOURCE/bin/scrollzero.sh" ]; then
  printf '%s\n' "Source extension is incomplete: $SOURCE" >&2
  exit 1
fi

if [ ! -f "$KO_SOURCE/main.lua" ] || [ ! -f "$KO_SOURCE/_meta.lua" ]; then
  printf '%s\n' "KOReader plugin is incomplete: $KO_SOURCE" >&2
  exit 1
fi

printf '%s\n' "Building Scroll Zero package..."
"$ROOT/package.sh" >/dev/null

mkdir -p "$TARGET"

# Preserve device-local settings, while making the deployed code match the
# source tree exactly. --delete is scoped to this one extension directory.
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete --exclude config.env "$SOURCE/" "$TARGET/"
else
  # macOS normally includes rsync, but keep a portable fallback.
  find "$TARGET" -mindepth 1 -maxdepth 1 ! -name config.env -exec rm -rf {} +
  ditto "$SOURCE/bin" "$TARGET/bin"
  ditto "$SOURCE/config.xml" "$TARGET/config.xml"
  ditto "$SOURCE/menu.json" "$TARGET/menu.json"
fi

if [ ! -f "$TARGET/config.env" ]; then
  cp "$SOURCE/config.env" "$TARGET/config.env"
fi

if [ -d "$KINDLE_MOUNT/koreader/plugins" ]; then
  mkdir -p "$KO_TARGET"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$KO_SOURCE/" "$KO_TARGET/"
  else
    find "$KO_TARGET" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    ditto "$KO_SOURCE" "$KO_TARGET"
  fi
  find "$KO_TARGET" -name '._*' -type f -delete 2>/dev/null || true
  printf '%s\n' "KOReader plugin: $KO_TARGET"
else
  printf '%s\n' "KOReader directory not found; KUAL shell app was deployed only."
fi

# Make the launcher executable when the mounted filesystem supports Unix mode
# bits. KUAL can also invoke it through `sh`, so this is best-effort.
chmod +x "$TARGET/bin/scrollzero.sh" 2>/dev/null || true

# macOS can create AppleDouble metadata files on removable volumes. They are
# not part of the extension and can confuse Kindle launchers.
find "$TARGET" -name '._*' -type f -delete 2>/dev/null || true

# Remove only the extension's known stale lock and macOS metadata. The app's
# 120-second lock TTL is the primary recovery mechanism once it is running.
if [ -d "$KINDLE_MOUNT/scrollzero-sample/.lock" ]; then
  rm -f "$KINDLE_MOUNT/scrollzero-sample/.lock/pid" \
    "$KINDLE_MOUNT/scrollzero-sample/.lock/started" 2>/dev/null || true
  rmdir "$KINDLE_MOUNT/scrollzero-sample/.lock" 2>/dev/null || true
fi
find "$KINDLE_MOUNT/scrollzero-sample" -name '._*' -type f -delete 2>/dev/null || true

printf '%s\n' "Deployed: $TARGET" "API: $(sed -n 's/^SCROLLZERO_API_BASE_URL=//p' "$TARGET/config.env" | sed -n '1p')"

if [ "${1:-}" = "--eject" ]; then
  diskutil eject "$KINDLE_MOUNT" >/dev/null
  printf '%s\n' "Kindle ejected safely."
else
  printf '%s\n' "Safely eject the Kindle before unplugging it."
fi
