#!/usr/bin/env bash
# Feed the live bench. Reads the hook payload on stdin and posts a one-line summary to the session feed.
# Silent and harmless when no live server is running.
set -euo pipefail
PORT="${KNEX_LIVE_PORT:-8730}"
payload="$(cat)"
line="$(printf '%s' "$payload" | node -e '
let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
  let j = {}; try { j = JSON.parse(s); } catch (e) { process.exit(0); }
  const name = j.tool_name || "", i = j.tool_input || {};
  let text = name;
  if (i.file_path) text = name + "  " + String(i.file_path).replace(process.env.PWD + "/", "");
  else if (i.command) text = "bash  " + String(i.command).split("\n")[0].slice(0, 140);
  process.stdout.write(text);
});' 2>/dev/null || true)"
[ -n "$line" ] || exit 0
curl -s -m 1 -X POST "http://localhost:$PORT/log" \
  -H 'Content-Type: application/json' \
  -d "$(node -e 'process.stdout.write(JSON.stringify({kind:"tool",text:process.argv[1]}))' "$line")" >/dev/null 2>&1 || true
exit 0
