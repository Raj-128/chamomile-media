const { chromium } = require("playwright-core");
const assert = require("assert");
const fs = require("fs");
const http = require("http");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const projectRoot = __dirname;
  const mimeTypes = {
    ".css": "text/css",
    ".html": "text/html",
    ".jpg": "image/jpeg",
    ".js": "text/javascript",
  };
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const filePath = path.resolve(projectRoot, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!filePath.startsWith(`${projectRoot}${path.sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    response.setHeader("Content-Type", mimeTypes[path.extname(filePath)] || "application/octet-stream");
    fs.createReadStream(filePath)
      .on("error", () => response.writeHead(404).end("Not found"))
      .pipe(response);
  });

  try {
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}/index.html`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".client-logo-card__image")]
        .every((image) => image.complete)
    );

    const desktop = await page.evaluate(() => {
      const grid = document.querySelector(".client-logo-grid");
      const hero = document.querySelector(".hero");
      const heading = document.querySelector(".hero-text h1");
      const form = document.querySelector(".hero-inquiry-card");
      const videoTrack = document.querySelector(".video-showcase__track");
      const logoCard = document.querySelector(".client-logo-card");
      const fallbackLogo = document.querySelector(".client-logo-card:not(:has(.client-logo-card__image))");
      const postHeroSections = [
        ".stats",
        "#about",
        "#services",
        "#best-videos",
        "#process",
        "#work",
        ".client-marquee-section",
        "#proof",
        "#contact-cta",
        ".site-footer",
      ];
      return {
        display: getComputedStyle(grid).display,
        columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
        clientCount: grid.children.length,
        cardBackground: getComputedStyle(logoCard).backgroundColor,
        cardBorder: getComputedStyle(logoCard).borderTopStyle,
        logoArtBackground: getComputedStyle(logoCard.querySelector(".client-logo-card__art")).backgroundImage,
        suppliedNameDisplay: getComputedStyle(logoCard.querySelector(".client-logo-card__name")).display,
        imageBlendMode: getComputedStyle(logoCard.querySelector(".client-logo-card__image")).mixBlendMode,
        imageFilter: getComputedStyle(logoCard.querySelector(".client-logo-card__image")).filter,
        fallbackTileDisplay: getComputedStyle(fallbackLogo.querySelector(".client-logo-card__art")).display,
        fallbackNameDisplay: getComputedStyle(fallbackLogo.querySelector(".client-logo-card__name")).display,
        imageFilter: getComputedStyle(logoCard.querySelector(".client-logo-card__image")).filter,
        postHeroBackgrounds: postHeroSections.map((selector) => ({
          selector,
          backgroundImage: getComputedStyle(document.querySelector(selector)).backgroundImage,
        })),
        gallerySlots: document.querySelectorAll(".gallery-tunnel__tile").length,
        videoCategories: [...document.querySelectorAll(".video-format-card h3")]
          .map((title) => title.textContent.trim()),
        videosFollowServices:
          document.querySelector("#services").compareDocumentPosition(
            document.querySelector("#best-videos")
          ) & Node.DOCUMENT_POSITION_FOLLOWING,
        videoTrackScrollable: videoTrack.scrollWidth > videoTrack.clientWidth,
        videoTrackSnap: getComputedStyle(videoTrack).scrollSnapType,
        workSamples: [...document.querySelectorAll(".work-card")].map((card) => ({
          client: card.dataset.client,
          category: card.dataset.category,
        })),
        workSpotlightClient: document.querySelector(".work-spotlight__title").textContent.trim(),
        workSpotlightCategory: document.querySelector(".work-spotlight__category").textContent.trim(),
        sliderArrows: document.querySelectorAll(".client-slider__arrow").length,
        headlineLeft: heading.getBoundingClientRect().left,
        formLeft: form.getBoundingClientRect().left,
        heroHeight: Math.round(hero.getBoundingClientRect().height),
        viewportHeight: innerHeight,
      };
    });

    assert.strictEqual(desktop.display, "grid", "brands should use a static grid");
    assert(desktop.columns >= 5, "desktop should show multiple logo columns");
    assert(desktop.clientCount >= 24, "all supported brands should be listed");
    assert.strictEqual(desktop.cardBackground, "rgba(0, 0, 0, 0)", "logo cards should have no block background");
    assert.strictEqual(desktop.cardBorder, "none", "logo cards should have no borders");
    assert.strictEqual(desktop.logoArtBackground, "none", "logo images should have no colored side strips");
    assert.notStrictEqual(desktop.suppliedNameDisplay, "none", "supplied logos should show their client name");
    assert.strictEqual(desktop.fallbackTileDisplay, "none", "missing logo tiles should not show initials blocks");
    assert.notStrictEqual(desktop.fallbackNameDisplay, "none", "clients without logo files should show plain wordmarks");
    assert.strictEqual(desktop.imageFilter, "none", "supplied logos should retain their original colors");
    assert.strictEqual(desktop.imageBlendMode, "normal", "supplied logos should not be color blended");
    assert(
      desktop.postHeroBackgrounds.every(({ backgroundImage }) => backgroundImage !== "none"),
      "every section after the hero should have a background treatment"
    );
    assert.strictEqual(desktop.gallerySlots, 30, "gallery tunnel should provide 30 image slots");
    assert.deepStrictEqual(desktop.videoCategories, [
      "UGC Videos",
      "AI-Generated Videos",
      "Personal Branding",
      "Sales-Oriented Videos",
      "Influencer Marketing",
      "Podcast Videos",
    ], "video showcase should include all requested formats");
    assert(desktop.videosFollowServices, "video showcase should follow services");
    assert(desktop.videoTrackScrollable, "video showcase should scroll horizontally");
    assert(desktop.videoTrackSnap.includes("x"), "video cards should snap while scrolling");
    assert.deepStrictEqual(desktop.workSamples, [
      { client: "Aarya Group", category: "Performance marketing" },
      { client: "New Model High School", category: "Brand presence" },
      { client: "Shivanta Group", category: "Trust-led" },
    ], "work section should show the three requested client and service pairs");
    assert.strictEqual(desktop.workSpotlightClient, "Aarya Group", "work highlight should start with Aarya Group");
    assert.strictEqual(desktop.workSpotlightCategory, "Performance marketing", "work highlight should match its active card");
    assert.strictEqual(desktop.sliderArrows, 0, "brand carousel controls should be removed");
    assert(desktop.headlineLeft < desktop.formLeft, "hero headline should stay left of the form");
    assert(desktop.heroHeight >= desktop.viewportHeight, "hero should fill the viewport");

    const initialTileTransform = await page.locator(".gallery-tunnel__tile").first()
      .evaluate((tile) => getComputedStyle(tile).transform);
    await page.waitForTimeout(900);
    const advancedTileTransform = await page.locator(".gallery-tunnel__tile").first()
      .evaluate((tile) => getComputedStyle(tile).transform);
    assert.notStrictEqual(
      advancedTileTransform,
      initialTileTransform,
      "gallery tiles should visibly advance toward the viewer"
    );

    await page.setViewportSize({ width: 390, height: 844 });
    const mobile = await page.evaluate(() => ({
      columns: getComputedStyle(document.querySelector(".client-logo-grid"))
        .gridTemplateColumns.split(" ").length,
      formFits: document.querySelector(".hero-inquiry-card").getBoundingClientRect().right <= innerWidth,
      videoTrackScrollable:
        document.querySelector(".video-showcase__track").scrollWidth >
        document.querySelector(".video-showcase__track").clientWidth,
    }));

    assert.strictEqual(mobile.columns, 2, "mobile should show two logo columns");
    assert(mobile.formFits, "inquiry form should fit on mobile");
    assert(mobile.videoTrackScrollable, "video showcase should scroll on mobile");
    await page.locator(".work-card").nth(2).click();
    const workHighlight = await page.locator(".work-spotlight").evaluate((spotlight) => ({
      client: spotlight.querySelector(".work-spotlight__title").textContent.trim(),
      category: spotlight.querySelector(".work-spotlight__category").textContent.trim(),
    }));
    assert.deepStrictEqual(workHighlight, {
      client: "Shivanta Group",
      category: "Trust-led",
    }, "selecting a work card should update the matching highlight");
    assert.deepStrictEqual(pageErrors, [], "page should have no JavaScript errors");
    console.log("PASSED: gallery, full-color unboxed logos, responsive layout, and video showcase");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})();
