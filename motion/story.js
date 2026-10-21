import { motion } from './motion.config.js';
export function story(gsap, ScrollTrigger, reduced, nativePanning) {
  const cards = [...document.querySelectorAll('[data-story-frame]')];
  const labels = [...document.querySelectorAll('[data-step-label]')];
  const bar = document.getElementById('story-progress-fill');
  const number = document.getElementById('story-current-number');
  let frame = 0;
  const update = () => {
    frame = 0;
    const focus = 80 + Math.max(0, innerHeight - 80) * .42;
    const anchors = cards.map(el => { const r = el.getBoundingClientRect(); return r.top + Math.min(r.height / 2, 240); });
    const active = anchors.reduce((best, y, i) => Math.abs(y - focus) < Math.abs(anchors[best] - focus) ? i : best, 0);
    cards.forEach((el, i) => el.classList.toggle('is-current', i === active));
    labels.forEach((el, i) => {
      el.classList.toggle('is-current', i === active);
      if (i === active) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
    });
    number.textContent = String(active + 1).padStart(2, '0');
    const progress = reduced || nativePanning ? (active + 1) / cards.length : (1 + Math.min(1, Math.max(0, (focus - anchors[0]) / (anchors.at(-1) - anchors[0]))) * (cards.length - 1)) / cards.length;
    bar.style.transform = `scaleX(${progress})`;
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const observer = nativePanning ? new IntersectionObserver(schedule, { rootMargin: '-35% 0px -35% 0px' }) : null;
  if (observer) cards.forEach(card => observer.observe(card));
  else window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
  return () => { cancelAnimationFrame(frame); observer?.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
}
export function depth(gsap) {
  // Only decoration moves. Keeping article geometry stable prevents active-step feedback loops.
  document.querySelectorAll('[data-parallax]').forEach(el => gsap.fromTo(el,
    { y: -motion.depth }, { y: motion.depth, ease: motion.scrubEase, scrollTrigger: {
      trigger: el.closest('[data-story-frame]'), start: motion.depthStart, end: motion.depthEnd, scrub: true,
    } }));
}
