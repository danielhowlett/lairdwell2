// Seconds and CSS pixels; heroRise uses percent and fastScroll uses pixels/second.
export const motion = Object.freeze({
  ease: 'power3.out', scrubEase: 'none', depthStart: 'top bottom', depthEnd: 'bottom top', duration: .7, heroDuration: .8, stagger: .08,
  rise: 32, mobileRise: 16, heroRise: 100, depth: 18,
  revealStart: 'top 85%', batchInterval: .08, fastScroll: 1800,
  lerp: .1, anchorDuration: .75, heroFollow: .16,
});
