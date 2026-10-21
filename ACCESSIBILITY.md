# Accessibility review

The footer identifies the business as **Lairdwell consulting LLC**. The visible brand, header, footer and page title use Lairdwell.

## Changes

- Added a main landmark, a visible-on-focus skip link, named primary navigation, and logical footer heading levels; made the repeated footer wordmark decorative.
- Strengthened muted text contrast, form outlines/placeholders, and focus visibility on light and dark backgrounds. Hero copy has its own dark background so its contrast does not depend on the animated canvas.
- Increased calculator range and chart-toggle target sizes. Added a debounced live summary for changed calculator results and a live heading for workflow changes.
- Made mobile navigation close with Escape, restore focus, reset its accessible label, and move focus to the destination when a link is selected. Compact navigation also covers tablet widths.
- Added required-field and minimum-message-length instructions, a sensitive-information warning, persistent live submission feedback, and a busy state. Existing native browser validation remains in use.
- Disabled animations/transitions for reduced-motion users and preserved visible story content without animation.

## Verification

`npm run test:a11y` builds and serves the actual production HTML on a temporary loopback server. It runs axe checks for WCAG A/AA rules through 2.2 plus best-practice rules at 1440px, 1024px, 390px, and 320px widths. Scanned states include the initial page, open compact menu, changed workflow/calculator, and mocked server error/success responses. Keyboard checks cover the skip link, menu, calculator inputs and range arrow keys, chart buttons, workflow changes, and native invalid-form focus. It also checks page overflow with increased text spacing. Tests use reduced motion for deterministic scans. Hero rendering modes and calculator interactions were separately checked during performance work.

Desktop/mobile screenshots were inspected for the hero, calculator and form. The scanner cannot determine every contrast case with gradients, overlapping content, pseudo-elements and symbol glyphs; those results must not be represented as automatic passes. Text colors were strengthened on the workflow diagram, and hero text was given a controlled background to address these cases.

## Before claiming conformance

This is engineering validation, not a WCAG certification or legal guarantee. Remaining review includes a real screen-reader walkthrough (for example NVDA/Chrome and VoiceOver/Safari), actual browser zoom and OS text scaling, forced-colors/high-contrast mode, successful production font loading, and checks on the deployed site with its real contact backend and any later cookie/analytics/privacy UI. A 320px viewport approximates 400% reflow of a 1280px viewport but does not replace real zoom testing. Page-width assertions do not prove that every component is free of clipping. Google Fonts is blocked in this cloud environment, so screenshot/automated checks used fallback fonts.

The form's real `/api/contact` backend is not implemented. Tests mock success and failure and send no real inquiries. A working backend and accurate privacy notice remain launch prerequisites; these checks do not establish security or privacy-law compliance.


Story navigation uses keyboard-accessible links with `aria-current="step"`, moves focus to the selected card, and honors reduced motion. Regression checks cover desktop smooth alignment, native proximity snapping, leaving the story section, one-shot reveals, and cancellation when reduced motion is enabled. No scroll events are intercepted to replace native wheel/touch behavior.
