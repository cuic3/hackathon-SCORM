# AGENTS.md - els-react--footer

**Current version:** `>7.9.8`

Use this file when generating feature code that consumes this component package.
Focus on product usage, accessibility, and prop correctness.

## General integration notes

-   This package provides React component(s) for the Leyden Design System.
-   Import the related Leyden SCSS files from this package's `/dist` folder in your project as well.
-   Avoid duplicate SCSS imports when multiple components share the same SCSS dependency.
-   Component documentation is available at https://leyden.elsevier.com.

## What this package exports

-   `Footer`

## Usage guidance (design/UX intent)

-   A page footer can contain common links to complement primary navigation. It contains legal and branding information while informing the user they have reached the end of page content.

## Footer props and behavior

-   `applicationLinks`: options/type: `array`; default: `[]`; notes: Content info links from your application. Each item in the array accepts all properties of LinkElement.
-   `noPadding`: options/type: `bool`; default: `false`; notes: Removes left and right padding from the footer
-   `onDark`: options/type: `bool`; default: `false`; notes: Applies styling for display on dark backgrounds
-   `monochromeLogo`: options/type: `bool`; default: `false`; notes: Displays the monochrome version of the Elsevier logo. For use with new branding
-   `copyrightYear`: options/type: `number`; default: `new Date().getFullYear()`; notes: Set to the system year of the user by default
-   `legalEntity`: options/type: `oneOf(/* Footer.LegalEntities */ 'Elsevier Inc.' | 'Elsevier Ltd.' | 'Elsevier B.V.' | '3D4Medical Ltd.' | 'Interfolio Inc.')`; default: `none`; notes: Follow the Brand Guidelines when choosing a legal entity. Please let us know if your needed entity is not listed.
-   `showOpenAccessCopyright`: options/type: `bool`; default: `false`; notes: Must be used if your application delivers Open Access content per the Brand Guidelines
-   `shouldShowHelpLink`: options/type: `bool`; default: `false`; notes: Shows the Help link in the footer
-   `privacyPolicyLanguage`: options/type: `string`; default: `''`; notes: Suffix applied to the privacy policy link for different translations maintained by Elsevier legal. Current available options are de-de, ja-jp, fr-fr, pl-pl, es-es, ko-kr, zh-tw, zh-cn, es-mx, ru-ru, tr-tr, and pt-br.
-   `legalContentLanguage`: options/type: `oneOf(/* Footer.LegalContentLanguages */ 'chineseSimplified' | 'chineseTraditional' | 'english' | 'farsi' | 'french' | 'german' | 'italian' | 'japanese' | 'korean' | 'portugeseBrazil' | 'portugesePortugal' | 'russian' | 'spanish' | 'turkish')`; default: `LegalContentLanguages.ENGLISH`; notes: Legal information in Footer will be shown in the selected language. Japanese and Korean deliberately display in English. Text is provided by the Elsevier legal team and may not be customized.
-   `helpLink`: options/type: `string`; default: `'https://service.elsevier.com/app/home/supporthub/'`; notes: Full URL for the help page for your application
-   `accessibilityLink`: options/type: `string`; default: `'https://www.elsevier.com/about/accessibility'`; notes: Full URL for the accessibility statement for your application
-   `children`: options/type: `node`; default: `null`; notes: Custom content to display in the footer
-   `cookieConsentConfig`: options/type: `object`; default: `null`; notes: If your application sets cookies you must contact the Elsevier Privacy team (email privacy@...) to obtain the id used here. Leyden will include the OneTrust JS by default, however if you want to include their files yourself add linkOnly: true and Leyden will only include the cookie link markup. Unfortunately OneTrust translates its link text based on the lang tag of your document, irrespective of what you set COOKIE_TOOL_LINK_TEXT to be in the messages prop.
-   `id`: options/type: `string`; default: `null`; notes: Unique identifier for the footer element

## Depends on

### React components

-   `els-react--link-element`
-   `els-react--logo`
-   `els-react--utils`

### SCSS packages

-   `els-styleguide-core`
-   `els-styleguide-footer`
-   `els-styleguide-link`

## Breaking change log

### v7.0.0 (2024-11-13)

-   removes the option to set your own translations of legal content. Now you must pick from the options provided.

### v6.0.0 (2024-01-25)

-   1. internal id attributes changed 2. testids reformatted to match other components' pattern

### v5.0.0 (2024-01-03)

-   remove link-element as id
-   remove link-element as id

### v4.0.0 (2023-07-21)

-   text props removed, and replaced by single `messages` object
-   change internationalization method to use `messages` object ([9952cdf](https://github.com/elsevier-health/health-leyden/commit/9952cdfd742eaecd4ea310dcc46977fdf75c5cbb))

### v3.0.0 (2022-09-27)

-   If the application already has an a11y link in the applicationLinks array, two a11y links will now be shown. The one in applicationLinks should be migrated to the new accessibilityLink prop.

### v2.0.0 (2022-08-18)

-   React (S)CCS assets renamed, and no longer imported into the React components
-   Update NPM version to 8.x.x and remove all yarn support
