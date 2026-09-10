#!/bin/bash
# Validate every pattern and render it to docs/patterns/*.svg|png
set -e
cd "$(dirname "$0")/.."
mkdir -p docs/patterns
./build.sh >/dev/null
fail=0
for f in patterns/*.knx; do
  n=$(basename "$f" .knx)
  printf "%-28s " "$n"
  node cli.js "$f" --quiet | tail -1
  node cli.js "$f" --quiet | tail -1 | grep -q "^0 errors" || fail=1
  # The checker only looks at geometry. A pattern can be legal and still tear itself apart under its
  # own weight, which is how 05-leaf-spring shipped broken: simulate every one and refuse a snapped
  # rod or a body that has left the desk.
  sim=$(node cli.js sim "$f" 2>&1)
  if grep -q "snapped out" <<<"$sim"; then
    echo "    BROKEN: $(grep -m1 -A1 'snapped out' <<<"$sim" | tail -1 | sed 's/^ *//')"
    fail=1
  fi
  if grep -q "more than half a metre" <<<"$sim"; then
    echo "    RAN AWAY: a body left the desk; it is held by nothing"
    fail=1
  fi
  node cli.js render "$f" "docs/patterns/$n.svg" --view iso --labels --width 900 --height 620 >/dev/null
done
python3 - <<'PY'
import glob, os
try:
    import cairosvg
    for f in sorted(glob.glob('docs/patterns/*.svg')):
        cairosvg.svg2png(url=f, write_to=f[:-4] + '.png', scale=1)
    print('rendered', len(glob.glob('docs/patterns/*.png')), 'pattern images')
except ImportError:
    print('svg written; install cairosvg for png')
PY
exit $fail
