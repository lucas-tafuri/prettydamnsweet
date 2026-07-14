/**
 * Egnis-style scroll text animation:
 * - Split headings into characters
 * - Scrub opacity + scaleY as the block scrolls through the viewport
 * - Soft fade/slide-up for supporting elements
 * - Hero letter entrance on load
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const REDUCED =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function splitChars(el: HTMLElement) {
  if (el.dataset.splitDone === "1") return;
  const text = el.textContent ?? "";
  el.setAttribute("aria-label", text.trim());
  el.innerHTML = "";
  el.classList.add("split-ready");

  // Preserve words so wrapping still works
  const words = text.split(/(\s+)/);
  for (const word of words) {
    if (/^\s+$/.test(word)) {
      el.appendChild(document.createTextNode(word));
      continue;
    }
    const wordEl = document.createElement("span");
    wordEl.className = "split-word";
    wordEl.setAttribute("aria-hidden", "true");
    for (const char of word) {
      const charEl = document.createElement("span");
      charEl.className = "split-char";
      charEl.textContent = char;
      charEl.setAttribute("aria-hidden", "true");
      wordEl.appendChild(charEl);
    }
    el.appendChild(wordEl);
  }
  el.dataset.splitDone = "1";
}

function animateChars(el: HTMLElement) {
  splitChars(el);
  const chars = el.querySelectorAll<HTMLElement>(".split-char");
  if (!chars.length) return;

  gsap.set(chars, { opacity: 0, scaleY: 1.1, transformOrigin: "50% 100%" });

  gsap.to(chars, {
    opacity: 1,
    scaleY: 1,
    ease: "none",
    stagger: { amount: 0.55 },
    scrollTrigger: {
      trigger: el,
      start: "top 92%",
      end: "top 35%",
      scrub: true,
    },
  });
}

/** Egnis work-widget-left: meta blocks slide in from the left, staggered */
function animateLeft(el: HTMLElement) {
  const blocks = el.querySelectorAll<HTMLElement>("[data-left-item]");
  const targets = blocks.length ? Array.from(blocks) : [el];
  gsap.fromTo(
    targets,
    { opacity: 0, x: -50 },
    {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: "power2.out",
      stagger: 0.12,
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    }
  );
}

/** Egnis work-widget-right: media un-blurs while sliding up */
function animateMedia(el: HTMLElement) {
  gsap.fromTo(
    el,
    { opacity: 0, y: 50, filter: "blur(5px)" },
    {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none none",
      },
      clearProps: "filter",
    }
  );
}

function animateIn(el: HTMLElement) {
  const y = el.dataset.animateY ? Number(el.dataset.animateY) : 28;
  gsap.fromTo(
    el,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration: 0.85,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        toggleActions: "play none none none",
      },
    }
  );
}

/** Hero-style letter slide-up on load (matches Egnis banner headings) */
function animateHero() {
  const lines = document.querySelectorAll<HTMLElement>("[data-hero-split]");
  lines.forEach((el, i) => {
    splitChars(el);
    const chars = el.querySelectorAll<HTMLElement>(".split-char");
    gsap.fromTo(
      chars,
      { yPercent: i % 2 === 0 ? -110 : 110, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.7,
        ease: "power3.out",
        stagger: { amount: 0.4 },
        delay: 0.15 + i * 0.08,
      }
    );
  });
}

function init() {
  if (REDUCED) return;

  animateHero();

  document
    .querySelectorAll<HTMLElement>('[data-split="chars"]')
    .forEach(animateChars);

  document
    .querySelectorAll<HTMLElement>('[data-animate="fade"]')
    .forEach(animateIn);

  document
    .querySelectorAll<HTMLElement>('[data-animate="left"]')
    .forEach(animateLeft);

  document
    .querySelectorAll<HTMLElement>('[data-animate="media"]')
    .forEach(animateMedia);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
