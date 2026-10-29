# Chamomile Media

Chamomile Media is a responsive digital marketing agency website built with
plain HTML, CSS, and JavaScript. It presents the agency's services, selected
work, client brands, video formats, and contact options. The portfolio and
client list are static content; there is no custom admin dashboard or CMS.

## Website pages

- [`index.html`](./index.html) — Homepage with the hero inquiry form, agency
  overview, services, video showcase, selected work, clients, testimonials, and
  project call to action.
- [`contact.html`](./contact.html) — Contact form and project inquiry details.
- [`thank-you.html`](./thank-you.html) — Confirmation page used after a
  successful Netlify form submission.
- `assets/images/creative-carousel/` — Stills from Chamomile Media shoots used by
  the homepage staircase carousel (`frame-001.webp` onwards).
- `assets/videos/` — Sample clips and poster frames for the "Video Formats We
  Create" cards (H.264 MP4, 720×1280).

## Project structure

```text
.
├── assets/
│   └── images/             # Agency and client logos
├── backend/
│   ├── Code.gs             # Optional Google Apps Script inquiry receiver
│   └── README.md           # Setup notes for the optional Google Sheets backend
├── css/                    # Base, layout, component, and animation styles
├── js/                     # Homepage, contact, and animation behavior
├── contact.html
├── index.html
├── netlify.toml            # Netlify publishes the project root
├── test-brand-grid.js      # Browser test for homepage layout and showcase
└── thank-you.html
```

## Preview locally

No build step or package installation is required. From this folder, run:

```powershell
py -m http.server 8000
```

Then open <http://localhost:8000> in a browser. On Windows, `python -m
http.server 8000` can be used instead if `py` is unavailable.

## Deploy to Netlify

Netlify is the recommended production host because the homepage and contact
forms use Netlify Forms.

1. Push this repository to GitHub.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Connect the GitHub repository and select the `main` branch.
4. Set the publish directory to `.` (the repository root). There is no build
   command; [`netlify.toml`](./netlify.toml) already configures the publish
   directory.
5. Deploy the site, then check **Forms** in the Netlify dashboard and submit a
   test inquiry from both forms.

Subsequent pushes to `main` will trigger Netlify deployments when the
repository is connected.

The inquiry forms use Netlify by default. To save leads to a private Google
Sheet and send the owner an email notification through Apps Script, follow
[`backend/README.md`](./backend/README.md). The Apps Script endpoint must be
configured on both forms before that integration becomes active.

The detailed contact form is a two-step client-side wizard. It requires a name,
valid email, timeline, at least one listed service, and a short project brief.
The service choices match the offerings shown on the homepage.

The homepage hero runs a staircase carousel behind the headline and form: the
centre photo sits level in the gap between them, earlier photos step up to the
top-left and later ones step down to the bottom-right. It advances once a second
and loops through every image in `assets/images/creative-carousel/`; the count
comes from `data-frame-count` on the carousel element in `index.html`. It keeps
running even when the visitor's system requests reduced motion.

Each "Video Formats We Create" card opens its clip in a native `<dialog>`
player; closing the dialog stops and unloads the video. The client section is a
static grid of original-colour logos, with plain wordmarks for brands that have
no logo file yet.

## SEO go-live

The SEO groundwork is in place but switched off until the site has its final
domain. Every spot that needs filling is marked `SEO go-live` or `YOUR-DOMAIN`.

1. **Domain.** Replace `https://YOUR-DOMAIN` with the live address (for example
   `https://chamomilemedia.in`) in `index.html`, `contact.html`,
   `thank-you.html`, `robots.txt` and `sitemap.xml`, then uncomment the
   `SEO go-live` blocks in those files.
2. **Google Search Console.** Add the domain as a property. Choose the "HTML
   tag" method, paste its code into the `google-site-verification` tag in
   `index.html`, deploy, then press Verify. Under *Sitemaps*, submit
   `sitemap.xml`. Use *URL Inspection* on the homepage and contact page and
   press *Request indexing*; check *Pages* after a few days to confirm both are
   indexed.
3. **Google Analytics.** Create a GA4 property and web stream, copy its
   Measurement ID (`G-…`) into `GA_MEASUREMENT_ID` in `js/analytics.js`, and
   deploy. In GA4, mark the `thank-you.html` page view as a key event to count
   form leads.
4. **Forms.** In Netlify, enable form detection and add an email notification
   for new submissions. To also log inquiries in Google Sheets, deploy
   `backend/Code.gs` and paste its URL into `data-apps-script-url` on both forms.
5. **Check.** Run Lighthouse (mobile) on the live URL and test the share preview
   by pasting the link into WhatsApp or LinkedIn.

`thank-you.html` carries `noindex`, so it stays out of search results; it is
left crawlable in `robots.txt` so Google can see that tag.

## Optional GitHub Pages mirror

The same repository can also be published on GitHub Pages as a static preview:

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select the `main` branch and `/(root)`, then save.
4. Wait for the Pages build. GitHub will show the published URL on that settings
   page.

GitHub Pages serves static files; it does **not** process Netlify Forms.
Therefore, form submissions will not be collected on the GitHub Pages copy.
Use the Netlify URL for real inquiries. If forms must work on GitHub Pages too,
connect the forms to a separate form backend; the optional Google Sheets script
in [`backend/README.md`](./backend/README.md) is not currently connected.

## Check the homepage

The browser test can be run when Node.js and `playwright-core` with Chrome are
available in the environment:

```powershell
node test-brand-grid.js
```
