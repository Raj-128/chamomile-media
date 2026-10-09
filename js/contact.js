const header = document.querySelector(".site-header");
const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".primary-nav");
const servicePills = Array.from(document.querySelectorAll(".service-pill"));
const servicesInput = document.querySelector("#contact-services");
const contactForm = document.querySelector("#contact-form");
const contactStatus = document.querySelector("#contact-status");
const contactSubmitButton = contactForm?.querySelector("button[type='submit']");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const supportsPointerTilt =
  window.matchMedia("(hover: hover) and (pointer: fine)").matches && !prefersReducedMotion;

if (toggle && nav) {
  toggle.setAttribute("aria-expanded", "false");

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

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNavigation));

  document.addEventListener("click", (event) => {
    if (nav.classList.contains("open") && !nav.contains(event.target) && !toggle.contains(event.target)) {
      closeNavigation();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNavigation();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) closeNavigation();
  });
}

if (header) {
  const syncHeaderState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  syncHeaderState();
  window.addEventListener("scroll", syncHeaderState, { passive: true });
}

if (servicePills.length && servicesInput) {
  const syncSelectedServices = () => {
    const selected = servicePills
      .filter((pill) => pill.classList.contains("is-selected"))
      .map((pill) => pill.dataset.service)
      .filter(Boolean);

    servicesInput.value = selected.join(", ");
  };

  servicePills.forEach((pill) => {
    pill.setAttribute("aria-pressed", String(pill.classList.contains("is-selected")));
    pill.addEventListener("click", () => {
      pill.classList.toggle("is-selected");
      pill.setAttribute("aria-pressed", String(pill.classList.contains("is-selected")));
      syncSelectedServices();
    });
  });

  syncSelectedServices();
}

if (contactForm && contactSubmitButton && contactStatus) {
  const isLocalPreview = ["127.0.0.1", "localhost", ""].includes(window.location.hostname);
  const usesAppsScript = Boolean(contactForm.dataset.appsScriptUrl?.trim());

  contactForm.addEventListener("submit", (event) => {
    if (isLocalPreview && !usesAppsScript) {
      event.preventDefault();
      contactStatus.textContent =
        "Local preview only: publish this site on Netlify to receive inquiry submissions.";
      contactStatus.dataset.state = "error";
      return;
    }

    contactSubmitButton.disabled = true;
    contactSubmitButton.textContent = "Sending...";
    contactStatus.textContent = "Sending your inquiry to Chamomile Media...";
    contactStatus.dataset.state = "pending";
  });
}

const motionSurfaces = Array.from(
  document.querySelectorAll(".contact-card, .contact-panel, .contact-point, .contact-option")
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
      const rotateY = (x - 0.5) * 8;
      const rotateX = (0.5 - y) * 8;

      surface.style.transform =
        `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) ` +
        `rotateY(${rotateY.toFixed(2)}deg) translateY(-6px)`;
    });

    surface.addEventListener("mouseleave", () => {
      resetSurfaceTilt(surface);
    });

    surface.addEventListener("blur", () => {
      resetSurfaceTilt(surface);
    });
  });
}
