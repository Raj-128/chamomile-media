# Google Sheets and email inquiry handling

The homepage inquiry form and the detailed contact form can both save
submissions to a private Google Sheet and email the website owner. Until an
Apps Script URL is configured on both forms, Netlify Forms remains the active
handler.

## Setup

1. Create a private Google Sheet for Chamomile Media inquiries.
2. In that sheet, choose **Extensions → Apps Script**.
3. Replace the starter code in `Code.gs` with the contents of this folder's
   `Code.gs` file, then save the project.
4. In **Project Settings → Script Properties**, add `OWNER_EMAIL` with the
   email address that should receive inquiry notifications. The address is
   kept in Apps Script settings, not in the website code.
5. Choose **Deploy → New deployment** and select **Web app**.
6. Set **Execute as** to your Google account and **Who has access** to
   **Anyone**, then deploy and approve Google's authorization prompts.
7. Copy the web-app URL ending in `/exec`.
8. In both `index.html` and `contact.html`, replace the empty
   `data-apps-script-url` value on the form with that URL.
9. Submit a test from each form and confirm the correct row appears in the
   private sheet's `Leads` tab and the matching email arrives before relying on
   the integration.

Keep the spreadsheet private. The web-app endpoint is public so website visitors
can submit the form; the script writes to the sheet using the deploying account.
The script validates fields, includes a honeypot, protects spreadsheet cells
from formula injection, and limits input lengths. If the row is saved but the
email cannot be sent, the page reports that separately instead of claiming both
steps succeeded. Google's Apps Script, Gmail, and Sheets quotas apply.

Submissions include the time, source form, name, email, phone, and any project
details provided on the contact page. The homepage form collects name, email,
and phone. Every submission is one row with aligned headers; the notification
email contains the same fields in a readable, aligned table. The visitor
sees only the site's confirmation page, never the spreadsheet or other leads.

If `data-apps-script-url` is left empty, both forms continue using Netlify Forms.
