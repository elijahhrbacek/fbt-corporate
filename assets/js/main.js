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
      "Form delivery is awaiting final setup. Please email orders@fortbendtickets.com in the meantime.",
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
      name: form.querySelector('[name="event name"]')?.value || "",
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
      "We couldn’t send your inquiry. Please try again or email orders@fortbendtickets.com.",
      "error",
    );
  } finally {
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = false;
      submitButton.textContent = defaultLabel;
    }
  }
}

const FILTER_LABELS = {
  basketball: "Basketball",
  tennis: "Tennis",
  motorsports: "Motorsports",
  football: "Football",
  sports: "Sports",
};

let eventsCatalog = [];
let eventsBySlug = {};

function getEventsDataUrl() {
  return `${getAssetPrefix()}data/events.json`;
}

function getEventDetailHref(slug) {
  const prefix = getAssetPrefix();
  const base = prefix.includes("../") ? "event.html" : "events/event.html";
  return `${base}?slug=${encodeURIComponent(slug)}`;
}

function formatEventMeta(event, { includeVenue = false, compact = false } = {}) {
  const datePart = compact ? compactEventDate(event.dateDisplay) : event.dateDisplay;
  const timePart = event.timeDisplay ? ` · ${event.timeDisplay}` : "";
  if (!includeVenue) return `${datePart}${timePart}`;
  return `${datePart}${timePart}<br />${escapeHtml(event.venue)}`;
}

