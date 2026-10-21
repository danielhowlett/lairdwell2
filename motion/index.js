import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { smoothScroll } from './smoothScroll.js';
import { hero } from './hero.js';
import { reveals } from './reveals.js';
import { story, depth } from './story.js';
const nativePanning = CSS.supports('-moz-appearance', 'none');
gsap.registerPlugin(SplitText);
if (!nativePanning) gsap.registerPlugin(ScrollTrigger);
let owner;
function setup() {
  if (owner) return;
  const context = gsap.context(() => {});
  const media = gsap.matchMedia();
  context.add(() => media.add({ reduced: '(prefers-reduced-motion: reduce)', desktop: '(min-width: 768px)', fine: '(pointer: fine)' }, ({ conditions }) => {
    const { reduced, desktop, fine } = conditions;
    // Gecko's asynchronous panning warns about JS-driven scroll positioning.
    // Preserve its native scrolling/depth rather than fight the compositor.

    const cleanups = [story(gsap, ScrollTrigger, reduced || !desktop, nativePanning)];
    if (!reduced) {
      cleanups.push(hero(gsap, nativePanning), reveals(gsap, ScrollTrigger, !desktop, nativePanning));
      if (desktop && !nativePanning) depth(gsap);
      if (desktop && fine && !nativePanning) cleanups.push(smoothScroll(gsap, ScrollTrigger));
    }
    return () => cleanups.reverse().forEach(cleanup => cleanup());
  }));
  const refresh = () => { if (owner && !nativePanning) ScrollTrigger.refresh(); };
  window.addEventListener('load', refresh);
  document.fonts.ready.then(refresh);
  const images = [...document.images];
  images.forEach(image => image.addEventListener('load', refresh));
  owner = () => {
    window.removeEventListener('load', refresh);
    images.forEach(image => image.removeEventListener('load', refresh));
    media.revert(); context.revert(); owner = null;
  };
}
window.addEventListener('pagehide', () => owner?.());
window.addEventListener('pageshow', setup);
setup();
