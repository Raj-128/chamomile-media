(() => {
  const root = document.documentElement;

  /*
   * Every element that starts hidden behind `html.reveal-pending`.
   * Kept in one place so the fallback and the safety sweep agree.
   */
  const HIDDEN_SELECTOR = [
    ".reveal",
    ".reveal-step",
    ".hero-card",
    ".stat-card",
    ".service-card",
    ".service-detail-card",
    ".work-card",
    ".testimonial-card",
    ".proof-strip__item",
    ".work-spotlight",
    ".client-showcase",
    ".hero-rotator",
    ".hero-proof span",
    ".hero-visual",
    ".hero-text",
  ].join(", ");

  const resetAnimationStyles = () => {
    document.querySelectorAll(HIDDEN_SELECTOR).forEach((element) => {
      element.style.removeProperty("opacity");
      element.style.removeProperty("visibility");
      element.style.removeProperty("transform");
      element.style.removeProperty("filter");
    });
  };

  const disableAnimationMask = () => {
    root.classList.remove("reveal-pending");
    root.classList.remove("animations-ready");
    resetAnimationStyles();
  };

  /*
   * Safety sweep.
   *
   * If any reveal target is still invisible after the page has settled,
   * something interrupted its tween. Content must never be lost to an
   * animation, so force it visible.
   */
  const sweepStuckElements = () => {
    document.querySelectorAll(HIDDEN_SELECTOR).forEach((element) => {
      const styles = window.getComputedStyle(element);
      const isStuck =
        styles.visibility === "hidden" || Number(styles.opacity) < 0.02;

      if (!isStuck) {
        return;
      }

      // Only rescue elements that are actually on screen or above it,
      // so genuinely pending scroll reveals are left alone.
      const bounds = element.getBoundingClientRect();

      if (bounds.top > window.innerHeight * 0.98) {
        return;
      }

      if (window.gsap) {
        window.gsap.killTweensOf(element);
      }

      element.style.removeProperty("filter");
      element.style.removeProperty("transform");
      element.style.visibility = "visible";
      element.style.opacity = "1";
    });
  };

  if (!window.gsap || !window.ScrollTrigger) {
    disableAnimationMask();
    return;
  }

  try {
    root.classList.remove("reveal-pending");
    root.classList.add("animations-ready");

    // Force a style recalculation so GSAP never reads the pre-reveal
    // (opacity: 0) computed styles when it records tween values.
    void document.body.offsetHeight;

    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;

    if (prefersReducedMotion) {
      disableAnimationMask();
      return;
    }

    /*
     * Shared reveal helper.
     *
     * Always `fromTo`, never `from`: `from` infers the end state from
     * whatever the element looks like right now, so a mis-timed read
     * animates an element from hidden to hidden and the content is gone.
     * `fromTo` states the visible end explicitly, so the content always
     * lands visible.
     */
    const revealFromTo = (targets, fromVars, toVars) =>
      gsap.fromTo(
        targets,
        Object.assign({ autoAlpha: 0 }, fromVars),
        Object.assign(
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            ease: "power2.out",
            overwrite: "auto",
            clearProps: "filter",
          },
          toVars
        )
      );

    const revealTargets = gsap.utils.toArray(
      ".reveal:not(.hero-card):not(.service-card):not(.work-card):not(.service-detail-card):not(.testimonial-card):not(.client-showcase):not(.work-spotlight):not(.proof-strip)"
    );

    revealTargets.forEach((element) => {
      revealFromTo(
        element,
        { y: 34, filter: "blur(10px)" },
        {
          duration: 0.82,
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            once: true,
          },
        }
      );
    });

    const staggerGroups = [
      ".stats-grid .stat-card",
      ".services-grid .service-card",
      ".service-detail-grid .service-detail-card",
      ".work-grid .work-card",
      ".testimonial-grid .testimonial-card",
      ".proof-strip .proof-strip__item",
    ];

    staggerGroups.forEach((selector) => {
      const items = gsap.utils.toArray(selector);

      if (!items.length) {
        return;
      }

      revealFromTo(
        items,
        { y: 28, filter: "blur(8px)" },
        {
          duration: 0.82,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: items[0].parentElement,
            start: "top 88%",
            once: true,
          },
        }
      );
    });

    const heroCards = gsap.utils.toArray(".hero-card");

    if (heroCards.length) {
      revealFromTo(
        heroCards,
        { y: 44, scale: 0.98, filter: "blur(12px)" },
        {
          duration: 0.95,
          stagger: 0.14,
          ease: "power3.out",
          onComplete() {
            if (isSmallScreen) {
              return;
            }

            heroCards.forEach((card, index) => {
              gsap.to(card, {
                y: index % 2 === 0 ? -10 : 10,
                duration: 4.6 + index * 0.5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: index * 0.14,
              });
            });
          },
        }
      );
    }

    const heroAccentItems = gsap.utils.toArray(".hero-rotator, .hero-proof span");

    if (!isSmallScreen) {
      heroAccentItems.forEach((item, index) => {
        gsap.to(item, {
          y: index % 2 === 0 ? -6 : 6,
          duration: 3.9 + index * 0.25,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 0.5 + index * 0.1,
        });
      });
    }

    const spotlightBlocks = gsap.utils.toArray(".work-spotlight, .client-showcase");

    spotlightBlocks.forEach((block, index) => {
      revealFromTo(
        block,
        { y: 34, scale: 0.985, filter: "blur(10px)" },
        {
          duration: 0.9,
          delay: index * 0.06,
          scrollTrigger: {
            trigger: block,
            start: "top 88%",
            once: true,
          },
        }
      );
    });

    const processSteps = gsap.utils.toArray(".reveal-step");

    if (processSteps.length) {
      revealFromTo(
        processSteps,
        { y: 34, scale: 0.985, filter: "blur(10px)" },
        {
          duration: 0.82,
          stagger: 0.16,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".process-timeline",
            start: "top 92%",
            once: true,
          },
        }
      );
    }

    if (!isSmallScreen && document.querySelector(".hero")) {
      gsap.to(".hero-visual", {
        yPercent: -5,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 1.05,
        },
      });

      gsap.to(".hero-text", {
        yPercent: -2,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 1.05,
        },
      });
    }

    /*
     * Fonts and images change layout after the triggers are built.
     * Refresh so every start/end position matches the final layout.
     */
    const refreshTriggers = () => ScrollTrigger.refresh();

    window.addEventListener("load", () => {
      refreshTriggers();
      window.setTimeout(sweepStuckElements, 1200);
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refreshTriggers);
    }

    window.setTimeout(refreshTriggers, 900);
    window.setTimeout(sweepStuckElements, 2600);
    window.addEventListener("scroll", () => {
      window.clearTimeout(sweepStuckElements.timer);
      sweepStuckElements.timer = window.setTimeout(sweepStuckElements, 700);
    }, { passive: true });
  } catch (error) {
    console.error("Chamomile Media animations disabled:", error);
    disableAnimationMask();
  }
})();
