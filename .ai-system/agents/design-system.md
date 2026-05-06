# Design System

This design system defines the initial visual language for the dashboard UI.
It emphasizes clarity, strong hierarchy, and a warm, confident brand tone.
The system is meant to be consistent across all admin pages and data-heavy views.
Use these rules unless a feature explicitly requires a new pattern.

## Visual Language
The visual language is modern and editorial with warm neutrals and sharp contrast.
Tokens below define the base palette, typography, and spacing.

### Colour Palette

| Token | Value | Usage |
|-------|-------|-------|
| primary | #0F2A3D | Primary buttons, links, highlights |
| secondary | #FFB84D | Accent, badges, callouts |
| background | #F6F1EA | App background |
| surface | #FFFFFF | Cards, modals, panels |
| text-primary | #1B1B1B | Main body text |
| text-muted | #5A5A5A | Labels, captions |
| danger | #D64545 | Errors, destructive actions |
| success | #1F8A4C | Success states |

### Typography

| Style | Font | Size | Weight |
|-------|------|------|--------|
| Heading 1 | Space Grotesk | 32px | 600 |
| Heading 2 | Space Grotesk | 24px | 600 |
| Body | IBM Plex Sans | 16px | 400 |
| Caption | IBM Plex Sans | 13px | 400 |
| Code | IBM Plex Mono | 13px | 500 |

### Spacing Scale

Use a 4px base unit: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

## Component Patterns
These components should be reused across pages to maintain consistency.
If a new component is required, document it here.

### Buttons
- Primary: solid primary background, white text
- Secondary: transparent background, primary border and text
- Destructive: danger background, white text
- Disabled state: 40 percent opacity, no hover

### Forms
- Inputs: 1px border, 8px radius, clear focus ring
- Errors: inline, left-aligned, danger color
- Submit buttons: show loading state and prevent double submit

### Navigation
- Use a left sidebar with icon + label, active state uses primary

### Cards / Containers
- White surface, subtle shadow, 12px radius, 16-24px padding

### Modals / Dialogs
- Centered modal with overlay, primary CTA on right

## UX Principles
These principles define how the UI should feel to operators.
They apply to every page and interaction.

1. Always show loading and empty states for async data
2. Destructive actions require confirmation
3. Errors must explain how to recover
4. All views must remain usable at 320px wide

## Responsive Breakpoints

| Breakpoint | Value | Target |
|------------|-------|--------|
| sm | 640px | Mobile |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Wide screens |

## Accessibility Requirements
These are the minimum standards for WCAG AA alignment.
Do not ship UI that fails these checks.

- All interactive elements must have keyboard focus states
- Colour contrast must meet WCAG AA (4.5:1 for text)
- Images must have alt text
- Forms must have associated labels

