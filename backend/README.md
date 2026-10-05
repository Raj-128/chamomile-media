# Free inquiry storage with Google Sheets

This is an optional future alternative for saving homepage and contact-page
inquiries to a private Google Sheet. Netlify Forms remains the active form
handler for now. Do not deploy or connect this script unless you decide to move
submissions to Google Sheets.

## Setup

1. Create a Google Sheet for Chamomile Media inquiries.
2. In that sheet, choose **Extensions → Apps Script**.
3. Replace the starter code in `Code.gs` with the contents of this folder's
   `Code.gs` file, then save the project.
4. Choose **Deploy → New deployment** and select **Web app**.
5. Set **Execute as** to your Google account and **Who has access** to
   **Anyone**, then deploy and approve Google's authorization prompt.
6. Copy the web-app URL ending in `/exec`.
7. To switch the website to this backend, connect the deployed web-app URL to
   both site forms and remove the Netlify form attributes.
8. Test an inquiry and confirm it appears in the private sheet's `Leads` tab
   before relying on the new handler.

Keep the spreadsheet private. The web-app endpoint is public so website visitors
can submit the form; the script writes to the sheet using the deploying account.
The script validates fields, includes a honeypot, and limits input lengths.
Google's Apps Script and Sheets quotas apply.

Submissions include the time, source form, name, email, phone, and any project
details provided on the contact page. The homepage form collects name, email,
and phone.
