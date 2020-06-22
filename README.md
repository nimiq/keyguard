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

For local testing of the Keyguard you can setup a local server, for example using
[`python -m http.server 8000`](https://docs.python.org/3/library/http.server.html#http-server-cli).
Note that it is mostly not necessary to run the build script for development purposes, as the code in `src` is fully
functional and you can use it as an endpoint. Only (re)generating the translation dictionary needs to be triggered
manually via `yarn i18n:build-dictionary`. For convenient testing of the Keyguard there are demos provided under
`/demos`.

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
    - assets
    - components
    - config
    - lib
    - request
    - translations
- types
- tests
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

The config file used for unbuilt code is `config.local.js`. The build script uses `config.testnet.js` by default. To use
a different file (especially useful for deployment), pass its name as an argument to the build script.
`yarn build mainnet` uses `config.mainnet.js`.

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

The Keyguard uses an app wide dictionary auto-generated from separate language
files, see section [Contribute to translations](#contribute-to-translations).

`I18n` will by default use the language specified in a `lang` cookie if present
or otherwise fallback to the browser's language or English.

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

### Language picker

Add `LanguagePicker.js` to your head and then add a language picker widget to your
page:

```javascript
    const languagePicker = new LanguagePicker();
    document.body.appendChild(languagePicker.getElement());
```

### Contribute to translations

First of all, a big thank you to all translators!

The Nimiq Keyguard is fully internationalized and ready for the community to add translations in different languages.

To help translate the Keyguard, the procedure is as follows:

- Clone this repository.

- The translations are located in the `src/translations` folder. A translation file for a language is named as the
  language's two letter [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) plus file extension
  `.json`. For example, for French with two letter code `fr` the translations are located at `src/translations/fr.json`.
  If that file doesn't exist yet, i.e. you're starting a new translation, please duplicate `en.json` as starting point
  and rename it accordingly.

- The translation files are in a key-value json format.
  For Example:
  ```json
  "my-translation": "Content in English",
  "timer-expiry": "This offer expires in",
  ```
  Where the key is the unique identifier of the string to translate. You can find the source string to translate in the
  `en.json` file.
  Please only edit the translations, not the source strings nor the keys.

- During the build step, a language dictionary is auto-generated from the separate translation files at
  `src/translation/index.js`. Please do not edit this file but only the separate translation files.

- You can test your translations locally by setting up a local development server as described in section
  [development](#development) and then setting the language cookie in the served page. To do so, open your browser's
  developer console (ctrl + shift + c) and input `document.cookie = 'lang=<lang>'` where `<lang>` should be replaced by
  the two letter language code of the language you want to test, for example `document.cookie = 'lang=fr'`. If you
  struggle setting up the local demo you can ask us to setup an online demo for you after opening a pull request.

- Once the file has been fully translated or you are done updating an existing translation file, you can open a pull
  request here in github.

- The pull request will then be reviewed and, if all goes well, merged into the master branch and published asap.

#### Additional information

- Words between square brackets are html tags which must not be translated nor edited. They will be replaced by a html
  tag during app runtime. For example:
  ```json
  "recovery-words-intro-offline": "Keep your words offline, enter them nowhere but on [strong]keyguard[/strong].nimiq.com."
  ```

- If you're a transifex collaborator, and need some information about how to get started, here are two links for you:
  - How to get started as a translator: https://docs.transifex.com/getting-started-1/translators
  - How translate using the web editor: https://docs.transifex.com/translation/translating-with-the-web-editor
