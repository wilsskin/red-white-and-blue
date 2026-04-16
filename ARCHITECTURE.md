# ARCHITECTURE.md

Technical reference for the **red-white-and-blue** Shopify theme (Vision v11.2.0 by Fuel Themes). Read this before making changes — it covers how the three layers work, how they talk to each other, and how an agent should approach this codebase confidently.

---

## Three-Layer Mental Model

| Layer | Files | Role |
|-------|-------|------|
| **Liquid** | `layout/`, `templates/`, `sections/`, `snippets/` | Data binding, HTML structure, page composition |
| **CSS** | `assets/*.css` + `snippets/head-variables.liquid` | Presentation; theme settings become CSS custom properties |
| **JavaScript** | `assets/*.js` | Interactivity via vanilla Web Components — no framework |

---

## How a Page Renders

1. Shopify evaluates `layout/theme.liquid` — the outermost shell for every page.
2. `{{ content_for_layout }}` is replaced by the active **template** (e.g. `templates/product.json`).
3. Templates are JSON files that declare which **sections** appear and in what order.
4. Each section `.liquid` file renders its HTML and loads its own `.css` / `.js` from `assets/`.
5. Sections call **snippets** via `{% render 'name', param: value %}` for reusable partials.

**Fixed layout areas** (independent of templates) live in section group JSON files:
- `sections/header-group.json` → announcement bar → secondary menu → header → mobile nav
- `sections/footer-group.json` → footer
- `sections/overlay-group.json` → cart drawer, search drawer, age verification popup

---

## Template System

Templates in `templates/` are pure JSON — no Liquid. They wire sections together:

```json
{
  "sections": {
    "main-product": {
      "type": "main-product",
      "blocks": {
        "title":          { "type": "title",          "settings": {} },
        "variant_picker": { "type": "variant_picker", "settings": { "picker_type": "button" } },
        "buy_buttons":    { "type": "buy_buttons",    "settings": {} }
      },
      "block_order": ["title", "variant_picker", "buy_buttons"],
      "settings": { "enable_sticky_add_to_cart": true }
    }
  },
  "order": ["breadcrumbs", "main-product", "product-recommendations"]
}
```

**Template variants** (e.g. `product.winter.json`, `product.velocite.json`) are alternate section arrangements for the same page type, assignable per-product in the Shopify admin. Max 25 sections per template; max 50 blocks per section.

---

## Section Anatomy

Each `sections/*.liquid` file has two parts:

**1. Liquid markup** — reads settings and renders blocks:
```liquid
{%- liquid
  assign columns = section.settings.columns_desktop
  assign limit   = section.settings.product_limit
-%}
<div class="featured-collection columns-{{ columns }}">
  {%- for product in collection.products limit: limit -%}
    {% render 'product-card', product_card_product: product %}
  {%- endfor -%}
</div>
```

**2. `{% schema %}` block** — JSON that defines the theme editor UI. One per file, cannot be nested inside a Liquid tag. **Do not modify** (see CLAUDE.md guardrails).

**Block rendering pattern:**
```liquid
{% for block in section.blocks %}
  {%- case block.type -%}
    {%- when 'title' -%}       <h1>{{ product.title }}</h1>
    {%- when 'description' -%} {{ product.description }}
  {%- endcase -%}
{% endfor %}
```

---

## Snippet Conventions

Snippets run in **fully isolated scope** — every variable must be passed explicitly:
```liquid
{% render 'product-card',  product_card_product: product, collection: collection %}
{% render 'product-media', product: product, section: section, sizes: sizes %}
{% render 'responsive-image', image: featured_media, sizes: '(max-width: 768px) 100vw, 50vw' %}
```

Pass `section` whenever the snippet needs `section.id` (for unique DOM IDs) or `section.settings`.

**Key snippets:**

| Snippet | Purpose | Required params |
|---------|---------|-----------------|
| `product-card.liquid` | Product tile used across all collection/search grids | `product_card_product`, `collection` |
| `product-information.liquid` | PDP block loop — title, variants, ATC | `product`, `section` |
| `product-media.liquid` | Image / video / 3D model rendering | `product`, `section`, `media_aspect_ratio` |
| `head-variables.liquid` | Emits all CSS custom properties from settings | none — reads `settings.*` directly |
| `responsive-image.liquid` | Lazy-loading `<img>` with srcset | `image`, `sizes` |
| `svg-icons.liquid` | Icon sprite lookup | `icon` (name string) |

