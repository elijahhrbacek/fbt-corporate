const menuToggle = document.querySelector("[data-menu-toggle]");
const navigation = document.querySelector("[data-navigation]");
const header = document.querySelector("[data-header]");

function closeMenu() {
  if (!menuToggle || !navigation) return;

  menuToggle.setAttribute("aria-expanded", "false");
  navigation.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

function toggleMenu() {
  if (!menuToggle || !navigation) return;

  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  navigation.classList.toggle("is-open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
}

function updateHeader() {
  if (!header) return;
  header.classList.toggle("is-sticky", window.scrollY > 140);
}

menuToggle?.addEventListener("click", toggleMenu);

navigation?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  const openModal = document.querySelector("[data-ticket-modal]:not([hidden])");
  if (openModal) return;

  closeMenu();
  menuToggle?.focus();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 920) closeMenu();
});

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

function getAssetPrefix() {
  return window.location.pathname.includes("/events/") ? "../" : "";
}

function getErrorMessage(field) {
  if (field.id?.endsWith("phone") && field.validity.customError) {
    return "Enter a phone number to opt in to SMS messages.";
  }
  if (field.validity.valueMissing) return "Please complete this field.";
  if (field.validity.typeMismatch) return "Please enter a valid email address.";
  return "Please check this field.";
}

function showFieldError(field) {
  const errorElement = field.form?.querySelector(`[data-error-for="${field.id}"]`);
  if (!errorElement) return;

  const hasError = !field.validity.valid;
  field.setAttribute("aria-invalid", String(hasError));
  errorElement.textContent = hasError ? getErrorMessage(field) : "";
}

function updateFormStatus(form, message, status) {
  const statusElement = form.querySelector("[data-form-status]");
  if (!statusElement) return;

  statusElement.textContent = message;
  statusElement.className = `form-status is-visible is-${status}`;
}

function clearFormErrors(form) {
  form.querySelectorAll("[aria-invalid]").forEach((field) => {
    if (field instanceof HTMLInputElement) field.setCustomValidity("");
    field.removeAttribute("aria-invalid");
    const errorElement = form.querySelector(`[data-error-for="${field.id}"]`);
    if (errorElement) errorElement.textContent = "";
  });
}

function bindFormValidation(form) {
  form.querySelectorAll("[required]").forEach((field) => {
    field.addEventListener("blur", () => showFieldError(field));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") showFieldError(field);
    });
  });

  const phoneField = form.querySelector('[name="phone"]');
  const smsConsent = form.querySelector("[data-sms-consent]");
  if (phoneField instanceof HTMLInputElement && smsConsent instanceof HTMLInputElement) {
    function validateSmsConsent() {
      phoneField.setCustomValidity(
        smsConsent.checked && !phoneField.value.trim()
          ? "Enter a phone number to opt in to SMS messages."
          : "",
      );
      showFieldError(phoneField);
    }

    phoneField.addEventListener("input", validateSmsConsent);
    smsConsent.addEventListener("change", validateSmsConsent);
  }

  form.querySelectorAll(".sms-consent a").forEach((link) => {
    link.addEventListener("click", (event) => event.stopPropagation());
  });
}

async function submitContactForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;

  const requiredFields = Array.from(form.querySelectorAll("[required]"));
  requiredFields.forEach(showFieldError);

  const firstInvalidField = requiredFields.find((field) => !field.validity.valid);
  if (firstInvalidField) {
    firstInvalidField.focus();
    updateFormStatus(form, "Please review the highlighted fields.", "error");
    return;
  }

  const phoneField = form.querySelector('[name="phone"]');
  const smsConsent = form.querySelector("[data-sms-consent]");
  if (phoneField instanceof HTMLInputElement && smsConsent instanceof HTMLInputElement) {
    phoneField.setCustomValidity(
      smsConsent.checked && !phoneField.value.trim()
        ? "Enter a phone number to opt in to SMS messages."
        : "",
    );
    showFieldError(phoneField);

    if (!phoneField.validity.valid) {
      phoneField.focus();
      updateFormStatus(form, "Please enter a phone number to opt in to SMS messages.", "error");
      return;
    }
  }

  const honeypot = form.querySelector('input[name="_gotcha"]');
  if (honeypot?.value) return;

  const submitButton = form.querySelector("[data-submit-button]");
  const endpoint = form.action;
  const defaultLabel = submitButton?.getAttribute("data-default-label") || "Send inquiry →";

  if (endpoint.includes("YOUR_FORM_ID")) {
    updateFormStatus(
      form,
      "Form delivery is awaiting final setup. Please email hello@fortbendtickets.com in the meantime.",
      "error",
    );
    return;
  }

  if (submitButton instanceof HTMLButtonElement) {
    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
  }

  try {
    const formData = new FormData(form);
    const emailField = form.querySelector('[name="email"]');
    if (emailField instanceof HTMLInputElement && emailField.value.trim()) {
      formData.set("_replyto", emailField.value.trim());
    }

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) throw new Error("Form submission failed");

    const eventContext = {
      slug: form.querySelector('[name="event_slug"]')?.value || "",
      name: form.querySelector('[name="event_name"]')?.value || "",
      date: form.querySelector('[name="event_date"]')?.value || "",
      time: form.querySelector('[name="event_time"]')?.value || "",
    };

    form.reset();
    clearFormErrors(form);

    if (form.hasAttribute("data-ticket-request-form")) {
      fillTicketRequestForm(form, eventContext);
    } else {
      applyEventInquiryContext();
    }

    updateFormStatus(form, "Thank you. Your inquiry has been sent and our team will be in touch.", "success");
  } catch {
    updateFormStatus(
      form,
      "We couldn’t send your inquiry. Please try again or email hello@fortbendtickets.com.",
      "error",
    );
  } finally {
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = false;
      submitButton.textContent = defaultLabel;
    }
  }
}

