# keyguard-next

## Development
Install the dev dependencies:
```bash
// With NPM
npm install

// With Yarn
yarn
```

Then you can:

- run the tests with `npm run test` or `yarn test`.
- run the typechecker with `npm run typecheck` or `yarn typecheck`.
- run the typecheck file watcher with `npm run watch` or `yarn watch`.
- run the linter with `npm run lint` or `yarn lint`.
- automatically fix basic things like spacing, commas, indentation and quotes with `npm run lintfix` or `yarn lintfix`.
- run `npm run pr` or `yarn pr` to run all three checks (`typecheck`, `lint`, `test`) as they would for a PR.

## Coding Style
- Code style is enforced with ESLint. Run `npm run lint` or `yarn lint` to see errors.
- Folder names are in Kebab Case: `sign-transaction`.
- Class files are named in Pascal Case: `PinInput.js`, `RpcServer.js`.
- JSDoc @type and @param annotations must have a hyphen between the argument name and description:
```
@param {string} address - The address to search for
```
- Folder structure:
```
- src
    - lib
    - components
    - request
- tests
- demos
```

## I18n usage

### Setup
First, import the `I18n.js` lib in your HTML's head section. Then, setup your dictionary (details see below) and  initialize `I18n` passing your dictionary and the fallback language that should be used if no translation in the current language has been found.
```javascript
var myDictionary = {
    'en': {
        ...
    }
};

I18n.initialize(myDictionary, 'en');
```
`I18n` will automatically use the language set up in the user's browser.

### Translate tag content
```html
<div data-i18n="my-translation">My content</div>
```
When the I18n gets started, or when the language has been switched, it will look for tags with the `data-i18n` attribute and put in the appropriate translation. `My content` will be replaced.

### Translate placeholders and value
```html
<input data-i18n-placeholder="my-placeholder-translation"/>
<input data-i18n-value="my-value-translation"/>
```
Similarily, I18n will translate the texts for value and placeholder.

### Dictionary
Format:
```javascript
{
    "en": {
        "my-translation": "Content in English"
    },
    "de": {
        "my-translation": "Inhalt auf Deutsch"
    }
}
```

### Language picker
Add `LanguagePicker.js` to your head and then add a language picker widget to your page:
```javascript
    const languagePicker = new LanguagePicker();
    document.body.appendChild(languagePicker.getElement());
```
