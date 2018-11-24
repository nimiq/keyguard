/* global Nimiq */

class Key {
    /**
     * @param {Uint8Array} secret
     * @param {Key.Type} [type]
     * @param {boolean} [hasPin]
     */
    constructor(secret, type = Key.Type.BIP39, hasPin = false) {
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
     * @param {Uint8Array} message - A utf-8 byte array (max 255 bytes)
     * @returns {Nimiq.Signature}
     */
    signMessage(path, message) {
        /**
         * Adding a prefix to the message makes the calculated signature recognisable as
         * a Nimiq specific signature. This prevents misuse where a malicious request can
         * sign arbitrary data (e.g. a transaction) and use the signature to impersonate
         * the victim. (https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign)
         */
        const prefix = 'Nimiq Signed Message:\n';
        const prefixBytes = new Nimiq.SerialBuffer(Nimiq.BufferUtils.fromAscii(prefix));
        const prefixLength = prefixBytes.length;

        const msgBytes = new Nimiq.SerialBuffer(message);
        const msgLength = msgBytes.length;

        if (msgLength > 255) {
            throw new Error('Message must not exceed 255 bytes');
        }

        const bufLength = 1 // prefixBytes length value
            + prefixLength
            + 1 // msgBytes length value
            + msgLength;

        // Construct buffer
        const buf = new Nimiq.SerialBuffer(bufLength);
        buf.writeUint8(prefixLength);
        buf.write(prefixBytes);
        buf.writeUint8(msgLength);
        buf.write(msgBytes);

        return this.sign(path, buf);
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
    LEGACY: 0,
    BIP39: 1,
};
