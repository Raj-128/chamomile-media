# Chamomile Media

Chamomile Media is a responsive digital marketing agency website built with
plain HTML, CSS, and JavaScript. It presents the agency's services, selected
work, client brands, video formats, and contact options.

## Website pages

- [`index.html`](./index.html) — Homepage with the hero inquiry form, agency
  overview, services, video showcase, selected work, clients, testimonials, and
  project call to action.
- [`contact.html`](./contact.html) — Contact form and project inquiry details.
- [`thank-you.html`](./thank-you.html) — Confirmation page used after a
  successful Netlify form submission.

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
