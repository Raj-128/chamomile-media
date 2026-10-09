const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".primary-nav");
const header = document.querySelector(".site-header");
const processSteps = Array.from(document.querySelectorAll(".process-step"));
const blurOverlay = document.querySelector(".process-blur-overlay");
const statNumbers = Array.from(document.querySelectorAll(".stat-number"));
const statCards = Array.from(document.querySelectorAll(".stat-card"));
const rotatingValue = document.querySelector(".hero-rotator__value");
const heroInquiryForm = document.querySelector("#hero-inquiry-form");
const workCards = Array.from(document.querySelectorAll(".work-card"));
const interactiveCards = Array.from(document.querySelectorAll(".interactive-card"));
const serviceCards = Array.from(document.querySelectorAll(".service-card"));
const servicesShowcase = document.querySelector("[data-services-showcase]");
const serviceNavItems = Array.from(document.querySelectorAll("[data-service-item]"));
const serviceStage = {
  panel: document.querySelector("[data-service-stage]"),
  kicker: document.querySelector("[data-service-kicker]"),
  title: document.querySelector("[data-service-title]"),
  copy: document.querySelector("[data-service-copy]"),
  chips: document.querySelector("[data-service-chips]"),
  count: document.querySelector("[data-service-count]"),
  progress: document.querySelector("[data-service-progress]"),
};
const clientSlider = document.querySelector("[data-client-slider]");
const clientTrack = document.querySelector("[data-client-track]");
const isMobileViewport = () => window.matchMedia("(max-width: 900px)").matches;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const supportsPointerTilt =
  window.matchMedia("(hover: hover) and (pointer: fine)").matches && !prefersReducedMotion;

if (heroInquiryForm) {
  const heroInquiryStatus = heroInquiryForm.querySelector(".hero-inquiry-status");
  const submitButton = heroInquiryForm.querySelector('button[type="submit"]');
  const usesAppsScript = Boolean(heroInquiryForm.dataset.appsScriptUrl?.trim());

  heroInquiryForm.addEventListener("submit", (event) => {
    if (!usesAppsScript && ["127.0.0.1", "localhost", ""].includes(window.location.hostname)) {
      event.preventDefault();
      if (heroInquiryStatus) {
        heroInquiryStatus.textContent =
          "Local preview only: publish this site on Netlify to receive inquiry submissions.";
        heroInquiryStatus.dataset.state = "error";
      }
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }
    if (heroInquiryStatus) {
      heroInquiryStatus.textContent = "Sending your inquiry to Chamomile Media...";
      heroInquiryStatus.dataset.state = "pending";
    }
  });
}

if (toggle && nav) {
  const closeNavigation = () => {
    nav.classList.remove("open");
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
  };

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    document.body.classList.toggle("menu-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNavigation);
  });

  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("open")) {
      return;
    }

    const clickedInsideNav = nav.contains(event.target);
    const clickedToggle = toggle.contains(event.target);

    if (!clickedInsideNav && !clickedToggle) {
      closeNavigation();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNavigation();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeNavigation();
    }
  });
}

if (header) {
  const syncHeaderState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  syncHeaderState();
  window.addEventListener("scroll", syncHeaderState, { passive: true });
}

if (processSteps.length && blurOverlay) {
  const showBlur = () => {
    blurOverlay.style.opacity = "1";
  };

  const hideBlur = () => {
    blurOverlay.style.opacity = "0";
  };

  processSteps.forEach((step) => {
    step.addEventListener("mouseenter", showBlur);
    step.addEventListener("focus", showBlur);
    step.addEventListener("mouseleave", hideBlur);
    step.addEventListener("blur", hideBlur);
  });
}

if (statNumbers.length) {
  const formatValue = (value, suffix) => `${value}${suffix ?? ""}`;

  const animateCounter = (element) => {
    const target = Number(element.dataset.count || 0);
    const suffix = element.dataset.suffix || "";
    const duration = 1400;
    const startTime = performance.now();
    const card = element.closest(".stat-card");

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      element.textContent = formatValue(value, suffix);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        element.textContent = formatValue(target, suffix);
        card?.classList.add("is-animated");
      }
    };

    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          currentObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  statNumbers.forEach((stat) => observer.observe(stat));
}

