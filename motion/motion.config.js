// Seconds and CSS pixels; heroRise uses percent and fastScroll uses pixels/second.
export const motion = Object.freeze({
  ease: 'power3.out', scrubEase: 'none', depthStart: 'top bottom', depthEnd: 'bottom top', duration: .7, heroDuration: .8, stagger: .08,
  rise: 32, mobileRise: 16, heroRise: 100, depth: 18,
  revealStart: 'top 85%', batchInterval: .08, fastScroll: 1800,
  // CSS ease-out curve for the dependency-free intro.
  cssEase: 'cubic-bezier(.215,.61,.355,1)',
  preloaderReveal: .5, preloaderExit: .3, preloaderScale: .96, preloaderMaxWait: 1.5,
  lerp: .1, anchorDuration: .75, heroFollow: .16,
});