---

## CSS Architecture

One `.css` file per feature in `assets/`. Main entry point is `app.css`. Sections load their own sheet:
```liquid
{{ 'featured-collection.css' | asset_url | stylesheet_tag }}
```

**All design tokens are CSS custom properties**, generated at runtime by `snippets/head-variables.liquid` from `config/settings_data.json`. Always use variables — never hardcode values.

Key variables on `:root`:
```
--color-body-bg     --color-text        --color-heading      --color-accent
--color-border      --color-header-bg   --color-header-links --color-footer-bg
--color-badge-sale  --solid-button-background               --solid-button-label
--font-body-scale   --font-heading-scale  --font-heading-letter-spacing
--block-border-radius  --button-border-radius
--section-spacing-mobile  --section-spacing-desktop
--logo-height  --logo-height-mobile
```

Note: `--logo-height` is written as an inline `{% style %}` tag inside `sections/header.liquid` from section settings, not from `head-variables.liquid`.

---

## Content Width and Side Padding System

This is the most common source of misalignment bugs. Read every word before touching layout.

### How the grid actually works

`app.css` defines the Foundation 6 `.row` class as the centering container **and also patches it with horizontal padding**:

```css
/* Foundation base — max-width + centering */
.row {
  max-width: var(--grid-width-row, 1380px);
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-flow: row wrap;
}

/* app.css custom patch — horizontal padding on the row itself */
.row {
  padding: 0 11px;              /* mobile */
}
@media only screen and (min-width: 768px) {
  .row {
    padding: 0 35px;            /* tablet/desktop */
  }
}

/* Foundation column gutters */
.row .columns {
  padding: 0 4px;               /* mobile */
}
@media only screen and (min-width: 768px) {
  .row .columns {
    padding: 0 15px;            /* tablet/desktop */
  }
}
```

**Combined effect:** `.row` + `.columns` produce exactly **15px** side offset on mobile and **50px** on desktop from the viewport edge, at any viewport width up to 1380px. Above 1380px, `.row` hits its max-width and centers with auto margins — the content offset grows proportionally.

### The three layout patterns

Every section in this theme uses one of three patterns. All three produce identical content edges.

---

**Pattern 1 — Standard (most sections)**

The outer section element has no horizontal padding. A `.row` inside handles centering and padding. `.columns` inside `.row` handle column gutters.

```html
<div class="my-section">          <!-- no horizontal padding -->
  <div class="row">               <!-- 11px/35px side padding + max-width 1380px centered -->
    <div class="columns">         <!-- 4px/15px column padding -->
      content
    </div>
  </div>
</div>
```

This is the default. Use it for any section whose outer element has no background color or whose background doesn't need to span the full viewport.

---

**Pattern 2 — Full-bleed background**

The outer element provides the full-viewport background color and vertical padding. Horizontal alignment is handled entirely by the `.row` inside — **no horizontal padding on the outer element**.

```html
<div class="my-section">          <!-- background + vertical padding ONLY — no horizontal padding -->
  <div class="row">               <!-- 11px/35px + max-width 1380px — same as Pattern 1 -->
    <div class="columns">         <!-- 4px/15px column padding -->
      content
    </div>
  </div>
</div>
```

```css
.my-section {
  background: var(--color-accent);
  padding: 45px 0;               /* vertical only — NO horizontal padding */
}

@media only screen and (min-width: 768px) {
  .my-section {
    padding: 65px 0;             /* vertical only — NO horizontal padding */
  }
}
```

**The footer uses this pattern.** `assets/footer.css` sets `padding: 45px 0` / `padding: 65px 0` — zero horizontal padding.

> **⚠ Critical trap:** Adding horizontal padding to the outer element AND using a `.row` inside creates double padding. At viewport widths ≤ 1380px the `.row` fills its container, so the outer padding just shifts content inward. At viewports > 1380px the `.row` centers with auto margins within the already-padded space — the offset diverges from all other sections. This was a hard-won lesson from a multi-hour debugging session. Never add horizontal padding to the outer element when a `.row` is the direct child.

