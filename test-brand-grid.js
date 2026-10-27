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
    // Logos are lazy-loaded, so bring the grid into view before waiting on them.
    await page.locator(".client-logo-grid").scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".client-logo-grid img")]
        .every((image) => image.complete)
    );
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".staircase-card img")]
        .every((image) => image.complete && image.naturalWidth > 0)
    );

    const desktop = await page.evaluate(() => {
      const grid = document.querySelector(".client-logo-grid");
      const staircase = document.querySelector("[data-staircase-carousel]");
      const hero = document.querySelector(".hero");
      const heading = document.querySelector(".hero-text h1");
      const form = document.querySelector(".hero-inquiry-card");
      const videoTrack = document.querySelector(".video-showcase__track");
      const logo = grid.querySelector("img");
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
        logosLoaded: [...grid.querySelectorAll("img")].every((image) => image.naturalWidth > 0),
        staircaseWidth: staircase.getBoundingClientRect().width,
        staircaseLeft: staircase.getBoundingClientRect().left,
        staircaseSlideCount: document.querySelectorAll(".staircase-card").length,
        serviceCount: document.querySelectorAll("[data-service-item]").length,
        imageBlendMode: getComputedStyle(logo).mixBlendMode,
        imageFilter: getComputedStyle(logo).filter,
        videoSources: [...document.querySelectorAll(".video-format-card [data-video]")].map((button) => button.dataset.video),
        postHeroBackgrounds: postHeroSections.map((selector) => ({
          selector,
          backgroundImage: getComputedStyle(document.querySelector(selector)).backgroundImage,
        })),
        videoCategories: [...document.querySelectorAll(".video-format-card h3")]
          .map((title) => title.textContent.trim()),
        missingFragmentTargets: [...document.querySelectorAll('a[href^="#"]')]
          .map((link) => link.getAttribute("href").slice(1))
          .filter((id) => !document.getElementById(id)),
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
        headlineLeft: heading.getBoundingClientRect().left,
        formLeft: form.getBoundingClientRect().left,
        heroHeight: Math.round(hero.getBoundingClientRect().height),
        viewportHeight: innerHeight,
      };
    });

    assert.strictEqual(desktop.display, "grid", "brands should use a static logo grid");
    assert.strictEqual(desktop.columns, 6, "the brand grid should show six logos per row on desktop");
    assert(desktop.clientCount >= 24, "all supported brands should be listed");
    assert(desktop.logosLoaded, "every brand logo should load");
    assert.strictEqual(desktop.staircaseWidth, 1440, "the staircase carousel should span the desktop viewport");
    assert.strictEqual(desktop.staircaseLeft, 0, "the staircase carousel should align with the left viewport edge");
    assert(desktop.staircaseSlideCount > 0, "the staircase carousel should render its photos");
    assert.deepStrictEqual(desktop.videoSources, [
      "assets/videos/ugc.mp4",
      "assets/videos/ai.mp4",
      "assets/videos/personal.mp4",
      "assets/videos/sales.mp4",
      "assets/videos/influencer.mp4",
      "assets/videos/podcast.mp4",
    ], "every video format card should open its sample video");
    assert.strictEqual(desktop.imageFilter, "none", "supplied logos should retain their original colors");
    assert.strictEqual(desktop.imageBlendMode, "normal", "supplied logos should not be color blended");
    assert(
      desktop.postHeroBackgrounds.every(({ backgroundImage }) => backgroundImage !== "none"),
      "every section after the hero should have a background treatment"
    );
    assert.deepStrictEqual(desktop.missingFragmentTargets, [], "all in-page links should have a target");
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
    assert(desktop.headlineLeft < desktop.formLeft, "hero headline should stay left of the form");
    assert(desktop.heroHeight >= desktop.viewportHeight, "hero should fill the viewport");


    // The staircase advances on its own, even with reduced motion requested.
    await page.emulateMedia({ reducedMotion: "reduce" });
    const firstStaircaseImage = () =>
      page.evaluate(() => document.querySelector(".staircase-card img").getAttribute("src"));
    const staircaseStart = await page.evaluate(() =>
      [...document.querySelectorAll(".staircase-slot")].map((slot) => slot.style.transform).join("|")
    );
    await page.waitForFunction(
      (start) =>
        [...document.querySelectorAll(".staircase-slot")].map((slot) => slot.style.transform).join("|") !== start,
      staircaseStart,
      { timeout: 5000 }
    );
    assert.ok(await firstStaircaseImage(), "staircase cards should show photos");
    await page.emulateMedia({ reducedMotion: "no-preference" });

    // Video format cards open a centred, playable dialog that stops when closed.
    const firstVideo = page.locator(".video-format-card [data-video]").first();
    await firstVideo.scrollIntoViewIfNeeded();
    await firstVideo.click();
    const openDialog = await page.evaluate(() => {
      const dialog = document.querySelector("[data-video-modal]");
      const box = dialog.getBoundingClientRect();
      return {
        open: dialog.open,
        src: dialog.querySelector("video").getAttribute("src"),
        centred: Math.abs(box.left + box.width / 2 - innerWidth / 2) < 2,
      };
    });
    assert.deepStrictEqual(openDialog, { open: true, src: "assets/videos/ugc.mp4", centred: true },
      "clicking a video card should open it centred in the player dialog");
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !document.querySelector("[data-video-modal]").open &&
        document.querySelector("[data-video-modal] video").getAttribute("src") === null,
      null,
      { timeout: 3000 }
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    const mobile = await page.evaluate(() => ({
      brandColumns: getComputedStyle(document.querySelector(".client-logo-grid")).gridTemplateColumns.split(" ").length,
      formFits: document.querySelector(".hero-inquiry-card").getBoundingClientRect().right <= innerWidth,
      videoTrackScrollable:
        document.querySelector(".video-showcase__track").scrollWidth >
        document.querySelector(".video-showcase__track").clientWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    }));

    assert.strictEqual(mobile.brandColumns, 3, "mobile should show three brands per row");
    assert(mobile.formFits, "inquiry form should fit on mobile");
    assert(mobile.videoTrackScrollable, "video showcase should scroll on mobile");
    assert.strictEqual(mobile.horizontalOverflow, false, "mobile homepage should not overflow horizontally");
    const selectedWorkCard = page.locator(".work-card").nth(2);
    await selectedWorkCard.evaluate((card) => {
      card.scrollIntoView({ block: "center", behavior: "instant" });
    });
    await page.waitForFunction(() => {
      const card = document.querySelectorAll(".work-card")[2];
      return card && getComputedStyle(card).visibility === "visible";
    });
    await selectedWorkCard.click();
    const workHighlight = await page.locator(".work-spotlight").evaluate((spotlight) => ({
      client: spotlight.querySelector(".work-spotlight__title").textContent.trim(),
      category: spotlight.querySelector(".work-spotlight__category").textContent.trim(),
      selected: spotlight.ownerDocument.querySelectorAll(".work-card")[2].getAttribute("aria-pressed"),
    }));
    assert.deepStrictEqual(workHighlight, {
      client: "Shivanta Group",
      category: "Trust-led",
      selected: "true",
    }, "selecting a work card should update the matching highlight");

    await page.goto(`http://127.0.0.1:${address.port}/contact.html`, { waitUntil: "domcontentloaded" });
    assert.strictEqual(
      await page.locator(".service-pill").count(),
      desktop.serviceCount,
      "every homepage service should be available in the inquiry form"
    );
    assert.strictEqual(
      await page.locator("#contact-form").getAttribute("action"),
      "thank-you.html",
      "contact confirmation path should remain relative to the deployed site"
    );
    await page.locator("[data-step-next]").evaluate((button) => {
      button.scrollIntoView({ block: "center", behavior: "instant" });
    });
    await page.waitForFunction(
      () => getComputedStyle(document.querySelector("#contact-card")).opacity === "1"
    );
    await page.locator("[data-step-next]").click();
    assert.strictEqual(
      await page.locator("#contact-name").getAttribute("aria-invalid"),
      "true",
      "the first step should flag a missing name"
    );
    assert.strictEqual(
      await page.locator("#contact-email").getAttribute("aria-invalid"),
      "true",
      "the first step should flag a missing email"
    );
    await page.locator("#contact-name").fill("Test visitor");
    await page.locator("#contact-email").fill("not-an-email");
    await page.locator("[data-step-next]").click();
    assert.strictEqual(
      await page.locator("#contact-email").getAttribute("aria-invalid"),
      "true",
      "the first step should flag an invalid email address"
    );
    await page.locator("#contact-email").fill("visitor@example.com");
    await page.locator("[data-step-next]").click();
    assert.strictEqual(
      await page.locator("#contact-timeline").isVisible(),
      true,
      "valid contact details should advance to the project step"
    );
    await page.locator("[data-step-submit]").click();
    assert.strictEqual(
      await page.locator("#contact-timeline").getAttribute("aria-invalid"),
      "true",
      "the project step should flag a missing timeline"
    );
    assert.strictEqual(
      await page.locator("#service-pill-group").getAttribute("aria-invalid"),
      "true",
      "the project step should require at least one selected service"
    );
    await page.locator("#contact-timeline").selectOption({ label: "Within 2-4 weeks" });
    const firstServicePill = page.locator(".service-pill").first();
    await firstServicePill.click();
    assert.strictEqual(
      await page.locator("#contact-services").inputValue(),
      "Social Media Management",
      "selected services should be included in the inquiry form"
    );
    await page.locator("#contact-message").fill("Testing the local contact form.");
    await page.locator("#contact-form button[type='submit']").click();
    assert.match(
      await page.locator("#contact-status").textContent(),
      /Local preview only/,
      "local form submission should explain that Netlify is required"
    );
    const contactHasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    );
    assert.strictEqual(contactHasHorizontalOverflow, false, "contact page should not overflow horizontally");
    const menuToggle = page.locator(".menu-toggle");
    await menuToggle.click();
    assert.strictEqual(await menuToggle.getAttribute("aria-expanded"), "true");
    await page.keyboard.press("Escape");
    assert.strictEqual(await menuToggle.getAttribute("aria-expanded"), "false");

    assert.deepStrictEqual(pageErrors, [], "page should have no JavaScript errors");

    const appsScriptEndpoint = "https://script.google.com/macros/s/test-deployment/exec";
    const appsScriptPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const appsScriptPageErrors = [];
    let appsScriptSubmission = "";
    appsScriptPage.on("pageerror", (error) => appsScriptPageErrors.push(error.message));
    await appsScriptPage.route("**/index.html", async (route) => {
      const response = await route.fetch();
      const html = (await response.text()).replace(
        'data-apps-script-url=""',
        `data-apps-script-url="${appsScriptEndpoint}"`
      );
      await route.fulfill({ response, body: html });
    });
    await appsScriptPage.route("**/contact.html", async (route) => {
      const response = await route.fetch();
      const html = (await response.text()).replace(
        'data-apps-script-url=""',
        `data-apps-script-url="${appsScriptEndpoint}"`
      );
      await route.fulfill({ response, body: html });
    });
    await appsScriptPage.route(appsScriptEndpoint, async (route) => {
      appsScriptSubmission = route.request().postData() || "";
      const submittedFormId = new URLSearchParams(appsScriptSubmission).get("formId");
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body:
          '<!doctype html><html><body><script>parent.postMessage(' +
          JSON.stringify({
            type: "chamomile-inquiry-result",
            status: "success",
            formId: submittedFormId,
          }) +
          ', "*");</script></body></html>',
      });
    });
    await appsScriptPage.goto(`http://127.0.0.1:${address.port}/index.html`, {
      waitUntil: "domcontentloaded",
    });
    await appsScriptPage.locator("#hero-inquiry-name").fill("Apps Script test");
    await appsScriptPage.locator("#hero-inquiry-email").fill("apps-script@example.com");
    await appsScriptPage.locator("#hero-inquiry-phone").fill("+1 555 0100");
    await appsScriptPage.locator("#hero-inquiry-form button[type='submit']").click();
    await appsScriptPage.waitForURL("**/thank-you.html");
    const submittedFields = new URLSearchParams(appsScriptSubmission);
    assert.strictEqual(submittedFields.get("formId"), "hero-inquiry-form");
    assert.strictEqual(submittedFields.get("name"), "Apps Script test");
    assert.strictEqual(submittedFields.get("email"), "apps-script@example.com");

    await appsScriptPage.goto(`http://127.0.0.1:${address.port}/contact.html`, {
      waitUntil: "domcontentloaded",
    });
    await appsScriptPage.locator("#contact-name").fill("Contact form test");
    await appsScriptPage.locator("#contact-email").fill("contact-test@example.com");
    await appsScriptPage.locator("#contact-company").fill("Test Company");
    await appsScriptPage.locator("[data-step-next]").click();
    await appsScriptPage.locator("#contact-timeline").selectOption({ label: "Within 2-4 weeks" });
    const appsScriptServicePill = appsScriptPage.locator(".service-pill").first();
    await appsScriptServicePill.click();
    await appsScriptPage.locator("#contact-message").fill("Testing contact form routing.");
    await appsScriptPage.locator("#contact-form button[type='submit']").click();
    await appsScriptPage.waitForURL("**/thank-you.html");
    const contactSubmission = new URLSearchParams(appsScriptSubmission);
    assert.strictEqual(contactSubmission.get("formId"), "contact-form");
    assert.strictEqual(contactSubmission.get("name"), "Contact form test");
    assert.strictEqual(contactSubmission.get("company"), "Test Company");
    assert.strictEqual(contactSubmission.get("services"), "Social Media Management");
    assert.deepStrictEqual(appsScriptPageErrors, [], "Apps Script form mode should have no JavaScript errors");

    console.log("PASSED: staircase, video player, brand grid, two-step intake validation, Netlify fallback, and Apps Script routing");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})();
