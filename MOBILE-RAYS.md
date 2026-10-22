# Mobile rays and process-card spacing

Mobile width and coarse/touch input no longer disable the sun-ray renderer. Supported GPUs use the existing SideRays shader, with a 180,000-pixel framebuffer budget and 24fps ceiling; desktop stays at 900,000 pixels / 30fps. Pointer tracking is disabled on mobile so scrolling/touching does not steer the rays. Mobile starts with the rays fully revealed, avoiding an initial dark dip when handing over from the still frame. Shader source, colors, speed and other appearance settings are unchanged.

The renderer still pauses offscreen and while the tab is hidden, tears down on pagehide, resumes after restoration, and stops for reduced motion. Firefox, software/unsupported GPUs and data-saving devices retain the lightweight static mode. Static mode now uses an actual frame of the original shader rather than a generic radial glow. The same frame is visible without JavaScript and under reduced motion. A failed/lost WebGL context also falls back to that frame. Poster files are only a few kilobytes each; there is no additional animation library.

`assets/hero/side-rays-mobile.webp` and `side-rays-desktop.webp` were captured directly from the actual WebGL draw buffer in WebKit, without page text, buttons, navigation or the contrast scrim. Both frames were composited onto the existing `#080b11` hero background to remove unnecessary alpha-channel noise; the desktop frame was proportionally resized. WebP output is approximately 2KB mobile / 3KB desktop. The existing hero scrim remains separate, preserving text legibility. Canvas visibility/background state prevents the still frame and live rays from being composited together.

For the first process card below 768px, `.story-flow-graphic` now sizes to its actual contents instead of the old fixed 210px height. Workflow nodes/connectors cannot shrink; a 28px bottom margin separates “Clear next action” from the heading. The card grows with its text instead of overlapping or clipping. Desktop card styling is unchanged.

## Verification

Production build and `git diff --check` pass. There is no configured lint command.

- `tests/rays.mjs` passed Chromium, Firefox and WebKit at 375×812, 430×932 and 844×390. WebKit exercised actual mobile WebGL (explicitly required in this environment), verified nonzero light pixels in the drawn framebuffer, the mobile pixel cap, pause/resume offscreen, and live reduced-motion changes. Chromium/Firefox exercised the still-ray fallback. Tests verified no JavaScript exceptions or horizontal overflow and at least 28px of card spacing at portrait widths.
- Reduced-motion and JavaScript-disabled checks verify a visible mobile still-ray background with the canvas hidden.
- Existing axe/keyboard/form/calculator/reflow checks passed desktop, tablet, mobile and 320px; these use mocked form responses and send no inquiries.
- Existing scrolling/navigation scenarios passed across the three engines. Actual physical phone performance and battery use remain device-dependent; 24fps is a ceiling, not a measured guarantee on all phones.

Artifacts: `/workspace/.onboarding/lairdwell2/mobile-rays-check/` and `mobile-rays-final/`. Source changes are in `index.html`; new static frames are in `assets/hero/`; regression coverage is `tests/rays.mjs` with `npm run test:rays`. README/package scripts and this note document the change.
