/**
 * Egnis-style cursor-follow CTA on project media:
 * frosted glass "View project" button tracks the pointer while hovering.
 */
const REDUCED =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const COARSE =
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;

function bindFrame(frame: HTMLElement) {
  const btn = frame.querySelector<HTMLElement>("[data-cursor-btn]");
  if (!btn) return;

  // Touch / reduced-motion: keep centered reveal, no tracking
  if (REDUCED || COARSE) {
    frame.classList.add("media-frame--static-cta");
    return;
  }

  let raf = 0;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  const apply = () => {
    btn.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
  };

  const tick = () => {
    currentX += (targetX - currentX) * 0.2;
    currentY += (targetY - currentY) * 0.2;
    apply();
    if (
      Math.abs(targetX - currentX) > 0.15 ||
      Math.abs(targetY - currentY) > 0.15
    ) {
      raf = requestAnimationFrame(tick);
    } else {
      currentX = targetX;
      currentY = targetY;
      apply();
      raf = 0;
    }
  };

  const setFromEvent = (e: MouseEvent, snap = false) => {
    const rect = frame.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
    if (snap) {
      currentX = targetX;
      currentY = targetY;
      apply();
    } else if (!raf) {
      raf = requestAnimationFrame(tick);
    }
  };

  frame.addEventListener("mouseenter", (e) => {
    frame.classList.add("is-hover");
    setFromEvent(e, true);
  });

  frame.addEventListener("mousemove", (e) => {
    setFromEvent(e);
  });

  frame.addEventListener("mouseleave", () => {
    frame.classList.remove("is-hover");
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
}

function init() {
  document
    .querySelectorAll<HTMLElement>("[data-cursor-media]")
    .forEach(bindFrame);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
