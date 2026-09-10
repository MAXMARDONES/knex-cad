/* Modules: design a sub-assembly once, place it many times.
     MOD leg              define; everything until END is the module's body
       C A W8 0,0,0
       R A ^FRAME         a ^name refers OUT of the module, to something already placed
     END
     USE leg L1 at=-2,-2,0
     USE leg L2 at=2,-2,0 rot=z180 mirror=x
   Names inside become prefix.name, so a module can be placed as often as you like.
   Rotations are quarter turns about an axis, because anything else leaves the lattice. */
KNEX.expand = function (text) {
  var V = KNEX.V, out = [], mods = {}, cur = null, errors = [];
  function rot90(p, axis, times) {
    var q = p.slice();
    for (var i = 0; i < times; i++) {
      if (axis === "z") q = [-q[1], q[0], q[2]];
      else if (axis === "x") q = [q[0], -q[2], q[1]];
      else q = [q[2], q[1], -q[0]];
    }
    return q;
  }
  function xform(p, t) {
    var q = p.slice();
    if (t.mirror) { var ax = "xyz".indexOf(t.mirror); q[ax] = -q[ax]; }
    if (t.rot) q = rot90(q, t.rot.axis, t.rot.times);
    return [q[0] + t.at[0], q[1] + t.at[1], q[2] + t.at[2]];
  }
  function xdir(tok, t) {                                   // a direction: rotate and mirror, never translate
    var v = V.axis(tok); if (!v) return tok;
    var q = v.slice();
    if (t.mirror) { var ax = "xyz".indexOf(t.mirror); q[ax] = -q[ax]; }
    if (t.rot) q = rot90(q, t.rot.axis, t.rot.times);
    return q.map(function (n) { return Math.abs(n) < 1e-9 ? 0 : Number(n.toFixed(6)); }).join(",");
  }
  function isPoint(tok) { return tok && tok.indexOf(",") >= 0 && tok.split(",").length === 3 && tok.split(",").every(function (n) { return isFinite(Number(n)); }); }
  function nameOf(tok, t, defined) {
    if (tok[0] === "^") return tok.slice(1);                // reach outside the module
    return defined[tok] ? t.prefix + "." + tok : tok;
  }
  function place(mod, t, ln) {
    var defined = {};
    mod.forEach(function (l) { var k = l.trim().split(/\s+/); if (["C", "H", "S"].indexOf(k[0]) >= 0 && k[1]) defined[k[1]] = 1; });
    mod.forEach(function (raw) {
      var k = raw.trim().split(/\s+/), op = k[0];
      function P(i) { if (k[i] && isPoint(k[i])) k[i] = xform(k[i].split(",").map(Number), t).join(","); }
      function D(i) { if (k[i]) k[i] = xdir(k[i], t); }
      function N(i) { if (k[i]) k[i] = nameOf(k[i], t, defined); }
      if (op === "C") { N(1); P(3); D(4); D(5); }
      else if (op === "H") { N(1); P(3); D(4); }
      else if (op === "S") { N(1); P(3); D(4); D(5); }
      else if (op === "R") { for (var i = 1; i <= 2; i++) { if (isPoint(k[i])) P(i); else N(i); } }
      else if (op === "P" || op === "O") { P(1); }
      else if (op === "X") { P(2); }
      else if (op === "F") { N(1); P(2); }
      else if (op === "E" || op === "Y") { N(1); N(2); N(3); }
      else if (op === "M" || op === "G") { N(1); N(2); }
      else if (op === "L" || op === "A" || op === "Z") { N(1); }
      else if (op === "W") { N(1); N(2); }
      out.push(k.join(" "));
    });
  }
  text.split(/\r?\n/).forEach(function (raw, i) {
    var ln = i + 1, line = raw.replace(/(^|\s)#(?![0-9a-fA-F]{3,8}(\s|$)).*$/, "").trim();
    var t = line.split(/\s+/);
    if (t[0] === "MOD") {
      if (cur) errors.push({ line: ln, msg: "MOD " + t[1] + " inside MOD " + cur.name });
      cur = { name: t[1], body: [] }; mods[t[1]] = cur.body; return;
    }
    if (t[0] === "END") { if (!cur) errors.push({ line: ln, msg: "END without MOD" }); cur = null; return; }
    if (cur) { if (line) cur.body.push(line); return; }
    if (t[0] === "USE") {
      var mod = mods[t[1]];
      if (!mod) { errors.push({ line: ln, msg: "USE: no module named '" + t[1] + "'" }); return; }
      if (!t[2]) { errors.push({ line: ln, msg: "USE " + t[1] + ": needs a name prefix" }); return; }
      var tr = { prefix: t[2], at: [0, 0, 0], rot: null, mirror: null };
      t.slice(3).forEach(function (o) {
        if (o.indexOf("at=") === 0) { var p = o.slice(3).split(",").map(Number); if (p.length === 3 && p.every(isFinite)) tr.at = p; else errors.push({ line: ln, msg: "USE: bad at=" }); }
        else if (o.indexOf("rot=") === 0) {
          var m = /^([xyz])(90|180|270)$/.exec(o.slice(4));
          if (m) tr.rot = { axis: m[1], times: Number(m[2]) / 90 }; else errors.push({ line: ln, msg: "USE: rot must be x90, z180 and so on (quarter turns keep the lattice)" });
        } else if (o.indexOf("mirror=") === 0) { if ("xyz".indexOf(o.slice(7)) >= 0) tr.mirror = o.slice(7); else errors.push({ line: ln, msg: "USE: mirror must be x, y or z" }); }
        else errors.push({ line: ln, msg: "USE: unknown option '" + o + "'" });
      });
      place(mod, tr, ln); return;
    }
    out.push(raw);
  });
  if (cur) errors.push({ line: 0, msg: "MOD " + cur.name + " is never closed with END" });
  return { text: out.join("\n"), errors: errors, modules: Object.keys(mods) };
};
