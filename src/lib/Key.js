/* global Nimiq */

class Key {
    /**
     * @param {Uint8Array} secret
     * @param {Key.Type} [type]
     */
    constructor(secret, type = Key.Type.BIP39) {
        this._secret = secret;
        this._type = type;
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PublicKey}
     */
    derivePublicKey(path) {
        return Nimiq.PublicKey.derive(this._derivePrivateKey(path));
    }

    /**
     * @param {string} path
     * @returns {Nimiq.Address}
     */
    deriveAddress(path) {
        return this.derivePublicKey(path).toAddress();
    }

    /**
     * @param {string} path
     * @param {Uint8Array} data
     * @returns {Nimiq.Signature}
     */
    sign(path, data) {
        const privateKey = this._derivePrivateKey(path);
        const publicKey = Nimiq.PublicKey.derive(privateKey);
        return Nimiq.Signature.create(privateKey, publicKey, data);
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PrivateKey}
     * @private
     */
    _derivePrivateKey(path) {
        return this._type === Key.Type.LEGACY
            ? new Nimiq.PrivateKey(this._secret)
            : new Nimiq.Entropy(this._secret).toExtendedPrivateKey().derivePath(path).privateKey;
    }

    /**
     * @type {Uint8Array}
     */
    get secret() {
        return this._secret;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {string}
     */
    get id() {
        const input = this._type === Key.Type.LEGACY
            ? Nimiq.PublicKey.derive(new Nimiq.PrivateKey(this._secret)).toAddress().serialize()
            : this._secret;
        return Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(input).subarray(0, 6));
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this.id);
    }

    /**
     * @param {string} id
     * @returns {string}
     */
    static idToUserFriendlyId(id) {
        // Stub
        return `UserFriendly ${id}`;
    }
}
Key.Type = {
    LEGACY: /** @type {Key.Type} */ 0,
    BIP39: /** @type {Key.Type} */ 1,
};

class KeyInfo {
    /**
     * @param {string} id
     * @param {Key.Type} type
     * @param {boolean} encrypted
     */
    constructor(id, type, encrypted) {
        /** @private */
        this._id = id;
        /** @private */
        this._type = type;
        /** @private */
        this._encryptd = encrypted;
    }

    /**
     * @type {string}
     */
    get id() {
        return this._id;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {boolean}
     */
    get encrypted() {
        return this._encryptd;
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this._id);
    }
}
