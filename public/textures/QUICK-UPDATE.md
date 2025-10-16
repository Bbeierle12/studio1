# Quick Update Guide: Adding Textures to Header

Once you've added `wood-light.webp` and `wood-dark.webp` to `/public/textures/`, follow these steps to integrate them into your header:

## Step 1: Update the Wooden Accent Strip

**Current code:**
```tsx
<div 
  className='h-1.5 w-full'
  style={{
    background: 'linear-gradient(90deg, #8B6F47 0%, #A0826D 25%, #8B6F47 50%, #A0826D 75%, #8B6F47 100%)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  }}
/>
```

**Updated with texture:**
```tsx
<div 
  className='h-1.5 w-full relative'
  style={{
    backgroundImage: 'url(/textures/wood-light.webp)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  }}
>
  {/* Optional: Add noise overlay */}
  <div 
    className='absolute inset-0 opacity-10'
    style={{
      backgroundImage: 'url(/textures/noise.png)',
      backgroundSize: '128px 128px',
      mixBlendMode: 'overlay',
    }}
  />
</div>
```

## Step 2: Update the Logo Plate

**Current code:**
```tsx
<Link 
  href='/' 
  className='mr-6 flex items-center space-x-2 px-3 py-1.5 rounded-lg relative transition-transform duration-150 hover:translate-y-0.5'
  style={{
    background: 'linear-gradient(135deg, #A0826D 0%, #8B6F47 50%, #A0826D 100%)',
    boxShadow: 'inset 0 0 0 1px rgba(139, 111, 71, 0.4), 0 1px 3px rgba(0, 0, 0, 0.12)',
  }}
>
  <CookingPot className='h-6 w-6 text-amber-700 dark:text-amber-400 drop-shadow-sm' />
  <span className='font-bold sm:inline-block font-headline text-white drop-shadow-sm'>
    Our Family Table
  </span>
</Link>
```

**Updated with texture (theme-aware):**
```tsx
<Link 
  href='/' 
  className='mr-6 flex items-center space-x-2 px-3 py-1.5 rounded-lg relative transition-transform duration-150 hover:translate-y-0.5 overflow-hidden'
>
  {/* Texture background */}
  <div 
    className='absolute inset-0 opacity-70 dark:opacity-80'
    style={{
      backgroundImage: `url(/textures/${theme === 'dark' ? 'wood-dark' : 'wood-light'}.webp)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  />
  
  {/* Gradient overlay for depth */}
  <div 
    className='absolute inset-0 opacity-40'
    style={{
      background: 'linear-gradient(135deg, rgba(160, 130, 109, 0.5) 0%, rgba(139, 111, 71, 0.7) 100%)',
    }}
  />
  
  {/* Ring effect */}
  <div 
    className='absolute inset-0 rounded-lg'
    style={{
      boxShadow: 'inset 0 0 0 1px rgba(139, 111, 71, 0.4), 0 1px 3px rgba(0, 0, 0, 0.12)',
    }}
  />
  
  {/* Content (with z-index to appear above backgrounds) */}
  <CookingPot className='h-6 w-6 text-amber-700 dark:text-amber-400 drop-shadow-sm relative z-10' />
  <span className='font-bold sm:inline-block font-headline text-white drop-shadow-sm relative z-10'>
    Our Family Table
  </span>
</Link>
```

## Step 3: Update Header Component (Add theme access)

Make sure the `theme` variable is available at the component level:

```tsx
export function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme(); // ← Already imported!
  const { unit, toggleUnit } = useUnit();
  const { toast } = useToast();
  
  // ... rest of component
```

## Texture Requirements Checklist

- [ ] `wood-light.webp` - 1200×200px, warm brown tones
- [ ] `wood-dark.webp` - 1200×200px, dark brown tones
- [ ] `noise.png` (optional) - 128×128px, subtle grain pattern

## Where to Get Textures

### Quick Options:
1. **Polyhaven** (CC0): https://polyhaven.com/textures/wood
2. **Freepik**: https://www.freepik.com/free-photos-vectors/wood-texture
3. **Unsplash**: Search for "wood grain texture"

### AI Generation:
Use prompts like:
- "seamless tileable oak wood texture, warm honey brown, natural grain, 1200x200"
- "seamless tileable walnut wood texture, dark rich brown, natural grain, 1200x200"

### Convert to WebP:
- Online: https://squoosh.app/
- CLI: `cwebp input.jpg -o wood-light.webp -q 80`

## Testing

After adding textures, verify:
1. ✅ Textures load on both light and dark modes
2. ✅ Text remains readable with good contrast
3. ✅ Mobile displays look good
4. ✅ File sizes are reasonable (~50-150 KB each)
5. ✅ No visual glitches or tiling issues

---

**Note**: The current gradient-based wood effect works fine as a placeholder. Only update when you have real texture files ready!
