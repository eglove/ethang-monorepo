try {
  self["workbox:core:7.3.0"] && _();
} catch {}
var Z = (o, ...e) => {
  let t = o;
  return (e.length > 0 && (t += ` :: ${JSON.stringify(e)}`), t);
};
var G = Z;
var c = class extends Error {
  constructor(e, t) {
    let r = G(e, t);
    (super(r), (this.name = e), (this.details = t));
  }
};
var q = new Set();
var m = {
    googleAnalytics: "googleAnalytics",
    precache: "precache-v2",
    prefix: "workbox",
    runtime: "runtime",
    suffix: typeof registration < "u" ? registration.scope : "",
  },
  A = (o) => [m.prefix, o, m.suffix].filter((e) => e && e.length > 0).join("-"),
  ee = (o) => {
    for (let e of Object.keys(m)) o(e);
  },
  y = {
    updateDetails: (o) => {
      ee((e) => {
        typeof o[e] == "string" && (m[e] = o[e]);
      });
    },
    getGoogleAnalyticsName: (o) => o || A(m.googleAnalytics),
    getPrecacheName: (o) => o || A(m.precache),
    getPrefix: () => m.prefix,
    getRuntimeName: (o) => o || A(m.runtime),
    getSuffix: () => m.suffix,
  };
function B(o, e) {
  let t = new URL(o);
  for (let r of e) t.searchParams.delete(r);
  return t.href;
}
async function L(o, e, t, r) {
  let s = B(e.url, t);
  if (e.url === s) return o.match(e, r);
  let n = Object.assign(Object.assign({}, r), { ignoreSearch: !0 }),
    a = await o.keys(e, n);
  for (let i of a) {
    let l = B(i.url, t);
    if (s === l) return o.match(i, r);
  }
}
function P(o) {
  o.then(() => {});
}
var b = class {
  constructor() {
    this.promise = new Promise((e, t) => {
      ((this.resolve = e), (this.reject = t));
    });
  }
};
async function V() {
  for (let o of q) await o();
}
var O = (o) =>
  new URL(String(o), location.href).href.replace(
    new RegExp(`^${location.origin}`),
    "",
  );
function f(o) {
  return new Promise((e) => setTimeout(e, o));
}
var te = 2e3;
async function W(o) {
  if (!o) return;
  let e = await self.clients.matchAll({ type: "window" }),
    t = new Set(e.map((n) => n.id)),
    r,
    s = performance.now();
  for (
    ;
    performance.now() - s < te &&
    ((e = await self.clients.matchAll({ type: "window" })),
    (r = e.find((n) => (o ? n.id === o : !t.has(n.id)))),
    !r);
  )
    await f(100);
  return r;
}
function F() {
  self.addEventListener("activate", () => self.clients.claim());
}
try {
  self["workbox:routing:7.3.0"] && _();
} catch {}
var T = "GET";
var g = (o) => (o && typeof o == "object" ? o : { handle: o });
var p = class {
  constructor(e, t, r = T) {
    ((this.handler = g(t)), (this.match = e), (this.method = r));
  }
  setCatchHandler(e) {
    this.catchHandler = g(e);
  }
};
var R = class extends p {
  constructor(e, t, r) {
    let s = ({ url: n }) => {
      let a = e.exec(n.href);
      if (a && !(n.origin !== location.origin && a.index !== 0))
        return a.slice(1);
    };
    super(s, t, r);
  }
};
var x = class {
  constructor() {
    ((this._routes = new Map()), (this._defaultHandlerMap = new Map()));
  }
  get routes() {
    return this._routes;
  }
  addFetchListener() {
    self.addEventListener("fetch", (e) => {
      let { request: t } = e,
        r = this.handleRequest({ request: t, event: e });
      r && e.respondWith(r);
    });
  }
  addCacheListener() {
    self.addEventListener("message", (e) => {
      if (e.data && e.data.type === "CACHE_URLS") {
        let { payload: t } = e.data,
          r = Promise.all(
            t.urlsToCache.map((s) => {
              typeof s == "string" && (s = [s]);
              let n = new Request(...s);
              return this.handleRequest({ request: n, event: e });
            }),
          );
        (e.waitUntil(r),
          e.ports && e.ports[0] && r.then(() => e.ports[0].postMessage(!0)));
      }
    });
  }
  handleRequest({ request: e, event: t }) {
    let r = new URL(e.url, location.href);
    if (!r.protocol.startsWith("http")) return;
    let s = r.origin === location.origin,
      { params: n, route: a } = this.findMatchingRoute({
        event: t,
        request: e,
        sameOrigin: s,
        url: r,
      }),
      i = a && a.handler,
      l = [],
      E = e.method;
    if (
      (!i &&
        this._defaultHandlerMap.has(E) &&
        (i = this._defaultHandlerMap.get(E)),
      !i)
    )
      return;
    let d;
    try {
      d = i.handle({ url: r, request: e, event: t, params: n });
    } catch (N) {
      d = Promise.reject(N);
    }
    let u = a && a.catchHandler;
    return (
      d instanceof Promise &&
        (this._catchHandler || u) &&
        (d = d.catch(async (N) => {
          if (u)
            try {
              return await u.handle({
                url: r,
                request: e,
                event: t,
                params: n,
              });
            } catch (j) {
              j instanceof Error && (N = j);
            }
          if (this._catchHandler)
            return this._catchHandler.handle({ url: r, request: e, event: t });
          throw N;
        })),
      d
    );
  }
  findMatchingRoute({ url: e, sameOrigin: t, request: r, event: s }) {
    let n = this._routes.get(r.method) || [];
    for (let a of n) {
      let i,
        l = a.match({ url: e, sameOrigin: t, request: r, event: s });
      if (l)
        return (
          (i = l),
          ((Array.isArray(i) && i.length === 0) ||
            (l.constructor === Object && Object.keys(l).length === 0) ||
            typeof l == "boolean") &&
            (i = void 0),
          { route: a, params: i }
        );
    }
    return {};
  }
  setDefaultHandler(e, t = T) {
    this._defaultHandlerMap.set(t, g(e));
  }
  setCatchHandler(e) {
    this._catchHandler = g(e);
  }
  registerRoute(e) {
    (this._routes.has(e.method) || this._routes.set(e.method, []),
      this._routes.get(e.method).push(e));
  }
  unregisterRoute(e) {
    if (!this._routes.has(e.method))
      throw new c("unregister-route-but-not-found-with-method", {
        method: e.method,
      });
    let t = this._routes.get(e.method).indexOf(e);
    if (t > -1) this._routes.get(e.method).splice(t, 1);
    else throw new c("unregister-route-route-not-registered");
  }
};
var v,
  D = () => (
    v || ((v = new x()), v.addFetchListener(), v.addCacheListener()),
    v
  );
