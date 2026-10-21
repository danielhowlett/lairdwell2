# Lairdwell website

The editable website is `index.html`. The original `laird-co-site.zip` is retained as an archive; it is not the deployment source.

## Development and deployment

Use Node.js 20+ and Python 3. Install with `npm ci`, run `npm run build`, then `npm start`. The build minifies embedded CSS and JavaScript into `public/index.html` without changing the editable source. Rebuild after editing source. The development server uses port 8000; stop any previous server using that port first.

For Cloudflare Pages, set the build command to `npm ci && npm run build` and the output directory to `public`. Cloudflare provides transfer compression; verify `Content-Encoding: br` or `gzip` on the deployed HTTPS response with `curl --compressed -I <deployment-url>`. The included `_headers` makes HTML revalidate so releases do not leave users with stale inline code. Python's local development server does not apply `_headers` or compress responses.

## Performance behavior

Mobile/coarse-pointer, reduced-motion, and data-saving devices use a static hero. Other devices initialize the WebGL hero after initial painting, cap resolution at 900,000 pixels and DPR 1, and render at most 30 fps. The hero pauses offscreen and in hidden tabs. Workflow dots use transforms and pause offscreen. Fonts load asynchronously with preconnected Google Fonts origins and a system fallback. Validate visual quality and rendering on representative physical phones and desktops before release.

The calculator uses 48 workweeks and estimates recovered staff-time value, not guaranteed cash savings. Defaults yield $16,128/year and 460.8 hours/year. The contact form still needs a `/api/contact` backend before it can send real inquiries; none is included.

## Accessibility checks

Run `npm run test:a11y` for the production build's automated accessibility and keyboard regression checks. It uses Chromium plus axe at desktop, tablet, mobile, and 320px reflow widths, and tests navigation, calculator controls, native validation, and mocked form responses. If Chromium is not installed, run `npx playwright install --with-deps chromium`, or set `CHROMIUM_PATH` to an installed executable. See `ACCESSIBILITY.md` for coverage and remaining manual checks.


## Scroll interactions

The three story steps link to their matching cards, with smooth scrolling and desktop proximity snapping at widths of 1100px or more. The current step follows the visible card; page scrolling remains native. Service cards and selected section headings/panels reveal once with a short transform animation. Reduced-motion users receive immediate step navigation with no snapping or reveal animations, including when the preference changes while the page is open.