---

**Pattern 3 — `--inner` wrapper (some special sections)**

Used when the outer container opts completely out of the `.row` padding system (e.g. uses `full-width-row-full`). A dedicated `--inner` div provides both the horizontal padding and the max-width centering directly.

```html
<div class="row full-width-row-full">   <!-- no padding, no max-width — completely neutral -->
  <div class="columns">
    <div class="email-signup--inner">   <!-- padding 0 15px/50px + max-width 1380px centered -->
      content
    </div>
  </div>
</div>
```

```css
.email-signup--inner {
  padding: 0 15px;
  max-width: var(--grid-width-row, 1380px);
  margin-left: auto;
  margin-right: auto;
}
@media only screen and (min-width: 768px) {
  .email-signup--inner {
    padding: 0 50px;
  }
}
```

Sections that use this pattern: `email-signup.css`, `breadcrumbs.css`, `announcement-bar.css`, `logo-list.css`, `video.css`, `text-with-icons.css`, `scrolling-content.css`, `media-grid.css`, `toggle-boxes.css`, `promotion-blocks.css`.

---

### The header is different — do not copy its pattern for body sections

The header uses a unique `--inner` wrapper with a **narrower** max-width:

```css
.header {
  padding: 0 15px;               /* mobile */
}
@media only screen and (min-width: 768px) {
  .header {
    padding: 0 50px;             /* desktop */
  }
}
.header--inner {
  max-width: var(--grid-width, 1280px);   /* narrower than --grid-width-row */
  margin: 0 auto;
  /* no padding — padding is on .header */
}
```

The header content is constrained to `--grid-width` (1280px), not `--grid-width-row` (1380px). This works because `.header--inner` has no padding of its own, so there is no double-padding problem. **Do not replicate this for body sections** — it uses a different max-width variable and doesn't use `.row` or `.columns`.

---

### Alignment proof

At any viewport width, all three patterns produce identical content edges:

| Viewport | Pattern 1 & 2 | Pattern 3 (`--inner`) |
|---|---|---|
| 375px mobile | `11 + 4 = 15px` from edge | `15px` from edge |
| 768px tablet | `35 + 15 = 50px` from edge | `50px` from edge |
| 1380px desktop | `35 + 15 = 50px` from edge | `50px` from edge |
| 1440px desktop | `30 (margin) + 35 + 15 = 80px` from edge | `30 + 50 = 80px` from edge |
| 1600px desktop | `110 + 35 + 15 = 160px` from edge | `110 + 50 = 160px` from edge |

---

### Rules — follow exactly

1. **Never add horizontal padding to a full-bleed outer element that contains a `.row`.** The `.row` handles all horizontal spacing. Adding padding to the outer element too creates double padding that misaligns at wide viewports.

2. **Never add horizontal padding directly to `.row`.** It is a shared Foundation class used across the entire theme. The custom patch in `app.css` (11px/35px) already handles this.

3. **The only valid side padding values are 15px (mobile) and 50px (desktop).** No other values. No intermediate breakpoints.

4. **Always use `min-width: 768px` for the desktop padding media query** — never `max-width`.

5. **Use `--grid-width-row` (1380px) for body section max-widths.** The narrower `--grid-width` (1280px) is for the header and specific inner content like slideshow text overlays only.

6. **When in doubt, use Pattern 1.** Add a background and vertical-only padding to the outer element if needed (Pattern 2). Reach for Pattern 3 only if the section already uses `full-width-row-full` in its Liquid.

---

## JavaScript Architecture

No framework, no bundler. Each feature is a standalone file loaded via `<script>` in `theme.liquid` or conditionally inside section files.

**Web Components are the primary pattern:**
```javascript
class VariantSelects extends HTMLElement {
  connectedCallback() { ... }
  onVariantChange()   { ... }
}
customElements.define('variant-selects', VariantSelects);
```

Active custom elements: `variant-selects`, `product-card`, `quick-view`, `cart-drawer`, `search-form`, `facet-toggle`, `facet-filters-form`, `slide-show`, `theme-header`, `quantity-selector`.

