Merge# Frontend Design Handoff Spec — "Our Family Table"

**Repo:** `/home/bbeierle12/studio1` · **Live:** craicnkuche.com (Vercel)
**Stack:** Next.js 15 (App Router) · React 18 · TypeScript · Tailwind CSS 3 · shadcn/ui + Radix · lucide-react · framer-motion · next-themes
**Purpose of this doc:** Source-of-truth context for a visual refinement done in Claude Design. The goal is **aesthetic polish + consistency** within the existing brand, *not* a ground-up redesign. Whatever Design produces must map back to the token system below so the drift documented in §6 doesn't recur.

> **Prime directive for the redesign:** every color, radius, shadow, and type style must resolve to a **semantic design token** (a CSS variable / Tailwind theme key), never a raw hex or a raw Tailwind palette utility (`bg-white`, `text-gray-700`, `from-orange-50`, …). The system already exists and is good — the problem is *adoption*, not the system.

---

## 1. Product & Brand

- **What it is:** A family recipe + meal-planning web app (PWA). Authenticated users land on a "Foyer" home that centers on a weekly meal calendar, browse/create recipes, plan meals, manage a household, and use AI recipe chat + voice cooking assistance.
- **Voice/feel:** Warm, homey, "recipe living room." Current palette is intentionally a warm beige/brown (coffee-and-cream) scheme, with a serif display face (Playfair Display) for a cookbook feel.
- **BRAND NAME — decision made:** **"Our Family Table"** is the canonical name everywhere.
  - ⚠️ Inconsistency to fix: `src/app/layout.tsx` metadata still says **"Studio1 Meal Planner"** (page `<title>`, OpenGraph, Twitter card) and `themeColor: '#ffffff'`. The visible UI (header, sidebar, footer) already says "Our Family Table." Align metadata to the UI name, and set `themeColor` to the brand background, not pure white.

---

## 2. Tech & Hard Constraints (what the Design output must respect)

- **Styling engine:** Tailwind CSS 3 with `darkMode: 'class'`. Theme tokens are HSL CSS variables in `src/app/globals.css`, surfaced as Tailwind colors in `tailwind.config.ts`. Components are shadcn/ui-style (Radix primitives + `cva` variants + `cn()` class merge).
- **Theming:** Light + dark are both supported via `next-themes` (`defaultTheme: 'system'`, class strategy). **Dark mode must be a first-class output** — every surface needs a real dark value (see §6, the calendar surface currently breaks this).
- **Icons:** `lucide-react` is the icon system. **Decision needed:** the UI currently mixes Lucide icons with emoji in headings/labels (🍳 📝 📖 📅 ☀️ 🌙 💻 ❤️ 🍂). Recommend standardizing on Lucide and dropping decorative emoji (or formalizing emoji as an intentional accent, used consistently).
- **Fonts:** Loaded from Google Fonts in `layout.tsx`: **Playfair Display 700** (`font-headline`) and **Roboto 400** (`font-body`). ⚠️ Only those two weights are loaded — any `font-medium/semibold/bold` on body text is browser-synthesized faux-bold. If the type scale needs more weights, they must be added to the font `<link>`.
- **Responsive:** Mobile-first. Breakpoints in use: `md:` (89×, the primary desktop breakpoint), `sm:` (49×), `lg:` (46×), `xl:` (14×). Container is centered, `padding: 2rem`, max width `2xl: 1400px`.
- **PWA + print:** App is installable (manifest, service worker, install/update prompts). There is a dedicated print stylesheet in `globals.css` (`@media print`, `.printable-content`, `.no-print`). Recipe detail/print must remain printable — don't remove the print layer.
- **Layout shell (`layout.tsx`):** fixed left **Sidebar** (desktop) + top **Header** + **BottomNav** (mobile) + main content. Many context providers wrap the tree (auth, theme, query, shopping list, units, etc.) — these are functional, leave them.

---

## 3. Information Architecture

### 3.1 Navigation systems (currently inconsistent — reconcile)

There are **three** nav surfaces, and the desktop and mobile menus expose **different destinations**:

| Surface | Where | Items |
|---|---|---|
| **Sidebar** (desktop, collapsible) | `components/sidebar.tsx` | Foyer `/` · Recipe Hub `/recipes` · Meal Plan `/meal-plan` · Family `/household` · Saved `/saved` · AI Recipe Chat `/recipe-chat` · Settings `/settings` · Admin `/admin` (admins only) |
| **Bottom nav** (mobile only) | `components/ui/bottom-nav.tsx` | Recipes `/recipes` · Calendar `/meal-plan` · Shopping `/meal-plan?view=shopping` · Analytics `/analytics` |
| **Header** (all) | `components/header.tsx` | Search · Quick Actions · Notifications · Shopping List · Unit toggle · Theme toggle · User menu / Sign in |

⚠️ **IA gap:** mobile users cannot reach Foyer/home, Family, Saved, AI Chat, or Settings from the bottom nav; and **Analytics** appears *only* in the bottom nav, never in the sidebar. The two menus should expose a coherent, overlapping set. Recommend a single canonical nav model with a sensible mobile subset (e.g. Home, Recipes, Meal Plan, Saved, More).

### 3.2 Full route map

**Public / Auth**
- `/login` — credentials + "Sign in with Google". Centered card (`max-w-md`). *Issues:* Google button hardcodes `bg-white text-gray-900 border-gray-300`; dead link to `/forgot-password` (route does not exist).
- `/register` — account creation + Google. Centered card. *Issues:* same hardcoded Google button; Google brand-hex SVG (acceptable — brand asset).
- `/offline` — PWA offline fallback. Clean.
- `/maintenance`, `/clear-maintenance` — maintenance gates. *Issues:* hardcoded gradient backgrounds (`from-gray-50`, `from-blue-50 to-indigo-100`) and status colors.

**Core app**
- `/` **Foyer (home)** — authed landing; welcome hero + **FoyerWeekCalendar** + quick-action cards + quick-access buttons. *Issues (high priority):* white-on-white placeholder hero image, `text-white` heading over it, `bg-white/90 dark:bg-gray-800/90` cards, emoji headings, mock weather. See §8.
- `/meal-plan` — full meal-planning calendar (`MealPlanningCalendar`). *Issues:* calendar component family hardcodes the espresso palette (see §6).
- `/saved` — saved-for-offline recipes; responsive `RecipeCard` grid (1/2/3/4 cols).
- `/collections` — recipes grouped by tag; cover-image cards. *Issues:* placehold.co images, `bg-gradient-to-t from-black/60`, `text-white` titles.
- `/household` — family members + roles. Clean, card-based.
- `/settings` — tabbed: Profile · Security · API Keys (admin) · Analytics · Notifications · Preferences · Account. *Issues:* hardcoded `bg-gray-100 dark:bg-gray-800` disabled inputs, `text-gray-600`, blue info boxes (`bg-blue-50 dark:bg-blue-950`), red danger zone, emoji theme buttons.
- `/analytics` — personal insights (`AnalyticsDashboard`).

**Recipes**
- `/recipes` — Recipe Hub; tabs (Browse / Add / My Recipes), nested All vs Collections, mobile FAB, detail drawer. Uses `rounded-md3-xl shadow-md3-3` on FAB (rare correct MD3-token usage).
- `/recipes/[id]` — recipe detail (article layout, hero, 2-col ingredients/instructions). *Issues:* placehold.co hero, `prose prose-stone`.
- `/recipes/[id]/edit`, `/recipes/new` — forms in cards.
- `/recipes/import` — URL + bulk import; tabs. *Issues:* blue info alert boxes, site badges.
- `/recipe-chat`, `/recipe-creator` — AI conversational recipe creation. *Issues:* full-page `from-orange-50 via-white to-green-50` gradient that ignores theme; blue/green chat bubbles.
- `/cook` — hands-free cook mode (steps + voice + timers). *Issues:* `from-orange-50 via-white to-amber-50 dark:from-gray-900` gradient, `text-orange-500`, hardcoded timer dot colors.

