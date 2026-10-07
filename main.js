(() => {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  const motion = !reduced && hasGsap;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  if (!motion) root.classList.add("reduced");
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  scrollTo(0, 0);

  /* ---------- Toast for demo actions ---------- */
  const toast = $("#toast");
  let tT;
  const say = (m) => { toast.textContent = m; toast.classList.add("on"); clearTimeout(tT); tT = setTimeout(() => toast.classList.remove("on"), 3600); };
  document.addEventListener("click", (e) => { const b = e.target.closest(".demo"); if (b) say(b.dataset.msg); });

  /* ---------- A thousand petals (canvas bloom) ---------- */
  const cv = $("#bloom"), ctx = cv.getContext("2d");
  const bloom = { open: reduced ? 1 : 0, spread: 0, t: 0 };
  let S = 0, petals = [], visible = true;
  const COLS = [[246, 220, 224], [228, 166, 178], [142, 216, 205], [42, 157, 146], [14, 93, 88]];
  const mix = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
  const colAt = (r) => { const f = r * (COLS.length - 1), i = Math.min(Math.floor(f), COLS.length - 2); return mix(COLS[i], COLS[i + 1], f - i); };
  function sizeBloom() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    S = cv.clientWidth;
    cv.width = cv.height = Math.round(S * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const N = S < 700 ? 300 : 440;
    petals = Array.from({ length: N }, (_, i) => {
      const r = Math.sqrt((i + 1) / N);
      const c = colAt(r);
      return { a: i * 2.39996, r, c: `rgba(${c[0]},${c[1]},${c[2]},`, w: .5 + Math.random() * .25 };
    });
  }
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  function drawBloom() {
    const cx = S / 2, cy = S / 2, R = S * .46;
    ctx.clearRect(0, 0, S, S);
    const o = easeOut(bloom.open), sp = bloom.spread;
    for (const p of petals) {
      const rr = R * p.r * (.08 + .92 * o) * (1 + sp * 1.2 * p.r);
      const ang = p.a + bloom.t * .02 * (1 - p.r * .5) + sp * 1.4 * (1 - p.r);
      const len = S * (.012 + .06 * p.r) * (.4 + .6 * o);
      const alpha = (.18 + .5 * (1 - p.r * .6)) * o * (1 - sp * .9);
      if (alpha <= .01) continue;
      ctx.save();
      ctx.translate(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.ellipse(0, 0, len, len * p.w * .62, 0, 0, 6.283);
      ctx.fillStyle = p.c + alpha.toFixed(3) + ")";
      ctx.fill();
      ctx.restore();
    }
  }
  sizeBloom();
  addEventListener("resize", () => { sizeBloom(); drawBloom(); });
  if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !reduced) requestAnimationFrame(loop); }).observe(cv);
  function loop() {
    if (!visible) return;
    bloom.t += 1;
    drawBloom();
    requestAnimationFrame(loop);
  }
  if (reduced) drawBloom(); else requestAnimationFrame(loop);

  /* ---------- Nav + dock ---------- */
  const nav = $("#nav"), dock = $("#dock");
  let lastY = 0;
  const onScroll = (y) => { nav.classList.toggle("hide", y > lastY && y > 400); dock.classList.toggle("show", y > innerHeight * .7); lastY = y; };

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (motion && typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: .09, wheelMultiplier: .9 });
    lenis.stop();
    lenis.on("scroll", (e) => { ScrollTrigger.update(); onScroll(e.scroll); });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      e.preventDefault();
      lenis.scrollTo(id === "#top" ? 0 : $(id), { offset: -10, duration: 1.4 });
    }));
  } else addEventListener("scroll", () => onScroll(scrollY), { passive: true });

  /* ---------- Pillars: shared state ---------- */
  let pilIdx = 0;
  const setPillar = (i) => {
    if (i === pilIdx) return;
    pilIdx = i;
    $$(".pil-panel").forEach((p, k) => p.classList.toggle("on", k === i));
    $$(".dw").forEach((p, k) => p.classList.toggle("on", k === i));
  };

  /* ---------- Offer rail progress ---------- */
  const rail = $("#rail"), fill = $("#railFill");
  const railP = () => { const m = rail.scrollWidth - rail.clientWidth; fill.style.transform = `translateX(${(m > 0 ? rail.scrollLeft / m : 0) * 233}%)`; };
  rail.addEventListener("scroll", railP, { passive: true }); railP();

  /* ---------- Before / after ---------- */
  const cmp = $("#cmp"), range = $("input", cmp);
  const setPos = (v) => cmp.style.setProperty("--pos", v + "%");
  range.addEventListener("input", () => setPos(range.value));

  /* ---------- Treatment finder ---------- */
  const FIND = {
    skin: [["ph-sparkle", "Customised clinical facial", "Built around your skin on the day", "Ask"], ["ph-dna", "RF microneedling", "Scarring, pores and texture", "from $1,400"], ["ph-drop", "Skin consultation", "Fee credited to your treatment", "$200"]],
    age: [["ph-syringe", "Toxin treatment", "40% off this month, after assessment", "40% off"], ["ph-dna", "Microneedling + peptides", "Collagen support for firmer skin", "from $1,400"], ["ph-flower-lotus", "The Vitality Edit", "Anti-aging facial, massage and a doctor's consult", "$1,100"]],
    relax: [["ph-hand-heart", "The Art of Pause", "Massage, facial and nail combinations", "from $630"], ["ph-fire", "Hot stone massage", "Deep, warm, unhurried", "Ask"], ["ph-flower-lotus", "The Vitality Edit", "Massage, sauna, facial and consult", "$1,100"]],
    health: [["ph-heartbeat", "Weight management", "Physician-supervised, weekly monitoring", "$1,600/mo"], ["ph-drop-half", "Vitamin infusions", "Hydration and replenishment", "Ask"], ["ph-stethoscope", "Diabetes & metabolic care", "Personal plans with your doctor", "Consult $400"]]
  };
  const fOut = $("#fOut");
  const renderFind = (k, animate) => {
    fOut.innerHTML = FIND[k].map(([ic, t, s, p]) => `<div class="f-item"><i class="ic ph-light ${ic}"></i><span><b>${t}</b><small>${s}</small></span><span class="f-p">${p}</span></div>`).join("");
    if (animate) gsap.from(".f-item", { y: 20, opacity: 0, duration: .6, stagger: .07, ease: "expo.out" });
  };
  $$(".f-chips button").forEach((b) => b.addEventListener("click", () => {
    $$(".f-chips button").forEach((x) => x.setAttribute("aria-checked", x === b));
    renderFind(b.dataset.k, motion);
  }));
  renderFind("skin", false);

  /* ---------- Gift card ---------- */
  const gVal = $("#gcVal");
  const gObj = { v: 500 };
  $$(".g-tiers button").forEach((b) => b.addEventListener("click", () => {
    $$(".g-tiers button").forEach((x) => x.setAttribute("aria-checked", x === b));
    if (b.dataset.v === "custom") { gVal.textContent = "Your amount"; return; }
    const v = +b.dataset.v;
    if (!motion) { gVal.textContent = "$" + v.toLocaleString(); return; }
    gsap.to(gObj, { v, duration: .9, ease: "expo.out", onUpdate: () => (gVal.textContent = "$" + Math.round(gObj.v).toLocaleString()) });
    gsap.fromTo("#gcard", { rotationY: -16 }, { rotationY: 0, duration: 1.1, ease: "elastic.out(1,.6)" });
  }));

  /* ---------- Booking ---------- */
  $$(".chips").forEach((g) => g.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $$("button", g).forEach((x) => x.setAttribute("aria-pressed", x === b));
  }));
  const form = $("#book"), note = $("#note");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const n = form.elements.name, ph = form.elements.phone;
    const bad = [n, ph].filter((f) => !f.value.trim());
    [n, ph].forEach((f) => f.toggleAttribute("aria-invalid", bad.includes(f)));
    if (bad.length) { note.className = "form-note err"; note.textContent = "Please add your name and phone so we can confirm."; bad[0].focus(); return; }
    const t = $('[data-g="t"] [aria-pressed="true"]').textContent;
    note.className = "form-note";
    note.textContent = `Thank you, ${n.value.trim().split(" ")[0]}. We'll call to confirm your ${t.toLowerCase()}. (Demo: on the live site this goes to the clinic's booking inbox.)`;
  });

  if (!motion) return;

  /* ================= MOTION ================= */
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Intro: seal stamps in, the bloom opens, headline rises
  const intro = gsap.timeline({ paused: true, defaults: { ease: "expo.out" }, onComplete: () => lenis && lenis.start() });
  intro
    .to(".seal-lg", { opacity: 1, scale: 1, rotation: 0, duration: .9, ease: "back.out(1.8)" })
    .to(".loader", { opacity: 0, duration: .6, ease: "power2.out" }, "+=.2")
    .set(".loader", { display: "none" })
    .to(bloom, { open: 1, duration: 2.6, ease: "power3.out" }, "-=.5")
    .from(".hero .ln > span", { yPercent: 110, duration: 1.2, stagger: .08 }, "<.1")
    .from(".hero .eyebrow, .lede, .cta-row", { y: 20, opacity: 0, duration: 1, stagger: .07 }, "<.3")
    .from(".hero-pill", { clipPath: "inset(50% 0% 50% 0% round 999px)", duration: 1.6, ease: "expo.inOut" }, "<-.2")
    .from(".hero-pill img", { scale: 1.3, duration: 2 }, "<")
    .from(".hero-badge", { scale: 0, rotation: -90, duration: 1.2, ease: "back.out(1.6)" }, "<.6")
    .from(".nav", { autoAlpha: 0, duration: .8 }, "<");
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => intro.play());
  setTimeout(() => intro.paused() && intro.play(), 2500);

  // Hero leaving: petals scatter, portrait lifts
  gsap.to(bloom, { spread: 1, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-pill", { yPercent: -10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-copy", { yPercent: -14, opacity: .2, ease: "none", scrollTrigger: { trigger: ".hero", start: "30% top", end: "bottom top", scrub: true } });

  // Pillars: pinned; the seal ring turns 120° per pillar
  gsap.timeline({
    scrollTrigger: {
      trigger: ".pillars", pin: ".pil-pin", start: "top top", end: () => "+=" + innerHeight * 2, scrub: true, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: (s) => setPillar(Math.min(2, Math.round(s.progress * 2)))
    }
  }).fromTo("#dialRing", { "--r": "0deg" }, { "--r": "-240deg", ease: "none", duration: 1 });
  gsap.from(".pil-head > *", { y: 30, opacity: 0, duration: 1, stagger: .08, ease: "expo.out", scrollTrigger: { trigger: ".pillars", start: "top 75%" } });

  // Section heads and generic reveals
  $$(".sec-head, .res-copy, .gift-copy").forEach((el) => gsap.from(el.children, {
    y: 36, opacity: 0, duration: 1.1, stagger: .08, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" }
  }));
  gsap.from(".offer", { x: 80, opacity: 0, duration: 1.1, stagger: .08, ease: "expo.out", scrollTrigger: { trigger: "#rail", start: "top 85%" } });

  // Compare: pill opens, then sweeps once
  gsap.from("#cmp", { clipPath: "inset(30% 20% 30% 20% round 999px)", ease: "none", scrollTrigger: { trigger: "#cmp", start: "top bottom", end: "top 35%", scrub: true } });
  ScrollTrigger.create({ trigger: "#cmp", start: "top 55%", once: true, onEnter: () => {
    const o = { v: 50 };
    const up = () => { setPos(o.v); range.value = o.v; };
    gsap.timeline().to(o, { v: 85, duration: 1, ease: "power3.inOut", onUpdate: up }).to(o, { v: 18, duration: 1.3, ease: "power3.inOut", onUpdate: up }).to(o, { v: 50, duration: 1, ease: "power3.inOut", onUpdate: up });
  } });

  // Weight: path draws through the steps
  gsap.to(".w-line path", { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".w-path", start: "top 75%", end: "bottom 60%", scrub: true } });
  $$(".w-step").forEach((s) => gsap.from(s, { x: 30, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: s, start: "top 82%" } }));
  gsap.from(".w-price", { y: 40, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ".w-price", start: "top 90%" } });

  // Gift: card tilts in, shine sweeps
  gsap.fromTo("#gcard", { rotationY: -35, rotationX: 14, y: 60 }, { rotationY: 6, rotationX: -3, y: 0, ease: "none", scrollTrigger: { trigger: ".gift", start: "top bottom", end: "center 55%", scrub: true } });
  gsap.fromTo("#gcard", { "--shine": "-70%" }, { "--shine": "70%", ease: "none", scrollTrigger: { trigger: ".gift", start: "top 70%", end: "bottom 50%", scrub: true } });

  // Parallax photos
  $$(".gift-img img, .v-photo img").forEach((img) => gsap.fromTo(img, { yPercent: -10 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } }));
  gsap.from(".v-card", { y: 60, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".v-card", start: "top 90%" } });
  gsap.from(".seal-foot", { rotation: -120, scale: .4, opacity: 0, duration: 1.4, ease: "back.out(1.6)", scrollTrigger: { trigger: ".foot", start: "top 85%" } });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
