---
version: 1.0
name: Aurora-Fitness-Design-System
description: "A light, energetic mobile health UI built on white card surfaces and a single purple-to-pink gradient signature. The base canvas is clean white with a barely-there lavender wash on auth screens. Every active state — selected tab, CTA button, progress ring, chart bar, active date chip — fires the same deep-violet-to-hot-pink gradient. Cards lift off the background through soft shadows alone (no borders). Poppins Bold anchors the display numerics; Inter carries the labels. The result feels like a modern consumer fitness app: vibrant, personal, and motivating without being loud."

# ─── COLOR TOKENS ────────────────────────────────────────────────────────────

colors:
  # Backgrounds
  bg-primary:       "#FFFFFF"   # Dashboard, session, feature screens
  bg-auth:          "#F7F5FF"   # Auth & onboarding — soft lavender tint
  bg-card:          "#FFFFFF"   # Card surfaces (depth via shadow, not color)
  bg-input:         "#F5F5F8"   # Search bars, text input fields
  bg-chip:          "#F0EEF8"   # Unselected date / filter chips

  # Brand gradient anchors
  # These are not used directly as flat fills — use them inside gradient arrays.
  gradient-start:   "#6D28D9"   # Deep violet
  gradient-mid:     "#A855F7"   # Mid purple-pink
  gradient-end:     "#EC4899"   # Hot pink

  # Module accents (flat fill fallbacks only — prefer gradients for active states)
  accent-purple:    "#7C3AED"   # Progress rings (flat), icon tints, date chip selected bg
  accent-pink:      "#EC4899"   # Calories ring, secondary pink moments
  accent-green:     "#10B981"   # Habit completion, streaks, success
  accent-amber:     "#F59E0B"   # Warnings, nutrition module

  # Sleep card (uses its own separate gradient — darker than primary gradient)
  sleep-card-start: "#3B0764"
  sleep-card-end:   "#9333EA"

  # Text
  text-primary:     "#1E1B2E"   # Headings, data values — charcoal-navy
  text-secondary:   "#6B7280"   # Subtitles, labels, secondary info
  text-muted:       "#9CA3AF"   # Placeholders, disabled
  text-on-gradient: "#FFFFFF"   # Text on any gradient surface

  # Borders (hairlines only — no card borders)
  border-hairline:  "#E5E7EB"   # List separators, input underlines

  # Semantic
  error:            "#EF4444"
  success:          "#10B981"
  overlay-scrim:    "#000000"   # At 40% opacity for modals

# ─── GRADIENT ARRAYS ─────────────────────────────────────────────────────────
# Use as the `colors` prop of <LinearGradient> from expo-linear-gradient.
# Never inline gradient color arrays in components — always reference these tokens.

gradients:
  # Primary brand gradient — CTA buttons, active tab pill, chart bars
  primary:
    colors: ["#6D28D9", "#A855F7", "#EC4899"]
    direction: left-to-right

  # Auth screen circular CTA button
  cta-button:
    colors: ["#7C3AED", "#EC4899"]
    direction: top-left-to-bottom-right

  # Sleep module card background
  sleep-card:
    colors: ["#3B0764", "#6D28D9", "#9333EA"]
    direction: top-left-to-bottom-right

  # Progress bar fill
  progress-bar:
    colors: ["#7C3AED", "#C026D3", "#EC4899"]
    direction: left-to-right

  # Heart rate bar chart bars
  heart-bars:
    colors: ["#EC4899", "#A855F7"]
    direction: bottom-to-top

  # Calories ring stroke
  calories-ring:
    colors: ["#EC4899", "#F472B6"]
    direction: top-to-bottom

  # Steps ring stroke
  steps-ring:
    colors: ["#6D28D9", "#7C3AED", "#A855F7"]
    direction: top-to-bottom

  # Auth & onboarding background wash
  auth-bg:
    colors: ["#F7F5FF", "#EDE9FE", "#DDD6FE"]
    direction: top-to-bottom

# ─── TYPOGRAPHY ──────────────────────────────────────────────────────────────

