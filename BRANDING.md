# Website logo kit and hero-boundary header

The new kit replaces the artwork used by the desktop header, collapsed navigation, footer, preloader, favicons and manifest. Supplied originals are retained unchanged. The emblem has proportionally resized 120px/240px/360px exports encoded as lossless WebP; no mark is redrawn or recolored. The dark-background primary logo is served from the 480px/960px PNG exports with native aspect ratios; those sized exports are smaller than the full-size lossless primary WebP. The compact header and preloader share the responsive dark-emblem candidates. Mobile can request a ~5KB icon instead of the supplied ~217KB full-size icon. Small supplied PNG favicon links avoid downloading the ~56KB ICO. The existing logo slot, header row height, navigation, page sections, calculator, Formspree form and scroll engine are preserved. Below the existing 1100px navigation breakpoint, the emblem avoids squeezing the Consulting subline into the small header.

`navigation/header.js` is compiled into the existing inline header-script location. It checks the real hero bottom (`getBoundingClientRect().bottom <= 0`), updating at most once per scroll frame. No viewport-distance or 30px cutoff is used. A ResizeObserver and resize handler cover actual hero geometry changes, including landscape heroes taller than the viewport. First setup and pageshow synchronize the state immediately before enabling the short backdrop transition. Setup is idempotent; pagehide disconnects the observer, cancels the frame and removes handlers.

The fixed header has no background, blur or shadow while the hero remains visible. After the hero has completely passed, a charcoal backdrop appears. Reverse scrolling removes it. Header height and document geometry do not change. The background-color transition uses the shared `headerBackdropDuration` and `cssEase` in `motion/motion.config.js`; reduced motion removes the transition. The mobile menu keeps its existing readable panel and keyboard behavior. The site's existing no-JavaScript fallback retains its static, dark navigation/menu so the light logo and links stay readable without the boundary script.

## Verification

The production build and `git diff --check` pass. No separate lint task is configured.

- All 42 responsive viewport cases in Chromium, Firefox and WebKit passed, including component overflow, header layout, calculator/workflows, normal/fast/reverse scrolling, anchors, resize, touch, live reduced motion and no-JavaScript navigation.
- Axe/keyboard accessibility checks passed desktop, tablet, mobile and 320px reflow, including mocked form success/failure and text spacing.
- The preloader suite passed all three engines at desktop, tablet, portrait and landscape sizes, including repeat visits, keyboard dismissal, reduced motion, unavailable storage, failed new logo asset, slow fonts and pagehide.
- The header suite covers 375×900, 820×900, 1440×900 and 844×390 in each engine: initial transparency, scroll past the old 30px trigger, near/exact hero boundaries, reversal, resize, actual saved-scroll results, deep-link initialization, repeated pagehide/pageshow, new logo loading/aspect ratios, menus and console diagnostics. It also checks normal-motion scrolling, immediate deep-link background and live reduced motion.
- Desktop/mobile header/footer screenshots were captured and inspected. These checks use browser engines and emulated viewports, not physical devices or browser-tab screenshots.

Tests are available as `npm run test:header`, `npm run test:responsive`, `npm run test:a11y` and `npm run test:preloader`. Configure Firefox/WebKit runtimes as documented in the main README. Generated screenshots are in `/workspace/.onboarding/lairdwell2/website-kit-check/`; full viewport and preloader artifacts are in the adjacent `website-kit-responsive/` and `website-kit-preloader/` directories.

Fresh Lighthouse on the production build: mobile Performance 94 / Accessibility 100 / CLS 0 after responsive icon optimization; desktop Performance 100 / Accessibility 100 / CLS 0. No Lighthouse run warnings. The original full-size icon delivery measured mobile Performance 77 and was corrected before commit. The final mobile report is `website-kit-check/lighthouse-mobile-final.json`; desktop is `website-kit-check/lighthouse-desktop.json` in the artifact root above.

## Modified files

`index.html`, `navigation/header.js`, `build.mjs`, `motion/motion.config.js`, new supplied assets and responsive emblem exports under `assets/brand/website-kit/`, `assets/brand/site.webmanifest`, `assets/brand/README.md`, `tests/header.mjs`, `tests/browser-helpers.mjs`, `tests/preloader.mjs`, `package.json`, and the branding/documentation links in `README.md` and `PRELOADER.md`.
