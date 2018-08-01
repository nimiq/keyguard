Client library for Nimiq Keyguard.
Note: A global typescript namespace 'Keyguard' is declared.

# Install:
````
npm install --save-dev nimiq-keyguard-client
````
or
````
yarn add --dev nimiq-keyguard-client
````

# Usage:
Add a new file 'Keyguard.d.ts' to your project folder and make sure it is included in your .tsconfig. That file
should contain:
````
// tslint:disable-next-line no-reference
/// <reference path="./node_modules/nimiq-keyguard-client/Keyguard.d.ts" />

````