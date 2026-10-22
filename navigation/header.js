import { motion } from '../motion/motion.config.js';

(() => {
  const navbar = document.getElementById('navbar');
  const hero = document.getElementById('home');
  if (!navbar || !hero) return;
  navbar.style.setProperty('--header-backdrop-duration', `${motion.headerBackdropDuration}s`);
  navbar.style.setProperty('--header-backdrop-ease', motion.cssEase);
  let cleanup, synchronize;
  const setup = () => {
    if (cleanup) { synchronize(); return; }
    let frame = 0, previous;
    const update = () => {
      frame = 0;
      // The actual hero boundary, not distance travelled or the header's own height.
      const past = hero.getBoundingClientRect().bottom <= 0;
      if (past === previous) return;
      previous = past;
      navbar.classList.toggle('is-past-hero', past);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(hero);
    cleanup = () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cleanup = null;
    };
    // Establish the initial/restored state without fading through a transparent header.
    synchronize = () => {
      cancelAnimationFrame(frame);
      navbar.classList.remove('is-header-ready');
      update();
      void getComputedStyle(navbar).backgroundColor;
      navbar.classList.add('is-header-ready');
    };
    synchronize();
  };
  window.addEventListener('pagehide', () => cleanup?.());
  window.addEventListener('pageshow', setup);
  setup();
})();
