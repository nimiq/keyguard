import * as _Nimiq from '../node_modules/@nimiq/core/types/web';

export as namespace Nimiq;
export = _Nimiq;

declare global {
    const Nimiq: typeof _Nimiq;
}