typography:
  # Poppins Bold — all display sizes, large data values, screen titles
  display-xl:
    fontFamily: Poppins_700Bold
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.10
    letterSpacing: -0.5px
    use: "Auth hero heading (Fitness You Wanna Have)"

  display-lg:
    fontFamily: Poppins_700Bold
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.3px
    use: "Session time value (40 min), module section openers"

  screen-title:
    fontFamily: Poppins_700Bold
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.30
    letterSpacing: 0
    use: "Screen headings (My Activities)"

  card-title:
    fontFamily: Poppins_600SemiBold
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.40
    letterSpacing: 0
    use: "Card labels (Steps, Sleep, Heart, Calories)"

  # Data values — large numerics inside progress rings and session screen
  data-value:
    fontFamily: Poppins_700Bold
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.00
    letterSpacing: -0.5px
    use: "2285, 8:00, 357 — the big number inside every card"

  data-unit:
    fontFamily: Inter_400Regular
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.30
    letterSpacing: 0
    use: "Steps, Hours, kcal, bpm — small unit label below data value"

  # Inter — body, labels, metadata
  body-lg:
    fontFamily: Inter_400Regular
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: -0.1px
    use: "Lead body copy, input placeholders"

  body:
    fontFamily: Inter_400Regular
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0
    use: "Default body text, list item labels"

  body-sm:
    fontFamily: Inter_400Regular
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0
    use: "Card secondary text, timestamps, eyebrows"

  button:
    fontFamily: Inter_600SemiBold
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.40
    letterSpacing: 0
    use: "Pill button labels, tab selector text"

  caption:
    fontFamily: Inter_400Regular
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.30
    letterSpacing: 0.2px
    use: "Current Session label, intensity subtitle, date chip month"

# ─── BORDER RADIUS ───────────────────────────────────────────────────────────

rounded:
  xs:   4px    # Tiny badges, notification dots
  sm:   8px    # Date chips, schedule day pills, image frames
  md:   12px   # Input fields, small chips
  lg:   20px   # Standard cards (Steps, Heart, Calories)
  xl:   24px   # Auth bottom card, modals, large panels
  pill: 50px   # Search bars, ALL pill buttons, tab selectors
  full: 9999px # Circular CTA button, mic button, avatar, progress thumb

# ─── SPACING ─────────────────────────────────────────────────────────────────

spacing:
  xxs:  4px
  xs:   8px
  sm:   12px
  md:   16px
  lg:   20px
  xl:   24px
  xxl:  32px
  xxxl: 48px

# ─── ELEVATION / SHADOW ──────────────────────────────────────────────────────
# Cards and panels use shadow exclusively for depth — no borders on white cards.

elevation:
  card:
    ios:
      shadowColor:   "#9499A7"
      shadowOpacity: 0.15
      shadowOffset:  "{ width: 0, height: 4 }"
      shadowRadius:  20
    android:
      elevation: 6
    use: "Standard white card (Steps, Heart, Calories, session schedule chips)"

  card-subtle:
    ios:
      shadowColor:   "#9499A7"
      shadowOpacity: 0.08
      shadowOffset:  "{ width: 0, height: 2 }"
      shadowRadius:  10
    android:
      elevation: 3
    use: "Date chips (unselected), search bar"

  modal:
    ios:
      shadowColor:   "#000000"
      shadowOpacity: 0.20
      shadowOffset:  "{ width: 0, height: 8 }"
      shadowRadius:  32
    android:
      elevation: 12
    use: "Bottom sheets, modals, popovers"

# ─── COMPONENTS ──────────────────────────────────────────────────────────────

