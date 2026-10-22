# Active website branding

The active artwork is in `website-kit/`, copied unchanged from the supplied `Lairdwell_Website_Logo_Kit.zip`. The original approved reference and supplied variants were inspected before integration. No marks were redrawn, recolored, stretched or converted to SVG. The supplied full-size icon is retained unchanged; proportionally resized 120px/240px/360px exports use lossless WebP encoding for actual display sizes.

- Desktop header and footer: `Web_PNG/lairdwell_primary_dark_480w.png` and `lairdwell_primary_dark_960w.png`. The provided 480px PNG is ~45KB, versus ~162KB for the full-size primary WebP, so the smaller PNG sources suit these display slots better.
- Collapsed navigation (below 1100px) and preloader: responsive `lairdwell_icon_dark_120.webp`, `..._240.webp` and `..._360.webp`, derived from the supplied `Web_WebP/lairdwell_icon_dark.webp`. The smallest is about 5KB versus 217KB for the supplied full-size icon. The compact header uses the supplied emblem rather than an illegibly small Consulting subline. The placements share responsive image candidates, avoiding a full-size icon download on mobile.
- Browser icons: supplied 32px/48px PNGs, 180px Apple icon and 192px/512px manifest icons. The supplied ICO is retained, but the page uses the small PNG favicon links to avoid a 56KB ICO fetch. `site.webmanifest` points to the new files using relative paths.

All website logo placements have dark backgrounds, so they use the reversed light-text/white-emblem variants. See `BRANDING.md` in the repository root for behavior and verification.

The old SVG/PNG/ICO files outside `website-kit/` came from the previous `Lairdwell_Logo_Package.zip` and remain as historical assets. The site's current markup does not reference those old logos or favicons.
