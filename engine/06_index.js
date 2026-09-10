/* Entry point: text -> { model, solved, issues, parts }. Steps carry the build order for the viewer. */
KNEX.build = function (text) {
  var ex = KNEX.expand(text);
  var m = KNEX.parse(ex.text), s = KNEX.solve(m);
  ex.errors.forEach(function (e) { s.issues.push({ level: "error", line: e.line, msg: e.msg }); });
  s.modules = ex.modules;
  m.errors.forEach(function (e) { s.issues.push({ level: "error", line: e.line, msg: e.msg }); });
  KNEX.check(m, s);
  s.issues.sort(function (a, b) { return (a.level === "error" ? 0 : 1) - (b.level === "error" ? 0 : 1) || (a.line || 0) - (b.line || 0); });
  s.title = m.title; s.U = m.U; s.flex = !!m.flex; s.steps = m.steps; s.inventory = m.inventory;
  s.errors = s.issues.filter(function (i) { return i.level === "error"; }).length;
  s.warnings = s.issues.length - s.errors;
  return s;
};
/* plain-data export (no functions) for JSON / the viewer */
KNEX.toJSON = function (s) {
  if (!s.bodies) KNEX.bodies(s);
  var bodyOf = new Map(); (s.parts || []).forEach(function (p) { bodyOf.set(p.ref, p.body); });
  return {
    bodies: s.bodies.map(function (b) { return { id: b.id, m: b.m, c: b.c, prop: b.prop ? b.prop.label : null, fixed: !!b.fixed }; }),
    springs: (s.springs || []).map(function (x) { return { rod: x.rod, a: x.a, b: x.b, flexi: x.flexi, slides: x.slides, kLat: x.kLat }; }),
    bodyOf: bodyOf,
    title: s.title, U: s.U, steps: s.steps, parts: s.parts, mass_g: s.mass_g, jointCounts: s.jointCounts, stiffness: s.stiffness,
    issues: s.issues, errors: s.errors, warnings: s.warnings,
    conns: s.conns.map(function (K) { return { name: K.name, kind: K.kind, pos: K.pos, n: K.n, e1: K.e1, e2: K.e2, line: K.line, step: K.step, mode: K.mode, pair: K.pair || null, body: bodyOf.get(K),
      joints: K.joints.map(function (j) { return { type: j.type, slot: j.slot, t: j.t, rod: j.rod }; }) }; }),
    rods: s.rods.map(function (R) { return { id: R.id, color: R.color, flexi: R.flexi, beam: R.beam, body: bodyOf.get(R), bow: R.bow || 0, tan0: R.tan0 || null, tan1: R.tan1 || null, p0: R.p0, p1: R.p1, t0: R.t0, t1: R.t1, len: R.len, L: R.L, line: R.line, step: R.step,
      joints: R.joints.map(function (j) { return { type: j.type, conn: j.conn, slot: j.slot, t: j.t }; }) }; }),
    spacers: s.spacers.map(function (P) { return { pos: P.pos, n: P.n, size: P.size, th: P.th, step: P.step, body: bodyOf.get(s.rods[P.rod]) }; }),
    extras: s.extras, loads: s.loads || [],
    /* The mechanisms. These used to stop here: the viewer got connectors, rods and spacers and
       nothing else, so a rig held together by seventeen rubber bands drew as if it had none, and
       motors, gears, balls and ballast were invisible too. Anything the bench should be able to
       draw or label has to survive the trip through JSON. */
    tendons: (s.tendons || []).map(function (T) {
      return { name: T.name, kind: T.kind, rest: T.rest, L0: T.L0, k: T.k, line: T.line, step: T.step,
               pts: T.pts.map(function (p) { return { conn: p.conn || null, ball: p.ball || null, pos: p.pos }; }) };
    }),
    motors: (s.motors || []).map(function (M) { return { name: M.name, conn: M.conn, rpm: M.rpm, torque: M.torque, line: M.line, step: M.step }; }),
    gears:  (s.gears  || []).map(function (G) { return { name: G.name, conn: G.conn, r: G.r, teeth: G.teeth, mesh: G.mesh || [], line: G.line, step: G.step }; }),
    locks:  (s.locks  || []).map(function (L) { return { name: L.name, conn: L.conn, line: L.line, step: L.step }; }),
    balls:  (s.balls  || []).map(function (O) { return { label: O.label, pos: O.pos || (O.at ? KNEX.V.mul(O.at, s.U) : null), mass: O.mass, r: O.r, line: O.line, step: O.step }; }),
    weights: (s.weights || []).map(function (W) { return { label: W.label, conn: W.conn, pos: W.pos, mass: W.mass, line: W.line, step: W.step }; }),
    anchors: (s.anchors || []).map(function (A) { return { conn: A.conn, line: A.line }; })
  };
};
if (typeof module !== "undefined") module.exports = KNEX;