components:

  # ── Buttons ────────────────────────────────────────────────────────────────

  button-cta-circle:
    description: "Circular gradient CTA on auth screen — primary action"
    shape: circle
    size: 56px
    gradient: "{gradients.cta-button}"
    gradient-direction: top-left-to-bottom-right
    icon: arrow-right (white, 22px)
    rounded: "{rounded.full}"
    shadow: "{elevation.card}"

  button-primary-pill:
    description: "Gradient pill button — used for primary actions on white surfaces"
    gradient: "{gradients.primary}"
    gradient-direction: left-to-right
    textColor: "{colors.text-on-gradient}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "12px 28px"
    minHeight: 48px

  button-secondary-pill:
    description: "White pill with purple text — secondary actions"
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.accent-purple}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "12px 28px"
    border: "1.5px solid {colors.accent-purple}"
    minHeight: 48px

  button-text-link:
    description: "Plain text link — Forget Details, Create account"
    backgroundColor: transparent
    textColor: "{colors.text-secondary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: "4px 8px"

  # ── Tab Selector ──────────────────────────────────────────────────────────

  tab-selected:
    description: "Active time period pill — Daily, Weekly, Monthly, Yearly"
    gradient: "{gradients.primary}"
    gradient-direction: left-to-right
    textColor: "{colors.text-on-gradient}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "8px 20px"

  tab-default:
    description: "Inactive tab — no background, gray text"
    backgroundColor: transparent
    textColor: "{colors.text-secondary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "8px 20px"

  # ── Input Fields ──────────────────────────────────────────────────────────

  search-bar:
    description: "Pill-shaped search bar on dashboard"
    backgroundColor: "{colors.bg-input}"
    textColor: "{colors.text-primary}"
    placeholderColor: "{colors.text-muted}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "12px 16px"
    iconLeft: search (gray, 18px)
    shadow: "{elevation.card-subtle}"

  text-input-underline:
    description: "Auth screen form field — icon + text + underline only"
    backgroundColor: transparent
    textColor: "{colors.text-primary}"
    placeholderColor: "{colors.text-muted}"
    typography: "{typography.body-lg}"
    border-bottom: "1px solid {colors.border-hairline}"
    iconLeft: 18px (email icon, lock icon) in "{colors.text-muted}"
    padding: "14px 0px"

  # ── Cards ─────────────────────────────────────────────────────────────────

  metric-card:
    description: "White metric card — Steps, Heart, Calories"
    backgroundColor: "{colors.bg-card}"
    rounded: "{rounded.lg}"
    padding: 16px
    shadow: "{elevation.card}"
    border: none
    layout: "Icon action top-right, data-value + data-unit center or bottom-left"

  sleep-card:
    description: "Gradient sleep metric card"
    gradient: "{gradients.sleep-card}"
    gradient-direction: top-left-to-bottom-right
    rounded: "{rounded.lg}"
    padding: 16px
    textColor: "{colors.text-on-gradient}"
    icon: moon (white, 20px, top-right)
    shadow: "{elevation.card}"

  auth-bottom-card:
    description: "White card that rises from bottom of auth screen"
    backgroundColor: "{colors.bg-card}"
    rounded: "{rounded.xl}"
    padding: 28px
    shadow: "{elevation.modal}"
    border: none
    layout: "Title top, inputs stacked, links row, CTA circle bottom-right"

  session-card:
    description: "Session info area — no card chrome, just content on white bg"
    backgroundColor: transparent
    padding: "0 24px"

  # ── Date Chips (Schedule Strip) ───────────────────────────────────────────

  date-chip-default:
    description: "Unselected day in schedule strip"
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
    shadow: "{elevation.card-subtle}"
    minWidth: 44px

  date-chip-selected:
    description: "Selected day — filled deep purple"
    backgroundColor: "{colors.gradient-start}"
    textColor: "{colors.text-on-gradient}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
    minWidth: 44px
    badge: "bell icon below chip in white"

  # ── Progress Elements ─────────────────────────────────────────────────────

  progress-ring:
    description: "Circular SVG ring inside metric cards"
    trackColor: "{colors.bg-input}"
    strokeWidth: 8px
    strokeLinecap: round
    size: "96px (dashboard cards) / 120px (detail screens)"
    gradient: "SVG <linearGradient> defs — steps use {gradients.steps-ring}, calories use {gradients.calories-ring}"

  progress-bar:
    description: "Horizontal gradient bar — session progress"
    track:
      backgroundColor: "{colors.bg-input}"
      height: 6px
      rounded: "{rounded.full}"
    fill:
      gradient: "{gradients.progress-bar}"
      height: 6px
      rounded: "{rounded.full}"
    thumb:
      size: 20px
      backgroundColor: "{colors.bg-card}"
      rounded: "{rounded.full}"
      shadow: "{elevation.card}"
      border: "2px solid {colors.accent-purple}"

  heart-chart:
    description: "Bar chart inside Heart card — gradient bars bottom-to-top"
    bar-gradient: "{gradients.heart-bars}"
    bar-width: 6px
    bar-rounded: "{rounded.xs}"
    bar-spacing: 4px
    bar-count: 7
    label: "110 bmp — body-sm below chart"

  # ── Navigation ────────────────────────────────────────────────────────────

  top-bar:
    description: "Screen top bar — icon left + avatar right"
    backgroundColor: transparent
    height: 56px
    left: "Grid/menu icon — {colors.text-secondary} — 24px"
    right: "User avatar — 36px circle — {rounded.full}"

  bottom-tab-bar:
    description: "Main tab navigation"
    backgroundColor: "{colors.bg-card}"
    shadow: "{elevation.modal}"
    height: 64px
    rounded: "top corners only — {rounded.xl}"
    active-icon-color: "{colors.accent-purple}"
    inactive-icon-color: "{colors.text-muted}"

  list-row:
    description: "Expandable info rows (Daily Meals, Other Information)"
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    padding: "16px 20px"
    separator: "1px {colors.border-hairline}"
    icon-right: "chevron or info icon — {colors.text-muted} — 20px"
    shadow: "{elevation.card}"
    rounded: "{rounded.lg}"

  # ── Voice Companion ───────────────────────────────────────────────────────

  mic-button-idle:
    description: "Mic CTA — same gradient circle language as auth CTA"
    gradient: "{gradients.cta-button}"
    size: 72px
    rounded: "{rounded.full}"
    icon: microphone (white, 28px)
    glow: "rgba(124, 58, 237, 0.25) — 0 0 24px"

  mic-button-listening:
    gradient: "{gradients.primary}"
    size: 72px
    rounded: "{rounded.full}"
    pulse-ring: "animated ring expanding from 72px → 96px, opacity 0 → 0.3, gradient stroke"