if (rotatingValue) {
  const phrases = JSON.parse(rotatingValue.dataset.rotate || "[]");
  let currentIndex = 0;

  if (phrases.length > 1 && !prefersReducedMotion) {
    const swapDuration = 460;

    setInterval(() => {
      currentIndex = (currentIndex + 1) % phrases.length;

      const swap = rotatingValue.animate(
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(-10px)", offset: 0.42 },
          { opacity: 0, transform: "translateY(10px)", offset: 0.58 },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: swapDuration,
          easing: "ease-in-out",
        }
      );

      /*
       * Swap the words at the invisible midpoint of the fade, not up
       * front. Setting the text first shows the new phrase fading out,
       * and leaves the line blank for the whole gap.
       */
      window.setTimeout(() => {
        rotatingValue.textContent = phrases[currentIndex];
      }, swapDuration * 0.5);

      // A dropped animation must never leave the phrase invisible.
      swap.addEventListener("cancel", () => {
        rotatingValue.textContent = phrases[currentIndex];
      });
    }, 3600);
  }
}

if (interactiveCards.length) {
  interactiveCards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const bounds = card.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 100;
      const y = ((event.clientY - bounds.top) / bounds.height) * 100;

      card.style.setProperty("--spotlight-x", `${x}%`);
      card.style.setProperty("--spotlight-y", `${y}%`);
    });

    card.addEventListener("touchstart", (event) => {
      const touch = event.touches[0];

      if (!touch) {
        return;
      }

      const bounds = card.getBoundingClientRect();
      const x = ((touch.clientX - bounds.left) / bounds.width) * 100;
      const y = ((touch.clientY - bounds.top) / bounds.height) * 100;

      card.style.setProperty("--spotlight-x", `${x}%`);
      card.style.setProperty("--spotlight-y", `${y}%`);
    }, { passive: true });
  });
}

const motionSurfaces = Array.from(
  new Set(
    [
      ...interactiveCards,
      ...document.querySelectorAll(
        ".service-detail-card, .testimonial-card, .proof-strip__item, .work-spotlight"
      ),
    ]
  )
);

if (supportsPointerTilt && motionSurfaces.length) {
  const resetSurfaceTilt = (surface) => {
    surface.style.removeProperty("transform");
  };

  motionSurfaces.forEach((surface) => {
    surface.addEventListener("mousemove", (event) => {
      const bounds = surface.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      const intensity = 6.5;
      const lift = -8;
      const rotateY = (x - 0.5) * intensity * 2;
      const rotateX = (0.5 - y) * intensity * 2;

      surface.style.transform =
        `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) ` +
        `rotateY(${rotateY.toFixed(2)}deg) translateY(${lift}px)`;
    });

    surface.addEventListener("mouseleave", () => {
      resetSurfaceTilt(surface);
    });

    surface.addEventListener("blur", () => {
      resetSurfaceTilt(surface);
    });
  });
}

