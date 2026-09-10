/* General rigid-body physics for any K'NEX build. SI units (m, kg, s, N, rad).
   Bodies come from the rigid partition; every hub and side-on joint becomes a real constraint;
   the desk is a contact plane with Coulomb friction; flexi rods are force elements; you can push
   anywhere with an external force. Sequential-impulse solver, Gauss-Seidel, Baumgarte stabilisation. */
KNEX.phys = (function () {
  var V = KNEX.V, G = 9.80665;
  // ---------- quaternion helpers (x, y, z, w)
  function qmul(a, b) { return [a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1], a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
                                a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3], a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]]; }
  function qnorm(q) { var n = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0]/n, q[1]/n, q[2]/n, q[3]/n]; }
  function qrot(q, v) {                                  // rotate v by q
    var t = V.mul(V.cross([q[0], q[1], q[2]], v), 2);
    return V.add(V.add(v, V.mul(t, q[3])), V.cross([q[0], q[1], q[2]], t));
  }
  function qmat(q) {                                     // rotation matrix
    var x=q[0],y=q[1],z=q[2],w=q[3];
    return [[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]];
  }
  function m3mul(A, B) { var O=[[0,0,0],[0,0,0],[0,0,0]]; for(var i=0;i<3;i++)for(var j=0;j<3;j++)for(var k=0;k<3;k++)O[i][j]+=A[i][k]*B[k][j]; return O; }
  function m3T(A) { return [[A[0][0],A[1][0],A[2][0]],[A[0][1],A[1][1],A[2][1]],[A[0][2],A[1][2],A[2][2]]]; }
  function m3v(A, v) { return [A[0][0]*v[0]+A[0][1]*v[1]+A[0][2]*v[2], A[1][0]*v[0]+A[1][1]*v[1]+A[1][2]*v[2], A[2][0]*v[0]+A[2][1]*v[1]+A[2][2]*v[2]]; }
  function m3inv(A) {
    var d = A[0][0]*(A[1][1]*A[2][2]-A[1][2]*A[2][1]) - A[0][1]*(A[1][0]*A[2][2]-A[1][2]*A[2][0]) + A[0][2]*(A[1][0]*A[2][1]-A[1][1]*A[2][0]);
    if (Math.abs(d) < 1e-18) return [[0,0,0],[0,0,0],[0,0,0]];
    return [[(A[1][1]*A[2][2]-A[1][2]*A[2][1])/d, (A[0][2]*A[2][1]-A[0][1]*A[2][2])/d, (A[0][1]*A[1][2]-A[0][2]*A[1][1])/d],
            [(A[1][2]*A[2][0]-A[1][0]*A[2][2])/d, (A[0][0]*A[2][2]-A[0][2]*A[2][0])/d, (A[0][2]*A[1][0]-A[0][0]*A[1][2])/d],
            [(A[1][0]*A[2][1]-A[1][1]*A[2][0])/d, (A[0][1]*A[2][0]-A[0][0]*A[2][1])/d, (A[0][0]*A[1][1]-A[0][1]*A[1][0])/d]];
  }
  // ---------- body
  function Body(i, m, c, I, fixed) {
    this.id = i; this.m = fixed ? 0 : m; this.invM = fixed ? 0 : 1 / m;
    this.x = c.slice(); this.x0 = c.slice(); this.q = [0, 0, 0, 1];
    this.v = [0, 0, 0]; this.w = [0, 0, 0];
    this.Ib = I; this.invIb = fixed ? [[0,0,0],[0,0,0],[0,0,0]] : m3inv(I);
    this.fixed = !!fixed; this.force = [0, 0, 0]; this.torque = [0, 0, 0];
  }
  Body.prototype.cacheI = function () { var R = qmat(this.q); this._iI = m3mul(m3mul(R, this.invIb), m3T(R)); return this._iI; };
  Body.prototype.invI = function () { return this._iI || this.cacheI(); };
  Body.prototype.toWorld = function (p0) { return V.add(this.x, qrot(this.q, V.sub(p0, this.x0))); };
  Body.prototype.pointVel = function (r) { return V.add(this.v, V.cross(this.w, r)); };
  Body.prototype.applyImpulse = function (r, P) {
    if (this.fixed) return;
    this.v = V.add(this.v, V.mul(P, this.invM));
    this.w = V.add(this.w, m3v(this.invI(), V.cross(r, P)));
  };
  Body.prototype.applyAngImpulse = function (L) { if (!this.fixed) this.w = V.add(this.w, m3v(this.invI(), L)); };
  return { G: G, Body: Body, qmul: qmul, qnorm: qnorm, qrot: qrot, qmat: qmat, m3v: m3v, m3inv: m3inv, m3mul: m3mul, m3T: m3T };
})();
