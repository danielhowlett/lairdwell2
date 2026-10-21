import { SplitText } from 'gsap/SplitText';
import { motion } from './motion.config.js';
let played = false;
export function hero(gsap, nativePanning) {
  const title = document.querySelector('[data-motion-hero]');
  const split = SplitText.create(title, { type: 'words', mask: 'words', aria: 'auto' });
  const timeline = gsap.timeline({ defaults: { ease: motion.ease, duration: motion.duration } });
  timeline.from(split.words, { yPercent: motion.heroRise, duration: motion.heroDuration, stagger: motion.stagger });
  timeline.from('[data-hero-follow]', { y: motion.mobileRise, opacity: 0, stagger: motion.stagger }, `-=${motion.heroFollow}`);
  if (played || location.hash) timeline.progress(1);
  played = true;
  const finish = () => timeline.progress(1);
  // Never leave text masked when focus, a hash jump, or fast scrolling skips the entrance.
  const detach = () => {
    window.removeEventListener('scroll', finish);
    document.removeEventListener('focusin', finish);
  };
  timeline.eventCallback('onComplete', detach);
  if (timeline.progress() < 1) {
    if (!nativePanning) window.addEventListener('scroll', finish, { once: true, passive: true });
    document.addEventListener('focusin', finish);
  }
  return () => {
    window.removeEventListener('scroll', finish);
    document.removeEventListener('focusin', finish);
    timeline.kill();
    split.revert();
  };
}
