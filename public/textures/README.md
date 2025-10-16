# Texture Assets

This directory contains texture files for the wood-themed UI elements.

## Required Textures

### 1. `wood-light.webp`
- **Dimensions**: 1200×200 pixels
- **Format**: WebP (or AVIF for better compression)
- **Size**: ~50–150 KB
- **Purpose**: Light mode wood texture for header accents, logo plate, and decorative elements
- **Style**: Warm, natural wood grain with honey/amber tones
- **Recommended colors**: Browns ranging from #A0826D to #8B6F47

### 2. `wood-dark.webp`
- **Dimensions**: 1200×200 pixels
- **Format**: WebP (or AVIF for better compression)
- **Size**: ~50–150 KB
- **Purpose**: Dark mode wood texture for header accents, logo plate, and decorative elements
- **Style**: Darker, richer wood grain with deeper brown tones
- **Recommended colors**: Dark browns ranging from #5A4A3A to #3D2F23

### 3. `noise.png` (Optional)
- **Dimensions**: Small tiling texture (e.g., 128×128 or 256×256)
- **Format**: PNG with transparency
- **Size**: ~5–20 KB
- **Purpose**: Subtle noise overlay for added realism
- **Usage**: Apply with `mix-blend-mode: overlay` at low opacity (5-15%)
- **Style**: Fine-grain noise pattern

## Usage Guidelines

- Keep opacity subtle (30-60%) to preserve text contrast and readability
- Use CSS `background-blend-mode` or `mix-blend-mode: overlay` for layering
- Ensure textures tile seamlessly for wider screens
- Test both light and dark modes for accessibility

## How to Add Textures

### Option 1: Generate AI Textures
Use AI image generators (Midjourney, DALL-E, Stable Diffusion) with prompts like:
- "seamless tileable wood grain texture, warm honey brown, 1200x200, natural oak wood pattern"
- "seamless tileable dark wood texture, rich walnut brown, 1200x200, natural grain pattern"

### Option 2: Use Free Texture Resources
- [Polyhaven Textures](https://polyhaven.com/textures) - CC0 license
- [Textures.com](https://www.textures.com/) - Free tier available
- [Freepik](https://www.freepik.com/) - Free textures with attribution

### Option 3: Create from Photos
1. Photograph real wood surface
2. Crop to 1200×200 aspect ratio
3. Adjust levels/contrast for web use
4. Convert to WebP using tools like:
   - Online: [Squoosh](https://squoosh.app/)
   - CLI: `cwebp input.jpg -o wood-light.webp -q 80`

## Conversion to WebP

```bash
# Using cwebp (install from Google WebP tools)
cwebp wood-light.jpg -o wood-light.webp -q 80
cwebp wood-dark.jpg -o wood-dark.webp -q 80

# Or use online converters
# https://squoosh.app/
# https://cloudconvert.com/jpg-to-webp
```

## Integration Example

Once textures are in place, update components to use them:

```tsx
// In header.tsx or other components
<div
  className="..."
  style={{
    backgroundImage: 'url(/textures/wood-light.webp)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    // Optional: Add noise overlay
    // mixBlendMode: 'overlay'
  }}
/>

// With theme support
<div
  className="..."
  style={{
    backgroundImage: theme === 'dark' 
      ? 'url(/textures/wood-dark.webp)' 
      : 'url(/textures/wood-light.webp)',
    backgroundSize: 'cover',
  }}
/>
```

## Quality Checklist

- [ ] Files are optimized (50-150 KB for wood textures)
- [ ] WebP or AVIF format used
- [ ] Textures tile seamlessly horizontally
- [ ] Sufficient contrast for overlaid text
- [ ] Both light and dark variants created
- [ ] Tested on various screen sizes
- [ ] Noise layer is subtle and enhances (not distracts)

---

**Note**: Placeholder textures are not included. You'll need to add actual image files named exactly as specified above.
