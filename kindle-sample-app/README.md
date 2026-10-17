# Scroll Zero Kindle sample app

This directory contains a production-oriented KUAL extension for a jailbroken
Kindle. It fetches the latest processed articles from the Scroll Zero API and
renders a compact reading queue on the device.

It is intentionally shell-only so it can be used as a starting point before
cross-compiling a native Kindle application.

## Requirements

- A jailbroken Kindle with KUAL, KUAL Next, or KUALA installed.
- `curl` available on the Kindle (with HTTPS support for production).
- A Scroll Zero API reachable from the Kindle over Wi-Fi.

## Configure

Copy `config.env.example` to `ScrollZero/config.env` and set the API host. Use
HTTPS in production. Do not use `localhost` unless the API is running on the
Kindle itself.

```sh
SCROLLZERO_API_BASE_URL=https://www.scroll0.com/api
```

The sample calls `GET /api/articles?page=1&limit=5` and caches the successful
response at `/mnt/us/scrollzero-sample/cache/articles.json`.

## Install

Copy `ScrollZero` into the Kindle's `extensions` directory, safely eject the
device, open KUAL, and choose **Scroll Zero → Refresh feed**.

```text
Kindle USB root/
└── extensions/
    └── ScrollZero/
        ├── config.xml
        ├── menu.json
        ├── config.env
        └── bin/scrollzero.sh
```

The app also has **Show cached feed** and **API diagnostics** actions. Failed
network requests fall back to the last valid cache, and cache writes are
atomic so a power loss cannot leave a half-written response.

## Run on a computer

The script can be inspected on macOS/Linux. Set `KINDLE_ROOT` to a temporary
directory containing the extension; it will skip Kindle-specific screen
rendering and print the output instead.

```sh
KINDLE_ROOT=/tmp/kindle-sample \
  sh ScrollZero/bin/scrollzero.sh refresh
```

The default parser uses `jq` when available, then falls back to the minimal
JSON extraction tools commonly present on Kindles. For richer content, bundle
a pinned native/Lua client rather than depending on arbitrary device packages.

## Package a release

From this directory, run:

```sh
./package.sh
```

The command creates a versioned ZIP under `dist/`. Extract it at the Kindle USB
root; the archive contains both the KUAL extension and the KOReader plugin.

## Build and deploy from a mounted Kindle

With the Kindle mounted as `/Volumes/Kindle`, run:

```sh
./deploy.sh
```

The script validates the mount, builds the package, deploys the code into
`/Volumes/Kindle/extensions/ScrollZero`, preserves the Kindle's existing
`config.env`, and prints the configured API URL. Use `./deploy.sh --eject` to
safely eject the Kindle after deployment.

The deployment also installs a touch-interactive KOReader plugin into
`/Volumes/Kindle/koreader/plugins/scrollzero.koplugin`. Open it from KOReader's
Tools menu, or use **Scroll Zero → Open interactive UI in KOReader** in KUAL.
The plugin provides a paginated article queue, refresh/offline cache, search
through the queue, and scrollable article detail pages.
