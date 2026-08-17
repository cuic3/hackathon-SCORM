# AGENTS.md - els-react--badge

**Current version:** `>3.8.6`

Use this file when generating feature code that consumes this component package.
Focus on product usage, accessibility, and prop correctness.

## General integration notes

-   This package provides React component(s) for the Leyden Design System.
-   Import the related Leyden SCSS files from this package's `/dist` folder in your project as well.
-   Avoid duplicate SCSS imports when multiple components share the same SCSS dependency.
-   Component documentation is available at https://leyden.elsevier.com.

## What this package exports

-   `Badge`

## Usage guidance (design/UX intent)

-   Badges are small containers with numerical or text values placed adjacent to a UI element. Counters are numerical badges indicating a running tally or count of a specific type of content, for example, the number of notifications or the number of filter results. Flags are text badges that indicate a system status, for example, New or Done.
-   Append to the end of a text string.
-   Do not use within a paragraph or in the middle of a sentence unless used as citations.
-   Related guidance areas: Basic badge; Light variation; Important or warning status; Overlap; Notification dot; Related design principles; Visibility of system status; Consistency and standards

## Badge props and behavior

-   `content`: options/type: `string`; default: `none`; notes: The text or number to display inside the badge
-   `badgeColor`: options/type: `string`; default: `''`; notes: Supports any Leyden Color. Ensure color combinations meet accessibility contrast requirements.
-   `textColor`: options/type: `string`; default: `''`; notes: Supports any Leyden Color. Ensure color combinations meet accessibility contrast requirements.
-   `size`: options/type: `oneOf(/* Badge.Sizes */ 'base' | 'body' | 'body_large' | 'caption' | 'display' | 'eyebrow' | 'eyebrow-emphasis' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'inherit' | 'intro' | 'jumbo' | 'meta')`; default: `BadgeSize.INHERIT`; notes: Controls the size of the badge text
-   `overlap`: options/type: `oneOf(/* Badge.Overlaps */ 'space-1o2' | 'space-1o4' | 'space-1x' | 'space-3o4')`; default: `null`; notes: Controls how much the badge overlaps with adjacent content
-   `isNotificationDot`: options/type: `bool`; default: `false`; notes: Shows only a small dot indicator without text content
-   `label`: options/type: `string`; default: `''`; notes: Accessible text for screen readers describing what the badge number represents
-   `id`: options/type: `string`; default: `null`; notes: Unique identifier for the badge element

## Depends on

### React components

-   `els-react--utils`

### SCSS packages

-   `els-styleguide-badge`
-   `els-styleguide-core`

## Breaking change log

### v3.0.0 (2024-01-02)

-   data-testid now uses id value

### v2.0.0 (2022-08-18)

-   React (S)CCS assets renamed, and no longer imported into the React components
-   Update NPM version to 8.x.x and remove all yarn support
