# AGENTS.md - els-react--utils

**Current version:** `>2.15.2`

Use this file when generating feature code that consumes this package.
Focus on correct usage of each utility, their parameters, return values, and side effects.

## General integration notes

-   This package is part of the Leyden Design System. It provides reusable JavaScript utility functions and React helpers used across Leyden components.
-   Unlike other Leyden packages, this package contains no CSS and no visual component — it is a utility/helper library only.
-   Component documentation is available at https://leyden.elsevier.com.

## What this package exports

-   `appendClass` — function
-   `createEnum` — function (deprecated)
-   `ErrorBoundary` — React class component
-   `makeErrorBoundComponent` — higher-order component factory
-   `formatFileSize` — function
-   `getFunctionBody` — function
-   `isBlankFunction` — function
-   `generateId` — function
-   `GlobalFocusOffset` — React component
-   `GlobalFocusToggle` — React component
-   `useEventListener` — React hook
-   `useId` — React hook
-   `sanitizeForSerialization` — function
-   `validateRequiredProps` — function
-   `ValidPropTypes` — frozen constants object

## Utility reference

### `appendClass({ className, value, delimiter })`

Transforms a class string by appending a delimiter and value to each individual class.
Useful for BEM naming where a base class name is variable and element/modifier suffixes need applying to all variants.

-   **`className`** `string` — space-separated list of existing CSS class names
-   **`value`** `string` — the string to append to each class name
-   **`delimiter`** `string` — separator between each class name and the value (e.g. `'--'` or `'__'`)
-   **Returns** `string` — space-separated list of transformed class names
-   **Throws** `TypeError` if any argument is not a string

**Example:**

```js
appendClass({
    className: 'c-els-button c-els-link',
    value: 'active',
    delimiter: '--',
});
// => 'c-els-button--active c-els-link--active'
```

---

### `createEnum(data)` _(deprecated)_

Creates an immutable enum-like object from an array of strings or a plain object.
**Deprecated** — prefer frozen static objects (`Object.freeze({})`) instead (STYLE-1511).

-   **`data`** `string[] | object` — values to build the enum from; string values are converted to SCREAMING_SNAKE_CASE keys
-   **Returns** `object | Proxy` — the frozen enum; in development, returns a Proxy with helpful console errors for invalid key access
-   **`getAll()`** method is added to return all enum values (useful for `PropTypes.oneOf` or `Array.includes`)
-   **Throws** `TypeError` if `data` is not an array or object

---

### `ErrorBoundary` (React component)

A React class component that catches errors thrown by its child component tree and renders a fallback UI instead of crashing the page. It also wraps its child in `validateRequiredProps` so that errors from missing or incorrectly typed required props are caught and surfaced rather than silently ignored.

**Context:** Leyden React components are written to `throw` when a detectable prop problem exists, rather than silently falling back to a default. `ErrorBoundary` ensures these throws don't crash the whole page. It is used internally by every Leyden component (via `makeErrorBoundComponent`) but is also available for use in application components that follow the same pattern.

**Props:**

