---
name: Cyber Bento
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#303032'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#ffb869'
  on-tertiary: '#482900'
  tertiary-container: '#ca801e'
  on-tertiary-container: '#3f2300'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffdcbb'
  tertiary-fixed-dim: '#ffb869'
  on-tertiary-fixed: '#2c1700'
  on-tertiary-fixed-variant: '#673d00'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
  glass-surface: rgba(255, 255, 255, 0.04)
  glass-border: rgba(255, 255, 255, 0.1)
  bg-deep: '#0A0A0C'
  text-muted: '#94A3B8'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 64px
    fontWeight: '800'
    lineHeight: 72px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
  chat-bubble:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '450'
    lineHeight: 22px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 2rem
  gutter-bento: 1.5rem
  card-padding: 1.5rem
  stack-sm: 0.5rem
  stack-md: 1rem
---

## Brand & Style

This design system embodies a **Futuristic Glassmorphism** aesthetic tailored for a high-end, "million-dollar" chat platform. The personality is professional yet immersive, prioritizing low-friction interactions through a modular **Bento UI** layout. 

The visual narrative relies on depth and translucency. By layering frosted glass surfaces over a deep charcoal foundation, the UI creates a sense of infinite digital space. Neon accents in Electric Violet and Cyber Cyan act as high-energy beacons for interactivity, while generous whitespace and heavy roundedness (24px+) ensure the interface remains approachable and premium.

**Key Stylistic Pillars:**
- **Glassmorphism 2.0:** Use of backdrop blurs and semi-transparent white borders (0.1 opacity) to define surfaces.
- **Bento Modularization:** Content is organized into distinct, rounded tiles that scale logically within a grid.
- **Neon Precision:** Interactive elements utilize 1px glowing strokes and subtle outer glows to signify active states.

## Colors

The palette is strictly dark-mode, designed to make the accent colors "pop" with cinematic intensity.

- **Primary (Electric Violet):** Reserved for the most important calls to action and "Start Chat" states.
- **Secondary (Cyber Cyan):** Used for status indicators (online), video overlays, and secondary functional highlights.
- **Neutral (Deep Charcoal):** The base container color. A slightly darker `#0A0A0C` should be used for the global background to create contrast with the `#121214` Bento tiles.
- **Glass Layers:** Surfaces are created using `glass-surface` with a `blur(12px)` filter. Borders should be a thin 1px `glass-border` to simulate light catching the edge of the glass.

## Typography

Typography focuses on high-contrast legibility and a technical, modern edge. **Geist** is the primary driver for its precise, geometric nature.

- **Display & Headings:** Use heavy weights (700-800) with tight letter spacing for a punchy, editorial feel.
- **Body & Chat:** Body text uses a slightly increased weight (450) to ensure readability against dark, translucent backgrounds.
- **Utility:** **JetBrains Mono** is introduced for labels and metadata (e.g., timestamps, user IDs) to reinforce the futuristic, "coded" aesthetic.

## Layout & Spacing

This design system uses a **Fixed Grid Bento** model. Content is housed in modular containers that adhere to a 12-column grid on desktop, reflowing to a single column on mobile.

- **Bento Logic:** Tiles should have a consistent gutter of `1.5rem`. Internal padding of cards is strictly `1.5rem` to maintain a spacious, premium feel.
- **Breakpoints:**
  - **Desktop (1280px+):** Full 12-column Bento dashboard.
  - **Tablet (768px - 1279px):** 6-column grid; sidebar collapses to an icon-only dock.
  - **Mobile (Under 768px):** Single column stack; Bento tiles become full-width cards with `1rem` margins.

## Elevation & Depth

Depth is established through **Tonal Layering** and **Backdrop Blurs** rather than traditional shadows.

- **Level 0 (Base):** `#0A0A0C` solid background.
- **Level 1 (Bento Tiles):** `#121214` background with 1px `glass-border`.
- **Level 2 (Overlays/Popovers):** `glass-surface` (rgba 255, 255, 255, 0.04) with `backdrop-filter: blur(20px)`.
- **Active States:** For active chat bubbles or selected tiles, apply a `0 0 20px rgba(139, 92, 246, 0.15)` outer glow to simulate a neon emission.

## Shapes

The shape language is characterized by "Hyper-Rounded" corners to offset the technicality of the dark theme and monospaced accents.

- **Bento Tiles:** Use `rounded-xl` (1.5rem/24px) as the standard.
- **Interactive Elements:** Buttons and input fields should follow `rounded-lg` (1rem/16px).
- **Avatars:** 2D avatars should be contained in circles or "squircle" shapes with a 32% curvature to maintain the premium software feel.

## Components

### Buttons
- **Primary:** Solid Electric Violet background, white text. On hover, apply a 2px Cyber Cyan outer glow.
- **Secondary:** Ghost style with a 1px white border (0.2 opacity). Background becomes `glass-surface` on hover.

### Bento Cards
- Every card must have a 1px border. Use `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))` for the stroke to simulate natural light.

### Chat Bubbles
- **Stranger:** Subtle gray glass bubble (`#1E1E20`) aligned left.
- **User:** Electric Violet to Deep Purple gradient bubble aligned right. 
- **Transitions:** Messages should "slide and fade" upward with a 300ms spring physics curve.

### Input Fields
- Darker than the Bento tile (`#0A0A0C`), 1px border. When focused, the border transitions to a 1px Cyber Cyan neon stroke with a subtle glow.

### Chips/Interests
- Small, pill-shaped containers with a background of `rgba(255, 255, 255, 0.05)` and `label-caps` typography.