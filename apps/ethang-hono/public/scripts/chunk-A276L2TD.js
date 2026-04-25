import { a as e } from "./chunk-5TBO732O.js";
var s = e((Fr, b) => {
  "use strict";
  function D(r) {
    var t = typeof r;
    return r != null && (t == "object" || t == "function");
  }
  b.exports = D;
});
var u = e((Er, g) => {
  "use strict";
  var M =
    typeof global == "object" && global && global.Object === Object && global;
  g.exports = M;
});
var j = e((kr, f) => {
  "use strict";
  var N = u(),
    U = typeof self == "object" && self && self.Object === Object && self,
    z = N || U || Function("return this")();
  f.exports = z;
});
var c = e((Ar, p) => {
  "use strict";
  var B = j(),
    H = B.Symbol;
  p.exports = H;
});
var T = e((Lr, O) => {
  "use strict";
  var l = c(),
    y = Object.prototype,
    I = y.hasOwnProperty,
    J = y.toString,
    n = l ? l.toStringTag : void 0;
  function K(r) {
    var t = I.call(r, n),
      o = r[n];
    try {
      r[n] = void 0;
      var C = !0;
    } catch {}
    var R = J.call(r);
    return (C && (t ? (r[n] = o) : delete r[n]), R);
  }
  O.exports = K;
});
var S = e((Cr, v) => {
  "use strict";
  var Q = Object.prototype,
    V = Q.toString;
  function W(r) {
    return V.call(r);
  }
  v.exports = W;
});
var i = e((Rr, d) => {
  "use strict";
  var x = c(),
    X = T(),
    Y = S(),
    Z = "[object Null]",
    _ = "[object Undefined]",
    q = x ? x.toStringTag : void 0;
  function $(r) {
    return r == null
      ? r === void 0
        ? _
        : Z
      : q && q in Object(r)
        ? X(r)
        : Y(r);
  }
  d.exports = $;
});
var a = e((Dr, P) => {
  "use strict";
  function rr(r) {
    return r != null && typeof r == "object";
  }
  P.exports = rr;
});
var w = e((Mr, m) => {
  "use strict";
  function tr(r, t) {
    return function (o) {
      return r(t(o));
    };
  }
  m.exports = tr;
});
var h = e((Nr, G) => {
  "use strict";
  var er = w(),
    or = er(Object.getPrototypeOf, Object);
  G.exports = or;
});
var k = e((Ur, E) => {
  "use strict";
  var nr = i(),
    ir = h(),
    cr = a(),
    ar = "[object Object]",
    br = Function.prototype,
    sr = Object.prototype,
    F = br.toString,
    gr = sr.hasOwnProperty,
    ur = F.call(Object);
  function fr(r) {
    if (!cr(r) || nr(r) != ar) return !1;
    var t = ir(r);
    if (t === null) return !0;
    var o = gr.call(t, "constructor") && t.constructor;
    return typeof o == "function" && o instanceof o && F.call(o) == ur;
  }
  E.exports = fr;
});
var vr = e((zr, A) => {
  "use strict";
  var jr = i(),
    pr = a(),
    lr = k(),
    yr = "[object DOMException]",
    Or = "[object Error]";
  function Tr(r) {
    if (!pr(r)) return !1;
    var t = jr(r);
    return (
      t == Or ||
      t == yr ||
      (typeof r.message == "string" && typeof r.name == "string" && !lr(r))
    );
  }
  A.exports = Tr;
});
var Gr = e((Br, L) => {
  "use strict";
  var Sr = i(),
    xr = s(),
    qr = "[object AsyncFunction]",
    dr = "[object Function]",
    Pr = "[object GeneratorFunction]",
    mr = "[object Proxy]";
  function wr(r) {
    if (!xr(r)) return !1;
    var t = Sr(r);
    return t == dr || t == Pr || t == qr || t == mr;
  }
  L.exports = wr;
});
export { u as a, j as b, c, i as d, s as e, Gr as f, a as g, w as h, vr as i };
