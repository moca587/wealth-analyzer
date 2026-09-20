#!/bin/sh
# Dev entrypoint: keep the named node_modules volume in sync with the
# bind-mounted lockfile. A Compose Watch `rebuild` only refreshes the image;
# the volume is populated once and would otherwise stay stale forever.
#
# Stamp rules:
#   - missing .bin            → npm ci (empty volume, never seeded)
#   - .bin present, no stamp  → write stamp only (image/volume seed is fine)
#   - stamp ≠ lockfile hash   → npm ci (deps actually changed)
set -eu

STAMP=/workspace/node_modules/.package-lock.sha
LOCK=/workspace/package-lock.json

mkdir -p /workspace/node_modules /workspace/.next

if [ -f "$LOCK" ]; then
  HASH=$(sha256sum "$LOCK" | awk '{print $1}')

  if [ ! -d /workspace/node_modules/.bin ]; then
    echo "docker-entrypoint: node_modules empty; running npm ci…"
    npm ci
    echo "$HASH" > "$STAMP"
  elif [ ! -f "$STAMP" ]; then
    echo "$HASH" > "$STAMP"
  elif [ "$HASH" != "$(cat "$STAMP")" ]; then
    echo "docker-entrypoint: package-lock.json changed; running npm ci…"
    npm ci
    echo "$HASH" > "$STAMP"
  fi
fi

exec "$@"
