/* Just enough three.js to make the viewer's code RUN in Node, so the build can catch real errors.
   Vector/Matrix maths is real; anything that only draws is a no-op. */
function V3(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; }
V3.prototype = {
  set: function (x, y, z) { this.x = x; this.y = y; this.z = z; return this; },
  copy: function (v) { return this.set(v.x, v.y, v.z); },
  clone: function () { return new V3(this.x, this.y, this.z); },
  add: function (v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; },
  addScaledVector: function (v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; },
  sub: function (v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; },
  multiplyScalar: function (s) { this.x *= s; this.y *= s; this.z *= s; return this; },
  length: function () { return Math.hypot(this.x, this.y, this.z); },
  distanceTo: function (v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); },
  normalize: function () { var l = this.length() || 1; return this.multiplyScalar(1 / l); },
  lerp: function (v, t) { this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t; this.z += (v.z - this.z) * t; return this; },
  cross: function (v) { return this.set(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x); },
  dot: function (v) { return this.x * v.x + this.y * v.y + this.z * v.z; },
  applyAxisAngle: function () { return this; }, applyMatrix4: function () { return this; },
  toArray: function () { return [this.x, this.y, this.z]; }, setFromMatrixPosition: function () { return this; }
};
function noop() { return this; }
function Obj3() { this.children = []; this.userData = {}; this.position = new V3(); this.rotation = { x: 0, y: 0, z: 0, order: "XYZ" };
  this.quaternion = { set: noop, setFromUnitVectors: noop, copy: noop, x: 0, y: 0, z: 0, w: 1 };
  this.scale = new V3(1, 1, 1); this.visible = true; this.matrix = {}; }
Obj3.prototype.add = function (o) { this.children.push(o); return this; };
Obj3.prototype.remove = function (o) { var i = this.children.indexOf(o); if (i >= 0) this.children.splice(i, 1); return this; };
Obj3.prototype.traverse = function (f) { f(this); this.children.forEach(function (c) { if (c.traverse) c.traverse(f); else f(c); }); };
Obj3.prototype.applyMatrix4 = noop; Obj3.prototype.lookAt = noop; Obj3.prototype.getWorldDirection = function () { return new V3(0, 0, -1); };
function Geo() { this.attributes = { position: { array: [], count: 0 }, normal: { array: [] } }; this.index = null; }
Geo.prototype.dispose = noop; Geo.prototype.clone = function () { return new Geo(); };
Geo.prototype.toNonIndexed = function () { return this; }; Geo.prototype.applyMatrix4 = noop;
Geo.prototype.translate = function () { return this; }; Geo.prototype.setAttribute = noop; Geo.prototype.copy = noop;
function Mat(o) { Object.assign(this, o || {}); this.color = new Col(); this.emissive = new Col(); }
function Col() { this.r = 0; this.g = 0; this.b = 0; }
Col.prototype.set = noop;
function Mesh(g, m) { Obj3.call(this); this.geometry = g || new Geo(); this.material = m || new Mat(); this.isMesh = true; }
Mesh.prototype = Object.create(Obj3.prototype); Mesh.prototype.constructor = Mesh;
function Box3() { this.min = new V3(1e9, 1e9, 1e9); this.max = new V3(-1e9, -1e9, -1e9); this._any = false; }
Box3.prototype.setFromObject = function (o) { this._any = true; this.min.set(-100, 0, -100); this.max.set(100, 200, 100); return this; };
Box3.prototype.expandByObject = Box3.prototype.setFromObject;
Box3.prototype.isEmpty = function () { return !this._any; };
Box3.prototype.getCenter = function (t) { return (t || new V3()).set(0, 100, 0); };
Box3.prototype.getSize = function (t) { return (t || new V3()).set(200, 200, 200); };
var T = {
  Scene: function () { Obj3.call(this); this.background = null; },
  Group: function () { Obj3.call(this); },
  Mesh: Mesh, Object3D: Obj3, Vector3: V3,
  Vector2: function (x, y) { this.x = x || 0; this.y = y || 0; },
  Box3: Box3, Color: Col,
  Matrix4: function () {
    this.elements = new Array(16).fill(0);
    this.makeBasis = noop; this.setPosition = noop; this.multiply = noop; this.premultiply = noop;
    this.makeRotationZ = noop; this.makeRotationX = noop; this.makeRotationY = noop; this.makeTranslation = noop;
    this.makeScale = noop; this.identity = noop; this.clone = function () { return new T.Matrix4(); };
    this.copy = noop; this.invert = noop; this.compose = noop; this.decompose = noop;
  },
  Quaternion: function () { this.set = noop; this.setFromUnitVectors = noop; this.copy = noop; this.x = 0; this.y = 0; this.z = 0; this.w = 1; },
  PerspectiveCamera: function () { Obj3.call(this); this.aspect = 1; this.updateProjectionMatrix = noop; },
  WebGLRenderer: function () { this.domElement = {}; this.setPixelRatio = noop; this.getPixelRatio = function () { return 1; };
                               this.setSize = noop; this.render = noop; },
  Raycaster: function () { this.setFromCamera = noop; this.intersectObjects = function () { return []; };
                           this.ray = { intersectPlane: function () { return null; } }; },
  Plane: function () { this.setFromNormalAndCoplanarPoint = noop; },
  GridHelper: function () { Obj3.call(this); this.material = new Mat({ transparent: true, opacity: 1 }); },
  ArrowHelper: function () { Obj3.call(this); this.setDirection = noop; this.setLength = noop; },
  HemisphereLight: function () { Obj3.call(this); }, DirectionalLight: function () { Obj3.call(this); },
  Sprite: function () { Obj3.call(this); }, SpriteMaterial: Mat,
  CanvasTexture: function () {}, MeshStandardMaterial: Mat, MeshBasicMaterial: Mat,
  BufferGeometry: Geo, Float32BufferAttribute: function () {},
  CubicBezierCurve3: function () {}, CatmullRomCurve3: function () {}, LineCurve3: function () {},
  Shape: function () { this.absarc = noop; this.moveTo = noop; this.lineTo = noop; this.closePath = noop; this.holes = []; },
  Path: function () { this.absarc = noop; }
};
["PlaneGeometry", "BoxGeometry", "CylinderGeometry", "SphereGeometry", "ConeGeometry", "TubeGeometry", "ExtrudeGeometry"]
  .forEach(function (n) { T[n] = function () { return new Geo(); }; });
["Scene", "Group", "PerspectiveCamera", "GridHelper", "ArrowHelper", "HemisphereLight", "DirectionalLight", "Sprite"]
  .forEach(function (n) { T[n].prototype = Object.create(Obj3.prototype); T[n].prototype.constructor = T[n]; });
T.SphereGeometry = T.SphereGeometry || function () { return new Geo(); };
T.geometry = { align_vectors: function () { return new T.Matrix4(); } };
T.MathUtils = { clamp: function (v, a, b) { return Math.max(a, Math.min(b, v)); } };
module.exports = T;
