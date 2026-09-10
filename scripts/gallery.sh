#!/bin/bash
# Regenerate every image in the repo as a real 3D render of the model. Runs a few at a time.
set -e
cd "$(dirname "$0")/.."
mkdir -p docs/patterns docs/instructions
./build.sh >/dev/null
shot() { ./scripts/shot.sh "$@" >/dev/null && printf "  %s\n" "$2"; }
export -f shot 2>/dev/null || true

echo "hero and the worked example"
./scripts/shot.sh builds/rig.knx docs/hero.png view=iso w=1600 h=900 caption=0 >/dev/null && echo "  docs/hero.png"
./scripts/shot.sh builds/demo_mech.knx docs/patterns/demo-mech.png view=iso w=1300 h=800 \
  caption="motor, gears, string, band and ball" >/dev/null && echo "  docs/patterns/demo-mech.png"
./scripts/shot.sh builds/rig.knx docs/stress.png view=iso stress=1 run=1.2 w=1300 h=800 \
  caption="stress view: bearings and bending rods, coloured by how close they are to letting go" >/dev/null && echo "  docs/stress.png"

echo "patterns"
for f in patterns/*.knx; do
  n="$(basename "$f" .knx)"
  title="$(sed -n 's/^T //p' "$f" | head -1)"
  ./scripts/shot.sh "$f" "docs/patterns/$n.png" view=iso w=1000 h=680 caption="$title" >/dev/null
  echo "  docs/patterns/$n.png"
done

echo "instructions"
./build_viewer.sh builds/rig.knx >/dev/null && printf '%s' builds/rig.knx > docs/.viewer-build
export SHOT_NOBUILD=1
steps=$(grep -c '^! ' builds/rig.knx)
views=(iso iso2 low right)
for i in $(seq 1 "$steps"); do
  v="${views[$((i % 4))]}"
  ./scripts/shot.sh builds/rig.knx "$(printf 'docs/instructions/step%02d.png' "$i")" \
    view="$v" step="$i" follow=0 w=1200 h=800 >/dev/null
  printf "  step%02d.png (%s)\n" "$i" "$v"
done
./scripts/shot.sh builds/rig.knx docs/instructions/complete.png view=iso w=1200 h=800 caption="complete" >/dev/null
unset SHOT_NOBUILD
rm -f docs/patterns/*.svg docs/instructions/*.svg docs/hero.svg docs/.viewer-build
echo "done"
