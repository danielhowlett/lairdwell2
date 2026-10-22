# Lairdwell website

The editable website is `index.html`. The original `laird-co-site.zip` is retained as an archive; it is not the deployment source.

## Development and deployment

Use Node.js 20+ and Python 3. Install with `npm ci`, run `npm run build`, then `npm start`. The build minifies embedded CSS and JavaScript into `public/index.html` without changing the editable source. Rebuild after editing source. The development server uses port 8000; stop any previous server using that port first.

For Cloudflare Pages, set the build command to `npm ci && npm run build` and the output directory to `public`. Cloudflare provides transfer compression; verify `Content-Encoding: br` or `gzip` on the deployed HTTPS response with `curl --compressed -I <deployment-url>`. The included `_headers` makes HTML revalidate so releases do not leave users with stale inline code. Python's local development server does not apply `_headers` or compress responses.

## Performance behavior

Mobile/coarse-pointer, reduced-motion, and data-saving devices use a static hero. Other devices initialize the WebGL hero after initial painting, cap resolution at 900,000 pixels and DPR 1, and render at most 30 fps. The hero pauses offscreen and in hidden tabs. Workflow dots use transforms and pause offscreen. Inter is self-hosted as a preloaded Latin variable font, with a lazy Latin Extended subset and system fallbacks. The font files carry fingerprinted names and the SIL Open Font License. Validate visual quality and rendering on representative physical phones and desktops before release.

The calculator uses 48 workweeks and estimates recovered staff-time value, not guaranteed cash savings. Defaults yield $16,128/year and 460.8 hours/year. The contact form posts to the configured Formspree endpoint, with an AJAX response and a native HTML fallback. No custom contact backend or secret API key is required. See the contact integration notes below.

## Accessibility checks

Run `npm run test:a11y` for the production build's automated accessibility and keyboard regression checks. It uses Chromium plus axe at desktop, tablet, mobile, and 320px reflow widths, and tests navigation, calculator controls, native validation, and mocked form responses. If Chromium is not installed, run `npx playwright install --with-deps chromium`, or set `CHROMIUM_PATH` to an installed executable. See `ACCESSIBILITY.md` for coverage and remaining manual checks.


## Scroll interactions

The three story steps link to their matching cards, with smooth native scrolling and a shared sticky-header offset. The current step and progress follow the visible cards. Page-level snapping was removed to avoid scroll jumps, and card geometry stays fixed during stage transitions. Service cards and selected section headings/panels reveal once with a short transform animation. Reduced-motion users receive immediate step navigation with no snapping or reveal animations, including when the preference changes while the page is open.


## Responsive browser regression suite

Run `npx playwright install --with-deps chromium firefox webkit` on a machine that supports installing browser runtimes, then `npm run test:responsive`. The suite covers Chromium, Firefox and WebKit at all 12 requested widths plus two short landscape sizes. It checks loaded Inter typography, single-line desktop headlines, component clipping, header layout, workflow height stability, maximum calculator values, story alignment, normal/fast/reverse scrolling, anchor offsets, resizing, reduced motion, and readable content without JavaScript. Screenshots and JSON results go to the ignored `.test-artifacts` directory. `TEST_BROWSERS=chromium` selects one engine. `REQUIRE_INTER=1` asserts that the real local font loaded.

`CHROMIUM_EXECUTABLE_PATH`, `FIREFOX_EXECUTABLE_PATH` and `WEBKIT_EXECUTABLE_PATH` can select preinstalled browsers. Environment-specific runtime installation is outside the production build; no front-end libraries were added. See `UI-REFINEMENT.md` for the verified outcomes and their limits.

## Contact form

The HTML form action is `https://formspree.io/f/xvkzeloo`. Existing vanilla JavaScript sends `FormData` to that action with `Accept: application/json`; no extra SDK is needed. With JavaScript disabled the same form posts directly to Formspree and uses its hosted response. All existing inquiry fields are included, plus the `_gotcha` honeypot and a fixed `_subject`. Server validation errors are announced, associated with fields and focused when applicable. Errors retain entered values; only successful submissions reset the form. Requests time out after 20 seconds and duplicate submissions are prevented while sending.

Formspree handles delivery and spam filtering; check the form's recipient/activation, any allowed-domain restrictions, account limits and spam settings in its dashboard. Verify one real inquiry from the deployed origin and confirm receipt in Formspree/the recipient inbox. Automated tests mock requests and do not send real inquiries. The small form disclosure identifies Formspree; a full business privacy notice should reflect its processing and the business's actual practices.

Run `npm run test:contact` for mocked success, validation, rate limiting, network failure, duplicate protection, calculator-prefilled payload and native no-JavaScript submission checks across browser engines.

## Current branding and header

The active artwork comes from `Lairdwell_Website_Logo_Kit.zip`. The header stays transparent until the actual hero bottom leaves the viewport, then gains its dark backdrop. See [BRANDING.md](BRANDING.md) for asset choices, lifecycle behavior, modified files and verification, or run `npm run test:header`.