-   **`children`** `node` _(required)_ — the render tree to protect; must be a single React element (the child's `type.requiredProps` is read for validation)
-   **`className`** `string`; default: `''` — custom classes for styling the error container
-   **`fallback`** `func`; default: `null` — custom render function called with `(error, classes)` when an error is caught; if omitted, a default styled red-bordered error message is shown
-   **`report`** `func`; default: `null` — optional error reporting callback called with `(error, info)`; if omitted, logs to `console.error`

**Behaviour:** When an error is caught, `getDerivedStateFromError` sets `hasError: true` and stores the error. On recovery (parent re-renders without error), state resets automatically.

**Error scenarios caught:**

| Scenario                                 | Result                                                           |
| ---------------------------------------- | ---------------------------------------------------------------- |
| Child has no `requiredProps` defined     | Throws — component must define `requiredProps`                   |
| Child's `requiredProps` is not an object | Throws `TypeError: requiredProps must be an object`              |
| Required prop is `undefined`             | Throws `TypeError: Required prop '<name>' is undefined`          |
| Required prop is wrong type              | Throws `TypeError: Required prop '<name>' is incorrect type`     |
| Nested required props are wrong type     | Checked recursively using dot-path notation                      |
| `requiredProps` is `{}` (empty object)   | Passes without error — use this to opt in with no required props |

---

### `makeErrorBoundComponent(Component)`

Higher-order component factory. Wraps any Leyden raw component in `ErrorBoundary` and wires up required-prop validation. All component packages export their default via this function.

-   **`Component`** `ReactComponent` — the raw component to wrap
-   **Returns** a `forwardRef` component with an `ErrorBound<Name>` display name and all static properties (e.g. `propTypes`, `defaults`, `requiredProps`) copied across
-   `fallback` and `report` props from `ErrorBoundary` are available on the returned component

**Example:**

```js
export const RawButton = Button;
export default makeErrorBoundComponent(RawButton);
```

---

### `formatFileSize(fileSizeBytes)`

Converts a file size in bytes to a human-readable string in the most appropriate unit.

-   **`fileSizeBytes`** `number` — file size in bytes
-   **Returns** `string` — e.g. `'512 bytes'`, `'1.5 KB'`, `'2.3 MB'`, `'1.1 GB'`

---

### `getFunctionBody(fn)`

Extracts the body of a function as a string (content between the outermost `{` and `}`).

-   **`fn`** `function` — the function to inspect
-   **Returns** `string` — trimmed function body

---

### `isBlankFunction(fn)`

Checks whether a function has an empty body.

-   **`fn`** `function` — the function to check
-   **Returns** `boolean` — `true` if the body is empty, `false` otherwise

---

### `generateId(length?)`

Generates a random alphanumeric string using `crypto.randomUUID()`.
Use this to create stable component IDs by initialising the result in component state (so it doesn't change on re-render).

-   **`length`** `number`; default: `5`, max: `32` — length of the generated string
-   **Returns** `string` — random alphanumeric ID

---

### `GlobalFocusOffset` (React component)

An accessibility utility that prevents a focused element from being hidden behind fixed elements at the top of the page (typically a fixed Header). When the user presses Tab, it scrolls the page so the newly focused element is visible below the specified offset. Place once in the app tree alongside the Header.

**Props:**

-   **`topOffset`** `number` _(required)_ — pixel height of fixed elements at the top of the page to account for (e.g. `86` for a fixed Header); focused elements whose top edge is less than this value will have the page scrolled to reveal them

**Notes:**

-   Returns `null` — renders nothing; side-effect only
-   The default `topOffset` used on the Leyden documentation site is `86`

---

### `GlobalFocusToggle` (React component)

An accessibility utility that suppresses focus outlines for mouse users while ensuring they remain visible for keyboard and assistive device users. This is important for accessibility — focus states are vital for keyboard navigation but distracting for mouse users.

Behaviour: adds the CSS scope class `s-els-no-focus` to the target element on `mousedown`, and removes it when `Tab`, `ArrowDown`, or `ArrowUp` is pressed.

**CSS dependency:** The `.s-els-no-focus` scope class is defined in `els-styleguide-core` (Core). Non-React projects can apply the same pattern using the toggling logic directly without this component.

**Props:**

-   **`children`** `node` _(required)_ — the full application render tree; the component wraps your entire app
-   **`selector`** `string`; default: `'body'` — DOM element selector where the `s-els-no-focus` class is toggled and where focus toggle event listeners are attached

**Notes:**

-   Returns `children` — transparently wraps the render tree without adding a DOM element
-   Place once at the very top level of the application, wrapping everything
-   Cleans up event listeners on unmount

---

### `useEventListener(eventName, handler, element?)`

React hook that attaches an event listener and automatically cleans it up when the component unmounts or dependencies change.

-   **`eventName`** `string` — DOM event type, e.g. `'keydown'`, `'click'`
-   **`handler`** `function` — callback to invoke on the event; will always use the latest version without needing to be in the dependency array
-   **`element`** `object` (optional) — a ref object (`.current`) or a DOM element to attach to; defaults to `window` if omitted (SSR-safe)

---

### `useId(id?, format?)`

React hook that returns a stable ID for a component. Returns the provided `id` directly if supplied, otherwise generates a new random ID once per component mount.

-   **`id`** `string` (optional) — an externally supplied ID to use instead of generating one
-   **`format`** `function`; default: identity — pure formatter applied to the generated ID
-   **Returns** `string` — the provided or generated ID

**Example:**

```js
const componentId = useId(props.id, (id) => `my-component-${id}`);
```

---

### `sanitizeForSerialization(value, reactSerializationFunction?)`

Recursively converts a value so it is safe to pass through `JSON.stringify`. Converts React elements to plain objects, flattens HTML element refs (which would otherwise cause circular reference errors), and leaves primitive values unchanged.

-   **`value`** `*` — any value: React element, HTML element, array, object, or primitive
-   **`reactSerializationFunction`** `function` (optional) — custom serializer for React elements; useful in the documentation app for generating readable React element strings
-   **Returns** `object | *` — the sanitized, serializable value

---

### `validateRequiredProps(renderedComponent)`

Validates a rendered React element's props against its `requiredProps` static property. Called internally by `ErrorBoundary` / `makeErrorBoundComponent`. Throws a `TypeError` in both development and production if a required prop is missing or the wrong type.

-   **`renderedComponent`** `ReactElement` — the rendered element whose `type.requiredProps` will be checked
-   **Returns** the `renderedComponent` unchanged if validation passes
-   **Throws** `TypeError` if any required prop is missing, the wrong type, or if `requiredProps` is not an object

---

### `ValidPropTypes`

A frozen constants object mapping type names to their string values. Used as values in a component's `requiredProps` static property.

```js
export const ValidPropTypes = Object.freeze({
    ARRAY: 'array',
    BOOL: 'bool',
    FUNCTION: 'function',
    NODE: 'node',
    NUMBER: 'number',
    OBJECT: 'object',
    STRING: 'string',
});
```

**Usage in a component:**

```js
MyComponent.requiredProps = {
    label: ValidPropTypes.STRING,
    onClick: ValidPropTypes.FUNCTION,
};
```

## Breaking change log

### v2.0.0 (2022-08-18)

-   Update NPM version to 8.x.x and remove all yarn support
