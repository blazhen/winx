/* =============================================================
   WINX CARPENTRY — main.js
   Lenis smooth scroll + GSAP/ScrollTrigger motion, counters,
   mobile nav, process pinning, projects filter, FAQ, form.
   Everything is progressively enhanced and fully disabled
   under prefers-reduced-motion.
   ============================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasLenis = typeof window.Lenis !== "undefined";
  const MOTION = !prefersReduced && hasGSAP;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* -----------------------------------------------------------
     1. HEADER — shrink on scroll, year stamp, current page
  ----------------------------------------------------------- */
  function initHeader() {
    const header = $("[data-header]");
    if (header) {
      const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    const yearEl = $("[data-year]");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  /* -----------------------------------------------------------
     2. MOBILE NAV overlay
  ----------------------------------------------------------- */
  function initMobileNav() {
    const toggle = $("[data-nav-toggle]");
    const overlay = $("[data-nav-overlay]");
    if (!toggle || !overlay) return;

    const links = $$("a", overlay);
    const setOpen = (open) => {
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      overlay.setAttribute("aria-hidden", String(!open));
      if (open) {
        if (window.__lenis) window.__lenis.stop();
        const first = links[0];
        if (first) first.focus({ preventScroll: true });
      } else {
        if (window.__lenis) window.__lenis.start();
      }
    };

    toggle.addEventListener("click", () =>
      setOpen(!document.body.classList.contains("menu-open"))
    );
    links.forEach((l) => l.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* -----------------------------------------------------------
     3. LENIS smooth scrolling (fed into ScrollTrigger)
  ----------------------------------------------------------- */
  function initLenis() {
    if (!MOTION || !hasLenis) return null;
    const lenis = new window.Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    window.__lenis = lenis;

    if (hasGSAP && window.ScrollTrigger) {
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }

    // anchor links → smooth scroll via Lenis
    $$('a[href^="#"]').forEach((a) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      a.addEventListener("click", (e) => {
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -90 });
      });
    });
    return lenis;
  }

  /* -----------------------------------------------------------
     4. GSAP scroll reveals, hero, parallax, process, counters
  ----------------------------------------------------------- */
  function initMotion() {
    if (!MOTION) return;
    const gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);
    document.documentElement.classList.add("has-motion");

    /* 4a. Hero — cinematic scroll: pin, zoom into the photo, then split it apart
       to reveal the statement. Desktop/tablet only — on phones the pinned scroll
       + moving pieces are unreliable (address-bar resize, sideways overflow), so
       the photo simply sits still (the four pieces form one image) and the
       headline word-rise / fades still play. */
    const hero = $("[data-hero]");
    const doors = $("[data-hero-doors]");
    const heroSplitOK = window.matchMedia("(min-width: 769px)").matches;
    if (hero && doors && heroSplitOK) {
      const zooms = $$("[data-hero-zoom]");
      const tl_ = $('[data-hero-piece="tl"]');
      const tr_ = $('[data-hero-piece="tr"]');
      const bl_ = $('[data-hero-piece="bl"]');
      const br_ = $('[data-hero-piece="br"]');
      const scrim = $("[data-hero-scrim]");
      const layer = $("[data-hero-layer]");
      const side = $(".hero__side");
      const scrollCue = $(".hero__scroll");
      const reveal = $(".hero__reveal");

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "+=150%",
          scrub: 0.5,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,   // recompute on mobile address-bar resize
        },
      });
      // zoom across the whole pin
      tl.to(zooms, { scale: 1.5, duration: 1 }, 0);
      // headline + chrome clear out early
      tl.to(layer, { yPercent: -10, autoAlpha: 0, duration: 0.4, ease: "power1.in" }, 0.04);
      tl.to([side, scrollCue], { autoAlpha: 0, duration: 0.3 }, 0.04);
      // then the four quadrants split out to the corners, revealing the panel
      tl.to(scrim, { autoAlpha: 0, duration: 0.35, ease: "power1.in" }, 0.5);
      const sp = { duration: 0.5, ease: "power3.inOut" };
      tl.to(tl_, { xPercent: -105, yPercent: -105, rotate: -6, ...sp }, 0.5);
      tl.to(tr_, { xPercent: 105, yPercent: -105, rotate: 6, ...sp }, 0.5);
      tl.to(bl_, { xPercent: -105, yPercent: 105, rotate: 6, ...sp }, 0.5);
      tl.to(br_, { xPercent: 105, yPercent: 105, rotate: -6, ...sp }, 0.5);
      tl.fromTo(reveal,
        { autoAlpha: 0, scale: 1.12 },
        { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power2.out" }, 0.56);

      // one shared value drives BOTH the lamp swing and the warm glow on the
      // words, so they can never drift out of sync (see --swing in styles.css)
      if (reveal) {
        gsap.fromTo(reveal,
          { "--swing": -1 },
          { "--swing": 1, duration: 3.2, ease: "sine.inOut", repeat: -1, yoyo: true });
      }
    }

    /* 4a-iii. Heading mask-rise — big headings rise out of a clip on scroll-in */
    $$(".page-hero h1, .section-head h2, .statement, .cta-band h2").forEach((h) => {
      if (h.classList.contains("has-mask")) return;
      const span = document.createElement("span");
      span.className = "rmask";
      while (h.firstChild) span.appendChild(h.firstChild);
      h.appendChild(span);
      h.classList.add("has-mask");
      h.removeAttribute("data-reveal"); // avoid double-animating with generic reveal
      gsap.set(span, { yPercent: 115 });
      gsap.to(span, {
        yPercent: 0, duration: 1.1, ease: "power4.out",
        scrollTrigger: { trigger: h, start: "top 88%" },
      });
    });

    /* 4a-iv. Image scale-in — figures settle from a gentle zoom */
    $$(".figure img").forEach((img) => {
      gsap.fromTo(img, { scale: 1.22 }, {
        scale: 1, duration: 1.4, ease: "power3.out",
        scrollTrigger: { trigger: img.closest(".figure"), start: "top 88%" },
      });
    });

    /* 4b. Generic reveals — fade + slide, staggered by group */
    $$("[data-reveal]").forEach((el) => {
      const staggerParent = el.closest("[data-reveal-group]");
      if (staggerParent && staggerParent.__done) return;
      if (staggerParent) {
        staggerParent.__done = true;
        const kids = $$("[data-reveal]", staggerParent);
        gsap.to(kids, {
          opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1,
          scrollTrigger: { trigger: staggerParent, start: "top 82%" },
        });
      } else {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      }
    });

    /* 4c. Parallax — backgrounds move slower than foreground */
    $$("[data-parallax]").forEach((el) => {
      const amount = parseFloat(el.dataset.parallax) || 12;
      gsap.fromTo(
        el, { yPercent: -amount }, { yPercent: amount, ease: "none",
          scrollTrigger: { trigger: el.closest(".figure, .project, section") || el, start: "top bottom", end: "bottom top", scrub: true } }
      );
    });

    /* 4c-ii. Card stack — buried cards recede & dim as the next covers them */
    initCardStack(gsap);

    /* 4c-iii. Rotary testimonials — 3 cards on a ring, scroll/swipe spins it */
    initTestiRing(gsap);

    /* 4d. Process — sticky visual advances with steps */
    initProcess(gsap);

    /* 4e. Stat counters */
    initCounters(gsap);

    /* 4f. Magnetic buttons */
    initMagnetic(gsap);

    // refresh once images settle
    window.addEventListener("load", () => window.ScrollTrigger.refresh());
  }

  function initTestiRing(gsap) {
    const section = $("[data-testi-ring]");
    if (!section) return;
    const ring = $("[data-ring]", section);
    if (!ring) return;
    const dots = $$("[data-ring-dots] span", section);
    const cards = $$(".testi-ring__card", ring);
    const steps = cards.length;            // 3
    const seg = 360 / steps;               // 120° per card

    section.classList.add("is-ring");      // switch CSS from grid → 3D ring

    let rot = 0;                           // target rotation (deg)
    const ry = gsap.quickTo(ring, "rotationY", { duration: 0.6, ease: "power3" });
    gsap.set(ring, { rotationY: 0 });

    const updateDots = () => {
      if (!dots.length) return;
      const idx = ((Math.round(-rot / seg) % steps) + steps) % steps;
      dots.forEach((d, n) => d.classList.toggle("is-active", n === idx));
    };
    const apply = () => { ry(rot); updateDots(); };
    const snap = () => { rot = Math.round(rot / seg) * seg; apply(); };
    updateDots();

    /* drag (mouse) / swipe (touch). touch-action:pan-y (CSS) lets vertical
       swipes scroll the page while horizontal swipes spin the ring. */
    let down = false, startX = 0, startRot = 0;
    ring.addEventListener("dragstart", (e) => e.preventDefault()); // no native text/element drag
    ring.addEventListener("pointerdown", (e) => {
      down = true; startX = e.clientX; startRot = rot;
      try { ring.setPointerCapture(e.pointerId); } catch (_) {}
      section.classList.add("is-grabbing");
    });
    ring.addEventListener("pointermove", (e) => {
      if (!down) return;
      rot = startRot + (e.clientX - startX) * 0.45;
      ry(rot); updateDots();
    });
    const release = (e) => {
      if (!down) return;
      down = false;
      try { ring.releasePointerCapture(e.pointerId); } catch (_) {}
      section.classList.remove("is-grabbing");
      snap();
    };
    ring.addEventListener("pointerup", release);
    ring.addEventListener("pointercancel", release);

    /* wheel while hovering the ring (desktop) → rotate, then settle */
    let wheelTO = 0;
    ring.addEventListener("wheel", (e) => {
      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      rot += d * 0.25;
      ry(rot); updateDots();
      e.preventDefault();
      clearTimeout(wheelTO);
      wheelTO = setTimeout(snap, 150);
    }, { passive: false });
  }

  function initCardStack(gsap) {
    const stack = $("[data-cardstack]");
    if (!stack) return;
    const cards = $$(".cardstack__card", stack);
    cards.forEach((card, i) => {
      if (i === cards.length - 1) return; // last card stays full
      const inner = $(".pcard", card);
      if (!inner) return;
      gsap.to(inner, {
        scale: 0.92, opacity: 0.5, ease: "none",
        scrollTrigger: {
          trigger: cards[i + 1],
          start: "top bottom",
          end: "top top",
          scrub: true,
        },
      });
    });
  }

  function initProcess(gsap) {
    const steps = $$("[data-process-step]");
    const visuals = $$("[data-process-visual]");
    if (!steps.length || !gsap.matchMedia) return;
    const mm = gsap.matchMedia();

    /* DESKTOP — the sticky image swaps as the active step changes */
    mm.add("(min-width: 900px)", () => {
      if (!visuals.length) return;
      const setActive = (i) => {
        steps.forEach((s, n) => s.classList.toggle("is-active", n === i));
        visuals.forEach((v, n) => v.classList.toggle("is-active", n === i));
      };
      setActive(0);
      steps.forEach((step, i) => {
        window.ScrollTrigger.create({
          trigger: step,
          start: "top 60%",
          end: "bottom 60%",
          onToggle: (self) => { if (self.isActive) setActive(i); },
        });
      });
    });

    /* MOBILE — pin the section. Each step's photo shrinks bottom→top in place
       (its height collapses, pushed by the text), then the body collapses too,
       leaving the step number + heading, which stack up at the top. */
    mm.add("(max-width: 899px)", () => {
      // plain stacked list — each step's photo, heading and text fade + rise in
      // as the step scrolls into view (staggered). No pin, no collapse.
      steps.forEach((step) => {
        const parts = [
          step.querySelector(".process__step-img"),
          step.querySelector(".process__step-head"),
          step.querySelector("p"),
        ].filter(Boolean);
        gsap.from(parts, {
          autoAlpha: 0,
          y: 38,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.09,
          scrollTrigger: { trigger: step, start: "top 82%" },
        });
      });
    });
  }

  function initCounters(gsap) {
    $$("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = (el.dataset.count.split(".")[1] || "").length;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 2,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
        onUpdate: () => {
          el.textContent = obj.v.toLocaleString("en-AU", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
        },
        onComplete: () => {
          el.textContent = target.toLocaleString("en-AU", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
        },
      });
    });
  }

  function initMagnetic(gsap) {
    if (window.matchMedia("(hover: none)").matches) return;
    $$("[data-magnetic]").forEach((btn) => {
      const strength = 0.35;
      const xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
      const yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      btn.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
    });
  }

  /* -----------------------------------------------------------
     5. PROJECTS filter
  ----------------------------------------------------------- */
  function initFilters() {
    const buttons = $$("[data-filter]");
    const items = $$("[data-category]");
    if (!buttons.length || !items.length) return;
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const f = btn.dataset.filter;
        buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        items.forEach((item) => {
          const show = f === "all" || item.dataset.category.split(" ").includes(f);
          item.hidden = !show;
        });
        if (typeof window.__sliderRefresh === "function") window.__sliderRefresh();
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      });
    });
  }

  /* -----------------------------------------------------------
     5b. PROJECTS drag slider — smooth drag + momentum, wheel,
         keyboard, progress, per-card parallax, custom drag cursor.
         Works without GSAP; parallax respects prefers-reduced-motion.
  ----------------------------------------------------------- */
  function initSlider() {
    const sliders = $$(".pslider");
    if (!sliders.length) return;
    const fineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const refreshers = [];

    sliders.forEach((slider) => {
      const track = $("[data-slider-track]", slider);
      if (!track) return;
      const progress = $("[data-slider-progress]", slider);
      // slides = every direct child except the trailing spacer (works for
      // image .pcard slides AND text .card slides)
      const cards = Array.from(track.children).filter((el) => !el.classList.contains("pad"));
      const stair = track.hasAttribute("data-slider-stair") && !prefersReduced;
      // .pslider--cards is an interactive carousel on mobile, but a plain CSS grid on desktop
      const mobileOnly = slider.classList.contains("pslider--cards");

      // optional progress dots (one per slide, click to jump)
      const dotsWrap = $("[data-slider-dots]", slider);
      const dots = [];
      if (dotsWrap && cards.length) {
        cards.forEach((c, i) => {
          const b = document.createElement("button");
          b.type = "button";
          b.setAttribute("aria-label", "Show item " + (i + 1));
          b.addEventListener("click", () => { track.scrollTo({ left: c.offsetLeft - 8, behavior: "smooth" }); });
          dotsWrap.appendChild(b);
          dots.push(b);
        });
      }

      const clamp = () => {
        const max = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft < 0) track.scrollLeft = 0;
        else if (track.scrollLeft > max) track.scrollLeft = max;
      };
      const update = () => {
        const max = track.scrollWidth - track.clientWidth;
        const pct = max > 0 ? track.scrollLeft / max : 0;
        if (progress) progress.style.left = pct * 82 + "%";
        if (dots.length) {
          const active = Math.round(pct * (dots.length - 1));
          dots.forEach((d, i) => d.classList.toggle("is-active", i === active));
        }
        const w = track.clientWidth || 1;
        cards.forEach((card) => {
          // position of the card's centre relative to the track's centre (layout-based, no feedback)
          const t = (card.offsetLeft + card.offsetWidth / 2 - track.scrollLeft - w / 2) / w;
          if (!prefersReduced) {
            const img = $("[data-slider-img]", card);
            if (img) img.style.objectPosition = `${50 + t * 16}% center`;
          }
          if (stair) {
            // climb to the upper-left, rotate around like a spiral staircase, recede at the edges
            const ty = t * 92;
            const ry = t * -17;
            const rz = t * -4;
            const sc = 1 - Math.min(Math.abs(t) * 0.18, 0.24);
            card.style.transform =
              `translateY(${ty.toFixed(1)}px) rotateY(${ry.toFixed(1)}deg) rotateZ(${rz.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
            card.style.zIndex = String(120 - Math.round(Math.abs(t) * 100));
          }
        });
      };
      refreshers.push(update);

      /* drag with momentum — shared state lives here so it survives activate/deactivate */
      const DRAG = 0.6;   // < 1 = the track moves slower than the finger/cursor
      let down = false, moved = false, startX = 0, startScroll = 0, lastX = 0, vx = 0, raf = 0;
      const stopRAF = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
      const momentum = () => {
        vx *= 0.93;
        track.scrollLeft -= vx;
        clamp();
        if (Math.abs(vx) > 0.5) { raf = requestAnimationFrame(momentum); } else { raf = 0; }
      };
      const endDrag = (e) => {
        if (!down) return;
        down = false;
        track.classList.remove("is-dragging");
        try { track.releasePointerCapture(e.pointerId); } catch (_) {}
        if (!prefersReduced && Math.abs(vx) > 1) {
          vx *= 9; // gentler release fling
          stopRAF();
          raf = requestAnimationFrame(momentum);
        }
      };

      /* All drag/wheel/keyboard/cursor wiring lives in activate(); deactivate()
         tears it down via AbortController so .pslider--cards can fall back to a
         static grid on desktop without leaving stray handlers behind. */
      let ac = null, cursorEl = null;
      function activate() {
        if (ac) return;
        ac = new AbortController();
        const sig = { signal: ac.signal };

        track.addEventListener("dragstart", (e) => e.preventDefault(), sig);
        track.addEventListener("pointerdown", (e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          down = true; moved = false; vx = 0;
          startX = lastX = e.clientX; startScroll = track.scrollLeft;
          stopRAF();
          track.classList.add("is-dragging");
          try { track.setPointerCapture(e.pointerId); } catch (_) {}
        }, sig);
        track.addEventListener("pointermove", (e) => {
          if (!down) return;
          const dx = (e.clientX - lastX) * DRAG;
          lastX = e.clientX;
          vx = vx * 0.6 + dx * 0.4; // smoothed velocity (already scaled by DRAG)
          if (Math.abs(e.clientX - startX) > 4) moved = true;
          track.scrollLeft = startScroll - (e.clientX - startX) * DRAG;
        }, sig);
        track.addEventListener("pointerup", endDrag, sig);
        track.addEventListener("pointercancel", endDrag, sig);
        // Suppress click navigation if the pointer was dragged
        track.addEventListener("click", (e) => { if (moved) { e.preventDefault(); } }, { capture: true, signal: ac.signal });

        /* vertical wheel → horizontal, releasing to the page at the ends */
        track.addEventListener("wheel", (e) => {
          if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // native horizontal/trackpad
          const max = track.scrollWidth - track.clientWidth;
          const atStart = track.scrollLeft <= 0;
          const atEnd = track.scrollLeft >= max - 1;
          if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;
          stopRAF();
          track.scrollLeft += e.deltaY;
          e.preventDefault();
          e.stopPropagation();
        }, { passive: false, signal: ac.signal });

        /* keyboard: arrow keys advance by ~one card */
        track.addEventListener("keydown", (e) => {
          const step = (cards[0] ? cards[0].offsetWidth : 360) + 20;
          if (e.key === "ArrowRight") { track.scrollBy({ left: step, behavior: "smooth" }); e.preventDefault(); }
          if (e.key === "ArrowLeft") { track.scrollBy({ left: -step, behavior: "smooth" }); e.preventDefault(); }
        }, sig);

        /* custom drag-cursor badge (fine pointer + motion only) */
        if (fineHover && !prefersReduced) {
          cursorEl = document.createElement("div");
          cursorEl.className = "pslider__cursor";
          cursorEl.setAttribute("aria-hidden", "true");
          cursorEl.innerHTML = "<span>Drag ↔</span>";
          slider.appendChild(cursorEl);
          track.classList.add("has-cursor");
          const place = (e) => {
            const s = down ? 0.82 : 1;
            cursorEl.style.transform =
              `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%) scale(${s})`;
          };
          track.addEventListener("pointerenter", (e) => { cursorEl.classList.add("is-on"); place(e); }, sig);
          track.addEventListener("pointerleave", () => cursorEl.classList.remove("is-on"), sig);
          track.addEventListener("pointermove", place, sig);
        }
      }
      function deactivate() {
        if (!ac) return;
        ac.abort(); ac = null;
        stopRAF();
        down = false;
        track.classList.remove("is-dragging", "has-cursor");
        if (cursorEl) { cursorEl.remove(); cursorEl = null; }
        track.scrollLeft = 0; // hand layout back to the CSS grid
        update();
      }

      track.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update, { passive: true });
      window.addEventListener("load", update);

      if (mobileOnly) {
        const mq = window.matchMedia("(max-width: 768px)");
        const sync = () => { if (mq.matches) activate(); else deactivate(); };
        if (mq.addEventListener) mq.addEventListener("change", sync); else mq.addListener(sync);
        sync();
      } else {
        activate();
      }
      update();
    });

    window.__sliderRefresh = () => refreshers.forEach((fn) => fn());
  }

  /* -----------------------------------------------------------
     6. FAQ accordion (accessible)
  ----------------------------------------------------------- */
  function initFAQ() {
    const items = $$("[data-faq-item]");
    if (!items.length) return;
    items.forEach((item) => {
      const btn = $(".faq__q", item);
      if (!btn) return;
      btn.addEventListener("click", () => {
        const open = item.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(open));
      });
    });
  }

  /* -----------------------------------------------------------
     7. CONTACT form → Formspree (AJAX, graceful fallback)
  ----------------------------------------------------------- */
  function initForm() {
    const form = $("[data-form]");
    if (!form) return;
    const status = $("[data-form-status]", form) || $("[data-form-status]");
    const submitBtn = $('button[type="submit"]', form);

    form.addEventListener("submit", async (e) => {
      // If the endpoint is still the placeholder, let it submit normally
      // so the developer notices — but warn in console.
      if (form.action.includes("FORM_ID")) {
        e.preventDefault();
        if (status) {
          status.textContent = "Form not yet connected — add your Formspree ID (see README).";
          status.className = "form__status is-error";
        }
        console.warn("[Winx] TODO: replace FORM_ID in contact.html with your Formspree endpoint.");
        return;
      }

      e.preventDefault();
      const data = new FormData(form);
      if (status) { status.textContent = "Sending…"; status.className = "form__status"; }
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          form.reset();
          if (status) {
            status.textContent = "Thanks — your enquiry is in. We'll be in touch shortly.";
            status.className = "form__status is-ok";
          }
        } else {
          const json = await res.json().catch(() => ({}));
          const msg = json.errors ? json.errors.map((x) => x.message).join(", ") : "Something went wrong.";
          if (status) { status.textContent = msg; status.className = "form__status is-error"; }
        }
      } catch (err) {
        if (status) {
          status.textContent = "Network error — please call 0411 833 069 instead.";
          status.className = "form__status is-error";
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  /* -----------------------------------------------------------
     8. PRELOADER — intro reveal, once per session
  ----------------------------------------------------------- */
  function initPreloader() {
    const pre = $("[data-preloader]");
    if (!pre) return;
    let seen = false;
    try { seen = !!sessionStorage.getItem("winxIntro"); } catch (_) {}
    if (prefersReduced || seen) { pre.classList.add("is-hidden"); return; }
    try { sessionStorage.setItem("winxIntro", "1"); } catch (_) {}

    document.body.classList.add("intro-lock");
    if (window.__lenis) window.__lenis.stop();
    window.scrollTo(0, 0);

    const fill = $("[data-preloader-fill]", pre);
    requestAnimationFrame(() => { if (fill) fill.style.transform = "scaleX(1)"; });

    setTimeout(() => {
      pre.classList.add("is-done");
      document.body.classList.remove("intro-lock");
      if (window.__lenis) window.__lenis.start();
      setTimeout(() => {
        pre.classList.add("is-hidden");
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      }, 950);
    }, 1400);
  }

  /* -----------------------------------------------------------
     8b. SPOTLIGHT — soft light follows the cursor across cards
  ----------------------------------------------------------- */
  function initSpotlight() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    $$(".card, .pillar, .quote").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });
  }

  /* -----------------------------------------------------------
     9. SCROLL PROGRESS BAR
  ----------------------------------------------------------- */
  function initScrollProgress() {
    const bar = $("[data-scroll-progress]");
    if (!bar) return;
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = "scaleX(" + p + ")";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }

  /* -----------------------------------------------------------
     Boot
  ----------------------------------------------------------- */
  function boot() {
    initHeader();
    initMobileNav();
    initLenis();
    initPreloader();
    initScrollProgress();
    initMotion();
    initSlider();
    initFilters();
    initFAQ();
    initForm();
    initSpotlight();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
