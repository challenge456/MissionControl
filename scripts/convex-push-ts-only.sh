#!/usr/bin/env bash
# Push Convex using only .ts sources to avoid "Two output files share the same path" errors
# (convex/ has both .ts and .js; Convex bundles both and collides. Moving .js aside for the push.)
set -e
cd "$(dirname "$0")/.."
echo "[convex-push] Moving convex/**/*.js to .js.bak..."
find convex -name "*.js" -not -path "convex/_generated/*" -type f -exec mv {} {}.bak \;
restore() {
  echo "[convex-push] Restoring .js files..."
  find convex -name "*.js.bak" -type f -exec sh -c 'mv "$1" "${1%.bak}"' _ {} \;
}
trap restore EXIT
echo "[convex-push] Running npx convex dev --once..."
npx convex dev --once --typecheck disable
echo "[convex-push] Done."
