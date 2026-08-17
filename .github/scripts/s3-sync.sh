#!/bin/bash

# Uploads dist/ to S3 with an explicit content type per file type, then prunes objects that are no
# longer part of the build.
#
# Usage: S3_BUCKET=... .github/scripts/s3-sync.sh
#
# The two halves belong together: the prune pass is what proves the upload passes were complete.
# It re-runs the sync with --size-only and must upload nothing; anything it wants to send is a file
# that escaped the typed passes and would otherwise land with a guessed content type. The origin
# sends `nosniff`, so a wrong content type is a hard failure in the browser, not a cosmetic one.
#
# tools/distValidator.js enforces the same allowlist against dist/ before any credentials are
# requested, so this is the second of two gates, not the first.

# Exit on error
set -eu
set -o pipefail

: "${S3_BUCKET:?S3_BUCKET is not set}"

DEST="s3://${S3_BUCKET}/"

# Matches the nginx deployment on testnet-web1, which serves everything `no-cache,
# must-revalidate`. CloudFront still serves from the edge; it just revalidates via ETag. Switching
# the content-hashed bundles under request/ to `immutable` is a worthwhile follow-up, but is a
# behaviour change and should land as its own revertible commit rather than riding along with the
# origin move.
CACHE="no-cache, must-revalidate"

# $1=content-type  $2...=filters
put() {
    local ct="$1"
    shift
    aws s3 sync dist/ "$DEST" --no-progress --exclude "*" "$@" \
        --content-type "$ct" --cache-control "$CACHE"
}

# Content types mirror what testnet-web1 sends today, with three deliberate upgrades: nginx sends
# application/octet-stream for .woff2, .map and LICENSE because its mime.types predates them.
put "application/javascript; charset=utf-8" --include "*.js" --include "*.mjs"
put "text/css; charset=utf-8"               --include "*.css"
put "application/wasm"                      --include "*.wasm"
put "image/svg+xml"                         --include "*.svg"
put "font/woff2"                            --include "*.woff2"
put "image/png"                             --include "*.png"
put "image/x-icon"                          --include "*.ico"
put "application/json"                      --include "*.map"
put "text/plain; charset=utf-8"             --include "*/LICENSE" --include "*.gitkeep"

# HTML last -- this is the commit point; it carries the SRI hashes that pin every bundle uploaded
# above.
put "text/html; charset=utf-8" --include "*.html"
put "application/json"         --include "build-info.json"

# --size-only here means "don't re-upload". Everything already went up with the correct metadata,
# so this pass must upload NOTHING.
extra=$(aws s3 sync dist/ "$DEST" --delete --size-only --dryrun --no-progress \
          | grep '^(dryrun) upload:' || true)
if [ -n "$extra" ]; then
    echo "$extra"
    echo "::error::files above were not covered by a typed upload pass"
    exit 1
fi

aws s3 sync dist/ "$DEST" --delete --size-only --no-progress
