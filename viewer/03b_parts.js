<script>
/* Accurate part geometry (patent numbers, see research/KNEX.md). Each part is merged into ONE BufferGeometry.
   Connector: local frame = (e1, e2, n): plane XY, hub axis Z. Rod: along local Y, centred at its middle. */
function mergeGeos(items) {                     // items: [{g, m}] -> one non-indexed geometry
  var pos = [], nor = [];
  items.forEach(function (it) {
    var g = it.g.index ? it.g.toNonIndexed() : it.g; if (it.m) g = g.clone().applyMatrix4(it.m);
    var p = g.attributes.position.array, n = g.attributes.normal.array;
    for (var i = 0; i < p.length; i++) pos.push(p[i]); for (var j = 0; j < n.length; j++) nor.push(n[j]);
  });
  var out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  return out;
}
var GEO = {};
function connGeo(kind) {
  if (GEO[kind]) return GEO[kind];
  var D = KNEX.DIMS, T = D.connT, slots = KNEX.KINDS[kind].slots, items = [], R0 = 10, R1 = D.connR;
  var cav = D.rodEndD / 2, throat = D.socketThroat / 2, jawT = 2.1, armW = 2 * (throat + jawT);   // 5.33 throat, jaw walls ~2.1 -> arm 9.9 wide
  // hub ring around the 6.4 hole
  var hub = new THREE.Shape(); hub.absarc(0, 0, 6.6, 0, Math.PI * 2, false);
  var hole = new THREE.Path(); hole.absarc(0, 0, D.hubHoleD / 2, 0, Math.PI * 2, true); hub.holes.push(hole);
  items.push({ g: new THREE.ExtrudeGeometry(hub, { depth: T, bevelEnabled: false }).translate(0, 0, -T / 2) });
  // jaw wall cross-section (u = tangential, v = normal): rectangle minus the cavity circle -> concave inner face
  function jaw(sign) {
    var s = new THREE.Shape(), steps = 10, a0 = Math.acos(throat / cav);   // circle r=cav meets |u|=throat at v=+-cav*sin(a0)
    s.moveTo(sign * throat, -T / 2); s.lineTo(sign * (throat + jawT), -T / 2); s.lineTo(sign * (throat + jawT), T / 2); s.lineTo(sign * throat, T / 2);
    var vt = Math.min(T / 2, cav * Math.sin(a0));
    s.lineTo(sign * throat, vt);
    for (var i = 0; i <= steps; i++) { var a = Math.PI / 2 - a0 + (2 * a0) * i / steps; s.lineTo(sign * cav * Math.sin(a) * (1), cav * Math.cos(a)); }   // arc through the cavity, bulging toward the centre
    s.lineTo(sign * throat, -vt); s.closePath(); return s;
  }
  var jawL = new THREE.ExtrudeGeometry(jaw(1), { depth: R1 - R0, bevelEnabled: false }), jawR = new THREE.ExtrudeGeometry(jaw(-1), { depth: R1 - R0, bevelEnabled: false });
  var floorG = new THREE.BoxGeometry(armW, T, 1.6);                         // socket floor wall at r = 10 (rod tip seats here)
  var neckG = new THREE.BoxGeometry(1.55, T, R0 - 5.5);                      // twin neck walls hub -> floor (open between: the triangular holes)
  var bumpG = new THREE.CylinderGeometry(1.5, 1.5, T, 10);                   // locking bumps inside the jaws (engage the rod groove)
  slots.forEach(function (k) {
    var a = k * Math.PI / 4;
    // jaw local axes: x tangential, y along the hub axis, z radial (extrusion)  ->  basis maps x->y, y->z, z->x, then radial offset and slot rotation
    var basis = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0));
    var m = new THREE.Matrix4().makeRotationZ(a).multiply(new THREE.Matrix4().makeTranslation(R0, 0, 0)).multiply(basis);
    items.push({ g: jawL, m: m }); items.push({ g: jawR, m: m });
    var rot = new THREE.Matrix4().makeRotationZ(a);
    items.push({ g: floorG, m: rot.clone().multiply(new THREE.Matrix4().makeTranslation(R0 - 0.8, 0, 0)).multiply(basis) });
    [-1, 1].forEach(function (sg) {
      items.push({ g: neckG, m: rot.clone().multiply(new THREE.Matrix4().makeTranslation(5.5 + (R0 - 5.5) / 2, sg * (armW / 2 - 0.775), 0)).multiply(basis) });
      items.push({ g: bumpG, m: rot.clone().multiply(new THREE.Matrix4().makeTranslation(R0 + 3.9, sg * (throat + 0.4), 0)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)) });
    });
  });
  if (KNEX.KINDS[kind].cross) {                  // 3D connectors: the perpendicular slot between the last and first socket
    var a8 = (slots[slots.length - 1] + 1) * Math.PI / 4;                       // position where the 8th socket would be
    var g = new THREE.BoxGeometry(R1 - 4, T, 8), m8 = new THREE.Matrix4().makeRotationZ(a8).multiply(new THREE.Matrix4().makeTranslation(4 + (R1 - 4) / 2, 0, 0)).multiply(new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0)));
    items.push({ g: g, m: m8 });
  }
  GEO[kind] = mergeGeos(items); return GEO[kind];
}
function rodGeo(color, len, ridges) {
  var key = "rod" + color + len; if (GEO[key]) return GEO[key];
  var D = KNEX.DIMS, r = D.rodEndD / 2, items = [], END = 9, ribW = 2.4, body = len - 2 * END;
  function cyl(rad, h, y) { return { g: new THREE.CylinderGeometry(rad, rad, h, 14), m: new THREE.Matrix4().makeTranslation(0, y, 0) }; }
  [-1, 1].forEach(function (s) {                // ends: tip flange, groove, shank
    var tip = s * len / 2;
    items.push(cyl(r, 2.2, tip - s * 1.1)); items.push(cyl(2.5, 1.6, tip - s * 3.0)); items.push(cyl(r, END - 3.8, tip - s * (3.8 + (END - 3.8) / 2)));
  });
  if (body > 0) {                                // X section: four lengthwise ribs, nothing across the rod
    items.push({ g: new THREE.BoxGeometry(D.rodD, body, ribW) });
    items.push({ g: new THREE.BoxGeometry(ribW, body, D.rodD) });
  }
  GEO[key] = mergeGeos(items); return GEO[key];
}
</script>
