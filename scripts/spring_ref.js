/* node cli.js spring   — how stiff each spring configuration is, so you can pick one.
   node cli.js arc      — how tightly a chain of rods and straight connectors can be curved. */
module.exports = {
  spring: function (KNEX) {
    var D = KNEX.DIMS, out = [];
    out.push("Spring configurations. k is the force needed to push the moving end sideways by 1 mm.");
    out.push("A rod held in sockets at BOTH ends is 4x stiffer than one whose far end is a hub it can slide through,");
    out.push("because a sliding end carries no moment. Segments in series divide the stiffness.");
    out.push("");
    out.push("rod      span   leaf (far end slides)   both ends socketed   x2 in series   x3 in series");
    KNEX.LADDER.forEach(function (l) {
      var leaf = 3 * D.E * D.I / Math.pow(l.c2c, 3), fix = 12 * D.E * D.I / Math.pow(l.c2c, 3);
      out.push("  " + l.color.padEnd(7) + String(l.c2c).padEnd(7) +
               (leaf.toFixed(3) + " N/mm").padEnd(24) + (fix.toFixed(3) + " N/mm").padEnd(21) +
               (fix / 2).toFixed(3).padEnd(15) + (fix / 3).toFixed(3));
    });
    out.push("");
    out.push("A flexi rod of the same length is " + (D.E / D.Eflexi).toFixed(0) + "x softer, but once you compress it past");
    out.push("its length it buckles and pushes back with a near-constant " + (Math.PI * Math.PI * D.Eflexi * D.Iflexi / Math.pow(106.07, 2)).toFixed(1) + " N (yellow), which is");
    out.push("more than a small model weighs. Use flexi rods as travel stops, not as centring springs.");
    out.push("");
    out.push("To change the feel of a rig: swap the rod colour first (k goes as 1/L^3, so a red is 2.8x softer than a");
    out.push("yellow), then add a segment, then switch an end from a socket to a sliding hub.");
    return out.join("\n");
  },
  arc: function (KNEX, args) {
    var D = KNEX.DIMS, out = [];
    function opt(f, d) { var i = args.indexOf(f); return i >= 0 ? Number(args[i + 1]) : d; }
    var colour = args.indexOf("--rod") >= 0 ? args[args.indexOf("--rod") + 1] : "blue";
    var l = KNEX.ladder(colour); if (!l) return "unknown rod colour '" + colour + "'";
    var R = opt("--radius", 0);
    out.push("Curving a chain of " + colour + " rods joined by straight (orange) connectors.");
    out.push("Each rod bends into an arc, so the chain follows a circle. The moment at every socket is EI/R.");
    out.push("The sockets give out at about " + D.socketMoment + " N.mm (estimate), which sets the tightest circle.");
    var Rmin = D.E * D.I / D.socketMoment;
    out.push("");
    out.push("  tightest circle with a plain rod: radius " + Rmin.toFixed(0) + " mm");
    out.push("  " + colour + " rod, c2c " + l.c2c + " mm");
    out.push("");
    out.push("radius mm   turn per joint   connectors for a full circle   moment at each socket");
    [Rmin, 300, 400, 600, 900, 1500].concat(R ? [R] : []).sort(function (a, b) { return a - b; }).forEach(function (r) {
      var th = l.c2c / r, n = Math.ceil(2 * Math.PI / th), M = D.E * D.I / r;
      out.push("  " + r.toFixed(0).padStart(7) + "   " + (th * 180 / Math.PI).toFixed(1).padStart(8) + " deg   " +
               String(n).padStart(20) + "   " + M.toFixed(0).padStart(14) + " N.mm" + (M > D.socketMoment ? "  OVER the socket limit" : ""));
    });
    out.push("");
    out.push("A socket is strong when the rod's peg is driven against its inner walls and weak when the load");
    out.push("levers the rod out of the connector's plane: about " + D.socketPush + " N pushing in, " + D.socketPull + " N pulling out,");
    out.push("but only " + D.socketPry + " N prying sideways. Keep a curved chain loaded in its own plane.");
    out.push("All four of those numbers are estimates; no source publishes them.");
    return out.join("\n");
  }
};
