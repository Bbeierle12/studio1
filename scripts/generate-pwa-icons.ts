/**
 * PWA Icon Generator
 *
 * Renders public/icons/icon-{size}.png for every size the manifest declares,
 * from an inline SVG source. Android will not treat the app as installable
 * without 192px and 512px icons — and a non-installable PWA never registers
 * its share_target, so the "share a recipe to the app" flow depends on these.
 *
 * Icons are declared "maskable any": Android may crop them to a circle, so the
 * glyph stays inside the safe zone (centre 80%) over a full-bleed background.
 *
 * Colors come from the app palette in globals.css:
 *   espresso #734d2e (--primary), warm cream #f7f3ef (--background).
 *
 * Run: npx tsx scripts/generate-pwa-icons.ts
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'icons');

const ESPRESSO = '#734d2e';
const CREAM = '#f7f3ef';

/**
 * A fork and spoon flanking a plate — legible at 72px, safe under circular
 * masking. Drawn on a 512 grid and scaled per size.
 */
const SOURCE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${ESPRESSO}"/>
  <circle cx="256" cy="256" r="140" fill="none" stroke="${CREAM}" stroke-width="16" opacity="0.35"/>
  <circle cx="256" cy="256" r="96" fill="${CREAM}" opacity="0.12"/>

  <!-- fork -->
  <g fill="${CREAM}">
    <rect x="168" y="150" width="12" height="70" rx="6"/>
    <rect x="192" y="150" width="12" height="70" rx="6"/>
    <rect x="216" y="150" width="12" height="70" rx="6"/>
    <path d="M162 214 h72 a10 10 0 0 1 10 10 v14 a46 46 0 0 1 -34 44 v76 a12 12 0 0 1 -24 0 v-76 a46 46 0 0 1 -34 -44 v-14 a10 10 0 0 1 10 -10 z"/>
  </g>

  <!-- spoon -->
  <g fill="${CREAM}">
    <ellipse cx="326" cy="196" rx="38" ry="50"/>
    <path d="M314 244 h24 v114 a12 12 0 0 1 -24 0 z"/>
  </g>
</svg>
`;

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const source = Buffer.from(SOURCE_SVG);
  await writeFile(path.join(process.cwd(), 'public', 'icon-source.svg'), source);

  for (const size of SIZES) {
    const file = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    await sharp(source).resize(size, size).png().toFile(file);
    console.log(`Generated icon-${size}x${size}.png`);
  }

  console.log(`\nDone — ${SIZES.length} icons written to public/icons/`);
  console.log('Replace public/icon-source.svg and re-run to rebrand.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
