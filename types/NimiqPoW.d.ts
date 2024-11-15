import _NimiqPoW from '../node_modules/@nimiq/core-web/types';

export as namespace NimiqPoW;
export = _NimiqPoW;

declare global {
    const NimiqPoW: typeof _NimiqPoW;
}