**Admin** (role-gated: SUPPORT_ADMIN / CONTENT_ADMIN / SUPER_ADMIN)
- `/admin` (dashboard) · `/admin/users` · `/admin/users/[id]` · `/admin/recipes` · `/admin/audit` · `/admin/analytics` · `/admin/settings` · `/admin/features` · `/admin/database`.
- *Dominant issue across admin:* status/role/difficulty conveyed with hardcoded "soft" Tailwind pairs (`bg-green-100 text-green-800`, `bg-yellow-100 text-yellow-800`, `bg-red-100 text-red-800`, `bg-purple-100 text-purple-800`, `bg-blue-100 text-blue-800`). These need **semantic status tokens** (§7.4) so they theme + dark-mode correctly.

**Utility / diagnostic**
- `/meal-plan-diagnostic` — internal debug (bare `bg-gray-100` pre blocks). Not user-facing polish target.

---

## 4. Current Design Tokens (the system to preserve & extend)

Defined in `src/app/globals.css` (`:root` and `.dark`), exposed in `tailwind.config.ts`. All colors are HSL triplets consumed as `hsl(var(--token))`.

### 4.1 Color tokens

| Token | Light (HSL → hex) | Dark (HSL → hex) | Role |
|---|---|---|---|
| `background` | `30 24% 96%` · #f7f3f0 | `25 55% 15%` · #38261a | App background |
| `foreground` | `25 55% 25%` · #604029 | `30 25% 85%` · #e0d7d1 | Body text |
| `card` / `card-foreground` | #f7f3f0 / #604029 | #38261a / #e0d7d1 | Card surface/text |
| `popover` / `popover-foreground` | #f7f3f0 / #604029 | #38261a / #e0d7d1 | Popover surface/text |
| `primary` / `-foreground` | `25 55% 25%` #604029 / #f7f3f0 | `30 40% 75%` #d4bda9 / #261a11 | Primary action (brown ↔ tan) |
| `secondary` / `-foreground` | `30 15% 55%` #9e8a7e / #fcfaf8 | `30 15% 30%` #5c524c / #e8e3df | Secondary |
| `muted` / `-foreground` | `30 15% 85%` #e0d9d4 / #827b76 | `30 15% 25%` #4f4641 / #b5a9a2 | Muted bg / subtle text |
| `accent` / `-foreground` | `30 30% 90%` #f0e9e4 / #4d3321 | `30 15% 20%` #423b36 / #e8e3df | Hover/accent |
| `destructive` / `-foreground` | `0 60% 50%` #cc3333 / #fff | `0 50% 40%` / #fff | Danger |
| `border` | `30 15% 82%` #dbd1cc | `30 15% 27%` | Borders |
| `input` | `30 15% 82%` #dbd1cc | `30 15% 27%` | Input borders |
| `ring` | `25 55% 35%` #7f5539 | `30 40% 75%` #d4bda9 | Focus ring |

⚠️ **Broken token:** `tailwind.config.ts` declares `chart-1 … chart-5` → `hsl(var(--chart-N))`, but **`--chart-1…5` are never defined** in `globals.css`. Any `bg-chart-1` resolves to invalid color; charts currently work around this with hardcoded hex (`analytics/charts.tsx`, `ui/chart.tsx`). **Define the 5 chart tokens** (light + dark) as part of this work — see §7.5.

