// eslint-disable-next-line no-unused-vars
class KeyInfo {
    /**
     * @param {string} id
     * @param {Nimiq.Secret.Type} type
     * @param {boolean} encrypted
     * @param {boolean} hasPin
     */
    constructor(id, type, encrypted, hasPin) {
        /** @private */
        this._id = id;
        /** @private */
        this._type = type;
        /** @private */
        this._encrypted = encrypted;
        /** @private */
        this._hasPin = hasPin;
    }

    /**
     * @type {string}
     */
    get id() {
        return this._id;
    }

    /**
     * @type {Nimiq.Secret.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {boolean}
     */
    get encrypted() {
        return this._encrypted;
    }

    /**
     * @type {boolean}
     */
    get hasPin() {
        return this._hasPin;
    }

    /**
     * @returns {KeyguardRequest.KeyInfoObject}
     */
    toObject() {
        return {
            id: this.id,
            type: this.type,
            encrypted: this.encrypted,
            hasPin: this.hasPin,
        };
    }

    /**
     * @param {KeyguardRequest.KeyInfoObject} obj
     * @returns {KeyInfo}
     */
    static fromObject(obj) {
        return new KeyInfo(obj.id, obj.type, obj.encrypted, obj.hasPin);
    }
}
