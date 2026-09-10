#!/bin/bash
# Assemble the viewer: docs/viewer.html = head + body (engine + embedded build injected) + scene + build + ui
cd "$(dirname "$0")"; KNX="${1:-builds/rig.knx}"
./build.sh >/dev/null || exit 1
node -e '
var fs=require("fs"); var eng=fs.readFileSync("dist/knex.js","utf8"); var knx=JSON.stringify(fs.readFileSync(process.argv[1],"utf8"));
/* Every .knx in builds/ rides along so the demo picker needs no server. Keyed by title, because that
   is what the reader recognises, falling back to the file name. */
var demos={}; fs.readdirSync("builds").filter(function(f){return /\.knx$/.test(f)}).sort().forEach(function(f){
  var src=fs.readFileSync("builds/"+f,"utf8"), t=(src.match(/^T\s+(.+)$/m)||[])[1];
  var key=(t?t.trim():f.replace(/\.knx$/,"")).slice(0,60);
  /* rig.knx and rig_leaf.knx carry the same T line. Keyed on title alone one would silently replace
     the other and the picker would be one demo short, so a clash keeps the file name too. */
  if (demos[key]!=null) key=key+" ("+f.replace(/\.knx$/,"")+")";
  demos[key]=src;
});
var body=fs.readFileSync("viewer/02_body.html","utf8").replace("/*__ENGINE__*/",function(){return eng}).replace("/*__BUILD__*/\"\"",function(){return knx}).replace("/*__DEMOS__*/{}",function(){return JSON.stringify(demos)});
var out=fs.readFileSync("viewer/01_head.html","utf8")+body+fs.readFileSync("viewer/03_scene.js","utf8")+fs.readFileSync("viewer/03b_parts.js","utf8")+fs.readFileSync("viewer/04_build.js","utf8")+fs.readFileSync("viewer/08_stress.js","utf8")+fs.readFileSync("viewer/09_steps.js","utf8")+fs.readFileSync("viewer/06_physics.js","utf8")+fs.readFileSync("viewer/05_ui.js","utf8")+fs.readFileSync("viewer/11_drag.js","utf8")+fs.readFileSync("viewer/12_live.js","utf8")+fs.readFileSync("viewer/13_hands.js","utf8")+fs.readFileSync("viewer/14_ui2.js","utf8")+fs.readFileSync("viewer/10_params.js","utf8")+fs.readFileSync("viewer/07_physui.js","utf8");
fs.writeFileSync("docs/viewer.html",out); console.log("docs/viewer.html",out.length,"bytes, build",process.argv[1]);
' "$KNX"

# Run the viewer's own code in Node with a stubbed browser. Catches the errors a syntax check cannot:
# undefined state, wrong load order, a throw that would freeze the page. Fails the build.
node scripts/smoke.js docs/viewer.html || {
  echo
  echo "the viewer built but does not run. docs/viewer.html was left in place so you can debug it," >&2
  echo "but do not ship it: fix the failures above and rebuild." >&2
  exit 1
}
