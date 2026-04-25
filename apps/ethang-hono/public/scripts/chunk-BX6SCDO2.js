import { a as g } from "./chunk-LFCSMEPO.js";
import { c as f } from "./chunk-5TBO732O.js";
var n = f(g(), 1),
  l = ".course-completion-button",
  u = ".course-status-text",
  d = "bg-slate-700",
  m = "bg-amber-400",
  p = "bg-sky-300",
  L = new Intl.NumberFormat("en-US", { style: "percent" }),
  v = class {
    constructor(e, s) {
      this.store = e;
      this.service = s;
    }
    store;
    service;
    isInitialized = !1;
    init() {
      this.isInitialized ||
        (this.store.subscribe((e) => {
          this.render(e);
        }),
        this.render(this.store.state),
        this.attachEventListeners(),
        (this.isInitialized = !0));
    }
    reset() {
      this.isInitialized = !1;
    }
    attachEventListeners() {
      for (let e of document.querySelectorAll(l)) {
        let { courseId: s, courseUrl: r } = e.dataset;
        !(0, n.default)(s) &&
          !(0, n.default)(r) &&
          e.addEventListener("click", () => {
            let { userId: t } = this.store.state;
            (0, n.default)(t) ||
              this.handleButtonClick(r, s, t).catch(globalThis.console.error);
          });
      }
    }
    async handleButtonClick(e, s, r) {
      this.store.setLoading(e, !0);
      try {
        let t = await this.service.updateCourseStatus(s, r);
        t && this.store.setStatus(e, t);
      } catch (t) {
        globalThis.console.error(t);
      } finally {
        this.store.setLoading(e, !1);
      }
    }
    hideAuthenticatedUi() {
      for (let e of document.querySelectorAll(l)) e.classList.add("hidden");
      for (let e of document.querySelectorAll(u)) e.classList.add("hidden");
      (document.querySelector("#auth-section-header")?.classList.add("hidden"),
        document.querySelector("#course-progress-bar")?.classList.add("hidden"),
        document.querySelector("#sign-in-prompt")?.classList.remove("hidden"));
    }
    render(e) {
      if (!e.isAuthenticated) {
        this.hideAuthenticatedUi();
        return;
      }
      this.showAuthenticatedUi();
      let s = 0,
        r = 0,
        t = 0,
        i = 0;
      for (let o of document.querySelectorAll(l)) {
        let { courseUrl: c } = o.dataset;
        if (!(0, n.default)(c)) {
          i += 1;
          let a = e.courses[c] ?? { isLoading: !1, status: "Incomplete" },
            h = o.parentElement?.querySelector(u);
          (h && (h.textContent = a.status),
            this.updateButtonState(o, a),
            a.status === "Complete"
              ? (s += 1)
              : a.status === "Revisit"
                ? (t += 1)
                : (r += 1));
        }
      }
      this.updateProgressBars(s, r, t, i);
    }
    setPercentageContent(e, s, r) {
      if (e) {
        let t = s / r,
          i = t * 100;
        ((e.textContent = L.format(t)),
          e.setAttribute("style", `width: ${i}%`),
          e.classList.toggle("hidden", i === 0),
          (e.textContent = 7 > i ? "" : L.format(t)));
      }
    }
    showAuthenticatedUi() {
      for (let e of document.querySelectorAll(l)) e.classList.remove("hidden");
      for (let e of document.querySelectorAll(u)) e.classList.remove("hidden");
      (document
        .querySelector("#auth-section-header")
        ?.classList.remove("hidden"),
        document
          .querySelector("#course-progress-bar")
          ?.classList.remove("hidden"),
        document.querySelector("#sign-in-prompt")?.classList.add("hidden"));
    }
    updateButtonState(e, s) {
      ((e.disabled = s.isLoading),
        s.isLoading
          ? (e.classList.remove("cursor-pointer"),
            e.classList.add("animate-spin", "cursor-progress"))
          : (e.classList.remove("animate-spin", "cursor-progress"),
            e.classList.add("cursor-pointer")),
        s.status === "Complete"
          ? (e.classList.add(p), e.classList.remove(d, m))
          : s.status === "Revisit"
            ? (e.classList.add(m), e.classList.remove(d, p))
            : (e.classList.add(d), e.classList.remove(p, m)));
    }
    updateProgressBars(e, s, r, t) {
      let i = document.querySelector("#complete-progress"),
        o = document.querySelector("#incomplete-progress"),
        c = document.querySelector("#revisit-progress");
      (this.setPercentageContent(i, e, t),
        this.setPercentageContent(o, s, t),
        this.setPercentageContent(c, r, t));
    }
  };
export { v as a };
