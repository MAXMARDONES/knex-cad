#!/usr/bin/env node
/* Keep docs/INTERNALS.md honest: every source file must be named there, and every path it names must
   exist. Run by `npm test`; a new file with no entry in the map fails the build. */
var fs = require("fs"), path = require("path");
var ROOT = path.join(__dirname, "..");
var doc = fs.readFileSync(path.join(ROOT, "docs", "INTERNALS.md"), "utf8");
function list(dir, ext) {
  return fs.readdirSync(path.join(ROOT, dir)).filter(function (f) { return ext.test(f); }).map(function (f) { return dir + "/" + f; });
}
var files = list("engine", /\.js$/).concat(list("viewer", /\.(js|html)$/), list("scripts", /\.(js|sh|py)$/));
var unnamed = files.filter(function (f) { return doc.indexOf(f) < 0; });
var named = (doc.match(/`((?:engine|viewer|scripts|patterns|builds|docs)\/[A-Za-z0-9_.\-]+)`/g) || [])
  .map(function (m) { return m.replace(/`/g, ""); });
var missing = named.filter(function (f) { return !fs.existsSync(path.join(ROOT, f)); });
if (unnamed.length) console.error("docs/INTERNALS.md does not mention:\n  " + unnamed.join("\n  "));
if (missing.length) console.error("docs/INTERNALS.md names files that do not exist:\n  " + missing.join("\n  "));
if (!unnamed.length && !missing.length) console.log("docs/INTERNALS.md covers all " + files.length + " source files");
process.exit(unnamed.length || missing.length ? 1 : 0);
