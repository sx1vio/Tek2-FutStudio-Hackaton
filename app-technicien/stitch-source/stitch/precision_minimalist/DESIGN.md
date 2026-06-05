---
name: Precision Minimalist
colors:
  surface: '#faf9fe'
  surface-dim: '#dad9df'
  surface-bright: '#faf9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f8'
  surface-container: '#eeedf3'
  surface-container-high: '#e9e7ed'
  surface-container-highest: '#e3e2e7'
  on-surface: '#1a1b1f'
  on-surface-variant: '#414755'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f1f0f5'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc1'
  primary: '#0058bc'
  on-primary: '#ffffff'
  primary-container: '#0070eb'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#4c4aca'
  on-secondary: '#ffffff'
  secondary-container: '#6664e4'
  on-secondary-container: '#fffbff'
  tertiary: '#9e3d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c64f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c2c1ff'
  on-secondary-fixed: '#0c006a'
  on-secondary-fixed-variant: '#3631b4'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb595'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#faf9fe'
  on-background: '#1a1b1f'
  surface-variant: '#e3e2e7'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style
The design system is anchored in a **Modern Minimalist** philosophy tailored for high-tech environments. It prioritizes clarity, performance, and a "content-first" interface that feels both sophisticated and effortless. 

The aesthetic identity is defined by high-contrast functional elements against a pristine, expansive white canvas. By utilizing generous whitespace and a strictly governed grid, the design system evokes an emotional response of organized calm and professional reliability. The "high-tech" feel is achieved through the tension between razor-sharp typography and soft, organic container shapes, supported by subtle kinetic depth rather than heavy ornamentation.

## Colors
The palette is dominated by **Pure White (#FFFFFF)** to maximize perceived brightness and cleanliness. This "infinite" background is structured using a scale of soft cool-greys for borders and secondary text, ensuring that the interface never feels "heavy."

**Electric Blue (#007AFF)** serves as the primary action color, providing a vibrant, high-energy contrast that draws the eye to key interactions. Success and Alert colors follow the high-chroma logic of the primary blue, ensuring that system status updates are unmistakable even at small sizes.

- **Primary:** Actionable elements, focus states, and primary brand indicators.
- **Surface:** The base layer for all views; strictly white.
- **Borders:** Use a subtle grey (#F2F2F7) for structural definition without creating visual noise.
- **Neutral:** Used for secondary text and disabled states.

## Typography
This design system utilizes **Inter** exclusively to lean into its systematic and utilitarian strengths. The type scale is designed with a slight tight-tracking on headlines to enhance the "tech" aesthetic, while body copy maintains standard tracking for optimal legibility.

Hierarchy is established through significant weight shifts (Bold for headlines vs. Regular for body) rather than dramatic size changes alone. For mobile, headline sizes are slightly compressed to maintain visual balance on narrow viewports. Use `label-sm` for all-caps styling in small UI components like overlines or metadata tags.

## Layout & Spacing
The layout follows a **Fluid Grid** model based on an 8px square rhythm. All internal component spacing (padding/margins) must be a multiple of 4px or 8px to ensure mathematical harmony.

**Desktop Layout:**
- 12-column grid.
- 24px gutters.
- 48px outer margins.

**Mobile Layout:**
- 4-column grid.
- 16px gutters.
- 16px outer margins.

Use "Generous Whitespace" as a functional tool: use `spacing.xl` to separate distinct sections of a page, ensuring the "Precision Minimalist" feel is maintained by allowing elements room to breathe.

## Elevation & Depth
Depth is communicated through **Ambient Shadows** rather than stark borders. The design system uses three primary elevation levels to establish the Z-axis:

1.  **Level 0 (Flat):** Used for the primary background surface.
2.  **Level 1 (Low):** Soft, diffused shadows (Y: 2px, Blur: 8px, Opacity: 4%) used for secondary cards and interactive inputs.
3.  **Level 2 (High):** Extra-diffused shadows (Y: 10px, Blur: 32px, Opacity: 8%) used for floating action buttons, modals, and dropdown menus.

Layering is further enhanced by **Soft Grey Borders** (#F2F2F7) which act as a "ghost" boundary when shadows are not appropriate, maintaining the minimalist look without sacrificing structure.

## Shapes
The shape language is defined by a consistent **16px (1rem)** radius for all primary containers and cards (`rounded-lg`). This specific roundedness softens the technical rigidity of the Inter typeface and the minimalist grid, making the UI feel approachable.

- **Small Components (Buttons, Tags):** 8px radius.
- **Large Components (Cards, Modals):** 16px radius.
- **Standard Inputs:** 12px radius for a balanced, modern appearance.

## Components

### Buttons
Primary buttons use the Electric Blue background with white text. They should have a subtle Level 1 shadow on hover to indicate interactivity. Secondary buttons use a "ghost" style with a soft grey border (#F2F2F7) and primary blue text.

### Input Fields
Inputs are defined by a white fill and a 1px soft grey border. Upon focus, the border transitions to Primary Blue with a subtle outer glow (2px spread, 10% opacity blue).

### Cards
Cards are the primary container for content. They must use the Level 1 shadow and 16px corner radius. To maintain the "High-Tech" feel, cards should never have heavy borders; a subtle #F2F2F7 stroke is optional if content is very dense.

### Chips & Tags
Use a 4px or 8px radius. Chips for status (Success/Alert) should use a 10% opacity background of the respective color with high-contrast text for accessibility.

### Checkboxes & Radios
These should strictly follow the primary color logic. When selected, they utilize a solid Electric Blue fill. The 16px roundness logic does not apply here; checkboxes maintain a 4px radius for clarity, while radios remain fully circular.