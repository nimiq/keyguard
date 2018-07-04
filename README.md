# keyguard-next

## Development
Install the TypeScript compiler globally:
```
// With NPM
sudo npm install --global typescript

// With Yarn
yarn global add typescript
```
Then run the file watcher with `npm run watch` or `yarn watch`.

## Coding Style
- Folder names in Kebab Case: `sign-transaction`
- Class files are named in Pascal Case: `PinInput.js`, `RpcServer.js`
- JSDoc @type and @param annotations must have a hyphon between argument name and description:
```
@param {string} address - The address to search for
```
- Folder structure:
```
- src
    - lib
    - components
    - pages
- tests
- demos
```