function compactEventDate(dateDisplay) {
  if (!dateDisplay) return "";
  return dateDisplay
    .replace(/\bMonday\b/g, "Mon")
    .replace(/\bTuesday\b/g, "Tue")
    .replace(/\bWednesday\b/g, "Wed")
    .replace(/\bThursday\b/g, "Thu")
    .replace(/\bFriday\b/g, "Fri")
    .replace(/\bSaturday\b/g, "Sat")
    .replace(/\bSunday\b/g, "Sun")
    .replace(/\bJanuary\b/g, "Jan")
    .replace(/\bFebruary\b/g, "Feb")
    .replace(/\bMarch\b/g, "Mar")
    .replace(/\bApril\b/g, "Apr")
    .replace(/\bAugust\b/g, "Aug")
    .replace(/\bSeptember\b/g, "Sep")
    .replace(/\bOctober\b/g, "Oct")
    .replace(/\bNovember\b/g, "Nov")
    .replace(/\bDecember\b/g, "Dec");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sortEvents(events) {
  return [...events].sort((a, b) => {
    if (Boolean(b.featured) !== Boolean(a.featured)) return Number(b.featured) - Number(a.featured);
    return String(a.sortDate || "").localeCompare(String(b.sortDate || ""));
  });
}

function buildEventCard(event, { compact = false } = {}) {
  const filterLabel = FILTER_LABELS[event.filter] || FILTER_LABELS[event.category] || "Sports";
  const meta = compact
    ? `${escapeHtml(compactEventDate(event.dateDisplay))} · ${escapeHtml(shortVenue(event.venue))}`
    : formatEventMeta(event, { includeVenue: true, compact: true });

  const article = document.createElement("article");
  article.className = "event-card";
  article.setAttribute("data-event-category", event.filter || event.category || "sports");
  article.innerHTML = `
    <div class="event-card-media">
      <img
        src="${escapeHtml(event.image)}"
        alt="${escapeHtml(event.imageAlt || event.name)}"
        width="900"
        height="600"
        loading="lazy"
      />
    </div>
    <div class="event-card-body">
      <span class="event-category">${escapeHtml(filterLabel)}</span>
      <h3>${escapeHtml(event.name)}</h3>
      <p class="event-meta">${meta}</p>
      <a class="text-link text-link-dark" href="${getEventDetailHref(event.slug)}">View details <span>→</span></a>
    </div>
  `;
  return article;
}

function shortVenue(venue) {
  if (!venue) return "";
  const parts = venue.split(",");
  if (parts.length >= 2) return parts.slice(-2).join(",").trim();
  return venue;
}

async function loadEvents() {
  if (eventsCatalog.length) return eventsCatalog;

  const response = await fetch(getEventsDataUrl());
  if (!response.ok) throw new Error("Unable to load events");

  const payload = await response.json();
  eventsCatalog = Array.isArray(payload.events) ? payload.events : [];
  eventsBySlug = Object.fromEntries(eventsCatalog.map((event) => [event.slug, event]));
  return eventsCatalog;
}

function inquiryFromEvent(event) {
  if (!event) return null;
  return {
    name: event.name,
    date: event.dateDisplay || "",
    time: event.timeDisplay || "",
  };
}

function applyEventInquiryContext() {
  const contactForm = document.querySelector("[data-contact-form]:not([data-ticket-request-form])");
  if (!(contactForm instanceof HTMLFormElement)) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("event") || "";
  const catalog = inquiryFromEvent(eventsBySlug[slug]);
  const eventName = params.get("eventName") || catalog?.name || "";
  const eventDate = params.get("eventDate") || catalog?.date || "";
  const eventTime = params.get("eventTime") || catalog?.time || "";

  if (!slug && !eventName) return;

  const eventNameField = contactForm.querySelector("#event-name");
  const eventDateField = contactForm.querySelector("#event-date");
  const eventTimeField = contactForm.querySelector("#event-time");
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
  const nameField = form.querySelector('[name="event name"]');
  const dateField = form.querySelector('[name="event_date"]');
  const timeField = form.querySelector('[name="event_time"]');
  const subjectLine = form.querySelector('input[name="_subject"]');
  const messageField = form.querySelector("[data-message-field]");
  const heading = form.closest("[data-ticket-modal]")?.querySelector("[data-modal-heading]");

  if (nameField instanceof HTMLInputElement) nameField.value = event.name || "";
  if (dateField instanceof HTMLInputElement) dateField.value = event.date || "";
  if (timeField instanceof HTMLInputElement) {
    timeField.value = event.time || "";
    timeField.closest(".form-field")?.toggleAttribute("hidden", !event.time);
  }

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
          <input id="ticket-event-name" name="event name" type="text" readonly />
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
          <input id="ticket-sms-consent" name="sms consent" type="checkbox" value="yes" data-sms-consent />
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

function renderEventListing(events) {
  const grid = document.querySelector("[data-event-grid]");
  if (!grid) return;

  grid.replaceChildren();
  sortEvents(events).forEach((event) => {
    grid.appendChild(buildEventCard(event));
  });
}

function renderHomeEvents(events) {
  const grid = document.querySelector("[data-home-event-grid]");
  if (!grid) return;

  const homeEvents = sortEvents(events).slice(0, 6);
  grid.replaceChildren();
  homeEvents.forEach((event) => {
    grid.appendChild(buildEventCard(event, { compact: true }));
  });
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function showEventNotFound() {
  const found = document.querySelector("[data-event-found]");
  const missing = document.querySelector("[data-event-missing]");
  if (found instanceof HTMLElement) found.hidden = true;
  if (missing instanceof HTMLElement) missing.hidden = false;
  document.title = "Event not found | Fort Bend Tickets";
}

function hydrateEventDetail(event) {
  const found = document.querySelector("[data-event-found]");
  const missing = document.querySelector("[data-event-missing]");
  if (!(found instanceof HTMLElement)) return;

  if (missing instanceof HTMLElement) missing.hidden = true;
  found.hidden = false;

  const filterLabel = FILTER_LABELS[event.filter] || FILTER_LABELS[event.category] || "Sports";
  const dateTime = event.timeDisplay
    ? `${event.dateDisplay} · ${event.timeDisplay}`
    : event.dateDisplay;
  const heroLine = `${event.dateDisplay} · ${event.venue}`;
  const pageTitle = `${event.name} | Fort Bend Tickets`;
  const description = `Request tickets to ${event.name} at ${event.venue}. Fort Bend Tickets follows up — no online checkout.`;
  const canonical = `https://fortbendtickets.com/events/event.html?slug=${encodeURIComponent(event.slug)}`;

  document.title = pageTitle;
  document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", pageTitle);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", event.summary || description);
  document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonical);
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonical);

  const heroMedia = document.querySelector("[data-event-hero-media]");
  if (heroMedia instanceof HTMLElement) {
    heroMedia.style.backgroundImage = `url("${event.image}")`;
    heroMedia.setAttribute("aria-label", event.imageAlt || event.name);
  }

  setText("[data-event-category-label]", filterLabel);
  setText("[data-event-name]", event.name);
  setText("[data-event-hero-meta]", heroLine);
  setText("[data-event-summary]", event.summary || "");
  setText("[data-event-about]", event.about || event.description || "");
  setText("[data-event-venue-name]", event.venue);
  setText("[data-event-venue]", event.venue);
  setText("[data-event-venue-description]", event.venueDescription || "");
  setText("[data-event-accommodations-intro]", event.accommodationsIntro || "");
  setText("[data-event-datetime]", dateTime);
  setText("[data-event-category-fact]", filterLabel);

  const countryLine = document.querySelector("[data-event-country-line]");
  if (countryLine) {
    countryLine.textContent = event.country ? ` · ${event.country}` : "";
  }

  const hotelList = document.querySelector("[data-event-accommodations]");
  if (hotelList instanceof HTMLElement) {
    hotelList.replaceChildren();
    const hotels = Array.isArray(event.accommodations) ? event.accommodations : [];
    if (!hotels.length) {
      const empty = document.createElement("li");
      empty.textContent = "Ask our team for lodging suggestions near the venue when you request tickets.";
      hotelList.appendChild(empty);
    } else {
      hotels.forEach((hotel) => {
        const item = document.createElement("li");
        const name = document.createElement("strong");
        name.textContent = hotel.name || "Nearby hotel";
        item.appendChild(name);
        if (hotel.detail) {
          item.appendChild(document.createTextNode(` — ${hotel.detail}`));
        }
        hotelList.appendChild(item);
      });
    }
  }

  const requestButton = document.querySelector("[data-ticket-request]");
  if (requestButton instanceof HTMLElement) {
    requestButton.setAttribute("data-event-slug", event.slug);
    requestButton.setAttribute("data-event-name", event.name);
    requestButton.setAttribute("data-event-date", event.dateDisplay || "");
    requestButton.setAttribute("data-event-time", event.timeDisplay || "");
  }
}

