(() => {
  const carousel = document.querySelector("[data-staircase-carousel]");

  if (!carousel) {
    return;
  }

  // Photos from the shoot plus one still from each video clip.
  const FRAME_COUNT = Number(carousel.dataset.frameCount) || 0;
  const images = Array.from({ length: FRAME_COUNT }, (_, i) =>
    `assets/images/creative-carousel/frame-${String(i + 1).padStart(3, "0")}.webp`
  );
  const AUTOPLAY_DELAY = 1000;
  const INACTIVE_SCALE = 0.7;
  const MAX_WIDTH = 240;
  const GUTTER = 16;

  if (images.length < 2) {
    return;
  }

  // Damped spring sampled into a CSS linear() easing, so nothing animates per frame in JS.
  const springEasing = (bounce, duration, samples = 48) => {
    const zeta = 1 - Math.min(Math.max(bounce, 0), 0.9);
    const w = (2 * Math.PI) / duration;
    const wd = w * Math.sqrt(1 - zeta * zeta);
    const end = Math.log(1000) / (zeta * w);
    const points = [];

    for (let k = 0; k <= samples; k += 1) {
      const t = (k / samples) * end;
      const v = k === samples
        ? 1
        : 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + ((zeta * w) / wd) * Math.sin(wd * t));
      points.push(+v.toFixed(4));
    }

    return { easing: `linear(${points.join(", ")})`, ms: Math.round(end * 1000) };
  };

  const spring = springEasing(0.1, 0.8);
  carousel.style.setProperty("--stair-spring", spring.easing);
  carousel.style.setProperty("--stair-spring-ms", `${spring.ms}ms`);

  // Only enough slots to cover the viewport are kept; a slot leaving the left
  // edge jumps to the right edge with the next image, so the loop never ends.
  let slots = [];
  let nextImage = 0;

  const place = (slot) => {
    const step = Math.sign(slot.offset);
    slot.el.style.transform = `translate3d(calc(${slot.offset} * var(--stair-w)), 0, 0)`;
    slot.card.style.transform = `translate3d(0, calc(${step} * var(--stair-step) * 100%), 0) scale(${step === 0 ? 1 : INACTIVE_SCALE})`;
  };

  const takeImage = () => {
    const src = images[nextImage];
    nextImage = (nextImage + 1) % images.length;
    return src;
  };

  // Centre photo sits in the gap between the hero text card and the form; the
  // step height keeps the upper row below the navbar and the lower row inside the hero.
  const layout = () => {
    const box = carousel.getBoundingClientRect();
    const text = document.querySelector(".hero-text")?.getBoundingClientRect();
    const form = document.querySelector(".hero-visual")?.getBoundingClientRect();
    const nav = document.querySelector(".header-inner")?.getBoundingClientRect();
    const gap = text && form ? form.left - text.right : 0;
    const sideBySide = gap > 120 && form.top < text.bottom;
    const width = sideBySide ? Math.min(MAX_WIDTH, gap - GUTTER * 2) : Math.min(MAX_WIDTH, box.width * 0.36);
    const x = sideBySide ? (text.right + form.left) / 2 - box.left : box.width / 2;
    const top = Math.max(0, (nav ? nav.bottom - box.top : 0)) + GUTTER;
    const bottom = box.height - GUTTER;
    const y = (top + bottom) / 2;
    const height = (width * 4) / 3;
    const step = Math.max(0, Math.min(1, ((bottom - top) / 2 - (height * INACTIVE_SCALE) / 2) / height));

    carousel.style.setProperty("--stair-w", `${width}px`);
    carousel.style.setProperty("--stair-x", `${x}px`);
    carousel.style.setProperty("--stair-y", `${y}px`);
    carousel.style.setProperty("--stair-step", step.toFixed(3));
    return { width, x };
  };

  const build = () => {
    const { width, x } = layout();
    const side = Math.ceil(Math.max(x, carousel.clientWidth - x) / width) + 1;

    carousel.replaceChildren();
    nextImage = 0;
    slots = [];

    for (let offset = -side; offset <= side; offset += 1) {
      const el = document.createElement("div");
      const card = document.createElement("div");
      const img = document.createElement("img");
      el.className = "staircase-slot";
      card.className = "staircase-card";
      img.alt = "";
      img.decoding = "async";
      img.src = takeImage();
      card.append(img);
      el.append(card);
      carousel.append(el);
      const slot = { el, card, img, offset };
      place(slot);
      slots.push(slot);
    }
  };

  const advance = () => {
    const maxOffset = slots.reduce((max, slot) => Math.max(max, slot.offset), 0);

    slots.forEach((slot) => {
      slot.offset -= 1;

      if (slot.offset < -maxOffset) {
        // Wrap off-screen without animating, then let transitions resume.
        slot.offset = maxOffset;
        slot.img.src = takeImage();
        slot.el.classList.add("is-jumping");
        place(slot);
        slot.el.getBoundingClientRect();
        slot.el.classList.remove("is-jumping");
        return;
      }

      place(slot);
    });
  };

  build();
  // Fonts and reveal animations can shift the hero blocks after first paint.
  window.addEventListener("load", () => window.setTimeout(build, 600));

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(build, 200);
  }, { passive: true });

  window.setInterval(advance, AUTOPLAY_DELAY);
})();
