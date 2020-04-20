/* global Nimiq */
/* global Key */
/* global BitcoinConstants */
/* global BitcoinJS */
/* global NodeBuffer */

class BitcoinKey {
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
     * @param {Key} key
     */
    constructor(key) {
        if (!(key.secret instanceof Nimiq.Entropy)) {
            throw new Error('Key must be of type Nimiq.Entropy');
        }
        this._secret = key.secret;
        this._hasPin = key.hasPin;
        this._id = key.id;
    }

    /**
     * @returns {Key}
     */
    toKey() {
        return new Key(this._secret, this._hasPin);
    }

    /**
     * @param {string} path
     * @param {string} bip
     * @returns {string}
     */
    deriveAddress(path, bip) {
        const keyPair = this._deriveNode(path);

        /** @type {BitcoinJS.Payment} */
        let payment;

        switch (bip) {
            case BitcoinConstants.BIP.BIP49:
                payment = this._nestedSegwitPayment(keyPair);
                break;
            case BitcoinConstants.BIP.BIP84:
                payment = this._nativeSegwitPayment(keyPair);
                break;
            default:
                throw new Error(`Invalid bip: ${bip}`);
        }

        if (!payment.address) {
            throw new Error('UNEXPECTED: Failed to derive an address');
        }

        return payment.address;
    }

    /**
     * @param {BitcoinJS.BIP32Interface} keyPair
     * @returns {BitcoinJS.Payment}
     */
    _nestedSegwitPayment(keyPair) {
        const network = BitcoinJS.networks.testnet; // FIXME: Make dynamic

        return BitcoinJS.payments.p2sh({
            redeem: BitcoinJS.payments.p2wpkh({
                pubkey: keyPair.publicKey,
                network,
            }),
        });
    }

    /**
     * @param {BitcoinJS.BIP32Interface} keyPair
     * @returns {BitcoinJS.Payment}
     */
    _nativeSegwitPayment(keyPair) {
        const network = BitcoinJS.networks.testnet; // FIXME: Make dynamic

        return BitcoinJS.payments.p2wpkh({
            pubkey: keyPair.publicKey,
            network,
        });
    }

    /**
     * @param {string[]} paths
     * @param {BitcoinJS.Psbt} psbt
     * @returns {BitcoinJS.Psbt}
     */
    sign(paths, psbt) {
        // Find common path prefix
        const { prefix, suffixes } = BitcoinKey.pathsToPrefixAndSuffixes(paths);
        const base = this._deriveNode(prefix);
        for (const suffix of suffixes) {
            const keyPair = base.derivePath(suffix);
            psbt.signAllInputs(keyPair);
        }
        return psbt;
    }

    /**
     * @param {string} path
     * @param {Uint8Array} message - A byte array
     * @throws
     */
    signMessage(path, message) { // eslint-disable-line no-unused-vars
        throw new Error('signMessage is not implemented for Bitcoin keys');
    }

    /**
     * @param {string} path
     * @returns {BitcoinJS.BIP32Interface}
     * @private
     */
    _deriveNode(path) {
        const mnemonic = Nimiq.MnemonicUtils.entropyToMnemonic(this._secret);
        const seed = Nimiq.MnemonicUtils.mnemonicToSeed(mnemonic);

        // @ts-ignore Argument of type 'import("...").Buffer' is not assignable to parameter of type 'Buffer'.
        const master = BitcoinJS.bip32.fromSeed(NodeBuffer.Buffer.from(seed), BitcoinJS.networks.testnet);
        return master.derivePath(path);
    }

    /**
     * @type {string}
     */
    get id() {
        return this._id;
    }

    /**
     * @type {Nimiq.Entropy}
     */
    get secret() {
        return this._secret;
    }

    /**
     * @type {Nimiq.Secret.Type}
     */
    get type() {
        return this._secret.type;
    }

    /**
     * @type {boolean}
     */
    get hasPin() {
        return this._hasPin;
    }

    set hasPin(hasPin) {
        /** @type {boolean} */ // Annotation required for Typescript
        this._hasPin = hasPin;
    }
}

BitcoinKey.PIN_LENGTH = 6;
