import { motion } from './motion.config.js';
const seen = new WeakSet();
export function reveals(gsap, ScrollTrigger, mobile, nativePanning) {
  const scope = gsap.context(() => {});
  const running = new Set();
  const finish = () => { for (const tween of running) tween.progress(1); };
  // Observer and batch callbacks run later; explicitly re-enter the owned context.
  const enter = elements => scope.add(() => {
    const targets = elements.filter(el => !seen.has(el) && el.getBoundingClientRect().bottom > 0);
    targets.forEach(el => seen.add(el));
    if (!targets.length) return;
    let tween;
    tween = gsap.from(targets, {
      ...(nativePanning ? { opacity: 0 } : { y: mobile ? motion.mobileRise : motion.rise }),
      duration: motion.duration, stagger: motion.stagger, ease: motion.ease,
      onComplete: () => {
        running.delete(tween);
        if (!nativePanning) targets.forEach(el => el.style.removeProperty('transform'));
      },
    });
    running.add(tween);
  });
  let observer;
  if (nativePanning) {
    observer = new IntersectionObserver(entries => {
      const entered = entries.filter(entry => entry.isIntersecting);
      entered.forEach(entry => observer.unobserve(entry.target));
      enter(entered.map(entry => entry.target));
    });
    document.querySelectorAll('[data-reveal]').forEach(el => { if (!seen.has(el)) observer.observe(el); });
  } else {
    // No hidden offscreen state: fast skips never strand unreadable content.
    scope.add(() => ScrollTrigger.batch([...document.querySelectorAll('[data-reveal]')].filter(el => !seen.has(el)), {
      start: motion.revealStart, once: true, interval: motion.batchInterval, onEnter: enter,
    }));
  }
  const quick = () => {
    if (!nativePanning && Math.abs(ScrollTrigger.getAll()[0]?.getVelocity() || 0) > motion.fastScroll) finish();
  };
  const visibility = () => { if (document.hidden) finish(); };
  window.addEventListener('scroll', quick, { passive: true });
  document.addEventListener('focusin', finish);
  document.addEventListener('visibilitychange', visibility);
  return () => {
    observer?.disconnect();
    finish(); scope.revert(); running.clear();
    window.removeEventListener('scroll', quick);
    document.removeEventListener('focusin', finish);
    document.removeEventListener('visibilitychange', visibility);
  };
}
