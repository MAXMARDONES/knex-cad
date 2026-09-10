/* .knx parser. One part per line, coordinates in lattice units (U = 37.5 mm) unless the U directive changes it.
   C name kind x,y,z [normal [ref]]     connector. LEAVE THE NORMAL OUT and the plane is worked out from the
                                        rods you attach; you are told if they are not coplanar. Any point may be NAME@dx,dy,dz
   H name kind x,y,z [ref]              connector with a rod through its hub (normal taken from that rod)
   S name kind x,y,z arm [ref]          side-on clip: x,y,z is the point ON the rod, arm points from hub to rod
   R a b [colour|flexi|flexi-colour]    rod between connectors (names) or points; colour inferred from length
   P x,y,z blue|silver                  spacer on the rod through that point
   X label x,y,z sx,sy,sz [#hex] [mass=g] [mu=] [pad=x,y mm shim] [fixed]  prop box (mm); with mass it is a physical body
   F name fx,fy,fz [label]              external force in newtons applied at that connector (a finger, a weight)
   E name a b [rest=mm] [k=N/mm]        rubber band: pulls only, never pushes
   Y name a b [via=c,d] [slack=mm]      string over guides: inextensible in tension, limp otherwise
   M name conn [rpm=] [torque=N.mm]     motor at a hub joint: spins the rod against whatever holds it
   L conn                               tan clip: locks that hub connector to its rod so they turn together
   O name x,y,z [d=mm] [mass=g] [mu=]   ball: a sphere with mass that rolls and collides
   A conn                               anchor: clamp that connector to the table, so the rig cannot tip or slide
   W name conn mass=g                   weight hung on that connector: ballast, a counterweight, a test load
   G name conn [teeth=]                 gear on that connector's axle; two gears that touch drive each other
   I kind=n colour=n ...                inventory available
   ! step title                         build step (everything below belongs to it)
   T title / U mm / # comment                                                                       */
