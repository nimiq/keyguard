/* global Nimiq */
/* global Errors */
/* global BitcoinJS */
/* global BitcoinConstants */
/* global BitcoinUtils */
/* global CONFIG */

class BitcoinKey {
    /**
     * @param {Key} key
     */
    constructor(key) {
        if (key.type !== Nimiq.Secret.Type.ENTROPY) {
            throw new Errors.KeyguardError('Key must be of type Nimiq.Entropy');
        }
        this._key = key;
    }

    /**
     * @param {string} path
     * @returns {string}
     */
    deriveAddress(path) {
        const keyPair = this.deriveKeyPair(path);

        const bip = BitcoinUtils.parseBipFromDerivationPath(path);

        /** @type {BitcoinJSTypes.Payment} */
        let payment;

        switch (bip) {
            case BitcoinConstants.BIP.BIP49:
                payment = BitcoinUtils.keyPairToNestedSegwit(keyPair);
                break;
            case BitcoinConstants.BIP.BIP84:
                payment = BitcoinUtils.keyPairToNativeSegwit(keyPair);
                break;
            default:
                throw new Errors.KeyguardError(`Invalid BIP: ${bip}`);
        }

        if (!payment.address) {
            throw new Errors.KeyguardError('UNEXPECTED: Failed to derive an address');
        }

        return payment.address;
    }

    /**
     * @param {string} path
     * @returns {string}
     */
    deriveExtendedPublicKey(path) {
        const bip = BitcoinUtils.parseBipFromDerivationPath(path);
        /** @type {BitcoinJSTypes.Network} */
        const network = {
            ...BitcoinUtils.Network,
            bip32: BitcoinConstants.EXTENDED_KEY_PREFIXES[bip][CONFIG.BTC_NETWORK],
        };
        const keyPair = this.deriveKeyPair(path, network);
        const publicKey = keyPair.neutered();
        return publicKey.toBase58();
    }

    /**
     * @param {string[]} paths
     * @param {BitcoinJSTypes.Psbt} psbt
     * @returns {BitcoinJSTypes.Psbt}
     */
    sign(paths, psbt) {
        // Dedupe paths
        paths = [...new Set(paths)];

        // Find common path prefix
        const { prefix, suffixes } = BitcoinUtils.pathsToPrefixAndSuffixes(paths);
        const base = this.deriveKeyPair(prefix);
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
        throw new Errors.KeyguardError('signMessage is not implemented for Bitcoin keys');
    }

    /**
     * @param {string} path
     * @param {BitcoinJSTypes.Network} [network]
     * @returns {BitcoinJSTypes.BIP32Interface}
     */
    deriveKeyPair(path, network = BitcoinUtils.Network) {
        const mnemonic = Nimiq.MnemonicUtils.entropyToMnemonic(this.secret);
        const seed = Nimiq.MnemonicUtils.mnemonicToSeed(mnemonic);

        // @ts-ignore Argument of type 'import("...").Buffer' is not assignable to parameter of type 'Buffer'.
        const master = BitcoinJS.bip32.fromSeed(BitcoinJS.Buffer.from(seed), network);
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
