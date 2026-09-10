#!/bin/bash
# Render a model in 3D, headless, straight to PNG. No UI in the picture.
#   scripts/shot.sh builds/rig.knx out.png [view=iso] [step=4] [stress=1] [run=2] [caption=...] [w=1600] [h=1000]
set -e
cd "$(dirname "$0")/.."
BUILD="${1:-builds/rig.knx}"; OUT="${2:-shot.png}"; shift 2 2>/dev/null || true
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || CHROME="$(command -v chromium || command -v google-chrome || true)"
[ -x "$CHROME" ] || { echo "no Chrome found. Set CHROME=/path/to/chrome" >&2; exit 1; }
W=1600; H=1000; Q="shot=1"
for kv in "$@"; do
  case "$kv" in w=*) W="${kv#w=}" ;; h=*) H="${kv#h=}" ;;
    caption=*) Q="$Q&caption=$(printf '%s' "${kv#caption=}" | sed 's/ /%20/g')" ;;
    *) Q="$Q&$kv" ;; esac
done
# only rebuild when the viewer does not already carry this model
STAMP="docs/.viewer-build"
if [ "${SHOT_NOBUILD:-0}" = "1" ] || { [ -f "$STAMP" ] && [ "$(cat "$STAMP")" = "$BUILD" ] && [ docs/viewer.html -nt "$BUILD" ]; }; then :;
else ./build_viewer.sh "$BUILD" >/dev/null && printf '%s' "$BUILD" > "$STAMP"; fi
OUT_ABS="$(cd "$(dirname "$OUT")" 2>/dev/null && pwd)/$(basename "$OUT")"
"$CHROME" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars \
  --window-size="$W,$H" --virtual-time-budget="${SHOT_BUDGET:-9000}" --screenshot="$OUT_ABS" \
  "file://$(pwd)/docs/viewer.html?$Q" >/dev/null 2>&1
[ -s "$OUT_ABS" ] || { echo "capture failed" >&2; exit 1; }
echo "$OUT  <-  $BUILD  ${Q#shot=1&}"
