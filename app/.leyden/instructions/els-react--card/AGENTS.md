# AGENTS.md - els-react--card

**Current version:** `>2.11.8`

Use this file when generating feature code that consumes this component package.
Focus on product usage, accessibility, and prop correctness.

## General integration notes

-   This package provides React component(s) for the Leyden Design System.
-   Import the related Leyden SCSS files from this package's `/dist` folder in your project as well.
-   Avoid duplicate SCSS imports when multiple components share the same SCSS dependency.
-   Component documentation is available at https://leyden.elsevier.com.

## What this package exports

-   `Card`
-   `ClickableCard`

## Usage guidance (design/UX intent)

-   A card is a preview that serves as an entry point to more detailed information. They should be easy to digest, providing relevant information and available actions. The hierarchy should be clear within the card.
-   Use Cards when you need to group information in a digestible form.
-   Use Cards when you need to offer a short entry point that is linked to more detailed content or a complex task.
-   Use Cards to lay out single or multiple sets of related information in the same region of the page. Cards may include an image, a text summary, pills, and actions. Cards typically have similar widths, but heights should accommodate varying content.
-   Cards should be placed inside a layout grid to help with alignment and sizing.
-   You need to show unrelated content types or actions in a single container.
-   You need to show content in multiple columns.
-   You need to display content in a table format.
-   Related guidance areas: Do not use cards when:

## Card props and behavior

-   `size`: options/type: `oneOf(/* Card.Sizes */ 'minimum' | 'xx-small' | 'x-small' | 'small' | 'medium')`; default: `CardSizes.SMALL`; notes: Controls the size of padding inside the card
-   `type`: options/type: `oneOf(/* Card.Types */ 'default' | 'primary' | 'secondary' | 'info' | 'confirm' | 'warn' | 'alert')`; default: `CardTypes.DEFAULT`; notes: Visual style of the card, controls border and background color(if fill is set)
-   `borderWeight`: options/type: `oneOf(/* Card.BorderWeights */ 'none' | 'light' | 'medium' | 'heavy')`; default: `CardBorderWeights.LIGHT`
-   `fill`: options/type: `bool`; default: `false`; notes: Applies a filled background color to the card
-   `heading`: options/type: `oneOfType([string, func, node])`; default: `''`
-   `headingLevel`: options/type: `oneOf(/* Card.HeadingLevels */ 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6')`; default: `CardHeadingLevels.H2`; notes: HTML heading level for the card title
-   `children`: options/type: `node`; default: `none`
-   `element`: options/type: `oneOf(/* Card.Elements */ 'address' | 'aside' | 'div' | 'figure' | 'section')`; default: `CardElements.DIV`; notes: HTML element type to use for the card container. If figure is used, figcaption must be included. element is not compatible with ClickableCard.
-   `radius`: options/type: `oneOf(/* Card.Radii */ 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl')`; default: `CardRadii.M`
-   `elevation`: options/type: `oneOf(/* Card.Elevations */ 'low' | 'medium' | 'high' | 'overlap')`; default: `''`
-   `squaredCorners`: options/type: `array`; default: `[]`; notes: Remove radius from one or more corners. Can be used with bottom-left or bottom-right to create a 'chat bubble'. Note that the all value can be used to square the four corners at once.
-   `suppressedBorders`: options/type: `array`; default: `[]`; notes: Remove border from top and/or bottom sides of the Card. Should only be used when corners are squared using squaredCorners above
-   `iconProps`: options/type: `object`; default: `null`; notes: Optional icon to display in the card. Accepts all configuration props for Icons
-   `id`: options/type: `string`; default: `null`

## ClickableCard props and behavior

-   `onClick`: options/type: `func`; default: `null`; notes: Function called when the card is clicked
-   `href`: options/type: `string`; default: `null`; notes: URL to navigate to when the card is clicked
-   `routerComponent`: options/type: `elementType`; default: `null`; notes: Custom router link component to use instead of standard anchor tag
-   `routerHrefAttribute`: options/type: `string`; default: `'to'`; notes: The prop name used for the href for the routerComponent supplied. For example Link uses to, which is therefore the default.

## Code examples

### Suggestion button

```jsx
<ClickableCard onClick={() => {}} iconProps={{ sprite: 'ArrowHook' }}>
    Tell me more about atrial fibrillation in different demographics
</ClickableCard>
```

### Chat bubble

```jsx
<Card
    onClick={() => {}}
    squaredCorners={[Card.SquaredCorners.BOTTOM_RIGHT]}
    radius={Card.Radii.XL}
>
    What is atrial fibrillation?
</Card>
```

### Stacked cards

```jsx
<>
    <Card
        onClick={() => {}}
        squaredCorners={[
            Card.SquaredCorners.BOTTOM_LEFT,
            Card.SquaredCorners.BOTTOM_RIGHT,
        ]}
    >
        Card 1
    </Card>
    <Card
        onClick={() => {}}
        squaredCorners={[Card.SquaredCorners.ALL]}
        suppressedBorders={[
            Card.SuppressedBorders.TOP,
            Card.SuppressedBorders.BOTTOM,
        ]}
    >
        Card 2
    </Card>
    <Card
        onClick={() => {}}
        squaredCorners={[
            Card.SquaredCorners.TOP_LEFT,
            Card.SquaredCorners.TOP_RIGHT,
        ]}
    >
        Card 3
    </Card>
</>
```

## Depends on

### React components

-   `els-react--icon`
-   `els-react--utils`

### SCSS packages

-   `els-styleguide-card`
-   `els-styleguide-core`

## Breaking change log

### v2.0.0 (2024-05-24)

-   fill switched to boolean. --on-dark removed as it's handled by CSS theme

### v1.0.0 (2022-08-18)

-   React (S)CCS assets renamed, and no longer imported into the React components
-   Update NPM version to 8.x.x and remove all yarn support
