import * as _BitcoinJS from '../node_modules/bitcoinjs-lib';
import type { BIP32API, BIP32Interface } from '../node_modules/bip32';
import type { ECPairAPI, ECPairInterface } from '../node_modules/ecpair';

export * from '../node_modules/bitcoinjs-lib';
export type { BIP32Interface, ECPairInterface };
export type { PsbtInput } from '../node_modules/bip174';

export as namespace BitcoinJSTypes;

declare global {
    // As exported by tools/bitcoinjs-parts.js
    const BitcoinJS: Pick<typeof _BitcoinJS, 'networks' | 'payments' | 'address' | 'script' | 'Psbt'> & {
        bip32: BIP32API,
        ECPair: ECPairAPI,
    };
}
