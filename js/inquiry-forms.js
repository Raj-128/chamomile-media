(() => {
  const forms = Array.from(document.querySelectorAll("#hero-inquiry-form, #contact-form"));

  forms.forEach((form) => {
    const endpoint = form.dataset.appsScriptUrl?.trim();
    if (!endpoint) {
      return;
    }

    let endpointUrl;
    try {
      endpointUrl = new URL(endpoint);
    } catch (error) {
      console.error(`Invalid Apps Script URL for ${form.id}.`, error);
    }

    const isValidEndpoint =
      endpointUrl &&
      endpointUrl.protocol === "https:" &&
      endpointUrl.hostname === "script.google.com" &&
      /^\/macros\/s\/[^/]+\/exec\/?$/.test(endpointUrl.pathname);
    const status = form.querySelector(".hero-inquiry-status, #contact-status");
    const submitButton = form.querySelector('button[type="submit"]');
    const initialButtonText = submitButton?.textContent || "Send inquiry";

    if (!isValidEndpoint) {
      console.error(`Apps Script URL for ${form.id} must be a deployed /macros/s/.../exec URL.`);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = initialButtonText;
        }
        if (status) {
          status.textContent = "This form is not configured yet. Please try again later.";
          status.dataset.state = "error";
        }
      });
      return;
    }

    const responseFrame = document.createElement("iframe");
    responseFrame.name = `response-${form.id}`;
    responseFrame.title = "Inquiry submission response";
    responseFrame.hidden = true;
    responseFrame.setAttribute("aria-hidden", "true");
    document.body.appendChild(responseFrame);

    form.action = endpointUrl.href;
    form.target = responseFrame.name;

    let responseTimeout = 0;

    const resetSubmitButton = () => {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = initialButtonText;
      }
    };

    window.addEventListener("message", (event) => {
      if (event.source !== responseFrame.contentWindow) {
        return;
      }

      const result = event.data;
      const formId = form.querySelector('[name="formId"]')?.value;
      if (
        !result ||
        result.type !== "chamomile-inquiry-result" ||
        result.formId !== formId
      ) {
        return;
      }

      window.clearTimeout(responseTimeout);

      if (result.status === "success") {
        if (status) {
          status.textContent = "Your inquiry has been received.";
          status.dataset.state = "success";
        }
        window.setTimeout(() => window.location.assign("thank-you.html"), 300);
        return;
      }

      resetSubmitButton();
      if (!status) {
        return;
      }

      if (result.status === "stored-email-not-configured" || result.status === "stored-email-failed") {
        status.textContent =
          "Your inquiry was saved, but the email notification could not be sent. We have your details.";
        status.dataset.state = "error";
      } else {
        status.textContent = "We couldn't save your inquiry. Please try again later.";
        status.dataset.state = "error";
      }
    });

    form.addEventListener("submit", () => {
      if (status) {
        status.textContent = "Sending your inquiry to Chamomile Media...";
        status.dataset.state = "pending";
      }
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
      }

      window.clearTimeout(responseTimeout);
      responseTimeout = window.setTimeout(() => {
        resetSubmitButton();
        if (status) {
          status.textContent =
            "We couldn't confirm delivery. Please contact us before submitting again.";
          status.dataset.state = "error";
        }
      }, 20000);
    });
  });
})();