function initEventDetailPage() {
  const detailRoot = document.querySelector("[data-event-detail]");
  if (!detailRoot) return;

  const slug = new URLSearchParams(window.location.search).get("slug") || "";
  const event = eventsBySlug[slug];
  if (!event) {
    showEventNotFound();
    return;
  }

  hydrateEventDetail(event);
}

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

function initContactForm() {
  const pageContactForm = document.querySelector("[data-contact-form]:not([data-ticket-request-form])");
  if (!(pageContactForm instanceof HTMLFormElement)) return;

  const submitButton = pageContactForm.querySelector("[data-submit-button]");
  if (submitButton instanceof HTMLButtonElement && !submitButton.getAttribute("data-default-label")) {
    submitButton.setAttribute("data-default-label", "Send inquiry →");
  }

  applyEventInquiryContext();
  bindFormValidation(pageContactForm);
  pageContactForm.addEventListener("submit", submitContactForm);
}

async function bootstrapEventsUi() {
  try {
    const events = await loadEvents();
    renderHomeEvents(events);
    renderEventListing(events);
    initEventDetailPage();
    initContactForm();
  } catch (error) {
    console.error(error);
    const grids = document.querySelectorAll("[data-event-grid], [data-home-event-grid]");
    grids.forEach((grid) => {
      if (!(grid instanceof HTMLElement)) return;
      grid.innerHTML =
        '<p class="event-load-error">Events could not be loaded. Please refresh the page or contact us directly.</p>';
    });
    if (document.querySelector("[data-event-detail]")) showEventNotFound();
    initContactForm();
  }

  initEventFilters();
  initTicketRequestModal();
}

bootstrapEventsUi();
