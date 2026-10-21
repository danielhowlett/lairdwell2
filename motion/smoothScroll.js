import Lenis from 'lenis';
import { motion } from './motion.config.js';
export function smoothScroll(gsap, ScrollTrigger) {
  const lenis = new Lenis({ lerp: motion.lerp, smoothWheel: true, syncTouch: false, autoRaf: false,
    prevent: node => Boolean(node.closest('#mobile-menu, textarea, select, [data-lenis-prevent]')),
  });
  const update = () => ScrollTrigger.update();
  const tick = time => lenis.raf(time * 1000);
  lenis.on('scroll', update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  document.documentElement.classList.add('motion-smooth');
  const anchor = event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    target.setAttribute('tabindex', target.getAttribute('tabindex') || '-1');
    target.focus({ preventScroll: true });
    // Respect the same fixed-header clearance as native anchor navigation.
    const offset = -(parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + parseFloat(getComputedStyle(target).scrollMarginTop || 0));
    history.pushState(null, '', link.hash);
    lenis.resize();
    const destination = target.getBoundingClientRect().top + scrollY + offset;
    lenis.scrollTo(scrollY, { immediate: true });
    lenis.scrollTo(destination, { duration: motion.anchorDuration, easing: gsap.parseEase(motion.ease) });
  };
  const keyboard = event => {
    if (['Tab', 'Home', 'End', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
      // Let browser focus scrolling take precedence over an outstanding wheel interpolation.
      lenis.scrollTo(scrollY, { immediate: true });
    }
  };
  document.addEventListener('click', anchor);
  document.addEventListener('keydown', keyboard);
  return () => {
    document.removeEventListener('click', anchor);
    document.removeEventListener('keydown', keyboard);
    gsap.ticker.remove(tick);
    lenis.off('scroll', update);
    lenis.destroy();
    document.documentElement.classList.remove('motion-smooth');
    window.scrollTo({ top: scrollY, behavior: 'instant' });
  };
}
