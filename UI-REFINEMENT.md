# UI and responsive refinement

The existing Lairdwell design, copy, palette, Workflow Studio and Impact Dashboard are retained. This pass refines their behavior and responsive layout.

## Changes and findings

- **Hero:** “Work, made simpler.” stays on one line at 1024, 1280, 1440, 1920 and 2560px using fluid typography and the full content width. Smaller screens can wrap naturally. Removed the rectangular text background; a continuous full-hero scrim keeps contrast independent of the rays. Content height is flexible, with stable viewport sizing and safe-area padding.
- **SideRays:** the entire script is byte-for-byte identical to the pre-refinement version, including shader settings and existing render budgets. SHA-256: `67e84966b2667acf39a98821a7e9313214f5cd7d9f0f0f663427f8a6e695c71b`. A live desktop Chromium check initialized WebGL2 at 1200×750 pixels with no WebGL error or uncaught page error. Existing mobile, reduced-motion and low-power fallbacks remain.
- **Scrolling:** removed dynamically enabled document snapping, which could trigger re-snapping while scrolling. Story links still smoothly align each card beneath the header. Measured cards no longer transform during scroll, preventing geometry feedback. Stage changes and the continuous progress bar use one scheduled frame and read geometry before writing styles. Offscreen story sections do not process each scroll event.
- **Animation timing:** retained restrained one-shot reveals with 12px transforms, 420ms timing and small grouped delays. Fast scrolling finishes offscreen reveals; reversing does not hide content. Reduced-motion changes finish reveals and stop in-flight smooth navigation. No parallax or scrolling library was introduced.
- **Responsive layouts:** corrected tablet service-card overflow, story-link overflow, short-height sticky sidebars, mobile navigation state after resizing, and shared header/anchor offsets. The story stacks below 1100px and drops sticky positioning on short screens. Contact fields use 16px text to avoid mobile focus zoom. Navigation and the hero account for safe-area insets.
- **Workflow Studio:** caption space is measured against all three descriptions at the actual width and remeasured after font loading/resizing, preventing section-height changes when switching views. Diagram labels wrap within their nodes.
- **Impact Dashboard:** its largest supported estimate ($6,480,000) scales to fit narrow cards. Number fields retain keyboard controls, and hours/results no longer collide with the ring. Existing calculations and disclosures are unchanged.
- **Assets and maintenance:** Inter is bundled locally as fingerprinted variable WOFF2 subsets with its SIL Open Font License. The build preloads Latin, copies assets and provides immutable font-cache headers. Replaced unsupported decorative symbol glyphs with inline SVG. Removed unused alternative-layout CSS and consolidated hero/responsive rules. No dependencies were added.
- **Fallbacks:** content and default estimates remain readable without JavaScript or WebGL. Mobile section navigation is visible without JavaScript, and native form validation remains available.

## Validation performed

The production build passed the following, with local Inter loaded:

| Browser | Viewport matrix | Additional interactions |
|---|---|---|
| Chromium | All 14 cases below | Native touch drag, touch taps, scrolling and fallback checks |
| Firefox | All 14 cases below | Touch-enabled taps, scrolling and fallback checks |
| WebKit | All 14 cases below | Touch-enabled taps, scrolling and fallback checks |

Widths/heights: **320×740, 360×800, 375×812, 390×844, 430×932, 768×1024, 820×1180, 1024×768, 1280×800, 1440×900, 1920×1080, 2560×1440, 844×390 and 1024×600**.

Checks include text/component overflow, navigation bounds, headline wrapping, all workflow views without height changes, maximum calculator output, story alignment, sticky-sidebar fit, keyboard step selection, slow/smooth and rapid/reverse scrolling, no delayed scroll jumps, every primary section anchor, resizing an open menu, live reduced-motion changes, touch interactions, landscape rotation and no-JavaScript content/navigation. Desktop/mobile screenshots were inspected across engines. The automated accessibility and keyboard suite passed at desktop, tablet, mobile and 320px widths, including mocked contact success/failure states.

A conservative hero contrast check replaced the rays with a solid white background. Across seven mobile/desktop widths, the headline remained at least **4.19:1** (large-text requirement 3:1), and supporting text at least **4.65:1** (normal-text requirement 4.5:1).

A single mobile Lighthouse run against the current local production build returned **98/100 performance**, **1.8s FCP**, **1.9s LCP**, **0ms total blocking time** and **0 layout shift**, with no run warnings. HTML transfer size is approximately **33.2 KiB gzip / 28.3 KiB Brotli**, essentially unchanged from before the refinement. The English page loads one local Latin variable font; the extended subset is fetched only when needed. These are local lab measurements, not production field Core Web Vitals or an INP measurement.

## Reproduction and limits

Run `npm run test:a11y` and `npm run test:responsive`; see README for installing the three browser runtimes. The suite writes screenshots and JSON to `.test-artifacts/` by default. `TEST_SCENARIOS_ONLY=1` reruns motion/touch/fallback scenarios without repeating the viewport matrix.

Cloud browser runtimes required writable XDG directories and locally staged Debian libraries; WebKit uses a launcher that includes those libraries, and Firefox uses a container-specific content-sandbox accommodation. No TLS, artifact checksum or package-signature verification was disabled. These environment-specific details are not production application requirements.

Headless Chromium/Firefox/WebKit and emulated touch do not replace physical iOS/Android checks or a screen-reader walkthrough. The retained SideRays effect has its existing 30fps render cap; this pass does not claim sustained 60fps on physical GPUs. Production CDN compression/cache headers and field metrics still need verification after deployment. The real contact backend and privacy notice remain separate launch requirements; automated form responses are mocked and send no inquiries.
