/* global Nimiq */
/* global Errors */
/* global ethers */

class PolygonKey { // eslint-disable-line no-unused-vars
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
        const wallet = this.deriveKeyPair(path);
        return wallet.address;
    }

    /**
     * @param {string} path
     * @param {ethers.providers.TransactionRequest} transaction
     * @returns {Promise<string>}
     */
    async sign(path, transaction) {
        const wallet = this.deriveKeyPair(path);
        return wallet.signTransaction(transaction);
    }

    /**
     *
     * @param {string} path
     * @param {ethers.TypedDataDomain} domain
     * @param {Record<string, Array<ethers.TypedDataField>>} types
     * @param {Record<string, any>} value
     * @returns {Promise<string>}
     */
    async signTypedData(path, domain, types, value) {
        const wallet = this.deriveKeyPair(path);
        return wallet._signTypedData(domain, types, value);
    }

    /**
     * @param {string} path
     * @param {Uint8Array} message - A byte array
     * @throws
     */
    signMessage(path, message) { // eslint-disable-line no-unused-vars
        throw new Errors.KeyguardError('signMessage is not implemented for Polygon keys');
    }

    /**
     * @param {string} path
     * @returns {ethers.Wallet}
     */
    deriveKeyPair(path) {
        const mnemonic = Nimiq.MnemonicUtils.entropyToMnemonic(this.secret);
        return ethers.Wallet.fromMnemonic(mnemonic.join(' '), path);
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
}
