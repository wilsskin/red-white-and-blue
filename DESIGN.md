# Design System — Red White and Blue

Read this before making any visual change. It's a decision tool, not a documentation dump.

All token values live on `:root` via `snippets/head-variables.liquid` from `config/settings_data.json`. This file tells you **which token to use when** — not what the values are.

---

## Brand

A patriotic, liberal Democratic community shop. Blue is the political identity and the visual identity. Red-white-and-blue is the name, but **blue dominates, white gives it air, red is a signal only**.

Fonts: **Oswald** for headings (condensed, American, campaign-poster energy), **Inter** for everything else.

---

## Color Rules

There are five color roles. Every surface, text, and accent in the store maps to one of these:

**1. Brand (blue):** `--color-accent` and its derivatives (`--solid-button-background`, `--color-header-links-hover`, `--white-button-label`). Use for any element that says "this is us" — CTAs, active states, hover states, the footer background, the announcement bar background. There is exactly one accent color. Do not introduce a second.

**2. Surface:** `--bg-body` (page background, off-white), `--color-drawer-bg` (panels/drawers, pure white). The two-layer system is intentional — drawers/modals float on white against the off-white page. New panels and elevated surfaces should use `--color-drawer-bg`.

**3. Text:** `--color-heading` for headings, `--color-body` for everything else. These are warm near-blacks, not pure `#000`. Use `--color-body` as the default; `--color-heading` only on actual headings and elements using `.h1`–`.h6` classes.

**4. Border:** `--color-border` for structural dividers, `--color-form-border` for input outlines. Don't hardcode grey hex values.

**5. Signal (functional only):** `--color-badge-sale` (red — sale/urgency), `--color-star` (amber — ratings), `--color-inventory-instock` / `--color-inventory-lowstock`, `--color-price-discounted`. These carry meaning and must never be used decoratively. **Red must never appear outside of sale badges** — in this brand context it carries Republican associations.

**Hover rule:** All hover states on the blue darken by 7% (handled automatically by `color_darken: 7` in Liquid). Don't invent hover colors.

**Icon rule:** Icons inherit color from their parent via `currentColor`. Change the parent's text color, not the icon's `fill`.

---

## Typography Rules

**Two fonts, no exceptions:** Oswald for headings and heading-styled elements, Inter for body, UI, labels, and buttons.

**When to use which size:**

| If you're building... | Use |
|----------------------|-----|
| Page/section title | `h1` / `.h1` — only one per page |
| Section heading | `h2` / `.h2` |
| Sub-section or card heading | `h3` / `.h3` |
| Component heading (e.g. sidebar title, drawer title) | `h4`–`h5` |
| Label, caption, meta text | `h6` or body at `0.8125rem` |
| Body copy | Default body size (`1.0625rem`, line-height 1.6) |
| Button label | `0.9375rem`, weight 500 (`--font-body-medium-weight`) |

The type scale is responsive — headings scale down automatically at mobile breakpoints (defined in `app.css`). Don't add your own responsive font-size overrides unless the existing scale doesn't cover your case.

**Weight rules:**
- Regular text: weight 400 (default)
- UI emphasis (button labels, form labels, bold inline): weight 500 via `--font-body-medium-weight`
- Strong emphasis (`<strong>`): weight 600 via `--font-body-bold-weight`
- Never use `font-weight: bold` literally — always use the variable

**Letter-spacing:** Headings are tightened (`--font-heading-letter-spacing`, ~`-0.02em`). Body is normal. Button spacing is 0. Don't change these.

---

## Spacing Rules

All spacing uses the **8px grid**. Every margin and padding value must be one of these steps:

| Step | Value | When to reach for it |
|------|-------|----------------------|
| 1 | **4px** | Micro only: icon-to-label gaps, badge internal padding, tight inline spacing |
| 2 | **8px** | Tight component internals: small button padding, tag padding, input vertical padding |
| 3 | **12px** | Compact component gaps: between label and input, list item padding |
| 4 | **16px** | Standard gap: between sibling elements, card internal padding (mobile), heading-to-content |
| 5 | **24px** | Comfortable gap: card internal padding (desktop), between-component breathing room |
| 6 | **32px** | Generous gap: between groups of components, section header to content |
| 7 | **40px** | Large internal: drawer content padding (desktop), panel padding |
| 8 | **48px** | Section-level: large component breathing room, page horizontal padding (desktop) |
| 9 | **80px** | Section vertical spacing — `var(--section-spacing-desktop)` |

**Grid gutters are not spacing tokens.** The Foundation 6 column gutters (`0.25rem` mobile / `0.9375rem` desktop) are structural framework values — do not change them.

### Fixed spacing rules

These are set in `config/settings_data.json` or `theme.liquid` and should not be overridden in CSS:

| What | Value | Source |
|------|-------|--------|
| Section spacing desktop | `var(--section-spacing-desktop)` — 80px | Settings |
| Section spacing mobile | `var(--section-spacing-mobile)` — ~50px | Settings |
| Grid max content width | `var(--grid-width)` — 1200px | Settings |
| Grid max row width | `var(--grid-width-row)` — 1380px | Settings |
| Grid column gutter mobile | 0.25rem (4px) per side | Foundation 6 |
| Grid column gutter desktop | 0.9375rem (15px) per side | Foundation 6 |

