/* Small vector toolkit (arrays of 3). */
KNEX.V = (function () {
  var V = {};
  V.add = function (a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; };
  V.sub = function (a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; };
  V.mul = function (a, s) { return [a[0]*s, a[1]*s, a[2]*s]; };
  V.dot = function (a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; };
  V.cross = function (a, b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; };
  V.norm = function (a) { return Math.sqrt(V.dot(a, a)); };
  V.unit = function (a) { var n = V.norm(a); return n > 1e-12 ? V.mul(a, 1 / n) : [0, 0, 0]; };
  V.dist = function (a, b) { return V.norm(V.sub(a, b)); };
  V.eq = function (a, b, tol) { return V.dist(a, b) <= (tol || 1e-6); };
  V.angleDeg = function (a, b) { var c = V.dot(V.unit(a), V.unit(b)); return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI; };
  V.parallelDeg = function (a, b) { var d = V.angleDeg(a, b); return Math.min(d, 180 - d); };
  V.rot = function (v, axis, deg) {            // Rodrigues rotation
    var k = V.unit(axis), t = deg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    return V.add(V.add(V.mul(v, c), V.mul(V.cross(k, v), s)), V.mul(k, V.dot(k, v) * (1 - c)));
  };
  /* "x", "-y", "x+y", "-x-z", or "a,b,c" -> unit vector; null if unparsable */
  V.axis = function (tok) {
    if (!tok) return null;
    if (tok.indexOf(",") >= 0) { var p = tok.split(",").map(Number); return p.length === 3 && p.every(isFinite) ? V.unit(p) : null; }
    var m = tok.match(/[+-]?[xyz]/g); if (!m || m.join("") !== tok) return null;
    var v = [0, 0, 0];
    m.forEach(function (s) { var sg = s[0] === "-" ? -1 : 1; var ax = "xyz".indexOf(s[s.length - 1]); v[ax] += sg; });
    return V.norm(v) > 0 ? V.unit(v) : null;
  };
  V.axisName = function (v) {                  // nearest signed axis label for reports
    var best = 0, bi = 0; for (var i = 0; i < 3; i++) if (Math.abs(v[i]) > Math.abs(v[bi])) bi = i;
    return (v[bi] < 0 ? "-" : "") + "xyz"[bi];
  };
  /* orthonormal frame: e1 = ref projected into the plane normal to n, e2 = n x e1 */
  V.frame = function (n, ref) {
    n = V.unit(n);
    if (!ref || V.parallelDeg(ref, n) < 1) ref = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    var e1 = V.unit(V.sub(ref, V.mul(n, V.dot(ref, n))));
    return { n: n, e1: e1, e2: V.cross(n, e1) };
  };
  /* closest point parameter t (unclamped) and perpendicular distance of p to the line a->b */
  V.toLine = function (p, a, b) {
    var ab = V.sub(b, a), L2 = V.dot(ab, ab); if (L2 < 1e-12) return { t: 0, d: V.dist(p, a) };
    var t = V.dot(V.sub(p, a), ab) / L2; var q = V.add(a, V.mul(ab, t));
    return { t: t, d: V.dist(p, q), q: q };
  };
  /* minimum distance between segments p1-p2 and q1-q2 (Ericson) */
  V.segSeg = function (p1, p2, q1, q2) {
    var d1 = V.sub(p2, p1), d2 = V.sub(q2, q1), r = V.sub(p1, q1);
    var a = V.dot(d1, d1), e = V.dot(d2, d2), f = V.dot(d2, r), s, t, EPS = 1e-9;
    if (a <= EPS && e <= EPS) return V.dist(p1, q1);
    if (a <= EPS) { s = 0; t = Math.max(0, Math.min(1, f / e)); }
    else {
      var c = V.dot(d1, r);
      if (e <= EPS) { t = 0; s = Math.max(0, Math.min(1, -c / a)); }
      else {
        var b = V.dot(d1, d2), den = a * e - b * b;
        s = den !== 0 ? Math.max(0, Math.min(1, (b * f - c * e) / den)) : 0;
        t = (b * s + f) / e;
        if (t < 0) { t = 0; s = Math.max(0, Math.min(1, -c / a)); }
        else if (t > 1) { t = 1; s = Math.max(0, Math.min(1, (b - c) / a)); }
      }
    }
    return V.dist(V.add(p1, V.mul(d1, s)), V.add(q1, V.mul(d2, t)));
  };
  return V;
})();
