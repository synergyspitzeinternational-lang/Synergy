/* =========================================
   SYNERGY WEBSITE
   Main JavaScript: script.js
   -----------------------------------------
   Contact details live in index.html only:
   - WhatsApp number: the wa.me link inside #contact
   - Email address:   the mailto link inside #contact
   This file reads them, so nothing is duplicated here.
========================================= */

(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  /* 1. MOBILE NAVIGATION */

  const menuToggle = $("#menuToggle");
  const navMenu = $("#navMenu");

  if (menuToggle && navMenu) {
    const isOpen = () => navMenu.classList.contains("open");

    const setMenu = (open, { returnFocus = false } = {}) => {
      navMenu.classList.toggle("open", open);
      menuToggle.classList.toggle("active", open);
      // The button keeps one constant label; aria-expanded carries the state.
      menuToggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);

      if (!open && returnFocus) menuToggle.focus();
    };

    menuToggle.addEventListener("click", () => setMenu(!isOpen()));

    // Close after choosing a link.
    navMenu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });

    // Close on Escape and hand focus back to the toggle button.
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) {
        setMenu(false, { returnFocus: true });
      }
    });

    // Close when clicking or tapping outside the menu.
    document.addEventListener("click", (event) => {
      if (
        isOpen() &&
        !navMenu.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        setMenu(false);
      }
    });

    // Close when the viewport grows to desktop width. matchMedia mirrors the
    // CSS breakpoint (max-width: 760px) and avoids a constantly firing
    // resize listener.
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

  /* 2. PORTFOLIO FILTERS */

  const filterButtons = $$(".filter-btn");
  const portfolioCards = $$(".portfolio-card");
  const filterStatus = $("#filterStatus");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedFilter = button.dataset.filter;

      filterButtons.forEach((filterButton) => {
        const isActive = filterButton === button;
        filterButton.classList.toggle("active", isActive);
        filterButton.setAttribute("aria-pressed", String(isActive));
      });

      let visibleCount = 0;

      portfolioCards.forEach((card) => {
        const shouldShow =
          selectedFilter === "all" || card.dataset.category === selectedFilter;

        card.hidden = !shouldShow;
        if (shouldShow) visibleCount += 1;
      });

      // Tell screen reader users what changed.
      if (filterStatus) {
        const noun = visibleCount === 1 ? "concept" : "concepts";
        const scope =
          selectedFilter === "all" ? "" : ` in ${button.textContent.trim()}`;
        filterStatus.textContent = `Showing ${visibleCount} ${noun}${scope}.`;
      }
    });
  });

  /* 3. AUTOMATIC COPYRIGHT YEAR */

  const currentYear = $("#currentYear");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  /* 4. WHATSAPP LINKS
     Every .whatsapp-link starts as a plain "#contact" anchor (a safe
     fallback if JavaScript fails). Here it is upgraded to a wa.me link.
     The number is read from the primary link in the contact section, and
     each link can carry its own pre-filled message via data-message. */

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

      // Let screen reader users know the link opens a new tab.
      const hint = document.createElement("span");
      hint.className = "sr-only";
      hint.textContent = " (opens in a new tab)";
      link.append(hint);
    });
  }

  /* 5. LEAD TRACKING (optional)
     Sends an event only if Google Analytics (gtag) is installed. */

  document.addEventListener("click", (event) => {
    const link = event.target.closest(".whatsapp-link, .email-link");

    if (!link || typeof window.gtag !== "function") return;

    window.gtag("event", "generate_lead", {
      method: link.classList.contains("email-link") ? "email" : "whatsapp",
      link_text: link.textContent
        .replace(/\(opens in a new tab\)/, "")
        .replace(/↗/g, "")
        .trim()
    });
  });
})();
