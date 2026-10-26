/* =========================================
   SYNERGY WEBSITE
   Shared JavaScript for inner pages: other.js
   -----------------------------------------
   Used together with other.css on services.html and the
   other inner pages. Every feature first checks that its
   elements exist, so this one file can be loaded on any page.

   Contact details live in each page's HTML only:
   - WhatsApp number: the wa.me link inside the #contact section
   - Email address:   the mailto link inside the #contact section
========================================= */

(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* 1. MOBILE NAVIGATION */

  const menuToggle = $("#menuToggle");
  const navMenu = $("#navMenu");

  if (menuToggle && navMenu) {
    const isOpen = () => navMenu.classList.contains("open");

    const setMenu = (open, { returnFocus = false } = {}) => {
      navMenu.classList.toggle("open", open);
      menuToggle.classList.toggle("active", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);

      if (!open && returnFocus) menuToggle.focus();
    };

    menuToggle.addEventListener("click", () => setMenu(!isOpen()));

    navMenu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) {
        setMenu(false, { returnFocus: true });
      }
    });

    document.addEventListener("click", (event) => {
      if (
        isOpen() &&
        !navMenu.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        setMenu(false);
      }
    });

    // Mirrors the CSS breakpoint (max-width: 760px).
    const desktop = window.matchMedia("(min-width: 761px)");
    const onBreakpointChange = (event) => {
      if (event.matches) setMenu(false);
    };

    if (desktop.addEventListener) {
      desktop.addEventListener("change", onBreakpointChange);
    } else {
      desktop.addListener(onBreakpointChange); // Safari < 14
    }
  }

  /* 2. FILTERS
     Used for services (by audience) and the portfolio (by industry).
     Markup contract:
     - a container with [data-filter-group] holding buttons with [data-filter]
       and an optional data-filter-noun (for example "services" or "projects")
     - items with [data-audience] or [data-category]: "all" or a
       space-separated list of filter names
     - optional #filterStatus live region
     - optional buttons with [data-show-services="filter"] elsewhere on the
       page that apply a filter and scroll to #services */

  const filterGroup = $("[data-filter-group]");

  if (filterGroup) {
    const filterButtons = $$("[data-filter]", filterGroup);
    const items = $$("[data-audience], [data-category]");
    const filterStatus = $("#filterStatus");
    const noun = filterGroup.dataset.filterNoun || "items";
    const singularNoun = noun.replace(/s$/, "");

    const applyFilter = (name) => {
      const activeButton =
        filterButtons.find((button) => button.dataset.filter === name) ||
        filterButtons[0];

      if (!activeButton) return;

      const selected = activeButton.dataset.filter;

      filterButtons.forEach((button) => {
        const isActive = button === activeButton;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      let visibleCount = 0;

      items.forEach((item) => {
        const groups = (item.dataset.audience || item.dataset.category || "all")
          .split(/\s+/);
        const shouldShow =
          selected === "all" || groups.includes("all") || groups.includes(selected);

        item.hidden = !shouldShow;
        if (shouldShow) visibleCount += 1;
      });

      if (filterStatus) {
        const word = visibleCount === 1 ? singularNoun : noun;
        filterStatus.textContent =
          selected === "all"
            ? `Showing all ${visibleCount} ${word}.`
            : `Showing ${visibleCount} ${word} for ` +
              `${activeButton.textContent.trim()}.`;
      }
    };

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => applyFilter(button.dataset.filter));
    });

    $$("[data-show-services]").forEach((button) => {
      button.addEventListener("click", () => {
        applyFilter(button.dataset.showServices);

        const section = $("#services");
        const heading = $("#services-title");

        if (section) {
          section.scrollIntoView({
            behavior: prefersReducedMotion ? "auto" : "smooth",
            block: "start"
          });
        }

        // Move focus so keyboard and screen reader users land on the services.
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });
        }
      });
    });
  }

  /* 3. AUTOMATIC COPYRIGHT YEAR */

  const currentYear = $("#currentYear");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  /* 4. WHATSAPP LINKS
     Every .whatsapp-link starts as a "#contact" anchor (a safe fallback if
     JavaScript fails) and is upgraded to a wa.me link here. The number is
     read from the primary link in the contact section, and each link can
     carry its own pre-filled message in data-message. */

  const DEFAULT_MESSAGE =
    "Hello Synergy, I am interested in getting a professional website " +
    "for my business. I would like to discuss my project.";

  const primaryWhatsApp = $('.whatsapp-link[href^="https://wa.me/"]');
  const numberMatch = primaryWhatsApp
    ? primaryWhatsApp.getAttribute("href").match(/wa\.me\/(\d{8,15})/)
    : null;

  if (numberMatch) {
    const whatsappNumber = numberMatch[1];

    $$(".whatsapp-link").forEach((link) => {
      const message = link.dataset.message || DEFAULT_MESSAGE;

      link.href =
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const hint = document.createElement("span");
      hint.className = "sr-only";
      hint.textContent = " (opens in a new tab)";
      link.append(hint);
    });
  }

  /* 5. LEAD TRACKING (optional)
     Sends an event only if Google Analytics (gtag) is installed. */

  document.addEventListener("click", (event) => {
    const link = event.target.closest(".whatsapp-link, .email-link, .call-link");

    if (!link || typeof window.gtag !== "function") return;

    window.gtag("event", "generate_lead", {
      method: link.classList.contains("email-link")
        ? "email"
        : link.classList.contains("call-link")
          ? "phone"
          : "whatsapp",
      link_text: link.textContent
        .replace(/\(opens in a new tab\)/, "")
        .replace(/↗/g, "")
        .trim()
    });
  });

  /* 6. CONTACT FORM
     Sending: if the form has a data-endpoint (a form service such as
     Formspree or Getform), the message is posted there and delivered to
     your inbox. Without an endpoint, the visitor's email app opens with the
     message ready to send, so the form still works on a static site.
     Spam: the hidden "_gotcha" field is a honeypot that real visitors
     never fill in. */

  const contactForm = $("#contactForm");

  if (contactForm) {
    const formStatus = $("#formStatus");
    const submitButton = $('[type="submit"]', contactForm);
    const emailLink = $(".email-link");
    const toEmail = emailLink
      ? emailLink.getAttribute("href").replace(/^mailto:/, "")
      : "";

    // With JavaScript running, validation messages are handled below.
    // Without it, the browser's own validation still applies.
    contactForm.noValidate = true;

    const setStatus = (state, text) => {
      formStatus.dataset.state = state;
      formStatus.textContent = text;
    };

    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      contactForm.classList.add("was-validated");

      if (!contactForm.checkValidity()) {
        setStatus("error", "Please check the highlighted fields and try again.");
        contactForm.reportValidity();
        return;
      }

      // Read at submit time so the endpoint can be set or changed at any point.
      const endpoint = (contactForm.dataset.endpoint || "").trim();
      const data = new FormData(contactForm);
      const get = (name) => (data.get(name) || "").toString().trim();

      // Bots fill the hidden field; pretend it worked and send nothing.
      if (get("_gotcha")) {
        contactForm.reset();
        setStatus("success", "Thank you. Your message has been sent.");
        return;
      }

      if (endpoint) {
        submitButton.disabled = true;
        contactForm.setAttribute("aria-busy", "true");
        setStatus("info", "Sending your message...");

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            body: data,
            headers: { Accept: "application/json" }
          });

          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          contactForm.reset();
          contactForm.classList.remove("was-validated");
          setStatus(
            "success",
            "Thank you. Your message has been sent and we will get back to you."
          );
        } catch (error) {
          setStatus(
            "error",
            "Sorry, your message could not be sent. Please try again, or " +
              "reach us by WhatsApp, phone or email using the options above."
          );
        } finally {
          submitButton.disabled = false;
          contactForm.removeAttribute("aria-busy");
        }

        return;
      }

      // No endpoint configured: open the visitor's email app.
      const lines = [`Name: ${get("name")}`, `Email: ${get("email")}`];
      if (get("phone")) lines.push(`Phone: ${get("phone")}`);
      if (get("business")) lines.push(`Business type: ${get("business")}`);
      if (get("service")) lines.push(`Service: ${get("service")}`);
      lines.push("", get("message"));

      const subject = `Website enquiry from ${get("name")}`;

      window.location.href =
        `mailto:${toEmail}?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(lines.join("\n"))}`;

      setStatus(
        "info",
        "Your email app should open with your message ready to send. If it " +
          `does not, email us at ${toEmail} or use WhatsApp.`
      );
    });
  }

  /* 7. COPY BUTTONS
     <button data-copy="text" data-copy-label="Phone number">. Hidden when
     the browser cannot copy to the clipboard. */

  const copyButtons = $$("[data-copy]");

  if (copyButtons.length) {
    const copyStatus = $("#copyStatus");

    copyButtons.forEach((button) => {
      if (!navigator.clipboard || !window.isSecureContext) {
        button.hidden = true;
        return;
      }

      const originalText = button.textContent;

      button.addEventListener("click", async () => {
        let message;

        try {
          await navigator.clipboard.writeText(button.dataset.copy);
          button.textContent = "Copied \u2713";
          message = `${button.dataset.copyLabel || "Text"} copied.`;
        } catch (error) {
          message = "Copy failed. Please copy it manually.";
        }

        if (copyStatus) copyStatus.textContent = message;

        setTimeout(() => {
          button.textContent = originalText;
          if (copyStatus) copyStatus.textContent = "";
        }, 2000);
      });
    });
  }
})();