function U(o, e, t) {
  let r;
  if (typeof o == "string") {
    let n = new URL(o, location.href),
      a = ({ url: i }) => i.href === n.href;
    r = new p(a, e, t);
  } else if (o instanceof RegExp) r = new R(o, e, t);
  else if (typeof o == "function") r = new p(o, e, t);
  else if (o instanceof p) r = o;
  else
    throw new c("unsupported-route-type", {
      moduleName: "workbox-routing",
      funcName: "registerRoute",
      paramName: "capture",
    });
  return (D().registerRoute(r), r);
}
try {
  self["workbox:strategies:7.3.0"] && _();
} catch {}
function S(o) {
  return typeof o == "string" ? new Request(o) : o;
}
var k = class {
  constructor(e, t) {
    ((this._cacheKeys = {}),
      Object.assign(this, t),
      (this.event = t.event),
      (this._strategy = e),
      (this._handlerDeferred = new b()),
      (this._extendLifetimePromises = []),
      (this._plugins = [...e.plugins]),
      (this._pluginStateMap = new Map()));
    for (let r of this._plugins) this._pluginStateMap.set(r, {});
    this.event.waitUntil(this._handlerDeferred.promise);
  }
  async fetch(e) {
    let { event: t } = this,
      r = S(e);
    if (r.mode === "navigate" && t instanceof FetchEvent && t.preloadResponse) {
      let a = await t.preloadResponse;
      if (a) return a;
    }
    let s = this.hasCallback("fetchDidFail") ? r.clone() : null;
    try {
      for (let a of this.iterateCallbacks("requestWillFetch"))
        r = await a({ request: r.clone(), event: t });
    } catch (a) {
      if (a instanceof Error)
        throw new c("plugin-error-request-will-fetch", {
          thrownErrorMessage: a.message,
        });
    }
    let n = r.clone();
    try {
      let a;
      a = await fetch(
        r,
        r.mode === "navigate" ? void 0 : this._strategy.fetchOptions,
      );
      for (let i of this.iterateCallbacks("fetchDidSucceed"))
        a = await i({ event: t, request: n, response: a });
      return a;
    } catch (a) {
      throw (
        s &&
          (await this.runCallbacks("fetchDidFail", {
            error: a,
            event: t,
            originalRequest: s.clone(),
            request: n.clone(),
          })),
        a
      );
    }
  }
  async fetchAndCachePut(e) {
    let t = await this.fetch(e),
      r = t.clone();
    return (this.waitUntil(this.cachePut(e, r)), t);
  }
  async cacheMatch(e) {
    let t = S(e),
      r,
      { cacheName: s, matchOptions: n } = this._strategy,
      a = await this.getCacheKey(t, "read"),
      i = Object.assign(Object.assign({}, n), { cacheName: s });
    r = await caches.match(a, i);
    for (let l of this.iterateCallbacks("cachedResponseWillBeUsed"))
      r =
        (await l({
          cacheName: s,
          matchOptions: n,
          cachedResponse: r,
          request: a,
          event: this.event,
        })) || void 0;
    return r;
  }
  async cachePut(e, t) {
    let r = S(e);
    await f(0);
    let s = await this.getCacheKey(r, "write");
    if (!t) throw new c("cache-put-with-no-response", { url: O(s.url) });
    let n = await this._ensureResponseSafeToCache(t);
    if (!n) return !1;
    let { cacheName: a, matchOptions: i } = this._strategy,
      l = await self.caches.open(a),
      E = this.hasCallback("cacheDidUpdate"),
      d = E ? await L(l, s.clone(), ["__WB_REVISION__"], i) : null;
    try {
      await l.put(s, E ? n.clone() : n);
    } catch (u) {
      if (u instanceof Error)
        throw (u.name === "QuotaExceededError" && (await V()), u);
    }
    for (let u of this.iterateCallbacks("cacheDidUpdate"))
      await u({
        cacheName: a,
        oldResponse: d,
        newResponse: n.clone(),
        request: s,
        event: this.event,
      });
    return !0;
  }
  async getCacheKey(e, t) {
    let r = `${e.url} | ${t}`;
    if (!this._cacheKeys[r]) {
      let s = e;
      for (let n of this.iterateCallbacks("cacheKeyWillBeUsed"))
        s = S(
          await n({
            mode: t,
            request: s,
            event: this.event,
            params: this.params,
          }),
        );
      this._cacheKeys[r] = s;
    }
    return this._cacheKeys[r];
  }
  hasCallback(e) {
    for (let t of this._strategy.plugins) if (e in t) return !0;
    return !1;
  }
  async runCallbacks(e, t) {
    for (let r of this.iterateCallbacks(e)) await r(t);
  }
  *iterateCallbacks(e) {
    for (let t of this._strategy.plugins)
      if (typeof t[e] == "function") {
        let r = this._pluginStateMap.get(t);
        yield (n) => {
          let a = Object.assign(Object.assign({}, n), { state: r });
          return t[e](a);
        };
      }
  }
  waitUntil(e) {
    return (this._extendLifetimePromises.push(e), e);
  }
  async doneWaiting() {
    for (; this._extendLifetimePromises.length; ) {
      let e = this._extendLifetimePromises.splice(0),
        r = (await Promise.allSettled(e)).find((s) => s.status === "rejected");
      if (r) throw r.reason;
    }
  }
  destroy() {
    this._handlerDeferred.resolve(null);
  }
  async _ensureResponseSafeToCache(e) {
    let t = e,
      r = !1;
    for (let s of this.iterateCallbacks("cacheWillUpdate"))
      if (
        ((t =
          (await s({
            request: this.request,
            response: t,
            event: this.event,
          })) || void 0),
        (r = !0),
        !t)
      )
        break;
    return (r || (t && t.status !== 200 && (t = void 0)), t);
  }
};
var h = class {
  constructor(e = {}) {
    ((this.cacheName = y.getRuntimeName(e.cacheName)),
      (this.plugins = e.plugins || []),
      (this.fetchOptions = e.fetchOptions),
      (this.matchOptions = e.matchOptions));
  }
  handle(e) {
    let [t] = this.handleAll(e);
    return t;
  }
  handleAll(e) {
    e instanceof FetchEvent && (e = { event: e, request: e.request });
    let t = e.event,
      r = typeof e.request == "string" ? new Request(e.request) : e.request,
      s = "params" in e ? e.params : void 0,
      n = new k(this, { event: t, request: r, params: s }),
      a = this._getResponse(n, r, t),
      i = this._awaitComplete(a, n, r, t);
    return [a, i];
  }
  async _getResponse(e, t, r) {
    await e.runCallbacks("handlerWillStart", { event: r, request: t });
    let s;
    try {
      if (((s = await this._handle(t, e)), !s || s.type === "error"))
        throw new c("no-response", { url: t.url });
    } catch (n) {
      if (n instanceof Error) {
        for (let a of e.iterateCallbacks("handlerDidError"))
          if (((s = await a({ error: n, event: r, request: t })), s)) break;
      }
      if (!s) throw n;
    }
    for (let n of e.iterateCallbacks("handlerWillRespond"))
      s = await n({ event: r, request: t, response: s });
    return s;
  }
  async _awaitComplete(e, t, r, s) {
    let n, a;
    try {
      n = await e;
    } catch {}
    try {
      (await t.runCallbacks("handlerDidRespond", {
        event: s,
        request: r,
        response: n,
      }),
        await t.doneWaiting());
    } catch (i) {
      i instanceof Error && (a = i);
    }
    if (
      (await t.runCallbacks("handlerDidComplete", {
        event: s,
        request: r,
        response: n,
        error: a,
      }),
      t.destroy(),
      a)
    )
      throw a;
  }
};
var M = {
  cacheWillUpdate: async ({ response: o }) =>
    o.status === 200 || o.status === 0 ? o : null,
};
var w = class extends h {
  constructor(e = {}) {
    (super(e),
      this.plugins.some((t) => "cacheWillUpdate" in t) ||
        this.plugins.unshift(M));
  }
  async _handle(e, t) {
    let r = [],
      s = t.fetchAndCachePut(e).catch(() => {});
    t.waitUntil(s);
    let n = await t.cacheMatch(e),
      a;
    if (!n)
      try {
        n = await s;
      } catch (i) {
        i instanceof Error && (a = i);
      }
    if (!n) throw new c("no-response", { url: e.url, error: a });
    return n;
  }
};
try {
  self["workbox:broadcast-update:7.3.0"] && _();
} catch {}
var H = (o, e, t) =>
  t.some((s) => o.headers.has(s) && e.headers.has(s))
    ? t.every((s) => {
        let n = o.headers.has(s) === e.headers.has(s),
          a = o.headers.get(s) === e.headers.get(s);
        return n && a;
      })
    : !0;
