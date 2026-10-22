# Lairdwell motion plan

## Site and baseline
One page, authored HTML/CSS with inline application scripts; esbuild produces `public/`.
Sections in order: hero (hook); services introduction (explain); three service cards (explain); three-step process (explain); illustrative Workflow Studio (demonstrate, not customer evidence); savings calculator (quantify); inquiry form (convert); footer (navigation/legal).
Baseline Lighthouse desktop/mobile Performance, Accessibility and CLS are recorded before edits in the final results below. Reports are retained outside the repository in `.onboarding/lairdwell2/motion/`.

## Frozen effect plan
1. Hero: SplitText word entrance from masks, then supporting copy. Establish hierarchy without changing text or the existing SideRays shader.
2. Services intro and cards: once-only, restrained rising reveals; introduce the offerings as a group.
3. Process: retain the existing native-flow sticky sidebar and active-step navigation; add subtle desktop-only depth to decorative graphics inside each card. Card geometry and all text remain stationary. This is the signature scroll moment, with no artificial scroll distance.
4. Workflow Studio, calculator heading/panels, contact heading: quiet once-only reveals so interactive content remains immediately usable. Footer stays static to keep navigation predictable.
5. Fine-pointer desktop: gentle Lenis scrolling synchronized with GSAP. Touch/mobile uses native scrolling. All anchors preserve focus and browser history.

No new effects during verification. No new pinning: the existing tall process layout already explains the steps clearly; extra scroll distance would delay access to the calculator. No horizontal strip (no gallery), counters (calculator numbers must remain exact), image masks (no photographs), marquee or page progress bar (unnecessary competing information). Existing process progress becomes discrete in reduced motion. Existing sticky positioning is disabled in reduced motion and on mobile.

## Architecture and tuning
GSAP + ScrollTrigger + SplitText and Lenis, bundled locally by esbuild. One owner in `motion/index.js`, per-concern modules, declarative data attributes, `gsap.context()`/`gsap.matchMedia()` cleanup. `motion/motion.config.js` owns durations, easing, distances, stagger, smooth-scroll and trigger settings for the new motion system. Existing UI feedback and the untouched decorative shader remain separate concerns. No hidden content in base CSS. Reveal transforms never move layout boxes. Cleanup runs on pagehide and setup resumes on pageshow; initialization is idempotent.

## Verification requirements
Test desktop Chromium, Firefox, WebKit; 375px mobile; normal, fast and reverse scrolling; JS disabled; reduced motion including live changes; keyboard/anchors; navigation cleanup; console diagnostics; all existing responsive/accessibility checks. Compare desktop/mobile Lighthouse Performance (maximum 5-point drop), Accessibility and CLS (<0.1). Maximum eight build/check/fix iterations. Simplify or cut failing effects.

## Final results

These results describe the original seven-iteration motion task. The subsequently authorized branding and first-visit intro are documented in [PRELOADER.md](PRELOADER.md), including their current performance measurements.
Completed in seven iterations. Installed `gsap@3.15.0` (ScrollTrigger and SplitText included) and `lenis@1.3.27`; no other animation engine.

| Section | Delivered |
| --- | --- |
| Hero | Accessible masked word entrance, then supporting copy; plays once. |
| Services / offerings | Once-only 32px rising reveals; 16px on mobile. |
| Process | Existing native-flow sticky story and anchors; decorative depth ±18px on desktop Chromium/WebKit; cards and body copy stay stationary. |
| Workflow / calculator / contact | Once-only group/heading reveals; calculator values and form behavior preserved. |
| Footer | Static navigation and legal copy. |
| Desktop scrolling | Lenis lerp 0.1, GSAP ticker synchronization, focused/hash anchors with header clearance, native scrolling inside menus/fields. |

Firefox intentionally uses native scroll, native intersection-driven opacity reveals, discrete active-step progress and a static hero. Its asynchronous-panning diagnostic persisted with scroll-linked positioning, and this environment's Firefox reports a warning even when probing unavailable WebGL. These effects were simplified/cut there to meet the console requirement, not suppressed. Software-rendered Chromium uses a static hero after a detached capability probe; WebKit exercised the live shader. Original shader strings and appearance settings were verified unchanged. Mobile uses native scrolling, discrete progress, no depth or sticky positioning. Reduced motion shows everything immediately with no smooth scrolling, pinning, scrub or depth. No new pinning/horizontal gallery, image masks, counters, marquee or page bar; reasons are recorded in the frozen plan.

