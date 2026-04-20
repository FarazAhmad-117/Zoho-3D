/* =====================================================
   ZOHO — Scroll orchestration
   Lenis smooth scroll + GSAP ScrollTrigger
   Synchronizes Three.js camera to scroll position across
   all sections.
   ===================================================== */
(function () {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  function init() {
    const LenisCtor = window.Lenis || (window.lenis && window.lenis.default);
    if (LenisCtor) {
      try {
        const lenis = new LenisCtor({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 1.0,
          lerp: 0.08,
        });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
        window.__lenis = lenis;
      } catch (err) {
        console.warn("Lenis failed, using native scroll", err);
        document.documentElement.style.scrollBehavior = "smooth";
      }
    } else {
      document.documentElement.style.scrollBehavior = "smooth";
    }

    const S = window.__scene;
    if (!S) return;

    // Progress bar + chapter label
    const progressBar = document.querySelector(".progress .bar i");
    const progressPct = document.querySelector(".progress .pct");
    const chapterNum = document.querySelector(".chapter .num");
    const chapterName = document.querySelector(".chapter .name");
    const chapters = [
      { id: "hero", n: "01", name: "First Contact" },
      { id: "intro", n: "02", name: "Manifesto" },
      { id: "features", n: "03", name: "Formulation" },
      { id: "ingredients", n: "04", name: "Composition" },
      { id: "story", n: "05", name: "Process" },
      { id: "rotation", n: "06", name: "Anatomy" },
      { id: "specs", n: "07", name: "Dimensions" },
      { id: "reviews", n: "08", name: "Acclaim" },
      { id: "variants", n: "09", name: "The Collection" },
      { id: "founder", n: "10", name: "Origin" },
      { id: "cta", n: "11", name: "Acquire" },
    ];

    ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      onUpdate(self) {
        const p = Math.round(self.progress * 100);
        if (progressBar) progressBar.style.width = p + "%";
        if (progressPct) progressPct.textContent = String(p).padStart(3, "0");
      },
    });

    chapters.forEach((c) => {
      const el = document.getElementById(c.id);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start: "top 50%",
        end: "bottom 50%",
        onEnter: () => { chapterNum.textContent = c.n; chapterName.textContent = c.name; },
        onEnterBack: () => { chapterNum.textContent = c.n; chapterName.textContent = c.name; },
      });
    });

    // ---------- HERO ----------
    // Bottle 0: tall front, slowly drifts backward + rotates as user scrolls
    {
      const b = S.bottles[0];
      gsap.set(b.position, { x: 0, y: 0, z: 0 });
      gsap.set(b.scale, { x: 1, y: 1, z: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
      tl.to(S.state.cameraTarget, { x: 0, y: 0.3, z: 6.2, duration: 1 }, 0);
      tl.to(S.state.cameraLook, { x: 0, y: 0, z: 0, duration: 1 }, 0);
      tl.to(b.rotation, { y: Math.PI * 0.3, duration: 1 }, 0);
      tl.to(b.position, { y: -0.2, duration: 1 }, 0);
    }

    // ---------- INTRO ----------
    // camera pans right to show bottle 1 floating sideways
    {
      const b = S.bottles[1];
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#intro",
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
      tl.to(S.state.cameraTarget, { x: 10, y: 1.2, z: 6.5, duration: 1 }, 0);
      tl.to(S.state.cameraLook, { x: 10, y: 1, z: -2, duration: 1 }, 0);
      tl.to(b.rotation, { z: -0.2, y: Math.PI, duration: 1 }, 0);
      tl.to(b.scale, { x: 0.8, y: 0.8, z: 0.8, duration: 1 }, 0);
    }

    // ---------- FEATURES (horizontal pinned scroll) ----------
    {
      const track = document.querySelector("#features .track");
      const panels = document.querySelectorAll("#features .panel");
      const totalX = (panels.length - 1) * 100; // vw
      const horiz = gsap.to(track, {
        x: () => `-${totalX}vw`,
        ease: "none",
        scrollTrigger: {
          trigger: "#features",
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // camera flies along horizontal path through bottle 2
      const b = S.bottles[2];
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#features",
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });
      tl.fromTo(S.state.cameraTarget, { x: 10, y: 1, z: 6 }, { x: 22, y: 0.5, z: 5.5, duration: 0.4 }, 0);
      tl.to(S.state.cameraTarget, { x: 22, y: 0, z: 4.5, duration: 0.3 }, 0.4);
      tl.to(S.state.cameraTarget, { x: 22, y: -0.5, z: 5.0, duration: 0.3 }, 0.7);
      tl.fromTo(S.state.cameraLook, { x: 10, y: 1, z: -2 }, { x: 22, y: 0, z: 0, duration: 1 }, 0);
      tl.to(b.rotation, { y: Math.PI * 2, duration: 1 }, 0);
      tl.to(b.position, { y: 0.6, duration: 0.5, yoyo: true, repeat: 1 }, 0);
    }

    // ---------- INGREDIENTS ----------
    // each ingredient row: animate its bar, fade the bottle bg
    {
      const b = S.bottles[3];
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#ingredients",
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
      tl.to(S.state.cameraTarget, { x: 34, y: 0, z: 7.5, duration: 1 }, 0);
      tl.to(S.state.cameraLook, { x: 34, y: -1, z: 2, duration: 1 }, 0);
      tl.to(b.rotation, { y: Math.PI * 1.5, duration: 1 }, 0);

      document.querySelectorAll(".ingr").forEach((ingr) => {
        const bar = ingr.querySelector(".bar-wrap i");
        const pct = parseFloat(ingr.dataset.pct || "60");
        gsap.fromTo(bar, { width: "0%" }, {
          width: pct + "%",
          ease: "power2.out",
          scrollTrigger: { trigger: ingr, start: "top 80%", end: "top 40%", scrub: 1 },
        });
        gsap.from(ingr, {
          y: 60, opacity: 0, duration: 1,
          scrollTrigger: { trigger: ingr, start: "top 85%", toggleActions: "play none none reverse" },
        });
      });
    }

    // ---------- STORY PARALLAX ----------
    {
      const b = S.bottles[4];
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#story",
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
      tl.to(S.state.cameraTarget, { x: 48, y: 1, z: 6.0, duration: 1 }, 0);
      tl.to(S.state.cameraLook, { x: 48, y: 0.5, z: 0, duration: 1 }, 0);
      tl.to(b.rotation, { y: Math.PI * 0.7, z: 0.1, duration: 1 }, 0);

      // parallax columns
      gsap.to("#story .col.left", {
        y: -160,
        scrollTrigger: { trigger: "#story", start: "top bottom", end: "bottom top", scrub: 1 },
      });
      gsap.to("#story .col.mid", {
        y: -320,
        scrollTrigger: { trigger: "#story", start: "top bottom", end: "bottom top", scrub: 1 },
      });
      gsap.to("#story .col.right", {
        y: -220,
        scrollTrigger: { trigger: "#story", start: "top bottom", end: "bottom top", scrub: 1 },
      });

      // banner reveal
      gsap.from("#story .banner", {
        y: 120, opacity: 0,
        scrollTrigger: { trigger: "#story .banner", start: "top 80%", end: "top 40%", scrub: 1 },
      });
    }

    // ---------- STICKY ROTATION ----------
    {
      const b = S.bottles[5];
      const steps = document.querySelectorAll("#rotation .step");
      const dots = document.querySelectorAll("#rotation .dots .d");
      const totalSteps = steps.length;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#rotation",
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onUpdate(self) {
            const idx = Math.min(totalSteps - 1, Math.floor(self.progress * totalSteps));
            steps.forEach((s, i) => s.classList.toggle("active", i === idx));
            dots.forEach((d, i) => d.classList.toggle("active", i === idx));
          },
        },
      });
      tl.fromTo(S.state.cameraTarget, { x: 62, y: 0, z: 7.5 }, { x: 62, y: 0.3, z: 5.2, duration: 1 }, 0);
      tl.fromTo(S.state.cameraLook, { x: 62, y: 0, z: 0 }, { x: 62, y: 0, z: 0, duration: 1 }, 0);
      tl.to(b.rotation, { y: Math.PI * 3, duration: 1 }, 0);
      tl.to(b.position, { y: 0.3, duration: 0.5, yoyo: true, repeat: 1 }, 0);
    }

    // ---------- SPECS ----------
    // after rotation we pull camera back, show bottle alongside data
    {
      const b = S.bottles[5];
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#specs",
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
      tl.to(S.state.cameraTarget, { x: 66, y: 0, z: 5.8, duration: 1 }, 0);
      tl.to(S.state.cameraLook, { x: 66, y: 0, z: 0, duration: 1 }, 0);
      tl.to(b.position, { x: 4, duration: 1 }, 0);
      tl.to(b.rotation, { y: Math.PI * 0.2, duration: 1 }, 0);

      gsap.from("#specs dl > div", {
        y: 40, opacity: 0, stagger: 0.05,
        scrollTrigger: { trigger: "#specs dl", start: "top 80%", toggleActions: "play none none reverse" },
      });
    }

    // ---------- REVIEWS, VARIANTS, FOUNDER, CTA ----------
    // keep camera moving but no bottle focus, just parallax
    {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#reviews",
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
      // drift toward empty area with fragments
      tl.to(S.state.cameraTarget, { x: 70, y: 1, z: 8, duration: 1 }, 0);
      tl.to(S.state.cameraLook, { x: 70, y: 0, z: 0, duration: 1 }, 0);

      gsap.utils.toArray("#reviews .review").forEach((el, i) => {
        gsap.from(el, {
          y: 80, opacity: 0, duration: 1,
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
        });
      });

      gsap.to(".marquee", {
        x: "-30%",
        scrollTrigger: { trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: 1 },
      });
    }

    {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#variants",
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
      // bring camera back to a curated bottle (bottle 2)
      tl.to(S.state.cameraTarget, { x: 22, y: 0.5, z: 9, duration: 1 }, 0);
      tl.to(S.state.cameraLook, { x: 22, y: 0, z: 0, duration: 1 }, 0);

      gsap.from(".variant", {
        y: 80, opacity: 0, stagger: 0.06, duration: 1,
        scrollTrigger: { trigger: "#variants .row", start: "top 80%", toggleActions: "play none none reverse" },
      });
    }

    {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#founder",
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
      tl.to(S.state.cameraTarget, { x: 10, y: 2, z: 9, duration: 1 }, 0);
      tl.to(S.state.cameraLook, { x: 10, y: 1, z: -2, duration: 1 }, 0);
    }

    {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#cta",
          start: "top bottom",
          end: "bottom bottom",
          scrub: 1,
        },
      });
      // dramatic pull to original bottle for the final shot
      tl.to(S.state.cameraTarget, { x: 0, y: 0.4, z: 5.2, duration: 1 }, 0);
      tl.to(S.state.cameraLook, { x: 0, y: 0, z: 0, duration: 1 }, 0);
      gsap.to(S.bottles[0].scale, {
        x: 1.15, y: 1.15, z: 1.15,
        scrollTrigger: { trigger: "#cta", start: "top 80%", end: "bottom bottom", scrub: 1 },
      });
    }

    // Reveal animations for section headers
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        y: 80, opacity: 0, duration: 1.2, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
      });
    });

    // Hero intro
    gsap.from("#hero .pre", { y: 30, opacity: 0, duration: 1.4, ease: "power3.out", delay: 0.4 });
    gsap.from("#hero .title span", { y: 140, opacity: 0, duration: 1.6, ease: "power4.out", stagger: 0.08, delay: 0.5 });
    gsap.from("#hero .sub", { y: 30, opacity: 0, duration: 1.4, ease: "power3.out", delay: 1.3 });
    gsap.from("#hero .meta-l, #hero .meta-r", { opacity: 0, duration: 1, delay: 1.6 });
    gsap.from(".nav > *", { y: -30, opacity: 0, stagger: 0.1, duration: 1, delay: 0.2 });

    ScrollTrigger.refresh();
  }

  if (window.__scene) init();
  else window.addEventListener("scene-ready", init);
})();
