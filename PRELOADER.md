# Branded first-visit intro

The later website logo kit changes the active emblem to responsive `assets/brand/website-kit/lairdwell_icon_dark_{120,240,360}.webp` candidates; timing and behavior are preserved. See [BRANDING.md](BRANDING.md) for current artwork and verification. Historical Lighthouse numbers below describe the original intro implementation.

The supplied L/W symbol appears on the existing charcoal background, fades/scales from 0.96 to 1 over 0.5 seconds, then the overlay fades away over 0.3 seconds. There is no hold period. The logo reveal and critical readiness run concurrently; readiness checks only parsed homepage markup, the header logo and the hero font. Lazy footer content and the WebGL decoration do not delay dismissal. The optional flying-logo transition was deliberately omitted to preserve the navigation and keep the transition quiet.

The overlay never locks scrolling, receives pointer events, or contains focusable controls. It is inert and decorative for assistive technology; page content stays accessible underneath. Keyboard, pointer, wheel/scroll interaction and pagehide immediately dismiss it. It also dismisses when the tab becomes hidden or reduced motion is enabled. All listeners, animations and the timeout are cleaned up. No new dependency was installed; native Web Animations provides the isolated two-effect intro, with settings imported from the existing shared motion config.

Session storage skips subsequent navigations. Refresh/back-forward restoration, deep links, reduced motion and unavailable storage skip the intro immediately. Without JavaScript, the overlay exists only in an inert HTML template and is never inserted. Failed assets dismiss it; a 1.5-second JS deadline and independent CSS visibility fallback prevent a stalled overlay from covering the page.

To see it again, use a new private browsing session and navigate directly to the homepage. Refresh intentionally skips it. For development, remove `lairdwell-intro-seen` from session storage and navigate to the homepage rather than reloading. To disable the component, remove the `<!-- preloader:bootstrap -->` marker from `index.html` and rebuild; the remaining template and scoped styles do nothing by themselves.

## Changed files

- `preloader/index.js`: isolated bootstrap, critical readiness, animation and cleanup.
- `index.html`: inert template and scoped overlay styles; existing sections are untouched.
- `build.mjs`: inline the small bootstrap before first paint, independently of the existing scroll bundle.
- `motion/motion.config.js`: shared intro durations, scale, easing and maximum lifetime.
- `assets/brand/lairdwell-icon-dark.svg`, `assets/brand/README.md`: unchanged supplied artwork and provenance.
- `tests/preloader.mjs`, `package.json`: `npm run test:preloader` and regression coverage.
- `MOTION_PLAN.md`: link from the earlier motion audit to this subsequent authorized feature.
- `PRELOADER.md`: implementation and verification notes.

The immediately preceding branding commit also replaced header/footer artwork, added the supplied favicon set, removed the all-caps footer watermark, and adjusted existing accessibility/server test helpers for image logos.

## Verification

`npm run build` and `git diff --check` pass. No separate lint command is configured. The preloader tests pass Chromium, Firefox and WebKit at 1440×900, 820×1180, 375×812 and 844×390: centering, supplied asset loading, first visit, refresh/session skip, reduced motion, JavaScript disabled, unavailable storage, deep links, keyboard dismissal/focus, live preference changes, failed logo, stalled fonts and pagehide. Desktop/mobile screenshots were captured and inspected. These are browser-engine tests, not a claim of testing physical iOS hardware.

Existing accessibility checks pass desktop/tablet/mobile/320px, including calculator outputs, keyboard navigation, text-spacing reflow and mocked contact outcomes. Existing normal/fast/reverse scrolling, touch scrolling, anchors, responsive navigation, live reduced motion and no-JavaScript scenarios pass all three engines. The full 42-case responsive matrix passed the preceding logo change; the isolated overlay's four viewport sizes were tested across all engines after adding the intro.

Fresh-session Lighthouse 12 on the production build: desktop Performance 100, Accessibility 100, CLS 0; mobile Performance 91, Accessibility 100, CLS 0. Both reports have no Lighthouse run warnings. Full reports/screenshots are in `/workspace/.onboarding/lairdwell2/preloader-check/`. The earlier pre-preloader motion audit recorded mobile Performance 95; keep this distinction when comparing reports.
