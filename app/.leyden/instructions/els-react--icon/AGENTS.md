# AGENTS.md - els-react--icon

**Current version:** `>6.32.7`

Use this file when generating feature code that consumes this component package.
Focus on product usage, accessibility, and prop correctness.

## General integration notes

-   This package provides React component(s) for the Leyden Design System.
-   Import the related Leyden SCSS files from this package's `/dist` folder in your project as well.
-   Avoid duplicate SCSS imports when multiple components share the same SCSS dependency.
-   Component documentation is available at https://leyden.elsevier.com.

## What this package exports

-   `Icon`

## Usage guidance (design/UX intent)

-   No markdown UX guidance found; rely on docs prop notes and component prop comments.

## Icon props and behavior

-   `sprite`: options/type: `oneOf(/* Icon.Sprites */ Icon.Sprites — 483 values, see src/constants/)`; default: `none`; notes: Icon identifier from the Gizmo icon set
-   `size`: options/type: `oneOf(/* Icon.Sizes */ 'xxs' | 'xs' | 's' | 'm' | 'ml' | 'l' | 'xl' | 'stretch')`; default: `SpriteSizes.S`; notes: Controls the size of the icon
-   `color`: options/type: `oneOf(/* Icon.Colors */ 'default' | 'primary' | 'secondary' | 'info' | 'alert' | 'confirm' | 'warn' | 'positive' | 'negative')`; default: `IconColors.DEFAULT`; notes: Applies to the icon only. When visible the label inherits color from the surrounding content.
-   `textAlignment`: options/type: `oneOf(/* Icon.TextAlignment */ 'baseline' | 'bottom' | 'inherit' | 'initial' | 'middle' | 'offset' | 'sub' | 'top')`; default: `FontAlignments.MIDDLE`; notes: Controls the vertical alignment of the icon relative to surrounding text
-   `children`: options/type: `node`; default: `null`; notes: Accessible text describing the icon purpose
-   `condense`: options/type: `bool`; default: `false`; notes: Applies negative horizontal margins to optically condense thin icons (chevrons, sort arrows, ruler, thermometer, sound/speaker icons, man/person, comb — any icon with `data-narrowicon` on its SVG) in text+icon layouts. Applied automatically by Button when used with text content.
-   `isVisible`: options/type: `bool`; default: `false`; notes: Shows the icon label text visually
-   `isTextFirst`: options/type: `bool`; default: `false`; notes: Positions the label text to the left of the icon
-   `isDecorative`: options/type: `bool`; default: `false`; notes: Marks icon as decorative, hiding it from screen readers
-   `isImageRole`: options/type: `bool`; default: `false`; notes: Use when the icon itself needs to be announced as an image (for example in legends or emoticons). When true, the SVG is given role="img" and an aria-label built from the icon a11y name/description.
-   `placeholder`: options/type: `string`; default: `'□'`; notes: Text or unicode character displayed while the icon is loading
-   `fallback`: options/type: `func`; default: `null`; notes: Function returning content to display if icon loading fails
-   `id`: options/type: `string`; default: `null`; notes: Unique identifier for the icon element

## Depends on

### React components

-   `els-react--utils`

### SCSS packages

-   `els-styleguide-core`

## Breaking change log

### v6.0.0 (2023-07-06)

-   **els-react--icon els-styleguide-core:** Remove 38 duplicate icons, rename / replace 2 icons. See list in STYLE-747.

### v5.0.0 (2022-12-06)

-   icons listed in STYLE-703 are deleted by this change

### v4.0.0 (2022-08-30)

-   **els-styleguide-core; els-react--icon:** A number of icons have been renamed and consolidated to the Gizmo set. A number of react icon SVGs have been renamed. The sprite property of the icon component will need to be updated if you use any of the following:
-   `Cart` icon renamed to `ShoppingCart`
-   `DocumentCSV` renamed to `DocumentCsv`
-   `Download` icon renamed to `CloudDownload`
-   `Expand` icon renamed to `Expand2`
-   `Person` icon renamed to `Man`
-   `Ppt` icon renamed to `Ppt2`
-   `Upload` icon renamed to `CloudUpload`

### v3.0.0 (2022-08-18)

-   React (S)CCS assets renamed, and no longer imported into the React components

### v2.0.0 (2021-08-25)

-   **els-react--icon:** Add 120 new icons, rename/replace 11 icons, resize every icon to be full-bleed, change default size to "s" STYLE-502