### 4.2 Typography
- `font-headline` → **Playfair Display** (serif, display) — used on recipe titles (`recipe-card`), 16 usages total.
- `font-body` → **Roboto** (sans) — the default body face (only 1 explicit `font-body`; it's the implicit default).
- `font-code` → monospace.
- ⚠️ No defined **type scale**. Headings are ad-hoc (`text-3xl md:text-4xl font-bold`, `text-2xl`, `text-lg`…). The home `<h1>` uses `font-bold` (Roboto), **not** `font-headline` — so the cookbook serif identity is applied inconsistently. **Define a heading scale** (h1–h4 sizes/weights/face) and apply `font-headline` to page/section titles consistently.

### 4.3 Radius
`--radius: 0.5rem`. Tailwind: `lg = radius`, `md = radius-2px`, `sm = radius-4px`, plus an MD3 set `md3-xs 4 / sm 8 / md 12 / lg 16 / xl 28`.
- ⚠️ **Primitive radius is inconsistent:** Button = `rounded-full` (full pill), Badge = `rounded-full`, Card = `rounded-lg` (8px), Input = `rounded-md` (6px). **Decision needed:** pick a coherent radius language (e.g. pill buttons + `md` inputs + `lg` cards is *defensible* but must be deliberate and documented).

### 4.4 Shadow (Material Design 3 elevation scale — defined, barely used)
`shadow-md3-1 … md3-5` exist in config. ⚠️ Used only **3×**; the app otherwise uses plain `shadow-sm/md/lg/xl` **53×**. **Decision:** either adopt the md3 elevation scale app-wide (recommended for consistency) or remove it. Cards currently use `shadow-sm`.

### 4.5 Animation
`accordion-down/up`, `spin-slow`, `pulse-fast`, plus an `animationDelay` scale. `framer-motion` is used in 4 components. `tailwindcss-animate` plugin present. Button has `active:scale-95` + `transition-all`. Keep motion subtle and consistent.

### 4.6 Custom CSS utilities (in globals.css)
`.border-smooth`, `.border-smooth-light`, `.border-smooth-gradient-x/y` — gradient "soft border" helpers. Header/sidebar reimplement these as **inline `style={{}}` linear-gradients** instead of using the classes — consolidate onto the utility classes (or tokens).

---

## 5. Component Library

### 5.1 Primitives (`src/components/ui/`, ~45 files) — shadcn/ui + Radix
accordion, alert, alert-dialog, avatar, badge, bottom-nav, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, dialog, dropdown-menu, form, input, label, loading, menubar, popover, progress, radio-group, scroll-area, select, separator, sheet, skeleton, slider, switch, table, tabs, textarea, toast/toaster, tooltip.
- These are **mostly token-clean** (good base). Notable: `button.tsx` (`cva` variants: default/destructive/outline/secondary/ghost/link; sizes default/sm/lg/icon; all `rounded-full`), `badge.tsx` (default/secondary/destructive/outline, `rounded-full`), `card.tsx` (`rounded-lg border bg-card shadow-sm`; `CardTitle` is `text-2xl`), `input.tsx` (`rounded-md border-input bg-background`).
- A few primitives carry stray `bg-white`/`text-white` (sheet, dialog, alert-dialog) — minor.

### 5.2 Feature components (`src/components/`, ~65 files in subfolders + loose)

**Token-clean groups (leave mostly as-is, light polish only):** `foyer/` (except the calendar, see below), `nutrition/`, `ai/` (except confidence colors), `analytics/`, `admin/` dialogs, `recipe-import/`, `grocery/`, and loose `recipe-card`, `recipe-form`, `shopping-list`, `command-palette`, `enhanced-search-bar`.

**Off-token offenders (priority targets) — by severity:**

1. **Meal-planning / calendar cluster — WORST, top priority.** A whole second palette (espresso/cream) is hardcoded and **does not respond to dark mode** (`dark:` values equal the light values):
   - `components/foyer/foyer-week-calendar.tsx` — `#3D2B1F`, `#2D1F14`, `#4A3426`, `#F5E6D3`, `#D4A574` (the **home page centerpiece**).
   - `components/home-week-view.tsx` — ~37 hardcoded hex.
   - `components/calendar/day-view.tsx` (~36), `day-cell.tsx` (~22), `week-view.tsx` (~12), `month-view.tsx`, `meal-planning-calendar.tsx`.
   - Meal-type accents are hardcoded browns (`#D4A574` breakfast/dinner, `#C9A96E` lunch, `#D2691E` snack). → Needs **meal-type semantic tokens** (§7.3) and a card that uses `bg-card`/`border-border`.
2. **`voice-assistant.tsx`** (~34 named-color uses) + `voice/Overlay.tsx` — orange→red gradient FAB, blue/green chat bubbles, red/green status dots.
3. **`media-upload.tsx`** (~28) — heavy gray/named colors + `bg-white`.
4. **`forecast-to-feast-hero.tsx`** (~22), **`culinary/AromaticsSelector.tsx`** (~22, + `bg-white`), **`culinary/FlavorRadar.tsx`** — inline SVG with hardcoded flavor hexes (#EF4444/#EAB308/#F59E0B/#10B981/#EC4899/#8B5CF6).
5. **`recipe-chat/recipe-chat-interface.tsx`** + `recipe-preview.tsx` — full-page hardcoded gradient, `bg-white`, blue/green bubbles.
6. **`weather-barometer.tsx`** — AQI status via `text-green/yellow/orange/red/purple-600`.
7. **`recipes/animated-background.tsx`** — inline `style={{}}` hex gradients + canvas rgba.
8. **`ai/smart-suggestions-panel.tsx`** — `getConfidenceColor()` returns hardcoded `bg-green/yellow/gray-500`.

**Quantified totals (src/components + src/app):** ~353 off-token named-color utilities · ~255 gray/slate/zinc/neutral utilities · ~60 `bg-white`/`text-white`/`text-black` · ~180 hardcoded hex (concentrated in the calendar cluster) · 18 inline `style={{}}` across 11 files.

---

## 6. Current-State Problems (consolidated, prioritized)

**P0 — visible/broken**
1. **White-on-white home hero.** `app/page.tsx`: hero bg is `placehold.co/1920x1080/FFFFFF/FFFFFF` (blank white), `<h1>` is `text-white` → effectively invisible / fails contrast.
2. **Placeholder images shipped to prod** (all blank white): `recipe-card.tsx:31`, `app/page.tsx:117`, `recipes/recipe-collections.tsx:83`, `recipes/[id]/page.tsx:114`, `collections/page.tsx:19,60`. Need a real on-brand fallback asset/component.
3. **Calendar surface ignores theme + dark mode** (espresso palette hardcoded; the app's actual home centerpiece). See §5.2.1.

**P1 — consistency**
4. Brand name split (Studio1 vs Our Family Table) + `themeColor:#ffffff`.
5. Token bypass at scale (the §5.2 offenders + §5 totals).
6. Primitive radius inconsistency (pill button vs lg card vs md input).
7. MD3 shadow scale defined but ~unused (53× plain shadow vs 3× md3).
8. Typography: no scale; `font-headline` applied inconsistently; only 2 font weights loaded.
9. Two divergent nav menus (sidebar vs bottom-nav) — §3.1.
10. Missing `--chart-*` tokens → charts hardcode hex.

**P2 — cleanup / functional-adjacent (flag, not necessarily Design's job)**
11. Mock weather data wired in `app/page.tsx` and `foyer-week-calendar.tsx` (real `/api/weather/forecast` exists).
12. Dead link: `login-form.tsx` → `/forgot-password` (no route).
13. Cruft files: `src/app/recipes/page-old.tsx`, `src/components/voice-assistant.tsx.backup`.
14. Decorative emoji vs Lucide icon inconsistency.

---

## 7. Target Design Direction & New Tokens to Define

### 7.1 Locked decisions
- **Brand:** "Our Family Table" everywhere (incl. metadata + `themeColor`).
- **Scope:** consistency + polish within the warm beige/brown identity (no palette overhaul unless Design proposes one and it's approved).
- **Rule:** token-first — no raw hex / raw palette utilities in components.
- **Dark mode:** every surface must have a real dark value; verify the calendar surface specifically.

### 7.2 Decisions to make in Design
- Final **radius language** (buttons/inputs/cards) — document it.
- Adopt or drop the **MD3 elevation scale**; if adopt, define which elevation each surface uses (card, dialog, popover, FAB, bottom-nav).
- **Type scale** (h1–h4 + body + caption: face/size/weight/line-height) and where `font-headline` applies. Add any needed font weights to the Google Fonts link.
- **Icon policy:** Lucide-only vs Lucide + sanctioned emoji.
- **Nav model:** reconcile sidebar ↔ bottom-nav into one coherent set.

### 7.3 New semantic tokens — **meal types** (replaces calendar hardcodes)
Define light+dark CSS vars + Tailwind keys, e.g. `--meal-breakfast`, `--meal-lunch`, `--meal-dinner`, `--meal-snack` (each with a `-foreground`/`-muted` as needed). The calendar cluster maps onto these.

### 7.4 New semantic tokens — **status** (replaces admin/badge hardcodes)
`--success`, `--warning`, `--info`, `--danger` (+ `-foreground`, + soft `-muted` background variants). Maps the admin role/difficulty/status badges, settings info/danger boxes, weather AQI, AI confidence, voice status dots — all currently hardcoded green/yellow/blue/red pairs.

### 7.5 New semantic tokens — **charts**
Define `--chart-1 … --chart-5` (light + dark) to back the already-declared Tailwind `chart.*` colors; migrate recharts/`ui/chart.tsx`/`analytics/charts.tsx` off hardcoded hex.

### 7.6 Imagery
Replace all `placehold.co/...FFFFFF/FFFFFF` with a single reusable **on-brand placeholder** (local asset or a `<RecipeImageFallback>` using `muted`/`accent` tokens + a Lucide food glyph). Recipe/collection cards and detail heroes consume it.

---

## 8. Screen-by-Screen Priority Notes (for the Design pass)

1. **Foyer / home (`/`)** — flagship. Fix hero contrast (drop white-on-white; use a real warm kitchen image or a tokened gradient; `font-headline` + `text-foreground` heading). Re-skin **FoyerWeekCalendar** onto card + meal-type tokens with true dark mode. Quick-action cards → `bg-card`/`border-border`. Decide emoji policy. (Weather is mock — design the state; wiring is separate.)
2. **Recipes hub (`/recipes`) + RecipeCard** — define the canonical recipe card (image fallback, `font-headline` title, tag badges, hover elevation from the chosen shadow scale). This card repeats across home, saved, collections, admin.
3. **Recipe detail (`/recipes/[id]`)** — cookbook-feel article; keep print layer intact; real hero fallback.
4. **Meal plan (`/meal-plan`) + calendar family** — the biggest token migration; apply meal-type tokens; verify month/week/day all theme correctly.
5. **Login / Register** — tokenize the Google button (keep the official multicolor Google "G" SVG — that's a required brand asset); design a `/forgot-password` screen or remove the link.
6. **Settings + Admin** — apply status tokens to all badges/info/danger boxes; consistent tab styling.
7. **Cook mode + AI chat + Voice** — replace orange/blue/green hardcodes with primary/accent + status tokens; make full-page gradients token-based and theme-aware.

---

## 9. Definition of Done (acceptance criteria)

- [ ] Zero raw hex and zero raw Tailwind palette utilities (`bg-white`, `text-gray-*`, `from-orange-*`, …) in `src/components` + `src/app` — everything resolves to a token. (Brand-asset SVGs like the Google "G" are the only sanctioned exception.)
- [ ] Light **and** dark mode verified on every page — calendar surface specifically no longer renders dark-on-light in light mode.
- [ ] No `placehold.co` references; a real on-brand image fallback in use.
- [ ] Brand name = "Our Family Table" in UI **and** metadata; `themeColor` set to brand bg.
- [ ] Documented + applied: radius language, shadow/elevation scale, type scale (with `font-headline` usage rule).
- [ ] New tokens defined (meal-type, status, chart) and adopted by their consumers.
- [ ] Sidebar and bottom-nav expose a reconciled destination set.
- [ ] Screenshot verification of home/foyer, recipes, recipe detail, meal-plan, login, settings — light + dark — before sign-off.

## 10. Out of Scope (handle separately, not in the Design pass)
- Backend/auth, Prisma, API wiring (incl. real weather integration, Google OAuth env setup).
- Removing cruft files and the dead `/forgot-password` link are quick code cleanups, not design — note them but they can be a follow-up commit.

---

### Appendix — key files
- Tokens: `src/app/globals.css` · `tailwind.config.ts`
- Shell: `src/app/layout.tsx` · `components/header.tsx` · `components/sidebar.tsx` · `components/ui/bottom-nav.tsx`
- Primitives: `src/components/ui/*`
- Flagship surfaces: `src/app/page.tsx` · `components/foyer/foyer-week-calendar.tsx` · `components/recipe-card.tsx` · `components/calendar/*` · `components/home-week-view.tsx`