if (servicesShowcase && serviceNavItems.length && serviceStage.panel) {
  const totalServices = serviceNavItems.length;
  const serviceCycleDuration = 5200;
  let activeServiceIndex = 0;
  let serviceCycleId = 0;

  const restartServiceProgress = () => {
    if (!serviceStage.progress) {
      return;
    }

    serviceStage.progress.style.transition = "none";
    serviceStage.progress.style.transform = "scaleX(0)";
    serviceStage.progress.getBoundingClientRect();
    serviceStage.progress.style.transition = `transform ${serviceCycleDuration}ms linear`;
    serviceStage.progress.style.transform = "scaleX(1)";
  };

  const stopServiceCycle = () => {
    if (serviceCycleId) {
      window.clearTimeout(serviceCycleId);
      serviceCycleId = 0;
    }

    if (serviceStage.progress) {
      const computedTransform = window.getComputedStyle(serviceStage.progress).transform;

      if (computedTransform && computedTransform !== "none") {
        const matrix = new DOMMatrixReadOnly(computedTransform);
        serviceStage.progress.style.transform = `scaleX(${matrix.m11})`;
      }

      serviceStage.progress.style.transition = "none";
    }
  };

  const queueNextService = () => {
    stopServiceCycle();
    if (prefersReducedMotion) {
      return;
    }
    restartServiceProgress();
    serviceCycleId = window.setTimeout(() => {
      activateService((activeServiceIndex + 1) % totalServices);
    }, serviceCycleDuration);
  };

  const updateServiceStage = (item, index) => {
    const serviceTags = (item.dataset.serviceTags || "")
      .split("|")
      .map((tag) => tag.trim())
      .filter(Boolean);

    serviceNavItems.forEach((navItem, navIndex) => {
      navItem.classList.toggle("is-active", navIndex === index);
      navItem.setAttribute("aria-pressed", String(navIndex === index));
    });

    serviceStage.kicker.textContent = item.dataset.serviceKicker || "";
    serviceStage.title.textContent = item.dataset.serviceTitle || "";
    serviceStage.copy.textContent = item.dataset.serviceCopy || "";
    serviceStage.chips.innerHTML = serviceTags.map((tag) => `<span>${tag}</span>`).join("");
    serviceStage.count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(totalServices).padStart(2, "0")}`;

    if (!prefersReducedMotion && serviceStage.panel.animate) {
      serviceStage.panel.animate(
        [
          { opacity: 0.62, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 360,
          easing: "ease-out",
        }
      );
    }
  };

  function activateService(index) {
    activeServiceIndex = index;
    const activeItem = serviceNavItems[activeServiceIndex];

    updateServiceStage(activeItem, activeServiceIndex);

    queueNextService();
  }

  serviceNavItems.forEach((item, index) => {
    const activate = () => activateService(index);

    item.addEventListener("click", activate);
    item.addEventListener("focus", activate);

    item.addEventListener("mouseenter", () => {
      if (!isMobileViewport()) {
        activate();
      }
    });
  });

  servicesShowcase.addEventListener("mouseenter", stopServiceCycle);
  servicesShowcase.addEventListener("mouseleave", queueNextService);
  servicesShowcase.addEventListener("focusin", stopServiceCycle);
  servicesShowcase.addEventListener("focusout", (event) => {
    if (!servicesShowcase.contains(event.relatedTarget)) {
      queueNextService();
    }
  });

  window.addEventListener("resize", () => {
    queueNextService();
  });

  activateService(0);
}

const processPanel = {
  title: document.querySelector(".process-panel__title"),
  body: document.querySelector(".process-panel__body"),
  pill: document.querySelector(".process-panel__pill"),
  stat: document.querySelector(".process-panel__stat"),
  note: document.querySelector(".process-panel__note"),
};

const setActiveProcessStep = (step) => {
  if (!step || !processPanel.title) {
    return;
  }

  processSteps.forEach((item) => item.classList.remove("is-active"));
  step.classList.add("is-active");
  processSteps.forEach((item) => item.setAttribute("aria-pressed", String(item === step)));

  const title = step.querySelector("h3")?.textContent?.trim() || "";

  processPanel.title.textContent = title;
  processPanel.body.textContent = step.dataset.detail || "";
  processPanel.pill.textContent = step.dataset.panelLabel || "";
  processPanel.stat.textContent = step.dataset.panelStat || "";
  processPanel.note.textContent = step.dataset.panelNote || "";
};

if (processSteps.length && processPanel.title) {
  setActiveProcessStep(processSteps[0]);

  processSteps.forEach((step) => {
    const activate = () => {
      setActiveProcessStep(step);

      if (isMobileViewport()) {
        document.querySelector(".process-visual")?.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "nearest",
        });
      }
    };

    step.addEventListener("mouseenter", activate);
    step.addEventListener("focus", activate);
    step.addEventListener("click", activate);
    step.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });
}

const workSpotlight = {
  title: document.querySelector(".work-spotlight__title"),
  metric: document.querySelector(".work-spotlight__metric strong"),
  metricLabel: document.querySelector(".work-spotlight__metric span"),
  summary: document.querySelector(".work-spotlight__summary"),
  category: document.querySelector(".work-spotlight__category"),
  tags: document.querySelector(".work-spotlight__tags"),
};

const setActiveWorkCard = (card) => {
  if (!card || !workSpotlight.title) {
    return;
  }

  workCards.forEach((item) => item.classList.remove("is-active"));
  card.classList.add("is-active");
  workCards.forEach((item) => item.setAttribute("aria-pressed", String(item === card)));

  workSpotlight.title.textContent = card.dataset.client || "";
  workSpotlight.metric.textContent = card.dataset.metric || "";
  workSpotlight.metricLabel.textContent = card.dataset.metricLabel || "";
  workSpotlight.summary.textContent = card.dataset.summary || "";
  workSpotlight.category.textContent = card.dataset.category || "";

  const tags = (card.dataset.services || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  workSpotlight.tags.innerHTML = tags
    .map((tag) => `<span>${tag}</span>`)
    .join("");
};

if (workCards.length && workSpotlight.title) {
  setActiveWorkCard(workCards[0]);

  workCards.forEach((card) => {
    const activate = () => {
      setActiveWorkCard(card);

      if (isMobileViewport()) {
        document.querySelector(".work-spotlight")?.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "nearest",
        });
      }
    };

    card.addEventListener("mouseenter", activate);
    card.addEventListener("focus", activate);
    card.addEventListener("click", activate);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });
}

/*
 * Client carousel.
 *
 * The row scrolls itself, continuously, and never needs to be dragged.
 * Hovering it eases the flow down to a browsing pace and enlarges the
 * card under the cursor; leaving it eases back up to full speed. The
 * arrows nudge the flow along without changing its speed.
 *
 * This is deliberately exempt from prefers-reduced-motion: the client
 * asked for the row to always move on its own. The rest of the site
 * still honours that setting.
 */
if (clientSlider && clientTrack) {
  const originalCards = Array.from(clientTrack.children);

  // Pixels per second. Brisk, but slow enough to read every brand name.
  const FLOW_SPEED = 52;

  // Pace while the cursor is over the row: slow, not stopped, so the
  // reader can take a card in without the row feeling stuck.
  const HOVER_SPEED = 18;

  // How fast the flow eases between those two speeds.
  const SPEED_EASE = 3.2;

  // How quickly an arrow nudge is absorbed into the flow.
  const NUDGE_EASE = 4.2;

  let loopWidth = 0;
  let offset = 0;
  let nudge = 0;
  let lastFrame = 0;
  let frameId = 0;
  let speed = FLOW_SPEED;
  let targetSpeed = FLOW_SPEED;

  const prevButton = clientSlider.querySelector("[data-client-prev]");
  const nextButton = clientSlider.querySelector("[data-client-next]");

  /*
   * Duplicate the set once so the track can wrap without a visible
   * jump. Clones are hidden from assistive tech: the names are already
   * announced by the originals.
   */
  const cloneCards = () => {
    clientTrack.querySelectorAll("[data-client-clone]").forEach((clone) => clone.remove());

    originalCards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute("data-client-clone", "");
      clone.setAttribute("aria-hidden", "true");
      clientTrack.appendChild(clone);
    });
  };

  const getVisibleCardCount = () => {
    if (window.innerWidth <= 640) {
      return 2;
    }

    if (window.innerWidth <= 900) {
      return 3;
    }

    if (window.innerWidth <= 1200) {
      return 4;
    }

    return 5;
  };

  const measure = () => {
    const viewport = clientSlider.querySelector(".client-slider__viewport");
    const gap = parseFloat(window.getComputedStyle(clientTrack).columnGap || "0") || 0;

    if (!viewport) {
      return;
    }

    const visibleCardCount = getVisibleCardCount();
    const cardWidth =
      (viewport.clientWidth - gap * (visibleCardCount - 1)) / visibleCardCount;

    clientTrack.querySelectorAll(".client-logo-card").forEach((card) => {
      card.style.width = `${cardWidth}px`;
      card.style.minWidth = `${cardWidth}px`;
    });

    loopWidth = originalCards.length * (cardWidth + gap);
  };

  const applyOffset = () => {
    clientTrack.style.transform = `translate3d(${-offset}px, 0, 0)`;
  };

  const step = (timestamp) => {
    if (!lastFrame) {
      lastFrame = timestamp;
    }

    // Clamped so a backgrounded tab does not resume with a huge jump.
    const delta = Math.min((timestamp - lastFrame) / 1000, 0.05);
    lastFrame = timestamp;

    // Ease towards the target pace rather than snapping to it, so the
    // row never jumps when the cursor crosses its edge.
    speed += (targetSpeed - speed) * Math.min(delta * SPEED_EASE, 1);

    let movement = speed * delta;

    if (nudge !== 0) {
      const chunk = nudge * Math.min(delta * NUDGE_EASE, 1);
      movement += chunk;
      nudge -= chunk;

      if (Math.abs(nudge) < 0.4) {
        nudge = 0;
      }
    }

    offset += movement;

    if (loopWidth > 0) {
      offset = ((offset % loopWidth) + loopWidth) % loopWidth;
    }

    applyOffset();
    frameId = requestAnimationFrame(step);
  };

  const start = () => {
    if (frameId) {
      return;
    }

    lastFrame = 0;
    frameId = requestAnimationFrame(step);
  };

  const stop = () => {
    if (!frameId) {
      return;
    }

    cancelAnimationFrame(frameId);
    frameId = 0;
  };

  const cardStep = () => {
    const gap = parseFloat(window.getComputedStyle(clientTrack).columnGap || "0") || 0;
    const first = clientTrack.firstElementChild;

    return first ? first.getBoundingClientRect().width + gap : 220;
  };

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      nudge -= cardStep();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      nudge += cardStep();
    });
  }

  clientSlider.addEventListener("pointerenter", () => {
    targetSpeed = HOVER_SPEED;
  });

  clientSlider.addEventListener("pointerleave", () => {
    targetSpeed = FLOW_SPEED;
  });

  clientSlider.addEventListener("focusin", () => {
    targetSpeed = HOVER_SPEED;
  });

  clientSlider.addEventListener("focusout", (event) => {
    if (!clientSlider.contains(event.relatedTarget)) {
      targetSpeed = FLOW_SPEED;
    }
  });

  // Only the tab going away stops the flow.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  let resizeTimer = 0;

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(measure, 150);
  });

  cloneCards();
  measure();

  // Images settle after load and change the card height, not the width,
  // but re-measuring keeps the loop exact if a font swap shifts widths.
  window.addEventListener("load", measure);

  start();
}

const clientLogoImages = Array.from(document.querySelectorAll(".client-logo-card__image"));

if (clientLogoImages.length) {
  clientLogoImages.forEach((image) => {
    const art = image.closest(".client-logo-card__art");

    if (!art) {
      return;
    }

    const showImage = () => {
      art.classList.add("has-image");
    };

    const showFallback = () => {
      art.classList.remove("has-image");
    };

    if (image.complete) {
      if (image.naturalWidth > 0) {
        showImage();
      } else {
        showFallback();
      }
    }

    image.addEventListener("load", showImage, { once: true });
    image.addEventListener("error", showFallback, { once: true });
  });
}

const sections = Array.from(document.querySelectorAll("main section[id]"));
const navLinks = Array.from(document.querySelectorAll(".primary-nav a[href^='#']"));

if (sections.length && navLinks.length) {
  const linkMap = new Map(
    navLinks.map((link) => [link.getAttribute("href")?.slice(1), link])
  );
  const setActiveNavLink = (sectionId) => {
    navLinks.forEach((link) => link.classList.remove("is-active"));
    linkMap.get(sectionId)?.classList.add("is-active");
  };

  const getCurrentSectionId = () => {
    const headerOffset = (header?.offsetHeight || 0) + 36;
    const scrollPosition = window.scrollY + headerOffset;
    let currentSectionId = sections[0]?.id;

    sections.forEach((section) => {
      if (scrollPosition >= section.offsetTop) {
        currentSectionId = section.id;
      }
    });

    return currentSectionId;
  };

  const syncActiveNavLink = () => {
    const currentSectionId = getCurrentSectionId();

    if (currentSectionId) {
      setActiveNavLink(currentSectionId);
    }
  };

  syncActiveNavLink();
  window.addEventListener("scroll", syncActiveNavLink, { passive: true });
  window.addEventListener("resize", syncActiveNavLink);
  window.addEventListener("load", syncActiveNavLink);
  window.addEventListener("hashchange", syncActiveNavLink);
}
