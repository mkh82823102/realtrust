const leadForm = document.querySelector("[data-lead-form]");
const successMessage = document.querySelector("[data-success-message]");
const newsletterForm = document.querySelector("[data-newsletter-form]");
const themeToggle = document.querySelector("[data-theme-toggle]");
const sliderRoots = document.querySelectorAll("[data-slider]");

const THEME_STORAGE_KEY = "realtrust-theme";

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  if (!themeToggle) return;

  const isDark = theme === "dark";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light theme" : "Switch to dark theme"
  );
}

function getCurrentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

applyTheme(getCurrentTheme());

themeToggle?.addEventListener("click", () => {
  const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
  applyTheme(nextTheme);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch (error) {
    // The selected theme still works for the current page even if storage is unavailable.
  }
});

leadForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  successMessage?.classList.add("lead-form__success--visible");
  leadForm.reset();
});

newsletterForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  newsletterForm.reset();
});

function setupSlider(slider) {
  const viewport = slider.querySelector("[data-slider-viewport]");
  const track = slider.querySelector("[data-slider-track]");
  const previousButton = slider.querySelector("[data-slider-prev]");
  const nextButton = slider.querySelector("[data-slider-next]");

  if (!viewport || !track || !previousButton || !nextButton) return;

  const getStep = () => {
    const firstSlide = track.firstElementChild;
    if (!firstSlide) return viewport.clientWidth;

    const trackStyles = window.getComputedStyle(track);
    const gap = Number.parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;

    return firstSlide.getBoundingClientRect().width + gap;
  };

  const updateControls = () => {
    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
    const atStart = viewport.scrollLeft <= 2;
    const atEnd = viewport.scrollLeft >= maxScrollLeft - 2;

    previousButton.disabled = atStart;
    nextButton.disabled = atEnd;
  };

  const move = (direction) => {
    viewport.scrollBy({
      left: getStep() * direction,
      behavior: "smooth"
    });
  };

  previousButton.addEventListener("click", () => move(-1));
  nextButton.addEventListener("click", () => move(1));
  let controlsFrame = 0;
  const scheduleControlUpdate = () => {
    if (controlsFrame) return;
    controlsFrame = window.requestAnimationFrame(() => {
      controlsFrame = 0;
      updateControls();
    });
  };

  viewport.addEventListener("scroll", scheduleControlUpdate, { passive: true });
  window.addEventListener("resize", scheduleControlUpdate, { passive: true });

  updateControls();
}

function initLazyImages() {
  const images = document.querySelectorAll("img[data-lazy-src]");
  if (!images.length) return;

  const loadImage = (image) => {
    const source = image.dataset.lazySrc;
    if (!source) return;

    image.addEventListener("load", () => {
      image.classList.add("lazy-image--loaded");
    }, { once: true });

    image.src = source;
    image.removeAttribute("data-lazy-src");
  };

  if (!("IntersectionObserver" in window)) {
    images.forEach(loadImage);
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      loadImage(entry.target);
      currentObserver.unobserve(entry.target);
    });
  }, { rootMargin: "220px 0px" });

  images.forEach((image) => observer.observe(image));
}

function runWhenIdle(callback) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 800 });
  } else {
    window.setTimeout(callback, 1);
  }
}

initLazyImages();
runWhenIdle(() => sliderRoots.forEach(setupSlider));

runWhenIdle(() => {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
});

// Mobile hamburger navigation
const header = document.querySelector(".header");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileNav = document.querySelector("[data-mobile-nav]");

function setMobileMenu(open) {
  if (!header || !menuToggle) return;
  header.classList.toggle("header--menu-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
}

menuToggle?.addEventListener("click", () => {
  setMobileMenu(!header?.classList.contains("header--menu-open"));
});

mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMobileMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMobileMenu(false);
});

document.addEventListener("click", (event) => {
  if (!header?.classList.contains("header--menu-open")) return;
  if (header.contains(event.target)) return;
  setMobileMenu(false);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 768) setMobileMenu(false);
}, { passive: true });
