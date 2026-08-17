# AGENTS.md

**Current version:** `>8.4.6`

Guidance for AI coding agents working with `@els/els-styleguide-core` and projects that consume Leyden.

## What Leyden Core Is

`els-styleguide-core` is the global foundation for Leyden. It provides:

-   Global tokens/settings (spacing, typography, colors, breakpoints, z-index, animation, keylines, elevation, radius)
-   Global CSS utilities (`u-els-*`)
-   CSS objects for layout (`o-els-*`)
-   CSS scopes (`s-els-*`) for typography, forms, visited links, and readability
-   Static assets (fonts, logos, imagery)
-   Theme/mode generation (brand variants and optional dark mode)

Every Leyden consumer should load Core before component SCSS.

## Non-Negotiable Usage Rules

-   Do not override Leyden component classes (`.c-els-*`) from app CSS.
-   Do not create your own classes in the `-els-` namespace.
-   Prefer SCSS overrides/settings and tools over ad-hoc CSS overrides.
-   Keep SCSS import order: Core -> Leyden component SCSS -> app SCSS.
-   Do not import the same Leyden component SCSS file twice.

## Install and Import Patterns

### Preferred approach: single barrel package

The recommended way to consume Leyden is via the single `@els/els-react--leyden` barrel package, which handles Core SCSS, CSS-only components, and the GlobalFocusToggle automatically:

```bash
npm install @els/els-react--leyden
```

```jsx
import { Leyden } from '@els/els-react--leyden';

<Leyden>...your application</Leyden>;
```

> **Warning — old branding:** If your project must remain on the old Leyden branding, you cannot use this barrel package. Use the separate packages approach below instead.

> **Warning — SCSS `with` configuration:** Core v8+ requires CSS variables for token configuration. If your project uses Sass `@use ... with (...)` to configure Core SCSS settings, those must be migrated to CSS variable overrides before adopting the barrel package.

When writing your own SCSS alongside the barrel package, import tools directly:

```scss
@use '@els/els-styleguide-core/scss/tools';

.my-class {
    color: tools.$els-color-primary;
    margin: tools.$els-space-1o2;
}
```

---

### Alternative approach: separate packages (not recommended)

> **Note:** This approach is supported but not recommended. It requires manually managing Core, individual component packages, and SCSS imports — which is significantly more complex.

#### 1) Install Core

```bash
npm install @els/els-styleguide-core
```

#### 2) Import Core in your main SCSS entry

Use Dart Sass (`sass` package), not `node-sass`.

Webpack-style relative font path:

```scss
@use '@els/els-styleguide-core/scss/core' with (
    $path-to-els-core-fonts: '../../fonts'
);
```

Vite/Rollup-style absolute node_modules path:

```scss
@use '@els/els-styleguide-core/scss/core' with (
    $path-to-els-core-fonts: '/node_modules/@els/els-styleguide-core/fonts'
);
```

`$path-to-els-core-fonts` is required when importing SCSS source.

#### 3) Import Leyden component SCSS after Core

Recommended when using React packages:

```scss
@use '@els/els-react--button/dist/els-styleguide-button';
```

Alternative (SCSS-only usage):

```scss
@use '@els/els-styleguide-button/scss/button';
```

#### 4) Import tools where you write app SCSS

```scss
@use '@els/els-styleguide-core/scss/tools';

.my-class {
    color: tools.$els-color-primary;
    margin: tools.$els-space-1o2;
}
```

If your app has multiple SCSS entry points, replicate the same override configuration where needed so tools and core stay aligned.

## Core Features You Should Use (Instead of Recreating)

### Colors

Use only the four core color groups (Backgrounds, Fills, Strokes, Text) rather than hardcoded values.

Backgrounds:

-   `background`
-   `background-2`
-   `background-3`
-   `background-4`
-   `background-info`
-   `background-confirm`
-   `background-warn`
-   `background-alert`
-   `background-ink`
-   `background-graphite`
-   `background-paper`
-   `background-sand`

Fills:

