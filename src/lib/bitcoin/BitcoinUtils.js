/* global BitcoinConstants */
/* global BitcoinJS */
/* global CONFIG */

class BitcoinUtils { // eslint-disable-line no-unused-vars
    static get Network() {
        switch (CONFIG.BTC_NETWORK) {
            case BitcoinConstants.NETWORK.MAIN:
                return BitcoinJS.networks.bitcoin;
            case BitcoinConstants.NETWORK.TEST:
                return BitcoinJS.networks.testnet;
            default:
                throw new Error('Invalid BTC_NETWORK configuration');
        }
    }

    /**
     * @param {string[]} paths
     * @returns {{prefix: string, suffixes: string[]}}
     */
    static pathsToPrefixAndSuffixes(paths) {
        const sorted = paths.concat().sort();
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        let i = 0;
        while (i < first.length && first.charAt(i) === last.charAt(i)) {
            i += 1;
        }
        let prefix = first.substring(0, i);

        // Make sure prefix ends on a slash so we don't derive a partial step
        while (prefix.charAt(prefix.length - 1) !== '/') {
            prefix = prefix.substring(0, prefix.length - 1);
        }

        const suffixes = prefix ? paths.map(path => path.replace(prefix, '')) : paths;

        // Remove trailing slash from prefix before returning
        prefix = prefix.substring(0, prefix.length - 1);

        return {
            prefix,
            suffixes,
        };
    }

    /**
     * @param {BitcoinJS.BIP32Interface} keyPair
     * @returns {BitcoinJS.Payment}
     */
    static keyPairToNestedSegwit(keyPair) {
        return BitcoinJS.payments.p2sh({
            redeem: BitcoinJS.payments.p2wpkh({
                pubkey: keyPair.publicKey,
                network: BitcoinUtils.Network,
            }),
        });
    }

    /**
     * @param {BitcoinJS.BIP32Interface} keyPair
     * @returns {BitcoinJS.Payment}
     */
    static keyPairToNativeSegwit(keyPair) {
        return BitcoinJS.payments.p2wpkh({
            pubkey: keyPair.publicKey,
            network: BitcoinUtils.Network,
        });
    }

    /**
     * @param {string} path
     * @returns {'BIP49'|'BIP84'}
     */
    static parseBipFromDerivationPath(path) {
        if (path.startsWith('m/49\'/')) return BitcoinConstants.BIP.BIP49;
        if (path.startsWith('m/84\'/')) return BitcoinConstants.BIP.BIP84;
        throw new Error(`Could not parse BIP from derivation path: ${path}`);
    }
}
