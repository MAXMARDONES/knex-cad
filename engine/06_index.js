/* Entry point: text -> { model, solved, issues, parts }. Steps carry the build order for the viewer. */
KNEX.build = function (text) {
  var m = KNEX.parse(text), s = KNEX.solve(m);
  m.errors.forEach(function (e) { s.issues.push({ level: "error", line: e.line, msg: e.msg }); });
  KNEX.check(m, s);
  s.issues.sort(function (a, b) { return (a.level === "error" ? 0 : 1) - (b.level === "error" ? 0 : 1) || (a.line || 0) - (b.line || 0); });
  s.title = m.title; s.U = m.U; s.steps = m.steps; s.inventory = m.inventory;
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
    extras: s.extras, loads: s.loads || []
  };
};
if (typeof module !== "undefined") module.exports = KNEX;