**Globally loaded** (every page, from `theme.liquid`): `vendor.min.js`, `app.js`, `product.js`, `slideshow.js`.
**Conditionally loaded** (based on settings or section): `cart-discounts.js`, `free-shipping.js`, `facets.js`, `header.js`, etc.

`vendor.min.js` bundles: Flickity (carousel), noUiSlider (price range), PhotoSwipe (lightbox), GSAP + ScrollTrigger (animations when enabled in settings).

---

## Liquid → JavaScript Data Bridge

`layout/theme.liquid` injects `window.theme` before any JS runs:
```javascript
window.theme = {
  settings: {
    money_with_currency_format: "${{amount}}",  // Liquid-rendered at page build
    cart_drawer: true
  },
  routes: {
    root_url:              '/',
    cart_url:              '/cart',
    cart_add_url:          '/cart/add',
    cart_change_url:       '/cart/change',
    cart_update_url:       '/cart/update',
    predictive_search_url: '/search/suggest'
  },
  variantStrings: { addToCart, soldOut, preOrder, unavailable },  // translated
  strings:        { requiresTerms, shippingEstimatorNoResults, ... }
};
```

All API calls use `theme.routes.*` — never hardcoded paths.

For larger data sets (e.g. all product variants), Liquid embeds JSON directly in the page:
```liquid
<script type="application/json" id="product-json-{{ section.id }}">
  {{ product.variants | json }}
</script>
```
```javascript
const variants = JSON.parse(
  document.getElementById(`product-json-${this.dataset.section}`).textContent
);
```

---

## Custom Event System

`app.js` exposes a global dispatcher:
```javascript
dispatchCustomEvent('event-name', { key: value });
// Fires as a CustomEvent on document
```

| Event | Fired by | Payload | Consumed by |
|-------|---------|---------|-------------|
| `product:variant-change` | `product.js` on option select | `{ variant, sectionId }` | Price update, media swap, ATC state |
| `cart:item-added` | `product.js` on successful ATC | `{ product, variant, quantity }` | Cart counter, drawer open |
| `line-item:change:end` | `cart.js` after qty change | `{ quantity, cart }` | Cart re-render |

---

## Cart (AJAX)

`assets/cart.js` manages the `/cart` page and the cart drawer.

**Quantity change flow:**
1. User changes qty → debounced `change` event fires (300ms)
2. POST to `theme.routes.cart_change_url` with `{ line, quantity, sections: ['main-cart', 'cart-bubble'] }`
3. Shopify returns re-rendered section HTML for all requested sections in one response
4. JS parses with `DOMParser` and swaps the relevant DOM nodes

**Re-rendered targets:**
- `main-cart` → `.thb-cart-form`
- `cart-bubble` → `.thb-item-count` (header icon count)

The cart drawer is pre-rendered on page load and toggled visible; it re-fetches on open.

---

## Product Variant Switching

**Selection flow (`assets/product.js`):**
1. `variant-selects` catches `change` on `<fieldset>` inputs
2. Collects all selected option values across fieldsets
3. Matches against the embedded variant JSON array
4. On match:
   - `updateMedia()` — jumps Flickity carousel to the variant's featured image
   - `updateURL()` — sets `?variant=123` in the URL bar
   - `renderProductInfo()` — fetches updated price/availability via Section Rendering API
   - Updates hidden `<input name="id">` so the form submits the right variant ID
5. Dispatches `product:variant-change`

**DOM IDs:** Media slides → `#Slide-{sectionId}-{mediaId}`, thumbnails → `#Thumb-{sectionId}-{mediaId}`.

---

## Collection Filtering (Facets)

`assets/facets.js` handles filter changes without full page reloads.

**Flow:**
1. Filter input changes → debounced 500ms
2. Form serialized to `searchParams`
3. Fetch `{pathname}?section_id=main-collection-product-grid&{searchParams}`
4. Cache response in `FacetFiltersForm.filterData` array (avoids duplicate requests)
5. Swap product grid, filter UI, and count in DOM
6. `history.pushState` to update URL
7. `popstate` restores state on back/forward

Sticky filter bar uses `IntersectionObserver` offset by `--header-height` CSS variable.

---

## Predictive Search

