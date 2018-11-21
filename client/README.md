# Nimiq Keyguard Client

This is the client library for Nimiq Keyguard. It is primarily built for internal
use with [Nimiq Accounts Manager](https://github.com/nimiq/accounts).

**Note:** A global Typescript namespace `KeyguardRequest` is declared that
includes all request and result types.

## Install

```sh
npm install --save-dev @nimiq/keyguard-client
```

or

```sh
yarn add --dev @nimiq/keyguard-client
```

## Usage

Add a new file `KeyguardRequest.d.ts` to your project folder and make sure it is
included in your `.tsconfig`. That file should contain:

```typescript
// tslint:disable-next-line no-reference
/// <reference path="./node_modules/@nimiq/keyguard-client/types/KeyguardRequest.d.ts" />
```