KNEX.parse = function (text) {
  var V = KNEX.V, m = { title: "", U: KNEX.U, steps: [], conns: [], rods: [], spacers: [], extras: [], loads: [], tendons: [], motors: [], locks: [], gears: [], balls: [], anchors: [], weights: [], inventory: {}, errors: [] };
  var names = {}, step = -1;
  function err(ln, s) { m.errors.push({ line: ln, msg: s }); }
  function pt(tok, ln) {                      // "x,y,z" | "NAME@x,y,z" (offset from a connector, units)
    if (!tok) return null;
    var rel = null, at = tok.indexOf("@");
    if (at > 0) { rel = tok.slice(0, at); tok = tok.slice(at + 1); if (!names[rel]) { err(ln, "unknown connector '" + rel + "' in '" + rel + "@'"); return null; } }
    var p = tok.split(",").map(Number);
    if (p.length !== 3 || !p.every(isFinite)) { err(ln, "bad point '" + tok + "'"); return null; }
    return rel ? { rel: rel, off: p } : p;
  }
  function ax(tok, ln, what) { if (!tok) return null; var v = V.axis(tok); if (!v) err(ln, "bad " + what + " '" + tok + "'"); return v; }
  function ref(tok, ln) { return tok ? ax(tok, ln, "ref") : null; }
  text.split(/\r?\n/).forEach(function (raw, i) {
    var ln = i + 1, line = raw.replace(/(^|\s)#(?![0-9a-fA-F]{3,8}(\s|$)).*$/, "").trim(); if (!line) return;
    var t = line.split(/\s+/), op = t[0];
    if (op === "T") { m.title = t.slice(1).join(" "); return; }
    if (op === "U") { m.U = Number(t[1]) || KNEX.U; return; }
    if (op === "!") { m.steps.push({ title: t.slice(1).join(" "), line: ln }); step = m.steps.length - 1; return; }
    if (op === "I") { t.slice(1).forEach(function (kv) { var p = kv.split("="); m.inventory[p[0]] = Number(p[1]); }); return; }
    if (op === "C" || op === "H" || op === "S") {
      var name = t[1], kind = t[2], p = pt(t[3], ln);
      if (!name || !kind || !p) return err(ln, op + " needs: name kind x,y,z");
      if (!KNEX.KINDS[kind]) return err(ln, "unknown connector kind '" + kind + "' (W8 B7 Y5 G4 P4 R3 L2 O2 D1)");
      if (names[name]) return err(ln, "duplicate name '" + name + "'");
      var c = { name: name, kind: kind, at: p, mode: op, line: ln, step: step };
      if (op === "C") { c.normal = t[4] ? ax(t[4], ln, "normal") : null; c.auto = !t[4]; c.ref = ref(t[5], ln); }
      if (op === "H") { c.ref = ref(t[4], ln); }
      if (op === "S") { c.arm = ax(t[4], ln, "arm"); if (!c.arm) return; c.ref = ref(t[5], ln); }
      names[name] = c; m.conns.push(c); return;
    }
    if (op === "R") {
      var a = t[1], b = t[2], col = t[3] || null, flexi = false;
      if (!a || !b) return err(ln, "R needs two ends");
      var beam = false;
      t.slice(3).forEach(function (f) { if (f === "beam") beam = true; });
      if (beam && col === "beam") col = null;
      if (col && col.indexOf("flexi") === 0) { flexi = true; col = col.split("-")[1] || null; }
      if (col && !KNEX.ladder(col)) return err(ln, "unknown rod colour '" + col + "'");
      var A = a.indexOf(",") >= 0 ? pt(a, ln) : (names[a] ? a : err(ln, "unknown connector '" + a + "'"));
      var B = b.indexOf(",") >= 0 ? pt(b, ln) : (names[b] ? b : err(ln, "unknown connector '" + b + "'"));
      if (A === undefined || B === undefined) return;
      if (A == null || B == null) return;
      m.rods.push({ a: A, b: B, color: col, flexi: flexi, beam: beam || flexi, line: ln, step: step }); return;
    }
    if (op === "P") { var q = pt(t[1], ln); if (!q) return; m.spacers.push({ at: q, size: t[2] || "blue", line: ln, step: step }); return; }
    if (op === "X") { var q2 = pt(t[2], ln), sz = pt(t[3], ln); if (!q2 || !sz) return;
      var x = { label: t[1], at: q2, size: sz, color: "#6B7280", mass: 0, mu: null, pad: [0, 0], fixed: false, line: ln, step: step };
      t.slice(4).forEach(function (f) {
        if (f[0] === "#") x.color = f;
        else if (f === "fixed") x.fixed = true;
        else if (f.indexOf("mass=") === 0) x.mass = Number(f.slice(5));
        else if (f.indexOf("mu=") === 0) x.mu = Number(f.slice(3));
        else if (f.indexOf("pad=") === 0) { var q = f.slice(4).split(",").map(Number); x.pad = [q[0] || 0, q.length > 1 ? q[1] : q[0] || 0]; }
        else err(ln, "X: unknown option '" + f + "'");
      });
      m.extras.push(x); return; }
    if (op === "F") {
      var v = pt(t[2], ln); if (!t[1] || !v) return err(ln, "F needs: connector fx,fy,fz");
      if (!names[t[1]]) return err(ln, "F: unknown connector '" + t[1] + "'");
      m.loads.push({ at: t[1], F: v, name: t.slice(3).join(" ") || t[1], line: ln, step: step }); return;
    }
    if (op === "E" || op === "Y") {
      var nm = t[1], ea = t[2], eb = t[3];
      if (!nm || !ea || !eb) return err(ln, op + " needs: name a b");
      var el = { name: nm, a: ea, b: eb, via: [], kind: op === "E" ? "band" : "string", line: ln, step: step };
      t.slice(4).forEach(function (f) {
        if (f.indexOf("via=") === 0) el.via = f.slice(4).split(",");
        else if (f.indexOf("rest=") === 0) el.rest = Number(f.slice(5));
        else if (f.indexOf("k=") === 0) el.k = Number(f.slice(2));
        else if (f.indexOf("slack=") === 0) el.slack = Number(f.slice(6));
        else err(ln, op + ": unknown option '" + f + "'");
      });
      m.tendons.push(el); return;
    }
    if (op === "M") {
      var mo = { name: t[1], conn: t[2], rpm: 45, torque: 300, line: ln, step: step };
      if (!mo.name || !mo.conn) return err(ln, "M needs: name connector");
      t.slice(3).forEach(function (f) {
        if (f.indexOf("rpm=") === 0) mo.rpm = Number(f.slice(4));
        else if (f.indexOf("torque=") === 0) mo.torque = Number(f.slice(7));
        else err(ln, "M: unknown option '" + f + "'");
      });
      m.motors.push(mo); return;
    }
    if (op === "A") { if (!t[1]) return err(ln, "A needs a connector"); m.anchors.push({ conn: t[1], line: ln }); return; }
    if (op === "W") {
      var w = { name: t[1], conn: t[2], mass: 100, line: ln, step: step };
      if (!w.name || !w.conn) return err(ln, "W needs: name connector");
      t.slice(3).forEach(function (f) { if (f.indexOf("mass=") === 0) w.mass = Number(f.slice(5)); else err(ln, "W: unknown option '" + f + "'"); });
      m.weights.push(w); return;
    }
    if (op === "L") { if (!t[1]) return err(ln, "L needs a connector"); m.locks.push({ conn: t[1], line: ln }); return; }
    if (op === "G") {
      var g = { name: t[1], conn: t[2], teeth: 34, line: ln, step: step };
      if (!g.name || !g.conn) return err(ln, "G needs: name connector");
      t.slice(3).forEach(function (f) { if (f.indexOf("teeth=") === 0) g.teeth = Number(f.slice(6)); else err(ln, "G: unknown option '" + f + "'"); });
      m.gears.push(g); return;
    }
    if (op === "O") {
      var o = { label: t[1], at: pt(t[2], ln), d: 25, mass: 10, mu: null, line: ln, step: step };
      if (!o.label || !o.at) return err(ln, "O needs: name x,y,z");
      t.slice(3).forEach(function (f) {
        if (f.indexOf("d=") === 0) o.d = Number(f.slice(2));
        else if (f.indexOf("mass=") === 0) o.mass = Number(f.slice(5));
        else if (f.indexOf("mu=") === 0) o.mu = Number(f.slice(3));
        else if (f[0] === "#") o.color = f;
        else err(ln, "O: unknown option '" + f + "'");
      });
      m.balls.push(o); return;
    }
    err(ln, "unknown op '" + op + "'");
  });
  return m;
};
