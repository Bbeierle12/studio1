# PWA Icons Placeholder

This directory should contain PWA app icons in the following sizes:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## How to Generate Icons

### Option 1: Online Tools (Recommended)
1. Visit https://realfavicongenerator.net/ or https://www.pwabuilder.com/
2. Upload your logo/icon (512x512px recommended)
3. Download the generated icon set
4. Place icons in this directory

### Option 2: Image Editor
1. Create a square logo in your preferred image editor
2. Export in multiple sizes (see list above)
3. Save to this directory

### Option 3: Use Sharp (Node.js)
See `scripts/generate-pwa-icons.ts` for automated generation script.

## Temporary Placeholder
Until you add custom icons, the app will use the favicon or default browser icons.
The PWA functionality will still work without custom icons.