-   `shape-1`
-   `shape-2`
-   `shape-3`
-   `shape-inverted`
-   `white`
-   `interaction`
-   `interaction-hover`
-   `interaction-hover-alt`
-   `interaction-pressed`
-   `info`
-   `warn`
-   `confirm`
-   `alert`
-   `elsevier-orange`
-   `disabled`
-   `read-only`
-   `page-overlay-transparency`

Strokes:

-   `stroke-default`
-   `stroke-highlight`
-   `stroke-hover`
-   `stroke-pressed`
-   `shape-1`
-   `shape-2`
-   `shape-3`
-   `shape-inverted`
-   `interaction`
-   `interaction-hover`
-   `interaction-pressed`
-   `info`
-   `warn`
-   `confirm`
-   `alert`
-   `disabled`
-   `divider`

Text:

-   `text`
-   `text-2`
-   `text-3`
-   `text-inverted`
-   `interaction`
-   `interaction-hover`
-   `interaction-pressed`
-   `link-visited`
-   `warn`
-   `confirm`
-   `disabled`

Color utility/setting mapping:

-   `.u-els-color-{name}` for text and stroke-oriented color utilities
-   `.u-els-background-color-{name}` for background and fill utilities
-   `$els-color-{name}` for SCSS token usage

Accessibility expectations:

-   Meet WCAG AA contrast targets
-   Do not use color alone to convey meaning

### Typography

Core provides global typography defaults, responsive typography behavior, and utilities.

-   Font families are controlled by core settings and should be consumed via tokens/utilities
-   `strong` and `em` map to configured bold/italic families
-   Responsive text behavior can be disabled via `$els-enable-responsive-text: false`

Useful utilities:

-   `u-els-font-size-*`
-   `u-els-font-family-*`
-   `u-els-line-height-*`

Typography scopes:

-   `.s-els-non-authored-content` for app/help/interface text styling
-   `.s-els-authored-content` for content-style text (e.g., article-like)
-   `.s-els-readable-width` or `.u-els-readable-width` to limit line length

### Spacing

Spacing derives from base unit defaults (`1rem`, 16px).

Common scale tokens/classes use fractions/multipliers:

-   `1o8`, `1o4`, `1o2`, `1x`, `1x1o8`, `1x1o2`, `2x`, `3x`, `4x`, `5x`

Use spacing utilities and container objects rather than one-off values.

### Layout and Widths

Use flex objects and width utilities instead of bespoke grid systems.

-   Parent object: `.o-els-flex-layout`
-   Child item: `.o-els-flex-layout__item`
-   Grow modifier: `.o-els-flex-layout__item--grow`
-   Gutters: `.o-els-flex-layout--gutters` and size variants
-   Wrap modifiers with breakpoints, e.g. `--wrap@mobile`
-   Width utilities, e.g. `.u-els-width-1o3`, including responsive suffixes
-   Page wrapper: `.o-els-page-padding`

### Responsive System

Default breakpoints:

-   mobile: `600px`
-   tablet: `900px`
-   desktop: `1200px`
-   wide: `1600px`

Use Sass MQ via tools:

```scss
@include tools.mq($until: mobile) {
    /* mobile only */
}
@include tools.mq($from: desktop) {
    /* desktop and up */
}
@include tools.mq($from: mobile, $until: tablet) {
    /* range */
}
```

Get raw breakpoint widths with `tools.mq-get-breakpoint-width(...)`.

Responsive utility suffixes:

-   `@mobile`
-   `@tablet`
-   `@desktop`
-   `@wide`
-   `@print` (where supported, such as display utilities)

Responsive utility examples:

-   `.u-els-display-none@mobile`
-   `.u-els-display-inline@tablet`
-   `.u-els-display-block@desktop`
-   `.u-els-display-unset@wide`
-   `.u-els-padding-1x@tablet`
-   `.u-els-padding-top-2x@desktop`
-   `.u-els-margin-bottom-1x1o2@mobile`
-   `.u-els-text-left@desktop`
-   `.u-els-float-right@wide`
-   `.u-els-width-1o1@mobile`
-   `.u-els-width-4o12@tablet`
-   `.u-els-min-width-1o2@desktop`
-   `.u-els-hide-visually@mobile`

### Themes and Modes

Core can generate mode-specific CSS outputs by overrides:

