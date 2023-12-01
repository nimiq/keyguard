import * as _Albatross from '../node_modules/@nimiq/albatross-wasm/types/web';

export as namespace Albatross;
export = _Albatross;

declare global {
    const Albatross: typeof _Albatross;
}
