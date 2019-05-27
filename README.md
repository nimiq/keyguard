# Nimiq Keyguard

This README is about setting up your own instances of Nimiq Keyguard.

For information about using the client please refer to
[the Keyguard Client README](https://github.com/nimiq/keyguard/tree/master/client/README.md).

## Development

Install the dev dependencies:

```sh
yarn
```

Then you can:

- run the build script with `yarn build [config]`.
- run the tests with `yarn test`.
- run the typechecker with `yarn typecheck`.
- run the typecheck file watcher with `yarn watch`.
- run the linter with `yarn lint`.
- automatically fix basic things like spacing, commas, indentation and quotes
  with `yarn lintfix`.
- run `yarn pr` to run all three checks (`typecheck`, `lint`, `test`) as they
  would for a PR.

Note that it is mostly not necessary to run the build script for development purposes, as the code in `src` is fully functional and you can use it as an endpoint.

## Coding Style

- Code style is enforced with ESLint. Run `yarn lint` to see errors.
- Folder names are in Kebab Case: `sign-transaction`.
- Class files are named in Pascal Case: `PinInput.js`, `RpcServer.js`.
- JSDoc @type and @param annotations must have a hyphen between the argument name
  and description:

```javascript
/**
 * @param {string} address - The address to search for
 */
```

- Folder structure:

```text
- src
    - lib
    - components
    - request
- types
- tests
- config
- tools
- demos
- client
    - src
    - types
```

## Configuration

You can configure the following values by configuration files located in folder `src/config`:
- ALLOWED_ORIGIN: The origin from which requests are accepted. '*' allows all origins.
- NETWORK: The network to connect with. Use Constants.NETWORK constants.
- ROOT_REDIRECT: The page where the user is redirected to when accidentally going to root URL.

The config file used for unbuilt code is `config.local.js`. The build script uses `config.testnet.js` by default. To use a different file (especially useful for deployment), pass its name as an argument to the build script. `yarn build mainnet` uses `config.mainnet.js`.

## I18n usage

### Setup

First, import the `I18n.js` lib in your HTML's head section. Then, setup your
dictionary (details see below) and  initialize `I18n` passing your dictionary
and the fallback language that should be used if no translation in the current
language has been found.

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

When the I18n gets started, or when the language has been switched, it will look
for tags with the `data-i18n` attribute and put in the appropriate translation.
`My content` will be replaced.

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

Add `LanguagePicker.js` to your head and then add a language picker widget to your
page:

```javascript
    const languagePicker = new LanguagePicker();
    document.body.appendChild(languagePicker.getElement());
```