const EVENT_INQUIRIES = {
  "summer-sounds-festival": {
    name: "Summer Sounds Festival",
    date: "Saturday, September 12, 2026",
    time: "4:00 PM",
  },
  "sugar-land-country-night": {
    name: "Sugar Land Country Night",
    date: "Friday, September 25, 2026",
    time: "8:00 PM",
  },
  "friday-night-classic": {
    name: "Friday Night Classic",
    date: "Friday, October 3, 2026",
    time: "7:00 PM",
  },
  "downtown-arena-live": {
    name: "Downtown Arena Live",
    date: "Saturday, October 17, 2026",
    time: "7:30 PM",
  },
  "gulf-coast-classic": {
    name: "Gulf Coast Classic",
    date: "Sunday, October 25, 2026",
    time: "12:00 PM",
  },
  "broadway-at-wortham": {
    name: "Broadway at the Wortham",
    date: "Saturday, November 8, 2026",
    time: "8:00 PM",
  },
  "alley-theatre-premiere": {
    name: "Alley Theatre Premiere",
    date: "Thursday, November 12, 2026",
    time: "7:30 PM",
  },
  "hardwood-rivalry": {
    name: "Hardwood Rivalry",
    date: "Wednesday, December 9, 2026",
    time: "7:00 PM",
  },
  "holiday-ballet-hobby": {
    name: "Holiday Ballet at the Hobby",
    date: "Saturday, December 19, 2026",
    time: "2:00 PM",
  },
  "new-years-eve-bayou": {
    name: "New Year’s Eve on the Bayou",
    date: "Thursday, December 31, 2026",
    time: "9:00 PM",
  },
  "moody-center-live": {
    name: "Moody Center Live",
    date: "Saturday, February 6, 2027",
    time: "8:00 PM",
  },
  "winspear-opera-evening": {
    name: "Winspear Opera Evening",
    date: "Saturday, March 13, 2027",
    time: "7:30 PM",
  },
  "opening-day-ballpark": {
    name: "Opening Day at the Ballpark",
    date: "Thursday, April 1, 2027",
    time: "6:10 PM",
  },
};

function applyEventInquiryContext() {
  const contactForm = document.querySelector("[data-contact-form]:not([data-ticket-request-form])");
  if (!(contactForm instanceof HTMLFormElement)) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("event") || "";
  const catalog = EVENT_INQUIRIES[slug];
  const eventName = params.get("eventName") || catalog?.name || "";
  const eventDate = params.get("eventDate") || catalog?.date || "";
  const eventTime = params.get("eventTime") || catalog?.time || "";

  if (!slug && !eventName) return;

  const eventNameField = contactForm.querySelector("#event-name");
  const eventDateField = contactForm.querySelector("#event-date");
  const eventTimeField = contactForm.querySelector("#event-time");
  const eventSlugField = contactForm.querySelector("[data-event-slug]");
  const messageField = contactForm.querySelector("[data-message-field]");
  const subjectLine = contactForm.querySelector('input[name="_subject"]');
  const formKicker = document.querySelector("[data-form-kicker]");
  const formHeading = document.querySelector("[data-form-heading]");
  const formIntro = document.querySelector("[data-form-intro]");

  contactForm.querySelectorAll("[data-event-field]").forEach((field) => {
    if (field instanceof HTMLElement) field.hidden = false;
  });
  if (eventNameField instanceof HTMLInputElement) eventNameField.value = eventName;
  if (eventDateField instanceof HTMLInputElement) {
    eventDateField.value = eventDate;
    eventDateField.closest(".form-field")?.toggleAttribute("hidden", !eventDate);
  }
  if (eventTimeField instanceof HTMLInputElement) {
    eventTimeField.value = eventTime;
    eventTimeField.closest(".form-field")?.toggleAttribute("hidden", !eventTime);
  }
  if (eventSlugField instanceof HTMLInputElement) eventSlugField.value = slug;

  const datetimeRow = eventDateField?.closest(".form-row");
  if (datetimeRow instanceof HTMLElement) {
    datetimeRow.hidden = !eventDate && !eventTime;
  }

  if (messageField instanceof HTMLTextAreaElement && eventName) {
    messageField.placeholder = `Ticket quantity, seating preferences, or other details for ${eventName}...`;
  }

  if (subjectLine instanceof HTMLInputElement && eventName) {
    subjectLine.value = `Ticket request: ${eventName}`;
  }

  if (formKicker) formKicker.textContent = "Ticket request";
  if (formHeading) formHeading.textContent = eventName ? `Request tickets for ${eventName}` : "Request tickets";
  if (formIntro) {
    formIntro.textContent =
      "Confirm the quantity and any seating preferences. Our team will follow up — there is no online checkout.";
  }
}

