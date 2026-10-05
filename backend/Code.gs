const SHEET_NAME = "Leads";
const FORM_IDS = ["hero-inquiry-form", "contact-form"];
const HEADERS = [
  "Submitted At",
  "Form",
  "Name",
  "Email",
  "Phone",
  "Brand or Company",
  "Timeline",
  "Services",
  "Budget",
  "Goal",
  "Message",
];

function doPost(event) {
  const formId = event && event.parameter && event.parameter.formId;
  if (!FORM_IDS.includes(formId)) {
    return createResponse_("error", "unknown");
  }

  const fields = event.parameter;
  if (fields.botField) {
    return createResponse_("success", formId);
  }

  const name = cleanField_(fields.name, 120);
  const email = cleanField_(fields.email, 254);
  const phone = cleanField_(fields.phone, 40);

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return createResponse_("error", formId);
  }

  if (phone && !/^[+0-9().\-\s]{7,40}$/.test(phone)) {
    return createResponse_("error", formId);
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      throw new Error("Bind this script to the Google Sheet used to store inquiries.");
    }

    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    sheet.appendRow([
      new Date(),
      formId === "hero-inquiry-form" ? "Homepage" : "Contact page",
      safeCell_(name),
      safeCell_(email),
      safeCell_(phone),
      safeCell_(cleanField_(fields.company, 160)),
      safeCell_(cleanField_(fields.timeline, 120)),
      safeCell_(cleanField_(fields.services, 500)),
      safeCell_(cleanField_(fields.budget, 120)),
      safeCell_(cleanField_(fields.goal, 160)),
      safeCell_(cleanField_(fields.message, 3000)),
    ]);

    return createResponse_("success", formId);
  } catch (error) {
    console.error("Could not save Chamomile inquiry.", error);
    return createResponse_("error", formId);
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

function cleanField_(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function safeCell_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function createResponse_(status, formId) {
  const message = JSON.stringify({
    type: "chamomile-inquiry-result",
    status: status,
    formId: formId,
  });
  const html =
    '<!doctype html><html><head><meta charset="utf-8"><title>Inquiry response</title></head>' +
    "<body><script>window.parent.postMessage(" +
    message +
    ', "*");</script></body></html>';

  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
