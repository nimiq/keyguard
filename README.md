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

## Coding Style
- Folder names in Kebab Case: `sign-transaction`
- Class files are named in Pascal Case: `PinInput.js`, `RpcServer.js`
- JSDoc @type and @param annotations must have a hyphen between argument name and description:
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
