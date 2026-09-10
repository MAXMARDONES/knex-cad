<script>
/* Hand tracking: grab, pull and twist parts with your hands through the webcam.
   Uses MediaPipe Hands (21 landmarks per hand) loaded on demand from a CDN — the one feature here that
   touches the network, and only after you switch it on. OpenCV alone does not give finger landmarks.
   A pinch grabs the part under your hand; moving pulls it; rolling your wrist twists it. */
var HANDS = { on: false, ready: false, hands: null, video: null, lm: [null, null], pinch: [false, false],
              roll: [0, 0], base: [0, 0], score: [0, 0], push: [0, 0], err: null,
              wasPinch: [false, false], latched: [false, false] };
var PALM = [];                                           // open-palm pushes, rebuilt every frame
var MP_SRC = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
var MP_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/hands";

function handsLoad() {
  if (window.Hands) return Promise.resolve();
  return new Promise(function (res, rej) {
    var s = document.createElement("script");
    s.src = MP_SRC; s.crossOrigin = "anonymous";
    s.onload = function () { res(); };
    s.onerror = function () { rej(new Error("could not load the hand tracker (offline?)")); };
    document.head.appendChild(s);
  });
}
function handsStart() {
  if (HANDS.on) return handsStop();
  toast("starting the camera");
  handsLoad().then(function () {
    return navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
  }).then(function (stream) {
    var v = document.getElementById("handsVideo");
    v.srcObject = stream; v.play();
    HANDS.video = v;
    HANDS.hands = new window.Hands({ locateFile: function (f) { return MP_BASE + "/" + f; } });
    HANDS.hands.setOptions({ maxNumHands: 2, modelComplexity: 0, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });
    HANDS.hands.onResults(handsResults);
    HANDS.on = true; HANDS.ready = true; HANDS.err = null;
    document.getElementById("handsPanel").classList.add("on");
    document.getElementById("optHands").checked = true;
    if (!PHYS.running) { PHYS.running = true; document.getElementById("physRun").textContent = "Pause"; }
    toast("pinch to grab, move to pull, roll your wrist to twist");
    handsPump();
  }).catch(function (e) {
    HANDS.err = e.message; HANDS.on = false;
    document.getElementById("optHands").checked = false;
    toast("hand tracking unavailable: " + e.message);
  });
}
function handsStop() {
  HANDS.on = false;
  ["left", "right"].forEach(function (s) { if (window.grabRelease) grabRelease(s); });
  if (HANDS.video && HANDS.video.srcObject) HANDS.video.srcObject.getTracks().forEach(function (t) { t.stop(); });
  document.getElementById("handsPanel").classList.remove("on");
  document.getElementById("optHands").checked = false;
}
function handsPump() {
  if (!HANDS.on || !HANDS.hands || !HANDS.video) return;
  HANDS.hands.send({ image: HANDS.video }).then(function () { requestAnimationFrame(handsPump); })
    .catch(function () { requestAnimationFrame(handsPump); });
}
function dist2(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function handsResults(r) {
  if (!HANDS.on) return;
  PALM.length = 0;
  var seen = { left: false, right: false };
  (r.multiHandLandmarks || []).forEach(function (lm, i) {
    var label = ((r.multiHandedness || [])[i] || {}).label || (i ? "Left" : "Right");
    var side = label.toLowerCase() === "left" ? "left" : "right", idx = side === "left" ? 0 : 1;
    seen[side] = true;
    HANDS.lm[idx] = lm; HANDS.score[idx] = ((r.multiHandedness || [])[i] || {}).score || 0;
    // pinch: thumb tip (4) to index tip (8), scaled by the hand's own size so distance from the camera does not matter
    var span = dist2(lm[0], lm[9]) || 1;
    var pinch = dist2(lm[4], lm[8]) / span < 0.45;
    // roll: the angle of the knuckle line, index MCP (5) to pinky MCP (17)
    var roll = Math.atan2(lm[17].y - lm[5].y, lm[17].x - lm[5].x);
    // the palm centre, mirrored because the webcam image is
    var px = (1 - lm[9].x) * canvas.clientWidth, py = lm[9].y * canvas.clientHeight;
    var r0 = canvas.getBoundingClientRect(), cx = r0.left + px, cy = r0.top + py;
    HANDS.roll[idx] = roll;
    var g = GRABS.filter(function (x) { return x.source === side; })[0];
    if (pinch && !g) {
      var hit = pickBodyAt(cx, cy);
      if (hit && hit.body && !hit.body.fixed) {
        var w = [hit.pointMm.x / 1000, -hit.pointMm.z / 1000, hit.pointMm.y / 1000];
        var ng = grabAt(hit.body, w, side);
        ng.hitMm = hit.pointMm.clone(); HANDS.base[idx] = roll;
      }
    } else if (pinch && g) {
      var p = screenToWorldPlane({ clientX: cx, clientY: cy }, g.hitMm);
      g.target = [p.x / 1000, -p.z / 1000, p.y / 1000];
      var d = roll - HANDS.base[idx];
      while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      g.twist = d;
    } else if (!pinch && g) {
      /* Latched: a pinch holds until you pinch again. Levers are the reason. Pulling one through its
         travel takes longer than a hand can comfortably stay closed in front of a webcam, and losing
         the grip halfway means starting over. */
      if (!(document.getElementById("handsLock") || {}).checked) grabRelease(side);
      else if (HANDS.wasPinch[idx]) HANDS.latched[idx] = true;
    }
    if (HANDS.latched[idx] && pinch && !HANDS.wasPinch[idx]) { grabRelease(side); HANDS.latched[idx] = false; }
    if (!pinch) {                                          // an open palm pushes whatever is under it
      var hit2 = pickBodyAt(cx, cy);
      if (hit2 && hit2.body && !hit2.body.fixed) {
        var open = dist2(lm[4], lm[8]) / span;             // how open the hand is sets how hard it pushes
        var into = camera.getWorldDirection(new THREE.Vector3());
        var F = Math.min(12, 14 * Math.max(0, open - 0.5));
        HANDS.push[idx] = F;
        if (F > 0.2) PALM.push({ body: hit2.body,
          at: [hit2.pointMm.x / 1000, -hit2.pointMm.z / 1000, hit2.pointMm.y / 1000],
          F: [into.x * F, -into.z * F, into.y * F], world: true, gain: 1 });
      } else HANDS.push[idx] = 0;
    } else HANDS.push[idx] = 0;
    HANDS.pinch[idx] = pinch;
  });
  ["left", "right"].forEach(function (s, i) {
    if (!seen[s]) {
      HANDS.lm[i] = null; HANDS.pinch[i] = false; HANDS.push[i] = 0;
      if (!HANDS.latched[i]) grabRelease(s);               // a latched grip survives the hand leaving frame
    }
    HANDS.wasPinch[i] = HANDS.pinch[i];
  });
  handsStatus();
  handsDraw();
}
/* What the tracker currently believes, per hand. Without it a webcam preview is just a picture of you:
   you cannot tell whether a pinch registered, what it caught, or why nothing is moving. */
function handsStatus() {
  var el = document.getElementById("handsStat"); if (!el) return;
  var out = [];
  ["left", "right"].forEach(function (s, i) {
    if (!HANDS.lm[i]) return;
    var g = (window.GRABS || []).filter(function (x) { return x.source === s; })[0];
    var what = g ? (HANDS.latched[i] ? "latched" : "holding") + " body " + g.body.id
                 : HANDS.push[i] > 0.2 ? "pushing " + HANDS.push[i].toFixed(1) + " N"
                 : HANDS.pinch[i] ? "pinching, nothing under it" : "open";
    var tw = g && g.twist ? ", twist " + (g.twist * 180 / Math.PI).toFixed(0) + "°" : "";
    out.push(s + ": " + what + tw);
  });
  el.textContent = out.length ? out.join("\n") : "looking for a hand…";
  el.style.whiteSpace = "pre";
}
function handsDraw() {
  var c = document.getElementById("handsCanvas"); if (!c) return;
  var g = c.getContext("2d"); g.clearRect(0, 0, c.width, c.height);
  [0, 1].forEach(function (i) {
    var lm = HANDS.lm[i]; if (!lm) return;
    g.fillStyle = HANDS.pinch[i] ? "#E8531A" : "#2E9E4F";
    lm.forEach(function (p, k) {
      var x = (1 - p.x) * c.width, y = p.y * c.height;
      g.beginPath(); g.arc(x, y, k === 4 || k === 8 ? 4 : 2, 0, 6.3); g.fill();
    });
    g.strokeStyle = g.fillStyle; g.lineWidth = 1.5;
    [[0,5],[5,9],[9,13],[13,17],[0,17],[4,8]].forEach(function (e) {
      g.beginPath(); g.moveTo((1 - lm[e[0]].x) * c.width, lm[e[0]].y * c.height);
      g.lineTo((1 - lm[e[1]].x) * c.width, lm[e[1]].y * c.height); g.stroke();
    });
  });
}
</script>
