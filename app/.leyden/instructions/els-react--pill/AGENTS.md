# AGENTS.md - els-react--pill

**Current version:** `>2.21.8`

Use this file when generating feature code that consumes this component package.
Focus on product usage, accessibility, and prop correctness.

## General integration notes

-   This package provides React component(s) for the Leyden Design System.
-   Import the related Leyden SCSS files from this package's `/dist` folder in your project as well.
-   Avoid duplicate SCSS imports when multiple components share the same SCSS dependency.
-   Component documentation is available at https://leyden.elsevier.com.

## What this package exports

-   `Pill`
-   `PillWithIcon`

## Usage guidance (design/UX intent)

-   Highlight specific areas of the experience as new or use for categorization of information.

## Pill props and behavior

-   `children`: options/type: `node`; default: `null`
-   `pillColor`: options/type: `string`; default: `''`; notes: Supports any Leyden Color. Ensure color combinations meet accessibility contrast requirements.
-   `textColor`: options/type: `string`; default: `''`; notes: Supports any Leyden Color. Ensure color combinations meet accessibility contrast requirements.
-   `condensed`: options/type: `bool`; default: `false`; notes: Reduces padding, designed for displaying numbers
-   `onClick`: options/type: `func`; default: `null`
-   `onClose`: options/type: `func`; default: `null`
-   `disabled`: options/type: `bool`; default: `false`; notes: Disables the pill preventing user interaction
-   `id`: options/type: `string`; default: `null`

## PillWithIcon props and behavior

-   `iconProps`: options/type: `object`; default: `none`; notes: Supports all the props of Icon. Must include sprite. a11y is only required if no children are provided.
-   `iconColor`: options/type: `string`; default: `''`; notes: Supports any Leyden Color. Overrides textColor if provided.
-   `iconRight`: options/type: `bool`; default: `false`

## Code examples

```jsx
<>
    <Pill onClose={() => {}}>With close action</Pill>{' '}
    <Pill onClick={() => {}}>With click action</Pill>{' '}
    <Pill onClose={() => {}} onClick={() => {}}>
        With click and close actions
    </Pill>
</>
```

```jsx
<>
    <Pill pillColor="shape-confirm">Confirm shape</Pill>{' '}
    <Pill pillColor="shape-paper" textColor="text">
        Background and text color
    </Pill>{' '}
    <Pill pillColor="shape-disabled" onClose={() => {}}>
        Disabled with close button
    </Pill>{' '}
</>
```

```jsx
<>
    <Pill className="u-els-margin-bottom">
        With wrapped
        <br />
        text
    </Pill>
    <br />
    <Pill onClose={() => {}} className="u-els-margin-bottom">
        With wrapped text
        <br />
        and close action
    </Pill>
    <br />
    <Pill onClick={() => {}} className="u-els-margin-bottom">
        With wrapped text
        <br />
        and click action
    </Pill>
    <br />
    <Pill onClose={() => {}} onClick={() => {}} className="u-els-margin-bottom">
        With click and close actions
        <br />
        and wrapped text
    </Pill>
</>
```

## Depends on

### React components

-   `els-react--icon`
-   `els-react--utils`

### SCSS packages

-   `els-styleguide-core`
-   `els-styleguide-pill`

## Breaking change log

### v2.0.0 (2022-08-18)

-   React (S)CCS assets renamed, and no longer imported into the React components
-   Update NPM version to 8.x.x and remove all yarn support
