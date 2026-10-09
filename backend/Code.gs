const SHEET_NAME = "Leads";
const OWNER_EMAIL_PROPERTY = "OWNER_EMAIL";
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
  if (fields.botField || fields["bot-field"]) {
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

    const submittedAt = new Date();
    const source = formId === "hero-inquiry-form" ? "Homepage inquiry" : "Contact page inquiry";
    const details = {
      "Submitted At": submittedAt,
      "Form": source,
      "Name": name,
      "Email": email,
      "Phone": phone,
      "Brand or Company": cleanField_(fields.company, 160),
      "Timeline": cleanField_(fields.timeline, 120),
      "Services": cleanField_(fields.services, 500),
      "Budget": cleanField_(fields.budget, 120),
      "Goal": cleanField_(fields.goal, 160),
      "Message": cleanField_(fields.message, 3000),
    };

    sheet.appendRow([
      details["Submitted At"],
      details["Form"],
      safeCell_(name),
      safeCell_(email),
      safeCell_(phone),
      safeCell_(details["Brand or Company"]),
      safeCell_(details["Timeline"]),
      safeCell_(details["Services"]),
      safeCell_(details["Budget"]),
      safeCell_(details["Goal"]),
      safeCell_(details["Message"]),
    ]);
    lock.releaseLock();

    const ownerEmail = PropertiesService.getScriptProperties()
      .getProperty(OWNER_EMAIL_PROPERTY);
    if (!ownerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      console.error("Inquiry saved, but OWNER_EMAIL is not configured in Script Properties.");
      return createResponse_("stored-email-not-configured", formId);
    }

    try {
      MailApp.sendEmail({
        to: ownerEmail,
        subject: "New Chamomile Media inquiry: " + source,
        body: formatEmail_(details),
        htmlBody: formatEmailHtml_(details),
      });
    } catch (emailError) {
      console.error("Inquiry saved, but its notification email could not be sent.", emailError);
      return createResponse_("stored-email-failed", formId);
    }

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

function formatEmail_(details) {
  const labels = Object.keys(details);
  const width = Math.max.apply(null, labels.map(function (label) {
    return label.length;
  }));

  return "A new inquiry was submitted on the Chamomile Media website.\n\n" +
    labels.map(function (label) {
      const value = details[label] instanceof Date
        ? details[label].toLocaleString()
        : String(details[label] || "Not provided").replace(/[\r\n]+/g, " ");
      return label.padEnd(width) + " : " + value;
    }).join("\n");
}

function formatEmailHtml_(details) {
  const rows = Object.keys(details).map(function (label) {
    const rawValue = details[label] instanceof Date
      ? details[label].toLocaleString()
      : details[label];
    const value = escapeHtml_(rawValue || "Not provided").replace(/[\r\n]+/g, "<br>");

    return '<tr><th scope="row" style="padding:8px 12px;text-align:left;vertical-align:top;' +
      'border:1px solid #d9e1e5;background:#f3f7f8;">' + escapeHtml_(label) +
      '</th><td style="padding:8px 12px;vertical-align:top;border:1px solid #d9e1e5;">' +
      value + "</td></tr>";
  }).join("");

  return '<div style="font-family:Arial,sans-serif;color:#22323c;">' +
    "<p>A new inquiry was submitted on the Chamomile Media website.</p>" +
    '<table style="width:100%;border-collapse:collapse;"><tbody>' + rows +
    "</tbody></table></div>";
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
