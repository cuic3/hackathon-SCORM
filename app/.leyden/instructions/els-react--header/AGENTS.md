# AGENTS.md - els-react--header

**Current version:** `>1.17.8`

Use this file when generating feature code that consumes this component package.
Focus on product usage, accessibility, and prop correctness.

## General integration notes

-   This package provides React component(s) for the Leyden Design System.
-   Import the related Leyden SCSS files from this package's `/dist` folder in your project as well.
-   Avoid duplicate SCSS imports when multiple components share the same SCSS dependency.
-   Component documentation is available at https://leyden.elsevier.com.

## What this package exports

-   `Header`

## Usage guidance (design/UX intent)

-   The header is an essential component from a usability and Brand perspective. It is consistently available and contains functionality for the current product as well as a clear visual tie to Elsevier’s brand equity. The header provides consistent locations for navigation. This component provides consistency and familiarity across products to enable people to easily adopt new products or navigate between related products.
-   Non Solus logo - Products which associate with the larger Elsevier Brand have been shown to gain trust, brand equity, and authority.
-   Product name - Tie your product name to the Elsevier Brand by using an approved wordmark. Request a wordmark using the Workmark request form.
-   Navigation buttons - Use one or two words to provide quick access to the main areas in your app where users visit most often. Test these selections, their order, and different words to achieve the best navigation possible.
-   Icon buttons - Only use icon buttons for actions that can be clearly represented with imagery. Account, Search, Settings, Help are some common actions found in headers that have widely understood iconography. If there is any doubt that users will understand an icon choice, test it with them before including it.
-   User account - Use initials for signed in experiences and the Person icon for not signed in. This element often opens a menu with more options for account management or signing in.
-   Hamburger menu - Collect other navigation links into this area if space is limited. At lower breakpoints, nav buttons and icon buttons should move into this menu.
-   Tips for Creating an Enviable Homepage: Navigation and Header Design (Vital Design)
-   Related guidance areas: Anatomy

## Header props and behavior

-   `wordmark`: options/type: `node`; default: `none`; notes: Note if wordmarkLink is set this JSX must not contain block level elements as they must not be nested inside an a element
-   `wordmarkLink`: options/type: `object`; default: `null`; notes: Accepts all properties of LinkElement. Using this prop wraps the full logo and wordmark in a link. You should include routerComponent if using one (usually React Router's Link).
-   `treeOnly`: options/type: `bool`; default: `false`
-   `onDark`: options/type: `bool`; default: `false`
-   `small`: options/type: `bool`; default: `false`
-   `fixed`: options/type: `bool`; default: `false`; notes: If header is fixed you should ensure focussed elements cannot appear behind it. See the Accessibility tab for guidance.
-   `scrolled`: options/type: `bool`; default: `false`; notes: To be set true when page is scrolled for fixed headers
-   `hideTreeAtMobile`: options/type: `bool`; default: `false`; notes: Do not show the tree logo at mobile breakpoint to save space
-   `headerIconProps`: options/type: `object`; default: `null`; notes: Accepts all props that Button does. Size and Type are non-configurable. Requires sprite, and appropriate accessibility configuration values as a minimum.
-   `children`: options/type: `node`; default: `null`
-   `id`: options/type: `string`; default: `null`

## Code examples

```jsx
<Header wordmark="Example wordmark" />
```

```jsx
<Header
    wordmark="Example wordmark"
    wordmarkLink={{ href: 'https://www.elsevier.com' }}
/>
```

```jsx
<Header
    wordmark="Example wordmark"
    wordmarkLink={{ href: 'https://www.elsevier.com' }}
    headerIconProps={{
        sprite: 'Menu',
        children: 'menu',
        onClick: () => {
            // eslint-disable-next-line no-console
            console.log('menu clicked');
        },
    }}
/>
```

## Depends on

### React components

-   `els-react--link-element`
-   `els-react--logo`
-   `els-react--utils`

### SCSS packages

-   `els-styleguide-core`
-   `els-styleguide-header`
-   `els-styleguide-link`

## Breaking change log

### v1.0.0 (2022-08-18)

-   React (S)CCS assets renamed, and no longer imported into the React components
-   Update NPM version to 8.x.x and remove all yarn support
