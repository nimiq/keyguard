import _BitcoinJS from '../node_modules/bitcoinjs-lib/types';

export as namespace BitcoinJS;
export = _BitcoinJS;

declare global {
    const BitcoinJS: typeof _BitcoinJS;
}
