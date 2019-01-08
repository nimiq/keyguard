# Nimiq Keyguard(-next)

This README is about setting up your own instances of Nimiq Keyguard.

For information about using the client please refer to
[the Keyguard Client README](https://github.com/nimiq/keyguard-next/tree/master/client/README.md).

## Development

Install the dev dependencies:

```sh
yarn
```

Then you can:

- run the build script with `yarn build`.
- run the tests with `yarn test`.
- run the typechecker with `yarn typecheck`.
- run the typecheck file watcher with `yarn watch`.
- run the linter with `yarn lint`.
- automatically fix basic things like spacing, commas, indentation and quotes
  with `yarn lintfix`.
- run `yarn pr` to run all three checks (`typecheck`, `lint`, `test`) as they
  would for a PR.

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
- tests
- demos
```

## Configuration

You can configure the following values via environment variables, which are replaced by the build script.
- KEYGUARD_ALLOWED_ORIGIN: The origin from which requests are accepted. For Team Nimiq's Keyguard, this would be 'http://accounts.nimiq.com'. Be aware that slashes have to be masked by `\`. Defaults to `'*'`, which allows all origins.
- KEYGUARD_CDN: The CDN (content delivery network) from which the core library is served. Defaults to 'https://cdn.nimiq-testnet.com'.

For local development, you can set temporary environment variables (valid in your current terminal session) by e.g.
```export KEYGUARD_ALLOWED_ORIGIN='https:\/\my-custom-accounts-instance.com'```
on Unix-based systems or
```set KEYGUARD_ALLOWED_ORIGIN='https:\/\my-custom-accounts-instance.com'```
on Windows. For a persisted configuration on your webserver, please refer to the server's documentation, e.g. [https://httpd.apache.org/docs/2.4/env.html] for Apache.

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
