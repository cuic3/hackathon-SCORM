# AGENTS.md - els-react--link-element

**Current version:** `>2.15.8`

Use this file when generating feature code that consumes this component package.
Focus on product usage, accessibility, and prop correctness.

## General integration notes

-   This package provides React component(s) for the Leyden Design System.
-   Import the related Leyden SCSS files from this package's `/dist` folder in your project as well.
-   Avoid duplicate SCSS imports when multiple components share the same SCSS dependency.
-   Component documentation is available at https://leyden.elsevier.com.

## What this package exports

-   `LinkElement`

## Usage guidance (design/UX intent)

-   Used for navigating through pages, parts of a process, etc.
-   Navigate to a different page within the application
-   Navigate to an entirely different site
-   Jump to an element on the same page
-   Link to emails or phone numbers
-   Related guidance areas: Use links when you want users to:; When not to use; Inline Link Underline Rule; Preferred (by w3.org); Acceptable; Above and beyond

## LinkElement props and behavior

-   `children`: options/type: `node`; default: `none`
-   `href`: options/type: `string`; default: `none`; notes: URL or path the link points to
-   `routerComponent`: options/type: `elementType`; default: `null`; notes: Custom router link component to use instead of standard anchor tag
-   `routerHrefAttribute`: options/type: `string`; default: `'to'`; notes: The attribute name used for the href value if routerComponent is used. For example Link uses to, which is therefore the default.
-   `isExternal`: options/type: `bool`; default: `false`; notes: Link opens in a new window. Includes overrideable explanatory accessibility text. Adds an arrow icon if no other icon is specified
-   `noExternalIcon`: options/type: `bool`; default: `false`; notes: In some cases, such as links which are clearly to Elsevier properties, or otherwise already labelled as external, the default external icon can be suppressed
-   `inline`: options/type: `bool`; default: `false`; notes: For use within paragraphs. Uses a dotted underline to pass a11y differentiation requirements with the surrounding text
-   `block`: options/type: `bool`; default: `false`; notes: For use with standalone, wrapping links, so the underline adheres to the text, but the focus block is a neat rectangle
-   `disabled`: options/type: `bool`; default: `false`; notes: HTML does not support the disabled attribute on anchors, however we can do an approximation of it here using aria-disabled and preventing the pointer click events
-   `type`: options/type: `oneOf(/* LinkElement.Type */ 'navigation' | 'info' | 'warn' | 'confirm' | 'alert')`; default: `null`; notes: navigation matches body text for nav lists; info, warn, confirm, and alert use Leyden messaging colors. Icons inherit the same color when shown.
-   `selected`: options/type: `bool`; default: `false`; notes: Highlight the selected item in a navigation. Note this takes priority over disabled styling
-   `iconSprite`: options/type: `oneOf(/* Icon.Sprites */ Icon.Sprites — 483 values, see src/constants/)`; default: `null`; notes: Only first 5 sprites shown as examples. Each type has a default sprite.
-   `iconSize`: options/type: `oneOf(/* Icon.Sizes */ 'xxs' | 'xs' | 's' | 'm' | 'ml' | 'l' | 'xl' | 'stretch')`; default: `'s'`
-   `iconRight`: options/type: `bool`; default: `false`
-   `iconEmphasis`: options/type: `bool`; default: `false`
-   `image`: options/type: `bool`; default: `false`; notes: If the link only contains an image, the underline jars visually so is suppressed
-   `layout`: options/type: `string`; default: `null`; notes: Matches the appearance of the vertical Button layout
-   `padded`: options/type: `oneOf(/* LinkElement.Padding */ 'one-of-two')`; default: `null`; notes: Adds a 1o2 clickable area around the link. Not for use with inline links
-   `ref`: options/type: `oneOfType([object, func])`; default: `none`; notes: A React reference, applied to the button element and used, for example, to send focus to it, with exampleRef.current.focus(). Note, it's better to do this with the keyboard to make the focus outline visible.
-   `id`: options/type: `string`; default: `null`

## Depends on

### React components

-   `els-react--icon`
-   `els-react--utils`

### SCSS packages

-   `els-styleguide-core`
-   `els-styleguide-link`

## Breaking change log

### v2.0.0 (2024-01-03)

-   remove link-element as id