**Rule:** Don't add section-level vertical padding in CSS. Sections control their own vertical spacing via `--section-spacing-desktop/mobile` from their schema settings.

---

## Border Radius Rules

**Only two values are allowed: 8px and 16px.** Every rounded element uses one of these. The only acceptable exceptions are `0` (intentional resets), `50%`/`100%` (circles), and `500px` (pill shapes, used sparingly).

| Tier | Variable | Value | When to use |
|------|----------|-------|-------------|
| **Cards / panels / modals / buttons** | `var(--block-border-radius)` / `var(--button-border-radius)` | 16px | Any container or interactive element: product cards, drawers, dropdowns, buttons, gallery items, side panels |
| **Inputs** | `var(--input-border-radius)` | 8px | Text inputs, textareas, selects, progress bars, sliders. Intentionally less rounded — inputs are utilitarian, buttons are branded. |

Use `var(--block-border-radius)` or `var(--button-border-radius)` for 16px elements, and `var(--input-border-radius)` for 8px elements — never hardcode the pixel value.

For pill-shaped elements (e.g. marketing CTAs, badge tags): `border-radius: 500px`. Use sparingly.

---

## Responsive Rules

**Breakpoints** (Foundation 6, mobile-first):

| Name | Min width | When to use |
|------|-----------|-------------|
| small | 0px | Default — write styles here first |
| medium | 768px | Tablet: multi-column layouts, larger gutters, expanded padding |
| large | 1068px | Desktop: full mega menu, max column counts, wide drawers |
| xlarge | 1200px | Rarely needed — it's the grid max-width, not a layout change |

**Always mobile-first.** Base styles = mobile. `@media (min-width: 768px)` adds tablet. `@media (min-width: 1068px)` adds desktop. Never use `max-width` queries.

**Layout rules by breakpoint:**
- Below 768px: single column. Never force more than 2 columns.
- 768px+: multi-column grids, sidebar filters, side-by-side product media.
- 1068px+: full mega menu replaces hamburger, drawers get fixed width (380–480px), max product grid columns.

**Button rule:** Full-width (`.button.full`) inside mobile forms. Auto-width on desktop. Minimum height: 32px (`.button.small`).

**Image rule:** Always `max-width: 100%`. Product images use portrait aspect ratio by default (set in settings, don't override).

---

## Shadow Rules

Three shadow tiers, accessed via CSS custom properties defined in `snippets/head-variables.liquid`:

| Tier | Variable | Value | When to use |
|------|----------|-------|-------------|
| **Light** | `var(--shadow-light)` | `0 2px 5px rgba(0, 0, 0, 0.06)` | Sticky headers, persistent UI bars, subtle depth on always-visible elements |
| **Standard** | `var(--shadow-standard)` | `0px 4px 6px rgba(0, 0, 0, 0.08)` | Drawers, dropdowns, mega menus, side panels, buttons with elevation, any panel that overlays content |
| **Heavy** | `var(--shadow-heavy)` | `0px 4px 40px rgba(0, 0, 0, 0.25)` | Modal dialogs, lightbox overlays, full-screen takeover panels |

**Do not add shadow to product cards** — the flat, borderless, shadowless card style is intentional.

**Hover shadow:** The hover state for `.has-shadow--true` uses `0px 4px 6px rgba(0, 0, 0, 0.16)` (2x the standard opacity). This is the only acceptable hardcoded shadow value — all others must use the variables above.

**Special-purpose shadows** (header scroll states, form focus rings, map effects) are framework-controlled and should not be changed.

---

## Motion Rules

**One easing, one duration:** `0.25s cubic-bezier(0.104, 0.204, 0.492, 1)`.

| Context | What to do |
|---------|------------|
| Hover on any interactive element | Always transition — never snap. Use the standard easing. |
| Color/background change (buttons, links) | Transition only `color` and `background-color`, not `all`. |
| Dropdown menus | `all 0.25s ease` (standard CSS ease, not the custom curve). |
| GSAP animations | Only active when `settings.animations` is true. Don't write CSS `@keyframes` that conflict — check for animation classes first. GSAP uses `Power4.easeOut`. |
| Transform-based animations | Never apply `transition: all` to elements with `transform` — list specific properties to avoid layout thrashing. |

---

## Decisions Log

| Date | Decision | Why |
|------|----------|-----|
| 2026-03-26 | Blue is the sole accent; no secondary accent color | Democratic community shop — blue IS the brand |
| 2026-03-26 | Red restricted to sale/urgency signals only | Avoids Republican color association |
| 2026-03-26 | Input border-radius → 8px (was 4px) | Harmonizes with 16px buttons/cards without making inputs look like buttons |
| 2026-03-26 | Oswald + Inter font pairing locked in | Oswald is the brand's visual voice; Inter is the reliable workhorse |
| 2026-03-26 | Product cards: no border, no shadow, transparent bg | Clean flat look is intentional — elevation is reserved for overlays |
| 2026-03-26 | 3-tier shadow system (light/standard/heavy) | Covers subtle persistent UI, standard overlays, and heavy modals — replaces the single-shadow rule |
| 2026-03-26 | Border radius restricted to 8px and 16px only | Simplifies the system — inputs get 8px, everything else (cards, buttons, panels) gets 16px |