| Lighthouse profile | Performance before → after | Accessibility before → after | CLS before → after |
| --- | --- | --- | --- |
| Mobile | 98 → 95 | 100 → 100 | 0 → 0 |
| Desktop, paired static GPU control | 100 → 100 | 100 → 100 | 0 → 0 |

Both comparisons meet the maximum five-point Performance drop and CLS <0.1. Lighthouse 12, system Chromium, production build served locally; reports: `/workspace/.onboarding/lairdwell2/motion/{baseline,final}-mobile.json` and `{baseline,final}-desktop-static.json`. The paired desktop runs use `--disable-webgl` identically because the original live software-GPU baseline timed out (66, incomplete). The final ordinary desktop run also completes at Performance 100 / Accessibility 100 / CLS 0 with no Lighthouse warnings, thanks to the automatic software fallback. These are cloud measurements, not a claim about every visitor's hardware/network.

Verification passed: 42 responsive viewport cases across Chromium, Firefox and WebKit; normal/fast/reverse wheel scrolling; touch scrolling; fixed-header anchors; keyboard and axe checks at 1440/1024/390/320px; enlarged text spacing; 375px normal motion; JS-disabled content/navigation; live reduced-motion changes; three repeated teardown/setup cycles per browser/size with masks, Lenis and scrub transforms removed during teardown. Strict console checks and separate unstubbed live-page load/scroll checks pass in all three engines. WebKit provides Safari-engine coverage; no physical iOS device was used. Desktop and mobile screenshots were inspected. The production build and `git diff --check` pass.

Run `npm run test:a11y`, `npm run test:responsive`, and `npm run test:motion` (install Playwright browser runtimes or supply executable paths for Firefox/WebKit). Motion behavior tests isolate GPU rendering; the live-page console checks were also run without that isolation. Full benchmark JSON and screenshots are retained in the report directory above.

Tune `motion/motion.config.js`: `duration`/`heroDuration` and `stagger` are seconds; `rise`, `mobileRise` and `depth` are pixels; `heroRise` is percent; `fastScroll` is pixels/second. `ease` is the shared `power3.out` family; linear scrub uses `scrubEase`. Lower `lerp` increases smoothing. `anchorDuration`, `revealStart` and depth trigger bounds are centralized there. Run `npm run build` after edits. Base CSS remains visible without the bundle; fonts/images refresh trigger positions when loaded.

## Completion checklist
- [x] Every planned section implemented or its cut explained.
- [x] Normal, fast and backwards scrolling tested without late jumps or stranded content.
- [x] Content/navigation readable with JavaScript disabled.
- [x] Reduced motion: no parallax, pinning, scrubbing or smooth scroll.
- [x] Keyboard and in-page anchors work.
- [x] 375px: native vertical flow, no pinning/horizontal scroll/overflow/clipping.
- [x] No console errors or warnings in tested browse/scroll flows.
- [x] Lighthouse within five baseline points; CLS under 0.1.
- [x] Owned animations/triggers/listeners clean up; lifecycle cycles do not accumulate masks/effects.
- [x] Animation easing, durations and travel distances centralized in shared motion config.

## Iteration Log

### Iteration 1
Initial build passed and Chromium's 14 responsive sizes passed. Smooth story anchors failed: a native focus/automation scroll could leave Lenis's cached position stale, and element-based scrolling also applied CSS anchor offsets twice. Fixed the root cause by resynchronizing Lenis and calculating the destination from actual document geometry once. Added missing reveal attributes on the service cards, a no-request favicon to eliminate a 404 console error, and updated the existing animation assertion for GSAP instead of the replaced WAAPI engine. All new effect parameters now come from the shared config. Desktop baseline with live WebGL timed out on this machine's software GPU (66, incomplete); retaining that report and measuring a second paired desktop baseline with WebGL disabled for a reproducible motion comparison. Mobile baseline: Performance 98, Accessibility 100, CLS 0.