---

## Overview

Aurora's visual identity is built on a single tension: pure white surfaces interrupted by a deep-violet-to-hot-pink gradient that fires on every active state. The canvas never competes with the data — white cards on a near-white background let numbers breathe. The gradient does the work of communicating energy, progress, and selection without decorating every surface.

**Three visual layers:**

1. **White canvas** — `{colors.bg-primary}` on dashboard and feature screens. Clean, clinical-free, modern consumer.
2. **Lavender-wash canvas** — `{colors.bg-auth}` (or `{gradients.auth-bg}`) on auth and onboarding only. Signals "you're not in the app yet" and creates warmth for the illustrated fitness characters.
3. **Gradient surface** — `{gradients.primary}`, `{gradients.sleep-card}`, `{gradients.cta-button}` — appears only on active / featured elements. Never decorative.

---

## Key Characteristics

- **White cards, shadow depth.** Cards lift off the background through `{elevation.card}` shadow only. No borders on cards. The shadow is the only edge signal.
- **One gradient, many uses.** The deep-violet-to-hot-pink gradient fires consistently across: CTA circles, active tab pills, progress ring strokes, chart bars, and progress bar fill. Seeing purple-pink anywhere in the UI means "active, selected, progressing."
- **Poppins Bold owns the numbers.** Every large data value (2285, 8:00, 357, 40 min) is Poppins Bold. Inter carries labels and body copy. The distinction is immediate — numerics jump out, text settles back.
- **Progress rings are the hero components.** Steps, Calories, and future hydration all use gradient SVG rings. The ring + number combination is the core data presentation unit.
- **Sleep card is the exception.** It uses `{gradients.sleep-card}` (deep purple) as its surface — the only metric card that is not white. This makes sleep visually distinct from the rest and signals rest/night visually.
- **Illustrations add warmth.** Fitness character illustrations on auth (yoga pose) and session screens (treadmill runner) prevent the UI from reading as clinical. They always appear in the same purple/pink gradient palette.

---

## Color Usage Rules

