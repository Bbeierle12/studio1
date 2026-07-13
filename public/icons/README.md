# PWA Icons

Generated — do not hand-edit. Run `npx tsx scripts/generate-pwa-icons.ts` to
rebuild all eight sizes from the inline SVG source in that script (it also
writes `public/icon-source.svg` for reference).

Sizes: 72, 96, 128, 144, 152, 192, 384, 512.

## Why these matter

Android will not treat the app as installable without valid 192px and 512px
icons, and a PWA that is not installable never registers its `share_target` —
so the "share a recipe from Instagram/TikTok into the app" flow depends on
these files existing. They are not cosmetic.

Icons are declared `maskable any`, so Android may crop them to a circle. Keep
any new artwork inside the centre 80% safe zone over a full-bleed background.

## Rebranding

Edit the `SOURCE_SVG` constant in `scripts/generate-pwa-icons.ts` (or swap in
your own square source image) and re-run the script. Colors currently come from
the app palette in `globals.css`: espresso `#734d2e`, warm cream `#f7f3ef`.
