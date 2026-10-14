const header = document.querySelector(".site-header");
const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".primary-nav");
const servicePills = Array.from(document.querySelectorAll(".service-pill"));
const servicesInput = document.querySelector("#contact-services");
const serviceGroup = document.querySelector("#service-pill-group");
const serviceError = document.querySelector("#contact-services-error");
const contactForm = document.querySelector("#contact-form");
const contactStatus = document.querySelector("#contact-status");
const contactSubmitButton = contactForm?.querySelector("button[type='submit']");
const contactSteps = Array.from(document.querySelectorAll("[data-contact-step]"));
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

if (contactForm && contactSteps.length) {
  const nextButton = contactForm.querySelector("[data-step-next]");
  const previousButton = contactForm.querySelector("[data-step-prev]");
  const progressBar = contactForm.querySelector("[data-step-progress]");
  const stepCount = contactForm.querySelector("[data-step-count]");
  let activeStep = 0;

  const showError = (field, message) => {
    const group = field.closest(".field-group");
    const error = group?.querySelector(".field-error");

    if (!group || !error) {
      return;
    }

    error.textContent = message;
    error.hidden = false;
    field.setAttribute("aria-invalid", "true");
    group.classList.remove("has-error");
    void group.offsetWidth;
    group.classList.add("has-error");
  };

  const clearError = (field) => {
    const group = field.closest(".field-group");
    const error = group?.querySelector(".field-error");

    if (!group || !error) {
      return;
    }

    error.textContent = "";
    error.hidden = true;
    group.classList.remove("has-error");
    field.removeAttribute("aria-invalid");
  };

  const fieldErrorMessage = (field) => {
    if (field.required && !field.value.trim()) {
      if (field.id === "contact-name") return "Please enter your name.";
      if (field.id === "contact-email") return "Please enter your email address.";
      if (field.id === "contact-timeline") return "Please choose your ideal timeline.";
      if (field.id === "contact-message") return "Please add a short project brief.";
    }

    if (field.type === "email" && field.value.trim() && field.validity.typeMismatch) {
      return "Please enter a valid email address.";
    }

    return "";
  };

  const setServicesError = (isInvalid) => {
    if (!serviceGroup || !serviceError) {
      return;
    }

    serviceGroup.setAttribute("aria-invalid", String(isInvalid));
    serviceError.hidden = !isInvalid;
    serviceError.textContent = isInvalid ? "Please select at least one service." : "";

    if (isInvalid) {
      const group = serviceGroup.closest(".field-group");
      group?.classList.remove("has-error");
      if (group) {
        void group.offsetWidth;
        group.classList.add("has-error");
      }
    } else {
      serviceGroup.closest(".field-group")?.classList.remove("has-error");
    }
  };

  const validateStep = (stepIndex, focusInvalid = true) => {
    const step = contactSteps[stepIndex];
    if (!step) {
      return true;
    }

    const invalidFields = [];
    step.querySelectorAll("input[required], select[required], textarea[required]").forEach((field) => {
      const message = fieldErrorMessage(field);
      if (message) {
        showError(field, message);
        invalidFields.push(field);
      } else {
        clearError(field);
      }
    });

    const servicesInvalid = stepIndex === 1 && !servicesInput?.value.trim();
    if (stepIndex === 1) {
      setServicesError(servicesInvalid);
      if (servicesInvalid && serviceGroup?.querySelector(".service-pill")) {
        invalidFields.push(serviceGroup.querySelector(".service-pill"));
      }
    }

    if (invalidFields.length && focusInvalid) {
      invalidFields[0].focus();
    }

    return invalidFields.length === 0;
  };

  const showStep = (stepIndex) => {
    activeStep = Math.min(Math.max(stepIndex, 0), contactSteps.length - 1);
    contactSteps.forEach((step, index) => {
      step.hidden = index !== activeStep;
    });

    const stepNumber = activeStep + 1;
    if (stepCount) {
      stepCount.textContent = String(stepNumber);
    }
    if (progressBar) {
      progressBar.setAttribute("aria-valuenow", String(stepNumber));
      progressBar.querySelector("span").style.width =
        `${(stepNumber / contactSteps.length) * 100}%`;
    }
    if (previousButton) {
      previousButton.hidden = activeStep === 0;
    }
    if (nextButton) {
      nextButton.hidden = activeStep === contactSteps.length - 1;
    }
    if (contactSubmitButton) {
      contactSubmitButton.hidden = activeStep !== contactSteps.length - 1;
    }

    contactSteps[activeStep].querySelector(".contact-step__title")?.focus();
  };

  const clearValidationStatus = () => {
    if (contactStatus?.dataset.state === "error") {
      contactStatus.textContent = "";
      delete contactStatus.dataset.state;
    }
  };

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      clearValidationStatus();
      if (validateStep(activeStep)) {
        showStep(activeStep + 1);
      } else if (contactStatus) {
        contactStatus.textContent = "Please complete the highlighted fields to continue.";
        contactStatus.dataset.state = "error";
      }
    });
  }

  if (previousButton) {
    previousButton.addEventListener("click", () => showStep(activeStep - 1));
  }

  contactForm.addEventListener("submit", (event) => {
    if (activeStep < contactSteps.length - 1) {
      event.preventDefault();
      clearValidationStatus();
      if (validateStep(activeStep)) {
        showStep(activeStep + 1);
      }
      return;
    }

    for (let stepIndex = 0; stepIndex < contactSteps.length; stepIndex += 1) {
      if (!validateStep(stepIndex, false)) {
        event.preventDefault();
        showStep(stepIndex);
        validateStep(stepIndex);
        if (contactStatus) {
          contactStatus.textContent = "Please complete the highlighted fields before sending.";
          contactStatus.dataset.state = "error";
        }
        return;
      }
    }

    clearValidationStatus();
  });

  contactSteps.forEach((step) => {
    step.querySelectorAll("input[required], select[required], textarea[required]").forEach((field) => {
      const clearWhenValid = () => {
        if (!fieldErrorMessage(field)) {
          clearError(field);
        }
        clearValidationStatus();
      };

      field.addEventListener("input", clearWhenValid);
      field.addEventListener("change", clearWhenValid);
    });
  });

  servicePills.forEach((pill) => {
    pill.addEventListener("click", () => {
      if (servicesInput?.value.trim()) {
        setServicesError(false);
      }
      clearValidationStatus();
    });
  });

  showStep(0);
}

if (contactForm && contactSubmitButton && contactStatus) {
  const isLocalPreview = ["127.0.0.1", "localhost", ""].includes(window.location.hostname);
  const usesAppsScript = Boolean(contactForm.dataset.appsScriptUrl?.trim());

  contactForm.addEventListener("submit", (event) => {
    if (event.defaultPrevented) {
      return;
    }

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
