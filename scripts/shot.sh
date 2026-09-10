#!/bin/bash
# node-free screenshots of a build. Usage:
#   scripts/shot.sh builds/rig.knx out.png [view=iso] [step=4] [stress=1] [hide=props] [run=2]
# Any viewer URL parameter can be passed as key=value.
set -e
cd "$(dirname "$0")/.."
BUILD="${1:-builds/rig.knx}"; OUT="${2:-shot.png}"; shift 2 || true
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || CHROME="$(command -v chromium || command -v google-chrome)"
[ -x "$CHROME" ] || { echo "no Chrome found; install it or set CHROME"; exit 1; }
./build_viewer.sh "$BUILD" >/dev/null
Q=""; for kv in "$@"; do Q="${Q}&${kv}"; done
URL="file://$(pwd)/docs/viewer.html?shot=1${Q}"
"$CHROME" --headless=new --hide-scrollbars --window-size=1600,1000 \
  --use-gl=swiftshader \
  --virtual-time-budget=8000 --screenshot="$OUT" "$URL" 2>/dev/null
echo "$OUT  <-  $BUILD  ${Q#&}"