`assets/predictive-search.js`:
1. Input debounces 300ms
2. Fetch `/search/suggest?q={term}&resources[type]=product,article,query,page&resources[limit]=10&section_id=predictive-search`
3. Parse response HTML, extract `#shopify-section-predictive-search` content
4. Inject into `.thb-predictive-search` container

---

## Header Structure

5 layout styles (`style1`–`style5`) — each rendered by its own snippet (`header-style1.liquid` etc.), switched via `section.settings.style` in `sections/header.liquid`.

Mega menus are section blocks of `type: "megamenu"`. Each maps to a top-nav position via `settings.position` (1-based numeric index).

---

## Shopify Platform Rules That Affect This Codebase

### `{% render %}` scope isolation
Snippets cannot access the calling context's variables. Pass everything explicitly. This is the #1 source of undefined-variable bugs.

### Section IDs in JSON templates are dynamic UUIDs
`section.id` is Shopify-generated, not the filename. Never hardcode it — always pass it as a `data-section` attribute and read `this.dataset.section` in JS.

### JS does not re-run when the theme editor loads a section
Shopify re-renders section HTML in the editor but does not re-execute page JS. Any initialization must also run on `shopify:section:load`:
```javascript
document.addEventListener('shopify:section:load',   (e) => initSection(e.target));
document.addEventListener('shopify:section:unload', (e) => cleanupSection(e.target));
document.addEventListener('shopify:block:select',   (e) => keepBlockVisible(e.target));
```
Detect editor context: Liquid → `request.design_mode`, JS → `Shopify.designMode`.

### `{{ block.shopify_attributes }}` is required
Every block-wrapping element needs this or the theme editor can't select it.

### Section `limit` only accepts 1 or 2
The schema `"limit"` property for sections only accepts `1` or `2`. There is no way to allow 3–N.

### Static sections share one instance across all pages
Sections in `theme.liquid` (header, footer, overlay group) use the same settings/blocks on every page — they cannot be configured per-page.

### Section Rendering API
Used by variant switching, facets, and cart to re-render sections without a full reload:
```
GET /?section_id=section-filename
GET /collections/handle?section_id=main-collection-product-grid&filter.p.m.custom.color=red
```
Response is raw HTML wrapped in `<div id="shopify-section-{id}">`. Parse with `DOMParser` and extract the inner content.

### Cart API
- Stock exceeded → quantity silently capped to available; no error thrown
- All monetary values in customer's presentment currency
- Always send `Content-Type: application/json`

---

## How an Agent Should Approach Changes in This Repo

**Before touching anything:**
1. Read the relevant section `.liquid` file to understand which settings and blocks it uses
2. Check which snippets it calls and what parameters they expect
3. If the change involves JS, read the corresponding `assets/*.js` file — identify which custom element owns the behaviour
4. If the change involves styling, check `assets/app.css` and the feature-specific `.css` file; confirm which CSS variables are already available

**Making a Liquid change:**
- Identify whether the change is in a **section** (page-level), **snippet** (component-level), or **layout** (`theme.liquid`)
- For sections: modify only the Liquid markup portion — the `{% schema %}` block is off-limits
- For snippets: check every call site (`grep -r "render 'snippet-name'"`) to ensure any new parameters are passed at all call sites
- Use `section.id` in any new DOM IDs to keep them unique across multiple section instances

**Making a CSS change:**
- Check whether a CSS variable already covers the value (`snippets/head-variables.liquid`)
- Add styles to the feature's existing `.css` file in `assets/`, or `app.css` for global rules
- Use BEM-adjacent class naming consistent with the existing codebase (e.g. `product-card__title`, `thb-` prefix for theme-level wrappers)

**Making a JS change:**
- Find the custom element that owns the behaviour — search for the relevant `customElements.define()`
- If adding interactivity that responds to a new state, check whether a `dispatchCustomEvent` already covers it before creating a new one
- Add a `shopify:section:load` handler for any initialization logic that must survive theme editor reloads
- Keep changes inside the existing file — do not create new `.js` files unless adding a genuinely new, standalone feature

**Before finishing:**
- Run `shopify theme check` to catch Liquid linting errors
- Verify no off-limits files were modified (`git diff --name-only`)
