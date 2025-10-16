/**
 * Wood Texture Integration Examples
 * 
 * This file provides examples for integrating wood textures into components.
 * Place actual texture files in /public/textures/ before using.
 */

// ============================================================================
// EXAMPLE 1: Header with Wood Texture
// ============================================================================

/**
 * Update the wooden accent strip with real texture
 * Replace in: src/components/header.tsx
 */
/*
<div 
  className='h-1.5 w-full relative'
  style={{
    backgroundImage: 'url(/textures/wood-light.webp)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  }}
>
  {/* Optional noise overlay for extra realism *\/}
  <div 
    className='absolute inset-0 opacity-10'
    style={{
      backgroundImage: 'url(/textures/noise.png)',
      backgroundSize: '128px 128px',
      mixBlendMode: 'overlay',
    }}
  />
</div>
*/

// ============================================================================
// EXAMPLE 2: Logo Plate with Theme-Aware Texture
// ============================================================================

/**
 * Update the logo plate with theme-responsive texture
 * Replace in: src/components/header.tsx
 */
/*
const { theme } = useTheme();

<Link 
  href='/' 
  className='mr-6 flex items-center space-x-2 px-3 py-1.5 rounded-lg relative transition-transform duration-150 hover:translate-y-0.5 overflow-hidden'
>
  {/* Base texture layer *\/}
  <div 
    className='absolute inset-0 opacity-80'
    style={{
      backgroundImage: theme === 'dark' 
        ? 'url(/textures/wood-dark.webp)' 
        : 'url(/textures/wood-light.webp)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  />
  
  {/* Optional gradient overlay for depth *\/}
  <div 
    className='absolute inset-0'
    style={{
      background: 'linear-gradient(135deg, rgba(160, 130, 109, 0.3) 0%, rgba(139, 111, 71, 0.5) 100%)',
    }}
  />
  
  {/* Ring effect *\/}
  <div 
    className='absolute inset-0 rounded-lg'
    style={{
      boxShadow: 'inset 0 0 0 1px rgba(139, 111, 71, 0.4), 0 1px 3px rgba(0, 0, 0, 0.12)',
    }}
  />
  
  {/* Content (must be relative to appear above backgrounds) *\/}
  <CookingPot className='h-6 w-6 text-amber-700 dark:text-amber-400 drop-shadow-sm relative z-10' />
  <span className='font-bold sm:inline-block font-headline text-white drop-shadow-sm relative z-10'>
    Our Family Table
  </span>
</Link>
*/

// ============================================================================
// EXAMPLE 3: Tailwind CSS Classes (if textures are in CSS)
// ============================================================================

/**
 * Add to globals.css or a separate wood-textures.css
 */
/*
@layer utilities {
  .wood-texture-light {
    background-image: url('/textures/wood-light.webp');
    background-size: cover;
    background-position: center;
  }

  .wood-texture-dark {
    background-image: url('/textures/wood-dark.webp');
    background-size: cover;
    background-position: center;
  }

  .wood-noise-overlay {
    position: relative;
  }

  .wood-noise-overlay::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('/textures/noise.png');
    background-size: 128px 128px;
    mix-blend-mode: overlay;
    opacity: 0.1;
    pointer-events: none;
  }
}
*/

// ============================================================================
// EXAMPLE 4: Next.js Image Component (for optimized loading)
// ============================================================================

/**
 * Using next/image for better performance
 */
/*
import Image from 'next/image';

<div className='relative h-1.5 w-full overflow-hidden'>
  <Image
    src='/textures/wood-light.webp'
    alt=''
    fill
    className='object-cover'
    priority
  />
  <div className='absolute inset-0 shadow-[0_2px_4px_rgba(0,0,0,0.1)]' />
</div>
*/

// ============================================================================
// EXAMPLE 5: CSS Variables for Easy Theming
// ============================================================================

/**
 * Define in globals.css with CSS variables
 */
/*
:root {
  --wood-texture: url('/textures/wood-light.webp');
  --wood-opacity: 0.6;
}

[data-theme='dark'] {
  --wood-texture: url('/textures/wood-dark.webp');
  --wood-opacity: 0.7;
}

.wood-element {
  background-image: var(--wood-texture);
  background-size: cover;
  opacity: var(--wood-opacity);
}
*/

// ============================================================================
// TIPS FOR IMPLEMENTATION
// ============================================================================

/**
 * 1. Contrast Preservation:
 *    - Keep texture opacity between 30-60%
 *    - Layer gradients over textures for better text readability
 *    - Use drop-shadow on text/icons
 * 
 * 2. Performance:
 *    - Use WebP or AVIF for smaller file sizes
 *    - Consider lazy loading textures not in viewport
 *    - Use CSS background-attachment: fixed sparingly (can impact scroll performance)
 * 
 * 3. Responsive Design:
 *    - Test textures at various screen sizes
 *    - Ensure textures tile seamlessly for ultra-wide displays
 *    - Consider using background-size: contain on mobile
 * 
 * 4. Accessibility:
 *    - Maintain WCAG contrast ratios (4.5:1 for normal text)
 *    - Test with screen readers (decorative images should have empty alt)
 *    - Provide reduced motion alternatives if textures animate
 * 
 * 5. Dark Mode:
 *    - Use darker, richer wood tones
 *    - May need higher opacity (70-80%) in dark mode
 *    - Test for eye strain during extended use
 */

export {};
