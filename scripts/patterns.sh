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
