/* global Key */

// eslint-disable-next-line no-unused-vars
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
        this._encrypted = encrypted;
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
        return this._encrypted;
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this._id);
    }

    /**
     * @returns {KeyInfoObject}
     */
    toObject() {
        return {
            id: this.id,
            type: this.type,
            encrypted: this.encrypted,
            // userFriendlyId: this.userFriendlyId,
        };
    }

    /**
     * @param {KeyInfoObject} obj
     * @returns {KeyInfo}
     */
    static fromObject(obj) {
        return new KeyInfo(obj.id, obj.type, obj.encrypted);
    }
}
