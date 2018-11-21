Client library for Nimiq Keyguard. Primarily built for internal use with [Nimiq Accounts Manager] (https://github.com/nimiq/accounts).
Note: A global typescript namespace 'KeyguardRequests' is declared.

# Install:
````
npm install --save-dev @nimiq/keyguard-client
````
or
````
yarn add --dev @nimiq/keyguard-client
````

# Usage:
Add a new file 'KeyguardRequests.d.ts' to your project folder and make sure it is included in your .tsconfig. That file
should contain:
````
// tslint:disable-next-line no-reference
/// <reference path="./node_modules/@nimiq/keyguard-client/types/KeyguardRequests.d.ts" />

````