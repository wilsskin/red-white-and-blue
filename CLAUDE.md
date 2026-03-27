# CLAUDE.md

Please read all files, especially @architecture.md and @design.md before responding. 

## Overview

This is the **red-white-and-blue** Shopify store theme, built on **Vision v11.2.0** by Fuel Themes. It is a Shopify OS 2.0 theme with no build step; files are deployed directly to Shopify.

- Vision docs: https://documentation.fuelthemes.net/article-categories/vision/
- Full technical reference: [ARCHITECTURE.md](ARCHITECTURE.md)
- Design system: [DESIGN.md](DESIGN.md) — **read before any visual change**

---

## CLI Commands

```bash
shopify theme dev           # Push as dev theme + start live preview (hot reload)
shopify theme push          # Push local files to Shopify (overwrites remote)
shopify theme pull          # Pull remote files locally
shopify theme check         # Lint Liquid with Theme Check
shopify theme check -a      # Auto-correct fixable linting errors
shopify theme console       # Interactive Liquid REPL for testing expressions
```

**Gotchas:**
- `theme dev` creates a temporary theme that auto-deletes on logout — it does not persist
- Always run `shopify theme push` before `pull` to establish a remote baseline
- Checkout pages cannot be previewed via the local dev server

---

## Scope of Changes — Frontend Only

This is a development store. Structural and schema changes are managed separately. **Only touch the following files:**

**Allowed:**
- `assets/*.css` — styles
- `assets/*.js` — non-minified JS only; never edit `*.min.js` or `vendor.min.js`
- `snippets/*.liquid` — presentation partials
- `sections/*.liquid` — Liquid markup only (not the `{% schema %}` block inside)
- `layout/theme.liquid`, `layout/password.liquid`

**Never modify:**
- `config/settings_schema.json` or `config/settings_data.json`
- `sections/*.json` — section group configs (header/footer/overlay groups)
- `templates/*.json` — template/section wiring
- `locales/*.json` — translation strings
- `{% schema %}` blocks inside any section file
- Any `*.min.js` file

**If a task requires touching off-limits files, stop and ask before proceeding.**

---

## Rules for Writing Code in This Repo

### Snippets are scope-isolated
`{% render %}` runs snippets in a fully isolated scope. Every variable a snippet needs must be passed explicitly — it cannot read from the calling context:
```liquid
{% render 'product-card', product_card_product: product, collection: collection %}
```
Never use `{% include %}` — it is deprecated.

### Always use CSS variables for design tokens
Colors, spacing, border radii, and typography are all CSS custom properties from `snippets/head-variables.liquid`. Never hardcode hex values or pixel sizes that correspond to theme settings — use `var(--color-accent)`, `var(--section-spacing-desktop)`, etc.

### User-facing strings use the translation filter
```liquid
{{ 'products.product.add_to_cart' | t }}
```
Never hardcode English strings in Liquid. Use existing keys from `locales/en.default.json` — do not add new keys (locales are off-limits).

### JS bundles stay small and non-blocking
- Per-feature JS files should stay under **16 KB** minified
- All `<script>` tags must use `defer` or `async`
- Use native DOM APIs — no jQuery, no frameworks

### Block elements require `{{ block.shopify_attributes }}`
Every element that represents a section block must carry this attribute or the theme editor cannot select it:
```liquid
{% for block in section.blocks %}
  <div {{ block.shopify_attributes }}>...</div>
{% endfor %}
```

### Section IDs in JSON templates are dynamic UUIDs
Never hardcode a section ID. Use `section.id` in Liquid and store it as a `data-` attribute for JS to read:
```liquid
<div data-section="{{ section.id }}">
```

### Cart API behavior
- Always send `Content-Type: application/json` on cart fetch requests
- Use `theme.routes.cart_add_url`, `theme.routes.cart_change_url`, etc. — never hardcode `/cart/add`
- Monetary values are returned in the customer's presentment currency
- Exceeding stock silently reduces quantity to available — it does not error
