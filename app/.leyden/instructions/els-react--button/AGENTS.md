# AGENTS.md - els-react--button

Use this file when generating feature code that consumes this component package.
Focus on product usage, accessibility, and prop correctness.

## General integration notes

-   This package provides React component(s) for the Leyden Design System.
-   Import the related Leyden SCSS files from this package's `/dist` folder in your project as well.
-   Avoid duplicate SCSS imports when multiple components share the same SCSS dependency.
-   Component documentation is available at https://leyden.elsevier.com.

## What this package exports

-   `Button`
-   `ButtonWithIcon`

## Usage guidance (design/UX intent)

-   Use buttons to convey important actions that a user can take on a page, form or dialog. This button library has a wide variety of button types, sizes and states for a range of applications.
-   Label buttons with a verb (“Submit”) or verb-phrase (“Submit Form”).
-   Strive for short, succinct button labels that clearly describe the action the button will perform.
-   Avoid lengthy button labels.
-   Use sentence case for button labels.
-   Aim to create a hierarchy of action importance via use of primary and secondary buttons.
-   Do not combine large and small buttons on a page.
-   Do not place multiple primary button variations on a page or application panel/window.
-   Do not use a button as a way of navigating to another place except back and/or next when part of a process.
-   Related guidance areas: Do; Don't; Primary Button; Secondary Button; Tertiary Button; Buttons with Icons; Alternative button; Icon only buttons

## Button props and behavior

-   Combined prop reference:
-   `type`: options/type: `see docs`; default: `none`; notes: Visual style of the button, controls background color and border appearance. transparent must only be used on uncluttered, dark backgrounds (hence demo background
-   `size`: options/type: `see docs`; default: `none`; notes: Required for most use-cases. It can be omitted when relying on native form submission (for example htmlType="submit" ) or when a containing
-   `disabled`: options/type: `see docs`; default: `none`; notes: Required for most use-cases. It can be omitted when relying on native form submission (for example htmlType="submit" ) or when a containing
-   `onClick`: options/type: `see docs`; default: `none`; notes: Required for most use-cases. It can be omitted when relying on native form submission (for example htmlType="submit" ) or when a containing
-   `children`: options/type: `see docs`; default: `none`; notes: Disables the button, and displays a loading animation. For use while waiting for an action to complete after click. Not compatible with the `alt` button style
-   `htmlType`: options/type: `see docs`; default: `none`; notes: Disables the button, and displays a loading animation. For use while waiting for an action to complete after click. Not compatible with the `alt` button style
-   `loading`: options/type: `see docs`; default: `none`; notes: Disables the button, and displays a loading animation. For use while waiting for an action to complete after click. Not compatible with the `alt` button style
-   `expanded`: options/type: `see docs`; default: `none`; notes: Makes the button expand to fill the full width of its container
-   `cta`: options/type: `see docs`; default: `none`; notes: Applies call-to-action styling to make the button more prominent. May be used for standalone buttons, not in a group. Not compatible with ButtonWithIcon 's
-   `condensed`: options/type: `see docs`; default: `none`; notes: Applies an active/pressed state visual styling to the button
-   `active`: options/type: `see docs`; default: `none`; notes: Applies an active/pressed state visual styling to the button
-   `linkOptions`: options/type: `see docs`; default: `none`; notes: This only applies when type=link . navigation used as an example. Supports the link modifiers emphasize , image ,
-   `ref`: options/type: `see docs`; default: `none`; notes: A React reference, applied to the button element and used, for example, to send focus to it, with
-   `id`: options/type: `see docs`; default: `none`; notes: When provided, this is also used for the data-testid on the button element
-   `Type`: options/type: `see docs`; default: `none`; notes: transparent must only be used on uncluttered, dark-colored backgrounds. It will therefore
-   `Size`: options/type: `see docs`; default: `none`
-   `layout`: options/type: `see docs`; default: `none`; notes: This only applies when type=link
-   `sprite`: options/type: `see docs`; default: `none`; notes: This only applies when type=link
-   `linkIconSize`: options/type: `see docs`; default: `none`; notes: This only applies when type=link
-   `iconOnly`: options/type: `see docs`; default: `none`; notes: Returns the character(s) to be used as a fallback in case lazy-loading of the icon fails
-   `iconRight`: options/type: `see docs`; default: `none`; notes: Returns the character(s) to be used as a fallback in case lazy-loading of the icon fails
-   `fallback`: options/type: `see docs`; default: `none`; notes: Returns the character(s) to be used as a fallback in case lazy-loading of the icon fails
-   `Icon`: options/type: `see docs`; default: `none`; notes: Requires icon markup above to be active
-   `Icon on right`: options/type: `see docs`; default: `none`; notes: Requires icon markup above to be active
-   `Icon only`: options/type: `see docs`; default: `none`; notes: Requires icon and iconOnly markup above to be active
-   `CTA`: options/type: `see docs`; default: `none`; notes: May be used for standalone buttons, not in a group
-   `Condensed`: options/type: `see docs`; default: `none`; notes: Used by the dropdown/menu component when open
-   `Expanded`: options/type: `see docs`; default: `none`; notes: Used by the dropdown/menu component when open
-   `Active`: options/type: `see docs`; default: `none`; notes: Used by the dropdown/menu component when open

## ButtonWithIcon props and behavior

-   Combined prop reference:
-   No explicit prop metadata found in source; check docs page examples and package index exports.

## Source references used

-   `packages/react/els-react--button/src/index.js`
-   `packages/react/els-react--button/src/component/Button.jsx`
-   `packages/react/els-react--button/src/component/ButtonWithIcon.jsx`
-   `documentation-app/src/routes/pages/components/ButtonDocs.jsx`
-   `documentation-app/src/_markdown/components/button.md`
