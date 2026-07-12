#!/usr/bin/env bash
# compress.sh — build a LEAN, web-optimized dist/ from the master assets.
# Masters in assets/ are only READ, never modified.
#  • re-encode H.264 at constant quality; KEEP the re-encode only if it is
#    meaningfully smaller — otherwise fall back to a lossless faststart remux,
#    so a file can never come out bigger than it went in.
#  • +faststart on everything so <video> starts before fully downloaded.
#  • yuv420p for universal (incl. Safari) playback.
#  • ffmpeg gets -nostdin so it can't swallow this loop's input.
set -euo pipefail
cd "$(dirname "$0")"
FF="ffmpeg -nostdin -y -loglevel error"

echo "→ Collecting references…"
grep -oE 'data-full-src="assets/[^"]+"' index.html | sed 's#.*assets/##;s#"##' | sort -u > /tmp/_full.txt
grep -ohE 'assets/[A-Za-z0-9_./-]+\.(mp4|webm)' index.html insights.html script.js style.v2.css style.css 2>/dev/null \
  | sed 's#assets/##' | sort -u > /tmp/_vids.txt
grep -ohE 'assets/[A-Za-z0-9_./-]+\.(jpg|jpeg|png|webp|svg|gif)' index.html insights.html script.js style.v2.css style.css 2>/dev/null \
  | sed 's#assets/##' | sort -u > /tmp/_imgs.txt
echo "  $(wc -l < /tmp/_vids.txt | tr -d ' ') videos, $(wc -l < /tmp/_imgs.txt | tr -d ' ') images."

rm -rf dist; mkdir -p dist/assets
cp index.html insights.html style.css style.v2.css script.js dist/ 2>/dev/null || true
while read -r f; do [ -n "$f" ] && [ -f "assets/$f" ] && cp "assets/$f" "dist/assets/$f" || true; done < /tmp/_imgs.txt

echo "→ Processing videos…"
BEFORE=0; AFTER=0
while IFS= read -r f; do
  [ -n "$f" ] || continue
  src="assets/$f"; out="dist/assets/$f"; tmp="dist/assets/.tmp_$f"
  [ -f "$src" ] || { echo "  MISSING → $f"; continue; }
  if grep -qx "$f" /tmp/_full.txt; then BOX=1920; CRF=24; else BOX=1280; CRF=28; fi
  if ffprobe -v error -select_streams a -show_entries stream=codec_name -of csv=p=0 "$src" 2>/dev/null | grep -q .; then
    AUD=(-c:a aac -b:a 96k); else AUD=(-an); fi
  # attempt a re-encode
  $FF -i "$src" -c:v libx264 -crf $CRF -preset slow -pix_fmt yuv420p \
    -vf "scale=${BOX}:${BOX}:force_original_aspect_ratio=decrease:force_divisible_by=2" \
    -movflags +faststart "${AUD[@]}" "$tmp"
  b=$(stat -f%z "$src"); e=$(stat -f%z "$tmp")
  # keep re-encode only if it saves >5%; else lossless faststart remux
  if [ "$e" -lt $(( b * 95 / 100 )) ]; then
    mv "$tmp" "$out"; tag="re-encoded"
  else
    rm -f "$tmp"
    $FF -i "$src" -c copy -movflags +faststart "$out"
    tag="faststart-only"
  fi
  a=$(stat -f%z "$out"); BEFORE=$((BEFORE+b)); AFTER=$((AFTER+a))
  printf "  ✓ %-30s %5sK → %5sK  (%s)\n" "$f" $((b/1024)) $((a/1024)) "$tag"
done < /tmp/_vids.txt

echo ""
printf "✓ videos: %sM → %sM\n" $((BEFORE/1048576)) $((AFTER/1048576))
du -sh dist