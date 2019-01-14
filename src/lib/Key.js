/* global Nimiq */

class Key {
    /**
     * @param {Uint8Array} input
     * @returns {string}
     */
    static derivePublicKey(input) {
        return Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(input).subarray(0, 32));
    }

    /**
     * @param {Uint8Array} secret
     * @param {Key.Type} [type]
     * @param {number?} [id]
     * @param {boolean} [hasPin]
     */
    constructor(secret, type = Key.Type.BIP39, id = null, hasPin = false) {
        this._id = id;
        this._secret = secret;
        this._type = type;
        this._hasPin = hasPin;
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
     * @param {Uint8Array} message - A byte array (max 255 bytes)
     * @returns {{signature: Nimiq.Signature, data: Uint8Array}}
     */
    signMessage(path, message) {
        const msgBytes = new Nimiq.SerialBuffer(message);
        const msgLength = msgBytes.length;

        if (msgLength > 255) {
            throw new Error('Message must not exceed 255 bytes');
        }

        /**
         * Adding a prefix to the message makes the calculated signature recognisable as
         * a Nimiq specific signature. This prevents misuse where a malicious request can
         * sign arbitrary data (e.g. a transaction) and use the signature to impersonate
         * the victim. (https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign)
         */
        const dataLength = 1 // prefixBytes length
            + Key.MSG_PREFIX_LENGTH
            + 1 // msgBytes length
            + msgLength;

        // Construct buffer
        const data = new Nimiq.SerialBuffer(dataLength);
        data.writeUint8(Key.MSG_PREFIX_LENGTH);
        data.write(Key.MSG_PREFIX);
        data.writeUint8(msgLength);
        data.write(msgBytes);

        const signature = this.sign(path, data);

        return { signature, data };
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
     * @type {boolean}
     */
    get hasPin() {
        return this._hasPin;
    }

    set hasPin(hasPin) {
        /** @type {boolean} */ // Annotation required for Typescript
        this._hasPin = hasPin;
    }

    /**
     * @type {string}
     */
    get publicKey() {
        const input = this._type === Key.Type.LEGACY
            ? Nimiq.PublicKey.derive(new Nimiq.PrivateKey(this._secret)).toAddress().serialize()
            : this._secret;
        return Key.derivePublicKey(input);
    }
}

Key.Type = {
    LEGACY: 0,
    BIP39: 1,
};

Key.MSG_PREFIX = new Nimiq.SerialBuffer(Nimiq.BufferUtils.fromAscii('Nimiq Signed Message:\n'));
Key.MSG_PREFIX_LENGTH = Key.MSG_PREFIX.length;
