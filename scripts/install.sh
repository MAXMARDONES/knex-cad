#!/bin/bash
# One clean install. Builds the engine, checks the toolchain, and tells you what is missing.
set -e
cd "$(dirname "$0")/.."
ok() { printf "  \033[32mok\033[0m   %s\n" "$1"; }
no() { printf "  \033[31mmiss\033[0m %s\n" "$1"; }
warn() { printf "  \033[33mopt\033[0m  %s\n" "$1"; }

echo "knex-cad install"
echo
echo "required"
if command -v node >/dev/null; then ok "node $(node --version)  (18 or newer)"; else no "node — install from nodejs.org, 18 or newer"; exit 1; fi
if command -v bash >/dev/null; then ok "bash"; else no "bash"; exit 1; fi
echo
echo "optional"
if python3 -c "import cairosvg" 2>/dev/null; then ok "python3 + cairosvg — SVG output also written as PNG";
else warn "python3 + cairosvg — without it you get SVG only. pip install cairosvg"; fi
if command -v gh >/dev/null; then ok "gh — only used if you want to fork or open issues"; else warn "gh — not needed"; fi
echo
echo "building"
./build.sh | sed 's/^/  /'
node cli.js builds/rig.knx --quiet | tail -1 | sed 's/^/  example model: /'
./build_viewer.sh builds/rig.knx | sed 's/^/  /'
echo
echo "try it"
echo "  node cli.js parts                       the catalogue and the rules"
echo "  node cli.js builds/rig.knx              check the example"
echo "  node cli.js sim builds/rig.knx          simulate it"
echo "  open docs/viewer.html                   the 3D bench"