function fillTicketRequestForm(form, event) {
  const nameField = form.querySelector('[name="event_name"]');
  const dateField = form.querySelector('[name="event_date"]');
  const timeField = form.querySelector('[name="event_time"]');
  const slugField = form.querySelector('[name="event_slug"]');
  const subjectLine = form.querySelector('input[name="_subject"]');
  const messageField = form.querySelector("[data-message-field]");
  const heading = form.closest("[data-ticket-modal]")?.querySelector("[data-modal-heading]");

  if (nameField instanceof HTMLInputElement) nameField.value = event.name || "";
  if (dateField instanceof HTMLInputElement) dateField.value = event.date || "";
  if (timeField instanceof HTMLInputElement) timeField.value = event.time || "";
  if (slugField instanceof HTMLInputElement) slugField.value = event.slug || "";

  if (subjectLine instanceof HTMLInputElement) {
    subjectLine.value = event.name ? `Ticket request: ${event.name}` : "Ticket request";
  }

  if (messageField instanceof HTMLTextAreaElement) {
    messageField.placeholder = event.name
      ? `Ticket quantity, seating preferences, or other details for ${event.name}...`
      : "Ticket quantity, seating preferences, or other details...";
  }

  if (heading) {
    heading.textContent = event.name ? `Request tickets for ${event.name}` : "Request tickets";
  }
}