-   `$els-dark-mode: true` for dark mode CSS

If runtime mode switching is needed, generate and load each needed output CSS file.

### Radius and Elevation

Use provided utilities/settings; do not invent independent scales.

-   Radius utilities: `.u-els-radius-xs`, `.u-els-radius-s`, `.u-els-radius-m`, `.u-els-radius-l`, `.u-els-radius-xl`, `.u-els-radius-xxl`
-   Elevation utilities: `.u-els-elevation-low`, `.u-els-elevation-medium`, `.u-els-elevation-high`, `.u-els-elevation-overlap`

When to use each elevation option:

-   `.u-els-elevation-low`: low-priority surfaces that float slightly above content (dropdown menus, tooltips, flyouts)
-   `.u-els-elevation-medium`: persistent floating UI that should sit above regular content (floating toolbars, floating action controls)
-   `.u-els-elevation-high`: modal-level attention and interruption surfaces (modals, modal panels, toasts)
-   `.u-els-elevation-overlap`: sticky/chromed elements that overlap scrolling content (sticky headers on scroll)

### Z-Index Schema

Use schema tokens/utilities to avoid stacking conflicts:

-   Click layers: `200`
-   Fixed layers: `400`
-   Hover layers: `600`
-   Modal: `800`
-   Full-page loader: `1000`

Use semantic utilities/settings (e.g., `.u-els-zindex-modal`, `$els-z-index-modal`) instead of magic numbers.

### CSS Utilities Categories

Primary utility families available in Core include the following. Use full utility classes (rather than partial patterns) in generated markup:

Colors/background colors:

-   `.u-els-color-text`
-   `.u-els-color-text-2`
-   `.u-els-color-link-visited`
-   `.u-els-background-color-background`
-   `.u-els-background-color-background-3`
-   `.u-els-background-color-interaction-hover-alt`
-   `.u-els-background-color-page-overlay-transparency`

Spacing:

-   `.u-els-margin-top-1o2`
-   `.u-els-margin-bottom-3x`
-   `.u-els-margin-left-1x1o2`
-   `.u-els-margin-right-1o8`
-   `.u-els-padding-top-2x`
-   `.u-els-padding-bottom-4x`
-   `.u-els-padding-left-5x`
-   `.u-els-padding-right-1o4`

Widths/view-width:

-   `.u-els-width-2o3`
-   `.u-els-width-5o12`
-   `.u-els-min-width-1o3`
-   `.u-els-max-width-2o3`
-   `.u-els-view-width-1o2`
-   `.u-els-max-view-width-4o12`

Height/view-height:

-   `.u-els-height-2o3`
-   `.u-els-min-height-1o2`
-   `.u-els-max-height-5o6`
-   `.u-els-view-height-1o2`
-   `.u-els-min-view-height-1o3`
-   `.u-els-max-view-height-2o3`

Typography:

-   `.u-els-font-size-small`
-   `.u-els-font-size-h4`
-   `.u-els-font-family-bold`
-   `.u-els-line-height-heading`

Display:

-   `.u-els-display-inline`
-   `.u-els-display-inline-block`
-   `.u-els-display-flex`
-   `.u-els-display-none`
-   `.u-els-display-unset`

Text alignment/float:

-   `.u-els-text-left`
-   `.u-els-text-center`
-   `.u-els-text-right`
-   `.u-els-float-left`
-   `.u-els-float-right`
-   `.u-els-clearfix`

Position:

-   `.u-els-position-relative`

Radius/elevation:

-   `.u-els-radius-m`
-   `.u-els-radius-xxl`
-   `.u-els-elevation-low`
-   `.u-els-elevation-overlap`

Line-break controls:

-   `.u-els-nowrap`
-   `.u-els-ellipses`
-   `.u-els-hyphenate`
-   `.u-els-readable-width`

Z-index:

-   `.u-els-zindex-click-layer`
-   `.u-els-zindex-fixed-layer`
-   `.u-els-zindex-hover-layer`
-   `.u-els-zindex-modal`
-   `.u-els-zindex-page-loader`

Accessibility:

-   `.u-els-hide-visually`
-   `.u-els-hide-visually@mobile`
-   `.u-els-prefers-reduced-motion`
-   `.u-els-does-not-prefer-reduced-motion`

Interaction helpers:

-   `.u-els-debuttonize`
-   `.u-els-anchorize`

Use utilities for one-off adjustments. For repeated patterns, write local SCSS and consume Leyden tokens/mixins through `tools`.

## Core Assets

Core includes and ships:

-   Web fonts
-   Elsevier/RELX image assets and variants for dark mode and different sizes
-   Icon-related support assets via associated packages

Asset path overrides:

-   `$path-to-els-core-fonts`
-   `$path-to-els-core-images`

## SCSS Mixins You Can Reuse

From `scss/tools` (representative list):

-   `debuttonize`
-   `anchorize`
-   `rem($pixels, $context)`
-   Font-family mixins (sans/serif, bold/italic variants)

Use mixins/tokens instead of duplicating hardcoded CSS values.

## Integration Notes for Agent-Generated Code

When generating app code that uses Leyden:

-   Always include Core import first in SCSS examples.
-   Include required font path override for SCSS source imports.
-   Use `@use` syntax (not legacy `@import` in generated new examples).
-   Prefer semantic Leyden tokens/utilities over raw values.
-   Respect readable-width and color-contrast guidance.
-   Keep component-facing customization to documented props, utilities, and SCSS overrides.

When generating migration plans:

-   Start by adding Core and resolving global CSS baseline conflicts.
-   Migrate component usage incrementally package-by-package.
-   Remove app styles that duplicate Core functionality.

## Quick Agent Checklist

Before finalizing code, verify:

-   Core is installed and imported.
-   SCSS import order is correct.
-   No `.c-els-*` overrides were introduced.
-   No custom `-els-` namespace classes were introduced.
-   Utilities/tokens are used instead of hardcoded design values where possible.
-   Responsive, accessibility, and readability rules were considered.

## Breaking change log

### v8.0.0 (2026-06-16)

-   syncs with Graphene and the forthcoming shared components, allowing same settings to be used for all three cases
-   Enables the combined single Leyden package, simplifying implementation and maintenance
-   makes dark mode simpler to implement and more performant SCSS settings are still mostly supported, barring some previously deprecated values. On updating you may have to make changes to some Sass math operations as CSS variables are not evaluated at compile time, so you cannot do math operations on them in Sass. You can instead use CSS calc(). This PR shows a lot of examples of what was done to Leyden's internal SCSS during this migration which should provide a helpful reference for your own code: https://leyden.elsevier.com/pages/spacing 2. A single set of color tokens has been implemented for Leyden and Graphene. This involves changing the names of some color tokens (they are now names semantically, depending on their intended use: background, text, stroke, and shape). It also involved removing a lot of colors that were previously deprecated. 3. Some features have been removed:
-   a few minor SCSS settings have not been replicated due to CSS variables not having the same feature set as SCSS settings
-   the ability to override individual component design with SCSS settings has been removed - this is a UX decision to ensure brand/UX consistency.

### v7.0.0 (2026-05-14)

-   overriding $els-core-theme to 'old-branding' is no longer supported

### v6.0.0 (2025-10-09)

-   new branding shown by default. Set the Core SCSS setting `$els-core-theme` to `old-branding` to switch back for now

### v5.0.0 (2023-07-06)

-   **els-react--icon els-styleguide-core:** Remove 38 duplicate icons, rename / replace 2 icons

### v4.0.0 (2022-12-06)

-   icons listed in STYLE-703 are deleted by this change

### v3.0.0 (2022-08-30)

-   **els-styleguide-core; els-react--icon:** A number of icons have been renamed and consolidated to the Gizmo set

### v2.0.0 (2022-08-18)

-   The Dart Sass files have been renamed without their temporary .mod suffixes. All lib sass files have been deleted

### v1.0.0 (2022-01-11)

-   list spacing changed, and outward-looking margins removed
-   4 major version bumps to Normalize
-   Numbers have a different baseline
-   Some font size tweaks. Some headers will get smaller on small screens.
-   remove deprecated/duplicated colors, including associated utilities, old .o-els-icon system, --1o4 and 1o8 icon modifiers
