<script>
/* Live mode: when the page is served by `knex-cad live`, it hot-reloads the model and shows a running
   log of what an agent is doing — its notes, the files it touches, and the images it looks at. */
var LIVE = { on: false, es: null, log: [] };
function liveInit() {
  if (!location.port || location.protocol === "file:") return;
  var es;
  try { es = new EventSource("/events"); } catch (e) { return; }
  LIVE.es = es;
  es.onopen = function () { LIVE.on = true; document.getElementById("live").className = "live on"; document.getElementById("livetxt").textContent = "live · watching"; };
  es.onerror = function () { LIVE.on = false; document.getElementById("live").className = "live"; document.getElementById("livetxt").textContent = "live · reconnecting"; };
  es.onmessage = function (m) {
    var ev; try { ev = JSON.parse(m.data); } catch (e) { return; }
    if (ev.kind === "engine") { location.reload(); return; }
    if (ev.kind === "build") {
      if (ev.data.knx && ev.data.knx !== CURRENT) render(ev.data.knx, "live");
      document.getElementById("updated").textContent = "compiled " + new Date(ev.t).toLocaleTimeString() +
        (ev.data.errors ? " · " + ev.data.errors + " errors" : "");
      liveAdd({ kind: "build", text: ev.data.file + " · " + ev.data.conns + " connectors, " + ev.data.rods + " rods, " +
                (ev.data.errors ? ev.data.errors + " errors" : "clean") }, ev.t);
      return;
    }
    if (ev.kind === "log") liveAdd(ev.data, ev.t);
  };
}
function liveAdd(d, t) {
  LIVE.log.push({ d: d, t: t });
  if (LIVE.log.length > 300) LIVE.log.shift();
  var box = document.getElementById("liveLog"); if (!box) return;
  var row = document.createElement("div");
  row.className = "ev " + (d.kind || "note");
  var time = new Date(t || Date.now()).toLocaleTimeString();
  var head = "<b>" + (d.kind || "note") + "</b> <span class='t'>" + time + "</span>";
  var body = "";
  if (d.text) body += "<div class='tx'>" + String(d.text).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }) + "</div>";
  if (d.image) body += "<img src='" + d.image + "' alt='' loading='lazy'>";
  row.innerHTML = head + body;
  box.appendChild(row);
  if (document.getElementById("liveFollow").checked) box.scrollTop = box.scrollHeight;
  var n = document.getElementById("liveCount"); if (n) n.textContent = LIVE.log.length;
}
</script>
