/* global Constants */
/* global Nimiq */

class Key {
    /**
     * @param {Uint8Array} input
     * @returns {string}
     */
    static deriveHash(input) {
        return Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(input).subarray(0, 32));
    }

    /**
     * @param {Nimiq.Entropy|Nimiq.PrivateKey} secret
     * @param {boolean} [hasPin]
     * @param {number?} [id]
     */
    constructor(secret, hasPin = false, id = null) {
        this._secret = secret;
        this._hasPin = hasPin;
        this._id = id;
        this._defaultAddress = this.deriveAddress(Constants.DEFAULT_DERIVATION_PATH);
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
     * @param {Uint8Array} message - A byte array
     * @returns {Nimiq.Signature}
     */
    signMessage(path, message) {
        const msgBytes = new Nimiq.SerialBuffer(message);
        const msgLength = msgBytes.byteLength;
        const msgLengthString = msgLength.toString(10);

        /**
         * Adding a prefix to the message makes the calculated signature recognisable as
         * a Nimiq specific signature. This and the hashing prevents misuse where a malicious
         * request can sign arbitrary data (e.g. a transaction) and use the signature to
         * impersonate the victim. (https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign)
         */
        const dataLength = /* prefix length */ 1 + Key.MSG_PREFIX_LENGTH + msgLengthString.length + msgLength;

        // Construct buffer
        const data = new Nimiq.SerialBuffer(dataLength);
        data.writeUint8(Key.MSG_PREFIX_LENGTH);
        data.write(Nimiq.BufferUtils.fromAscii(Key.MSG_PREFIX));
        data.write(Nimiq.BufferUtils.fromAscii(msgLengthString));
        data.write(msgBytes);

        // Hash data before signing
        // (uses SHA256, because it is the widest available)
        const hash = Nimiq.Hash.computeSha256(data);

        return this.sign(path, hash);
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PrivateKey}
     * @private
     */
    _derivePrivateKey(path) {
        return this._secret instanceof Nimiq.Entropy
            ? this._secret.toExtendedPrivateKey().derivePath(path).privateKey
            : this._secret;
    }

    /**
     * @param {number?} id
     */
    set id(id) {
        this._id = id;
    }

    /**
     * @type {number?}
     */
    get id() {
        return this._id;
    }

    /**
     * @type {Nimiq.Entropy|Nimiq.PrivateKey}
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

    get defaultAddress() {
        return this._defaultAddress;
    }

    /**
     * @type {string}
     */
    get hash() {
        const input = this._secret instanceof Nimiq.Entropy
            ? this._secret.serialize()
            : Nimiq.PublicKey.derive(this._secret).toAddress().serialize();
        return Key.deriveHash(input);
    }
}

Key.MSG_PREFIX = 'Nimiq Signed Message:\n';
Key.MSG_PREFIX_LENGTH = 0x16; // 22


// 'export' to client via side effects
window.__messageSigningPrefix = {
    MSG_PREFIX: Key.MSG_PREFIX,
};
