# AGENTS.md - els-react--logo

**Current version:** `>1.9.6`

Use this file when generating feature code that consumes this component package.
Focus on product usage, accessibility, and prop correctness.

## General integration notes

-   This package provides React component(s) for the Leyden Design System.
-   Import the related Leyden SCSS files from this package's `/dist` folder in your project as well.
-   Avoid duplicate SCSS imports when multiple components share the same SCSS dependency.
-   Component documentation is available at https://leyden.elsevier.com.

## What this package exports

-   `Logo`

## Usage guidance (design/UX intent)

-   This Logo component is primarily for internal use by Leyden for the Header and Footer components, however there may be occasions where it is needed for direct use by applications too. For example:
-   Print/PDF views that require some branding, but not a full header or footer
-   Custom Headers or Footers where a branding exemption has been granted

## Logo props and behavior

-   `alt`: options/type: `string`; default: `'Elsevier'`; notes: Alternative text for the logo image for accessibility
-   `onDark`: options/type: `bool`; default: `false`; notes: Uses the light colored logo variant for dark backgrounds
-   `monochrome`: options/type: `bool`; default: `false`; notes: For use with the new branding only
-   `hideElement`: options/type: `oneOf(/* Logo.Elements */ 'tree' | 'elsevier')`; default: `null`; notes: Hides part of the logo, such as text or symbol portions
-   `id`: options/type: `string`; default: `null`; notes: Unique identifier for the logo element

## Depends on

### React components

-   `els-react--utils`

### SCSS packages

-   `els-styleguide-core`
