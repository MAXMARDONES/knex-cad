#!/usr/bin/env node
/* knex-cad replay <transcript.jsonl> — reconstruct a session feed from a Claude Code transcript.
   Streams the file, so a huge transcript costs nothing but time, and posts what the live bench would
   have shown: the reasoning, the tool uses, and the images the agent looked at.
     node cli.js replay run.jsonl [--port 8730] [--out feed.json] [--speed 0] [--quiet] */
var fs = require("fs"), readline = require("readline"), http = require("http"), path = require("path");
module.exports = function replay(args) {
  function opt(f, d) { var i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; }
  var file = args.filter(function (a) { return a.slice(0, 2) !== "--"; })[1];
  if (!file) { console.error("usage: node cli.js replay transcript.jsonl [--port 8730] [--out feed.json]"); process.exit(2); }
  var port = Number(opt("--port", 8730)), out = opt("--out"), speed = Number(opt("--speed", 0));
  var events = [], counts = { reasoning: 0, thinking: 0, tool: 0, image: 0, result: 0, redacted: 0, skipped: 0 };
  function firstLines(x) {
    var keep = String(x).split("\n").filter(function (l) { return /\bERR\b|error|FAIL|warn|not a K'NEX length|0 errors/i.test(l); });
    return (keep.length ? keep : String(x).split("\n")).slice(0, 5).join("\n").slice(0, 500);
  }

  function summarise(name, input) {                       // one line, never the file contents
    input = input || {};
    if (input.file_path) return name + "  " + String(input.file_path).split("/").slice(-2).join("/");
    if (input.command) return "bash  " + String(input.command).split("\n")[0].slice(0, 160);
    if (input.pattern) return name + "  /" + input.pattern + "/";
    if (input.path) return name + "  " + String(input.path).split("/").slice(-2).join("/");
    if (input.url) return name + "  " + input.url;
    if (input.prompt) return name + "  " + String(input.prompt).slice(0, 120);
    if (input.description) return name + "  " + input.description;
    return name;
  }
  function push(kind, text, image, t) {
    events.push({ kind: kind, text: text, image: image, t: t });
    counts[kind] = (counts[kind] || 0) + 1;
  }
  var rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
  rl.on("line", function (line) {
    if (!line.trim()) return;
    var j; try { j = JSON.parse(line); } catch (e) { counts.skipped++; return; }
    var t = Date.parse(j.timestamp || j.ts || "") || null;
    var msg = j.message || j;
    var content = msg && msg.content;
    if (typeof content === "string") { if (j.type === "assistant") push("reasoning", content.trim(), null, t); return; }
    if (!Array.isArray(content)) return;
    content.forEach(function (b) {
      if (!b || !b.type) return;
      if (b.type === "text" && b.text && b.text.trim()) push("reasoning", b.text.trim(), null, t);
      else if (b.type === "tool_use") push("tool", summarise(b.name, b.input), null, t);
      else if (b.type === "thinking") { if (b.thinking && b.thinking.trim()) push("thinking", b.thinking.trim(), null, t); else counts.redacted++; }
      else if (b.type === "tool_result") {
        var c = b.content;
        if (typeof c === "string") { if (b.is_error || /\bERR\b|error|FAIL|not a K'NEX length/i.test(c)) push("result", firstLines(c), null, t); }
        else if (Array.isArray(c)) c.forEach(function (r) {
          if (r && r.type === "image" && r.source && r.source.data)
            push("image", "an image the agent looked at", "data:" + (r.source.media_type || "image/png") + ";base64," + r.source.data, t);
          else if (r && r.type === "text" && r.text && (/\bERR\b|error|FAIL/i.test(r.text))) push("result", firstLines(r.text), null, t);
        });
      }
    });
  });
  rl.on("close", function () {
    events.sort(function (a, b) { return (a.t || 0) - (b.t || 0); });
    if (out) fs.writeFileSync(out, JSON.stringify(events, null, 1));
    var i = 0, sent = 0, failed = 0;
    function next() {
      if (i >= events.length) {
            if (counts.redacted) console.log("note: " + counts.redacted + " thinking blocks are in the transcript but their text is not stored, so the reasoning cannot be recovered");
        console.log("replayed " + sent + " events" + (failed ? ", " + failed + " failed to post" : "") +
                    "  (" + Object.keys(counts).filter(function (k) { return counts[k]; }).map(function (k) { return counts[k] + " " + k; }).join(", ") + ")");
        if (out) console.log("saved to " + out);
        return;
      }
      var e = events[i++];
      var body = JSON.stringify({ kind: e.kind === "thinking" ? "reasoning" : e.kind, text: e.text, image: e.image });
      var req = http.request({ host: "localhost", port: port, path: "/log", method: "POST",
                               headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
        function (res) { res.resume(); sent++; setTimeout(next, speed); });
      req.on("error", function () { failed++; setTimeout(next, speed); });
      req.end(body);
    }
    next();
  });
};
