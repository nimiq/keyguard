# keyguard-next

## Development
Install the dev dependencies:
```
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
