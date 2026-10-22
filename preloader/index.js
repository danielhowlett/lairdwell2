import { motion } from '../motion/motion.config.js';

// Inline at the start of <body>: independent of the scroll bundle and its lifecycle.
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const navigation = performance.getEntriesByType('navigation')[0];
  if (preference.matches || location.hash || scrollY > 0 || navigation?.type === 'reload' || navigation?.type === 'back_forward') return;
  try {
    if (sessionStorage.getItem('lairdwell-intro-seen')) return;
    sessionStorage.setItem('lairdwell-intro-seen', '1');
  } catch { return; } // Storage unavailable: keep the page immediate rather than replay on every visit.

  let overlay, deadline, reveal, exit, dismissed = false;
  const interactions = ['pointerdown', 'keydown', 'wheel', 'scroll', 'pagehide'];
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(deadline);
    reveal?.cancel(); exit?.cancel();
    overlay?.remove();
    interactions.forEach(type => window.removeEventListener(type, dismiss, true));
    preference.removeEventListener('change', change);
    document.removeEventListener('visibilitychange', visibility);
  };
  const change = () => { if (preference.matches) dismiss(); };
  const visibility = () => { if (document.hidden) dismiss(); };
  const run = async () => {
    const template = document.getElementById('brand-preloader-template');
    if (!template || !Element.prototype.animate) return;
    overlay = template.content.firstElementChild.cloneNode(true);
    overlay.style.setProperty('--preloader-max', `${motion.preloaderMaxWait}s`);
    document.body.append(overlay);
    deadline = setTimeout(dismiss, motion.preloaderMaxWait * 1000);
    interactions.forEach(type => window.addEventListener(type, dismiss, { capture: true, passive: true }));
    preference.addEventListener('change', change);
    document.addEventListener('visibilitychange', visibility);

    const domReady = document.readyState === 'loading'
      ? new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }))
      : Promise.resolve();
    // Only the header logo and hero's font matter here; never wait for the lazy footer or shader.
    const critical = domReady.then(() => Promise.all([
      document.querySelector('#navbar img')?.decode(),
      document.fonts?.load('350 48px Inter'),
    ]));
    const logo = overlay.querySelector('img');
    // Attach rejection handlers immediately, even if the independent logo request is slow.
    const logoReady = logo.decode();
    const ready = Promise.all([critical, logoReady]).then(() => true, () => { dismiss(); return false; });
    await logoReady;
    if (dismissed) return;
    reveal = logo.animate([
      { opacity: 0, transform: `scale(${motion.preloaderScale})` },
      { opacity: 1, transform: 'scale(1)' },
    ], { duration: motion.preloaderReveal * 1000, easing: motion.cssEase, fill: 'both' });
    await Promise.all([ready, reveal.finished]);
    if (dismissed) return;
    exit = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: motion.preloaderExit * 1000, easing: motion.cssEase, fill: 'forwards',
    });
    await exit.finished;
    dismiss();
  };
  run().catch(dismiss);
})();