### Do
- Use `{gradients.primary}` for every active, selected, or in-progress state.
- Use `{colors.bg-primary}` (#FFFFFF) as the background of all dashboard and feature screens.
- Use `{colors.bg-auth}` or `{gradients.auth-bg}` only on auth and onboarding screens.
- Keep card backgrounds white — let shadow do the elevation work.
- Use `{colors.accent-green}` for habit completion checkmarks and streak counters.
- Use `{colors.text-primary}` (#1E1B2E) for all heading and value text.
- Use `{colors.text-secondary}` (#6B7280) for subtitles, labels, and unselected tab text.

### Don't
- Don't use dark backgrounds (`#0A0E1A`, `#131929`) anywhere — those are the old Aurora dark theme and must not appear.
- Don't add borders to white cards on white backgrounds.
- Don't use flat purple (`{colors.accent-purple}`) for primary CTAs — always use the gradient.
- Don't apply the gradient to text — only to surfaces and SVG strokes.
- Don't show more than one gradient CTA button per screen — the gradient should feel special.
- Don't mix the sleep card gradient with any other card surface.
- Don't use `{colors.accent-amber}` as a background surface — it is a warning signal only.

---

## Typography Rules

- Weight carries hierarchy on body copy, not size — `Inter_600SemiBold` label vs `Inter_400Regular` description, same 14px.
- Poppins is reserved for display sizes and large numerics. Never use Poppins at 12px or below.
- Negative letter-spacing at display sizes only (`-0.5px` at 40px, `-0.3px` at 32px).
- All data values inside rings use `{typography.data-value}` (Poppins Bold 28px). The unit below uses `{typography.data-unit}` (Inter Regular 12px). Never the same font.

---

## Elevation Rules

- Level 0: Gradient surfaces (sleep card, CTA button) — no shadow added, the color is the depth signal.
- Level 1 `{elevation.card}`: White metric cards (Steps, Calories, Heart), auth bottom card, list rows.
- Level 2 `{elevation.card-subtle}`: Search bar, unselected date chips, secondary surfaces.
- Level 3 `{elevation.modal}`: Bottom sheets, modals, mic button overlay panels.

---

## Layout & Spacing

- Screen horizontal padding: `{spacing.xl}` (24px) on all screens.
- Dashboard card grid: 2 columns, `{spacing.md}` (16px) gap between cards.
- Section gap between "My Activities" title and search bar: `{spacing.sm}` (12px).
- Section gap between search bar and tabs: `{spacing.md}` (16px).
- Card internal padding: `{spacing.md}` (16px) on all metric cards.
- Auth card internal padding: `{spacing.xl}` (24px).
- Input field vertical spacing: `{spacing.lg}` (20px) between each field.
- Schedule strip: horizontal scroll, `{spacing.xs}` (8px) between date chips.
- Progress bar track height: 6px. Thumb size: 20px. Always vertically centered on track.

---

## Progress Ring Specification

```svg
<!-- Steps ring (96×96 viewBox) -->
<svg width="96" height="96" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="stepsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#6D28D9" />
      <stop offset="50%" stopColor="#7C3AED" />
      <stop offset="100%" stopColor="#A855F7" />
    </linearGradient>
  </defs>
  <!-- Track -->
  <circle cx="48" cy="48" r="40" fill="none" stroke="#F5F5F8" strokeWidth="8" />
  <!-- Progress arc — strokeDasharray animated by Reanimated -->
  <circle
    cx="48" cy="48" r="40"
    fill="none"
    stroke="url(#stepsGrad)"
    strokeWidth="8"
    strokeLinecap="round"
    strokeDasharray="251.2"
    strokeDashoffset="{calculated from progress %}"
    transform="rotate(-90 48 48)"
  />
</svg>
```

Animate `strokeDashoffset` with React Native Reanimated `useSharedValue` + `withTiming` on mount.

---

## Screen Layout Reference

### Login Screen
```
┌─────────────────────────────────┐
│ [Logo icon top-right]            │
│                                  │
│   "Fitness                       │
│    You Wanna                     │
│    Have"      [Fitness Illustration]
│                                  │
│ ╔══════════════════════════════╗ │
│ ║ Please Login                 ║ │
│ ║                              ║ │
│ ║ ✉  Username@gmail.com        ║ │
│ ║ ───────────────────────────  ║ │
│ ║ 🔒  •••••••••   [eye icon]   ║ │
│ ║ ───────────────────────────  ║ │
│ ║                              ║ │
│ ║ Forget Details?  Create acct ║ │
│ ║                    [→ CTA]   ║ │
│ ╚══════════════════════════════╝ │
└─────────────────────────────────┘
CTA = 56px circle, gradients.cta-button, white arrow
```

### Dashboard Screen
```
┌─────────────────────────────────┐
│ [⊞ grid icon]      [👤 avatar]  │
│                                  │
│ My Activities                    │
│                                  │
│ [🔍 Search...                 ] │  ← pill, bg-input
│                                  │
│ [Daily] Weekly  Monthly  Yearly  │  ← Daily = gradient pill
│                                  │
│ ┌──────────────┐ ┌──────────────┐│
│ │ Steps    [✏] │ │ Sleep    [🌙]││
│ │              │ │   8:00       ││ ← gradient card
│ │   (ring)     │ │   Hours      ││
│ │   2285       │ └──────────────┘│
│ │   Steps      │ ┌──────────────┐│
│ └──────────────┘ │ Calories [⊙] ││
│ ┌──────────────┐ │              ││
│ │ Heart    [♥] │ │   (ring)     ││
│ │ [bar chart]  │ │   357        ││
│ │ 110 bmp      │ │   kcal       ││
│ └──────────────┘ └──────────────┘│
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Daily Meals                🍎│ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Other Information           ℹ│ │
│ └──────────────────────────────┘ │
└─────────────────────────────────┘
```

### Session Screen
```
┌─────────────────────────────────┐
│ ‹                             🔍│
│                                  │
│ Current Session                  │  ← caption, text-secondary
│ 40 min                           │  ← display-lg, Poppins Bold
│ Medium Intensity                 │  ← caption, text-secondary
│                                  │
│ Schedule              Aug, 2020  │
│                                  │
│  10  [11]  12   13   14          │  ← date chips
│   S   S    M    T    W           │    selected = gradient-start bg
│       [🔔]                       │
│                                  │
│ Your Progress                    │
│ ┌──────────────────────────────┐ │
│ │████████████████████████○     │ │  ← gradient progress bar
│ └──────────────────────────────┘ │
│ 40 min / 150 min                 │
│                                  │
│              [🏃 runner illus.]  │
└─────────────────────────────────┘
```

---

## Iteration Guide

1. Reference all colors via `{colors.*}` and all gradients via `{gradients.*}` — never use raw hex values in components.
2. When adding a new metric card: default to white + shadow. Only use a gradient surface for a card if it represents a fundamentally different state (e.g., sleep = rest = dark purple).
3. Default body typography to `{typography.body}` (Inter 14px Regular). Reach for `{typography.body-lg}` only for lead paragraphs or input fields.
4. Every new CTA must use `{gradients.primary}` or `{gradients.cta-button}`. Never use a flat colored button for a primary action.
5. Progress rings and bars are the highest-fidelity components — animate them with Reanimated `withTiming` on mount and on value change.
6. Keep `{colors.accent-green}` scarce — only habit completion, streak counts, and success toasts. It should feel like a reward signal.
7. Keep the screen horizontal padding consistent at `{spacing.xl}` (24px) across all screens.

---

## Known Constraints

- `expo-linear-gradient` is required for all gradient surfaces. Install it if not already present: `npx expo install expo-linear-gradient`.
- Progress ring gradient strokes require SVG `<linearGradient>` defs inside the SVG — React Native SVG does not support CSS gradient syntax. Use `react-native-svg` defs block as shown in the Progress Ring Specification above.
- Poppins Bold requires `@expo-google-fonts/poppins`. Required weights: `Poppins_600SemiBold`, `Poppins_700Bold`.
- Inter requires `@expo-google-fonts/inter`. Required weights: `Inter_400Regular`, `Inter_600SemiBold`.
- Android shadow (`elevation`) does not support colored shadows. The shadow color (#9499A7) is iOS only. Android will render a neutral gray shadow at the given elevation level — this is acceptable.
- The auth background gradient (`{gradients.auth-bg}`) should fill the entire screen using `<LinearGradient style={{ flex: 1 }}>` as the root container, not as a card background.