function createTicketRequestModal() {
  const prefix = getAssetPrefix();
  const modal = document.createElement("div");
  modal.className = "ticket-modal";
  modal.setAttribute("data-ticket-modal", "");
  modal.hidden = true;
  modal.innerHTML = `
    <div class="ticket-modal-backdrop" data-modal-close tabindex="-1"></div>
    <div
      class="ticket-modal-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-heading"
      data-modal-dialog
    >
      <button class="ticket-modal-close" type="button" aria-label="Close ticket request form" data-modal-close>
        <span aria-hidden="true">×</span>
      </button>
      <p class="form-kicker">Ticket request</p>
      <h2 id="ticket-modal-heading" data-modal-heading>Request tickets</h2>
      <p class="ticket-modal-intro">Event details are filled in. Add your info and we’ll follow up — there is no online checkout.</p>
      <form
        class="contact-form ticket-request-form"
        action="https://formspree.io/f/xaewbveq"
        method="post"
        data-contact-form
        data-ticket-request-form
        novalidate
      >
        <div class="form-field">
          <label for="ticket-event-name">Event</label>
          <input id="ticket-event-name" name="event_name" type="text" readonly />
          <input type="hidden" name="event_slug" />
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="ticket-event-date">Date</label>
            <input id="ticket-event-date" name="event_date" type="text" readonly />
          </div>
          <div class="form-field">
            <label for="ticket-event-time">Time</label>
            <input id="ticket-event-time" name="event_time" type="text" readonly />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="ticket-name">Name <span aria-hidden="true">*</span></label>
            <input id="ticket-name" name="name" type="text" autocomplete="name" required aria-describedby="ticket-name-error" />
            <span id="ticket-name-error" class="field-error" data-error-for="ticket-name"></span>
          </div>
          <div class="form-field">
            <label for="ticket-email">Email <span aria-hidden="true">*</span></label>
            <input id="ticket-email" name="email" type="email" autocomplete="email" required replyto aria-describedby="ticket-email-error" />
            <span id="ticket-email-error" class="field-error" data-error-for="ticket-email"></span>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="ticket-phone">Phone <small>(optional)</small></label>
            <input id="ticket-phone" name="phone" type="tel" autocomplete="tel" aria-describedby="ticket-phone-error" />
            <span id="ticket-phone-error" class="field-error" data-error-for="ticket-phone"></span>
          </div>
          <div class="form-field">
            <label for="ticket-quantity">Ticket quantity <small>(optional)</small></label>
            <input id="ticket-quantity" name="quantity" type="number" min="1" max="50" inputmode="numeric" />
          </div>
        </div>
        <div class="sms-consent">
          <input id="ticket-sms-consent" name="sms_consent" type="checkbox" value="yes" data-sms-consent />
          <label for="ticket-sms-consent">
            By checking this box, I agree to receive informational and customer-care SMS messages from Fort Bend Tickets LLC at the phone number provided above regarding ticket orders, ticket delivery, digital ticket transfers, event information, and customer support. Message frequency may vary. Message and data rates may apply. Reply STOP to opt out or HELP for assistance. Consent is not a condition of purchase. View our <a href="${prefix}privacy.html">Privacy Policy</a> and <a href="${prefix}terms.html">Terms and Conditions</a>.
          </label>
        </div>
        <div class="form-field">
          <label for="ticket-message">Tell us more <span aria-hidden="true">*</span></label>
          <textarea id="ticket-message" name="message" rows="4" required aria-describedby="ticket-message-error" placeholder="Ticket quantity, seating preferences, or other details..." data-message-field></textarea>
          <span id="ticket-message-error" class="field-error" data-error-for="ticket-message"></span>
        </div>
        <div class="honeypot" aria-hidden="true">
          <label for="ticket-company-website">Leave this field empty</label>
          <input id="ticket-company-website" name="_gotcha" type="text" tabindex="-1" autocomplete="off" />
        </div>
        <input type="hidden" name="_subject" value="Ticket request" />
        <button class="button button-primary form-submit" type="submit" data-submit-button data-default-label="Send request →">Send request <span aria-hidden="true">→</span></button>
        <p class="form-status" role="status" aria-live="polite" data-form-status></p>
        <p class="form-privacy">By submitting this form, you agree that Fort Bend Tickets may contact you about your inquiry. See our <a href="${prefix}privacy.html">Privacy Policy</a>.</p>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function initTicketRequestModal() {
  const triggers = document.querySelectorAll("[data-ticket-request]");
  if (!triggers.length) return;

  const modal = createTicketRequestModal();
  const dialog = modal.querySelector("[data-modal-dialog]");
  const form = modal.querySelector("[data-ticket-request-form]");
  const closeButtons = modal.querySelectorAll("[data-modal-close]");
  let lastFocus = null;

  if (!(form instanceof HTMLFormElement)) return;

  bindFormValidation(form);
  form.addEventListener("submit", submitContactForm);

  function openModal(trigger) {
    lastFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
    fillTicketRequestForm(form, {
      slug: trigger.getAttribute("data-event-slug") || "",
      name: trigger.getAttribute("data-event-name") || "",
      date: trigger.getAttribute("data-event-date") || "",
      time: trigger.getAttribute("data-event-time") || "",
    });
    clearFormErrors(form);
    updateFormStatus(form, "", "success");
    const status = form.querySelector("[data-form-status]");
    if (status) status.className = "form-status";

    modal.hidden = false;
    document.body.classList.add("modal-open");
    const firstField = form.querySelector("#ticket-name");
    if (firstField instanceof HTMLElement) firstField.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => openModal(trigger));
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      event.preventDefault();
      closeModal();
    }
  });

  dialog?.addEventListener("click", (event) => event.stopPropagation());
}

const pageContactForm = document.querySelector("[data-contact-form]:not([data-ticket-request-form])");

if (pageContactForm instanceof HTMLFormElement) {
  const submitButton = pageContactForm.querySelector("[data-submit-button]");
  if (submitButton instanceof HTMLButtonElement && !submitButton.getAttribute("data-default-label")) {
    submitButton.setAttribute("data-default-label", "Send inquiry →");
  }

  applyEventInquiryContext();
  bindFormValidation(pageContactForm);
  pageContactForm.addEventListener("submit", submitContactForm);
}

initTicketRequestModal();

function initEventFilters() {
  const grid = document.querySelector("[data-event-grid]");
  const filters = document.querySelectorAll("[data-event-filter]");
  if (!grid || !filters.length) return;

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.getAttribute("data-event-filter");

      filters.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });

      grid.querySelectorAll("[data-event-category]").forEach((card) => {
        if (!(card instanceof HTMLElement)) return;
        card.hidden = category !== "all" && card.getAttribute("data-event-category") !== category;
      });
    });
  });
}

initEventFilters();
