#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
VERSION=$(sed -n '1p' "$ROOT/VERSION")
DIST="$ROOT/dist"
ARCHIVE="$DIST/scrollzero-kindle-$VERSION.zip"
STAGE=$(mktemp -d "${TMPDIR:-/tmp}/scrollzero-package.XXXXXX")

cleanup() {
  rm -rf "$STAGE"
}
trap cleanup EXIT INT TERM

mkdir -p "$DIST"
rm -f "$ARCHIVE"

mkdir -p "$STAGE/extensions"
cp -R "$ROOT/ScrollZero" "$STAGE/extensions/ScrollZero"
mkdir -p "$STAGE/koreader/plugins"
cp -R "$ROOT/koreader-plugin/scrollzero.koplugin" "$STAGE/koreader/plugins/scrollzero.koplugin"
(cd "$STAGE" && zip -q -r "$ARCHIVE" extensions/ScrollZero koreader/plugins/scrollzero.koplugin)
printf '%s\n' "$ARCHIVE"
