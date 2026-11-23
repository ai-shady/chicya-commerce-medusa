#!/usr/bin/env bash
# List upstream commits that have not been reviewed/ported yet.
#
# Usage: ./scripts/upstream-gap.sh [--stat]
set -euo pipefail

# Last upstream commit we fully reviewed. Keep in sync with docs/upstream-sync.md
SYNCED="f677db4"

cd "$(git rev-parse --show-toplevel)"

git fetch upstream --prune --tags --quiet

echo "upstream/main : $(git rev-parse --short upstream/main) $(git log -1 --format=%s upstream/main)"
echo "last reviewed : $SYNCED $(git log -1 --format=%s "$SYNCED")"
echo

if [ "$(git rev-parse upstream/main)" = "$(git rev-parse "$SYNCED")" ]; then
  echo "Up to date. Nothing to review."
  exit 0
fi

if [ "${1:-}" = "--stat" ]; then
  git log --no-merges --stat --format="%n=== %h %s (%ad)" --date=short "$SYNCED..upstream/main"
else
  git log --no-merges --format="%h %ad %s" --date=short "$SYNCED..upstream/main"
fi