### Iteration 2
Rebuilt and re-read the full brief and plan. Responsive layouts and initial desktop/tablet accessibility passed. Two verification assumptions needed updating for the requested stack: the old settling helper could report completion during Lenis's interpolation tail; it now waits for Lenis to finish as well as stable pixels. SplitText intentionally nests word masks, so lifecycle checks now compare wrapper counts across repeated teardown/setup rather than forbid legitimate nesting. Made hero entrance play only once, including after breakpoint changes and BFCache restoration; hash arrivals finish immediately. Anchor easing now explicitly uses the shared easing family. Reproducible desktop static baseline: Performance 100, Accessibility 100, CLS 0. No new effects added.

### Iteration 3
Re-read the brief and plan. Accessibility now passes desktop/tablet/mobile/320px, including keyboard, form mocks, enlarged text spacing and live reduced motion. Fixed the pre-existing nonbreaking service phrase overflow with an emergency wrapping fallback. All Chromium/Firefox responsive and navigation scenarios passed. New strict console checks caught Firefox's asynchronous-panning warning and software-GPU readback stalls from the existing hero. Simplified Firefox to native scrolling and static process decoration; it retains hero/reveals/active steps. Added static hero fallback for software renderers without changing shader or settings, and fixed its pagehide/pageshow and live preference cleanup. These fixes address renderer capability and lifecycle, rather than hiding warnings.

### Iteration 4
Re-read the brief and plan and rebuilt. Full responsive, native-touch, no-JavaScript and anchor scenarios passed in all three engines (42 viewport cases). Firefox still reported its positioning diagnostic with JS scroll-linked reveals/progress, so extended its simplification: native IntersectionObserver delivers one-shot opacity reveals and discrete process steps; no JS-driven positioning or scrub effects there. Other browsers retain the frozen plan. Fixed the hero's BFCache resume to avoid starting on the initial pageshow before its idle initialization. No warnings are filtered or suppressed.

### Iteration 5
Re-read the full brief and plan. Isolated Firefox features separately: finishing the hero from its scroll handler was the remaining positioning diagnostic. Removed that scroll-linked finish in Firefox; its load entrance completes independently. Detached completed entrance listeners and disabled unused ScrollTrigger registration/refresh there. Made delayed reveal callbacks enter an explicit GSAP context and persist their seen state across breakpoint/lifecycle resets. Strict live Chromium console testing found even creating a visible software canvas caused one GPU warning; moved capability detection to a detached canvas before allocating the visible one. Live Chromium now selects static fallback with zero errors/warnings. Shader source and appearance settings are unchanged. Rebuilt; final cross-engine and performance checks underway.

### Iteration 6
Re-read the full prompt and plan. Strict motion/lifecycle/console checks passed Chromium and Firefox at desktop/375px and WebKit desktop. WebKit mobile's `innerText` omits whitespace between inline word masks across a visual line break; inspection confirmed original `textContent`, exact accessible name, word spacing and screenshot are correct. Changed the text-integrity assertion to DOM text plus the existing accessible-label assertion; retained the effect. Strengthened lifecycle checks to verify masks, Lenis and scrub transforms are absent during teardown, before setup resumes. Final accessibility and cross-engine navigation checks are passing; running the strengthened lifecycle suite and Lighthouse comparison next.


### Iteration 7
Re-read the entire brief, Step 6 checklist and plan. Removed inherited process shadow/color/width transitions so scroll changes do not animate costly properties outside the shared engine. Let nested menus and form controls retain native wheel handling. Simplified Firefox's legacy hero to static because even unavailable-context probing emits a warning there; kept the shader untouched on supported engines. Made mobile process progress discrete so mobile retains only entrance/reveal motion. Rebuilt and verified that final mobile change in all three engines. All strengthened lifecycle/motion checks, cross-engine navigation/touch/no-JS scenarios, accessibility checks and unstubbed live-console checks pass. Final Lighthouse: mobile 95/100/CLS 0 (baseline 98/100/0); paired desktop 100/100/0 (baseline 100/100/0); ordinary final desktop also 100/100/0. No failing checklist items; no new effects added.
