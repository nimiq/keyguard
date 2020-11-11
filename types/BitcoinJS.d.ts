import _BitcoinJS from '../node_modules/bitcoinjs-lib/types';
import { Buffer as _Buffer } from '../node_modules/buffer';

declare module '../node_modules/bitcoinjs-lib/types' {
    export type Buffer = _Buffer;
}

export as namespace BitcoinJSTypes;
export = _BitcoinJS;

declare global {
    const BitcoinJS: typeof _BitcoinJS & {
        Buffer: typeof _Buffer;
    };
}
