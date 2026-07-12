#!/usr/bin/env bash
# build.sh — assemble a lean publish folder (dist/) containing ONLY the files
# the live site actually uses. Your full asset masters stay in assets/ untouched.
#
# Why: `netlify deploy --dir .` would upload the entire 1.4 GB folder (including
# 1.23 GB of unused video masters). Deploying dist/ instead ships ~112 MB.
#
# Usage:
#   ./build.sh                 # rebuild dist/
#   netlify deploy --dir dist --site a8f14c41-afa4-403c-88d4-25168a148c15            # draft preview URL
#   netlify deploy --dir dist --site a8f14c41-afa4-403c-88d4-25168a148c15 --prod     # publish to production

set -euo pipefail
cd "$(dirname "$0")"

echo "→ Finding assets referenced by the site…"
grep -ohE 'assets/[A-Za-z0-9_./-]+\.(mp4|jpg|jpeg|png|webp|svg|gif)' \
  index.html insights.html script.js style.v2.css style.css 2>/dev/null \
  | sed 's#assets/##' | sort -u > /tmp/_used_assets.txt
echo "  $(wc -l < /tmp/_used_assets.txt) assets used."

echo "→ Rebuilding dist/…"
rm -rf dist
mkdir -p dist/assets
cp index.html insights.html style.css style.v2.css script.js dist/

while read -r f; do
  [ -n "$f" ] || continue
  if [ -f "assets/$f" ]; then
    cp "assets/$f" "dist/assets/$f"
  else
    echo "  WARN: referenced asset missing → $f"
  fi
done < /tmp/_used_assets.txt

echo "✓ dist/ built — $(du -sh dist | cut -f1) ($(ls dist/assets | wc -l | tr -d ' ') assets)"
echo "  Preview:  netlify deploy --dir dist --site a8f14c41-afa4-403c-88d4-25168a148c15"
echo "  Publish:  netlify deploy --dir dist --site a8f14c41-afa4-403c-88d4-25168a148c15 --prod"
