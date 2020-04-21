/* global Nimiq */
/* global BitcoinJS */
/* global BitcoinConstants */
/* global BitcoinUtils */
/* global NodeBuffer */
/* global CONFIG */

class BitcoinKey {
    /**
     * @param {Key} key
     */
    constructor(key) {
        if (key.type !== Nimiq.Secret.Type.ENTROPY) {
            throw new Error('Key must be of type Nimiq.Entropy');
        }
        this._key = key;
    }

    /**
     * @param {string} path
     * @returns {string}
     */
    deriveAddress(path) {
        const keyPair = this._deriveKeyPair(path);

        const bip = BitcoinUtils.parseBipFromDerivationPath(path);

        /** @type {BitcoinJS.Payment} */
        let payment;

        switch (bip) {
            case BitcoinConstants.BIP.BIP49:
                payment = BitcoinUtils.keyPairToNestedSegwit(keyPair);
                break;
            case BitcoinConstants.BIP.BIP84:
                payment = BitcoinUtils.keyPairToNativeSegwit(keyPair);
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
     * @param {string} path
     * @returns {string}
     */
    deriveExtendedPublicKey(path) {
        const bip = BitcoinUtils.parseBipFromDerivationPath(path);
        /** @type {BitcoinJS.Network} */
        const network = {
            ...BitcoinUtils.Network,
            bip32: BitcoinConstants.EXTENDED_KEY_PREFIXES[bip][CONFIG.BTC_NETWORK],
        };
        const keyPair = this._deriveKeyPair(path, network);
        const publicKey = keyPair.neutered();
        return publicKey.toBase58();
    }

    /**
     * @param {string[]} paths
     * @param {BitcoinJS.Psbt} psbt
     * @returns {BitcoinJS.Psbt}
     */
    sign(paths, psbt) {
        // Find common path prefix
        const { prefix, suffixes } = BitcoinUtils.pathsToPrefixAndSuffixes(paths);
        const base = this._deriveKeyPair(prefix);
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
     * @param {BitcoinJS.Network} [network]
     * @returns {BitcoinJS.BIP32Interface}
     * @private
     */
    _deriveKeyPair(path, network = BitcoinUtils.Network) {
        const mnemonic = Nimiq.MnemonicUtils.entropyToMnemonic(this.secret);
        const seed = Nimiq.MnemonicUtils.mnemonicToSeed(mnemonic);

        // @ts-ignore Argument of type 'import("...").Buffer' is not assignable to parameter of type 'Buffer'.
        const master = BitcoinJS.bip32.fromSeed(NodeBuffer.Buffer.from(seed), network);
        return master.derivePath(path);
    }

    /**
     * @returns {Key}
     */
    key() {
        return this._key;
    }

    /**
     * @type {string}
     */
    get id() {
        return this._key.id;
    }

    /**
     * @type {Nimiq.Entropy}
     */
    get secret() {
        return /** @type {Nimiq.Entropy} */ (this._key.secret);
    }

    /**
     * @type {Nimiq.Secret.Type}
     */
    get type() {
        return this._key.secret.type;
    }

    /**
     * @type {boolean}
     */
    get hasPin() {
        return this._key.hasPin;
    }

    set hasPin(hasPin) {
        /** @type {boolean} */ // Annotation required for Typescript
        this._hasPin = hasPin;
    }
}

BitcoinKey.PIN_LENGTH = 6;