var K = "CACHE_UPDATED",
  Y = "workbox-broadcast-update",
  Q = !0,
  J = ["content-length", "etag", "last-modified"];
var ae = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
function ne(o) {
  return { cacheName: o.cacheName, updatedURL: o.request.url };
}
var C = class {
  constructor({
    generatePayload: e,
    headersToCheck: t,
    notifyAllClients: r,
  } = {}) {
    ((this._headersToCheck = t || J),
      (this._generatePayload = e || ne),
      (this._notifyAllClients = r ?? Q));
  }
  async notifyIfUpdated(e) {
    if (
      e.oldResponse &&
      !H(e.oldResponse, e.newResponse, this._headersToCheck)
    ) {
      let t = { type: K, meta: Y, payload: this._generatePayload(e) };
      if (e.request.mode === "navigate") {
        let r;
        (e.event instanceof FetchEvent && (r = e.event.resultingClientId),
          (!(await W(r)) || ae) && (await f(3500)));
      }
      if (this._notifyAllClients) {
        let r = await self.clients.matchAll({ type: "window" });
        for (let s of r) s.postMessage(t);
      } else if (e.event instanceof FetchEvent) {
        let r = await self.clients.get(e.event.clientId);
        r?.postMessage(t);
      }
    }
  }
};
var $ = class {
  constructor(e) {
    ((this.cacheDidUpdate = async (t) => {
      P(this._broadcastUpdate.notifyIfUpdated(t));
    }),
      (this._broadcastUpdate = new C(e)));
  }
};
var z = "2cf065bc",
  X = `assets-${z}`,
  I = `html-${z}`;
self.skipWaiting();
F();
self.addEventListener("activate", (o) => {
  let e = [X, I];
  o.waitUntil(
    caches
      .keys()
      .then((t) =>
        Promise.all(
          t.filter((r) => !e.includes(r)).map((r) => caches.delete(r)),
        ),
      ),
  );
});
U(
  ({ request: o }) => o.mode === "navigate",
  new w({
    cacheName: I,
    plugins: [new $({ headersToCheck: ["etag", "last-modified"] })],
  }),
);
U(
  ({ request: o }) => o.method === "GET" && o.mode !== "navigate",
  new w({ cacheName: X }),
);
self.addEventListener("message", (o) => {
  if (o.data?.type === "PRECACHE_LINKS") {
    let e = o.data.urls;
    o.waitUntil(caches.open(I).then((t) => t.addAll(e)));
  }
});
