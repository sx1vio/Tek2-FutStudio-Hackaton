---
name: Industrial Excellence System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434656'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ced'
  primary: '#003ec7'
  on-primary: '#ffffff'
  primary-container: '#0052ff'
  on-primary-container: '#dfe3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#005479'
  on-tertiary: '#ffffff'
  tertiary-container: '#006d9c'
  on-tertiary-container: '#cee9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001452'
  on-primary-fixed-variant: '#0038b6'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1'
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  sidebar_width: 280px
  max_content_width: 1440px
---

## Brand & Style

The brand personality of the design system is rooted in **Industrial Precision** and **Operational Intelligence**. It is designed for high-stakes environments where clarity, speed of cognition, and reliability are paramount. The target audience consists of maintenance managers, engineers, and floor supervisors who require an interface that feels like a professional-grade instrument rather than a consumer app.

The visual style is **Corporate / Modern** with a strong lean toward **Minimalism**. It prioritizes a "white-space-first" philosophy to reduce cognitive load in data-heavy environments. By using high-end typography and a restrained color palette, the UI evokes a sense of calm authority and technological sophistication, ensuring that critical maintenance alerts and data visualizations are never obscured by decorative elements.

## Colors

The palette is anchored by a **Primary Blue (#0052FF)**, chosen to represent trust, technology, and stability. This blue is used sparingly for primary actions, active states, and brand touchpoints to maintain its impact. 

The background is a **Pure White (#FFFFFF)** to ensure maximum contrast and a "high-end" clean feel. We utilize a range of cool, subtle greys for borders, dividers, and secondary text to create a clear visual hierarchy without introducing visual noise. 

For functional feedback, a semantic set of colors is defined: 
- **Critical:** High-visibility red for urgent equipment failure.
- **Warning:** Amber for preventative maintenance schedules.
- **Success:** Emerald for completed work orders and healthy system status.

## Typography

This design system utilizes **Inter** exclusively across all levels to ensure maximum legibility and a systematic, utilitarian aesthetic. Inter’s tall x-height and excellent kerning make it ideal for the high-density tables and technical labels common in GMAO systems.

**Headlines** use semi-bold weights with slight negative letter-spacing to appear tight and professional. 
**Body text** is optimized for long-form reading of maintenance logs, utilizing a generous line height (1.6) to prevent eye fatigue. 
**Labels** are frequently used in uppercase with increased letter-spacing to clearly differentiate metadata (like Serial Numbers or Asset IDs) from descriptive text.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. A fixed-width **Sidebar Navigation (280px)** persists on the left, providing immediate access to Assets, Work Orders, and Analytics. The main content area is fluid, expanding to fill the screen up to a **Maximum Content Width of 1440px** to ensure charts and tables do not become unreadable on ultra-wide monitors.

A strict **8px grid system** governs all spatial relationships. 
- **Desktop:** 12-column grid with 24px gutters and 40px outer margins.
- **Tablet:** 8-column grid with 16px gutters and 24px margins.
- **Mobile:** 4-column grid with 16px gutters and 16px margins. Sidebar collapses into a bottom-sheet or "hamburger" drawer.

Content is grouped logically using "Containers" (Cards), with consistent padding of 24px (md) to maintain a rhythm of professional organized space.

## Elevation & Depth

To maintain a clean, high-end feel, the design system avoids heavy shadows. Instead, it utilizes **Tonal Layers** and **Subtle Ambient Shadows**.

1.  **Level 0 (Canvas):** The base background layer in Pure White.
2.  **Level 1 (Cards/Surface):** Elements elevated with a very soft, diffused shadow (Offset: 0, 4px; Blur: 20px; Opacity: 4% Black) and a 1px solid border in a light grey (#E2E8F0). This "Border + Soft Shadow" combination provides a crisp, professional edge.
3.  **Level 2 (Dropdowns/Modals):** Higher elevation using a more pronounced but still diffused shadow (Blur: 30px; Opacity: 8% Black) to indicate temporary interaction layers over the main content.

Interactive elements (buttons) use a subtle inner-light border on hover to simulate a "physical" press without the clutter of traditional skeuomorphism.

## Shapes

The design system employs a **Soft (Level 1)** shape language. This choice of a 4px (0.25rem) base radius reflects the "Precision Instrument" concept—it is more approachable than sharp 90-degree corners but feels more technical and structured than highly rounded "consumer" interfaces.

- **Standard Elements (Inputs, Buttons):** 4px radius.
- **Cards & Large Containers:** 8px (rounded-lg) radius.
- **Status Badges & Tags:** 4px radius to match buttons, maintaining a unified geometric language.
- **Icon Containers:** May use 100% (Circle) for specific notification pips, but generally follow the 4px rule.

## Components

### Buttons
Primary buttons use the Primary Blue background with white text. Secondary buttons use a "Ghost" style: a subtle grey border with primary-colored text. All buttons have a height of 40px for standard actions to ensure a comfortable touch/click target.

### Status Badges (Criticality)
Used for asset health and priority. These are small, caps-locked labels with a subtle tinted background (e.g., 10% opacity of the semantic color) and a dark text overlay for maximum readability. 
- *High:* Red tint / Red text.
- *Medium:* Amber tint / Amber text.
- *Low:* Blue tint / Blue text.

### Data Visualization
Charts should use a custom-tuned color palette derived from the Primary Blue, utilizing different shades and tints (Monochromatic) to ensure technical clarity. Grid lines in charts should be kept to a minimum, using a faint #F1F5F9 grey.

### Input Fields
Fields feature a 1px border (#CBD5E1) that shifts to Primary Blue on focus. Labels are always positioned above the field in `label-md` style for unambiguous data entry.

### Cards
The primary vessel for information. Cards must include a header section with a `headline-sm` title and a body with 24px padding. All cards use the Level 1 Elevation (Border + Soft Shadow).