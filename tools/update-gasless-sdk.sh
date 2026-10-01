#!/bin/bash
# Vendors the core of @nimiq/gasless-sdk (https://github.com/NimiqToolbox/gas-abstraction) from a built SDK:
# the browser bundle as src/lib/polygon/NimiqGaslessCore.js and its type declarations into types/gasless-sdk.
# Afterwards, update the NimiqGaslessCore hash in tools/build.sh.
#
# Usage: tools/update-gasless-sdk.sh [path to the SDK's dist directory, default: ../gas-abstraction/sdk/dist]

set -e

SDK_DIST=${1:-../gas-abstraction/sdk/dist}

if [ ! -f "$SDK_DIST/core/index.global.js" ]; then
    echo "No SDK build found in $SDK_DIST, build it first with 'pnpm build:sdk' in the gas-abstraction repository."
    exit 1
fi

# Without the source map reference, which is not vendored
sed '/^\/\/# sourceMappingURL=/d' "$SDK_DIST/core/index.global.js" > src/lib/polygon/NimiqGaslessCore.js

rm -rf types/gasless-sdk
mkdir -p types/gasless-sdk/core
cp "$SDK_DIST/core/index.d.ts" types/gasless-sdk/core/index.d.ts
for chunk in $(grep -oh "'\.\./[^']*\.js'" "$SDK_DIST/core/index.d.ts" | tr -d "'" | sed 's|^\.\./||; s|\.js$|.d.ts|' | sort -u); do
    cp "$SDK_DIST/$chunk" "types/gasless-sdk/$chunk"
done

sha256sum src/lib/polygon/NimiqGaslessCore.js
