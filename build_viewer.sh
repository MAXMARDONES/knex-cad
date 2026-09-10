#!/bin/bash
# Assemble the viewer: docs/viewer.html = head + body (engine + embedded build injected) + scene + build + ui
cd "$(dirname "$0")"; KNX="${1:-builds/rig.knx}"
./build.sh >/dev/null || exit 1
node -e '
var fs=require("fs"); var eng=fs.readFileSync("dist/knex.js","utf8"); var knx=JSON.stringify(fs.readFileSync(process.argv[1],"utf8"));
var body=fs.readFileSync("viewer/02_body.html","utf8").replace("/*__ENGINE__*/",function(){return eng}).replace("/*__BUILD__*/\"\"",function(){return knx});
var out=fs.readFileSync("viewer/01_head.html","utf8")+body+fs.readFileSync("viewer/03_scene.js","utf8")+fs.readFileSync("viewer/03b_parts.js","utf8")+fs.readFileSync("viewer/04_build.js","utf8")+fs.readFileSync("viewer/08_stress.js","utf8")+fs.readFileSync("viewer/09_steps.js","utf8")+fs.readFileSync("viewer/06_physics.js","utf8")+fs.readFileSync("viewer/05_ui.js","utf8")+fs.readFileSync("viewer/10_params.js","utf8")+fs.readFileSync("viewer/07_physui.js","utf8");
fs.writeFileSync("docs/viewer.html",out); console.log("docs/viewer.html",out.length,"bytes, build",process.argv[1]);
' "$KNX"
