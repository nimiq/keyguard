/* global Nimiq */
/* global Errors */

class JSONUtils {
    /**
     * @param {any} value
     * @returns {string}
     */
    static stringify(value) {
        return JSON.stringify(value, JSONUtils._jsonifyType);
    }

    /**
     * @param {string} value
     * @returns {any}
     */
    static parse(value) {
        return JSON.parse(value, JSONUtils._parseType);
    }

    /**
     * @param {string} key
     * @param {any} value
     * @returns {any}
     */
    static _parseType(key, value) {
        /* eslint-disable no-prototype-builtins */
        if (value && value.hasOwnProperty
            && value.hasOwnProperty(JSONUtils.TYPE_SYMBOL)
            && value.hasOwnProperty(JSONUtils.VALUE_SYMBOL)) {
            switch (value[JSONUtils.TYPE_SYMBOL]) {
                case JSONUtils.UINT8_ARRAY:
                    return Nimiq.BufferUtils.fromBase64(value[JSONUtils.VALUE_SYMBOL]);
                default:
                    throw new Errors.KeyguardError(`Unknown type ${value[JSONUtils.TYPE_SYMBOL]}`);
            }
        }
        return value;
        /* eslint-enable no-prototype-builtins */
    }

    /**
     * @param {string} key
     * @param {any} value
     * @returns {any}
     */
    static _jsonifyType(key, value) {
        if (value instanceof Uint8Array) {
            return JSONUtils._typedObject(JSONUtils.UINT8_ARRAY, Nimiq.BufferUtils.toBase64(value));
        }
        return value;
    }

    /* eslint-disable-next-line valid-jsdoc */
    /**
     * @param {string} type
     * @param {string} value
     * @returns {{[x: string]: string}}
     */
    static _typedObject(type, value) {
        /** @type {{[x: string]: string}} */
        const obj = {};
        obj[JSONUtils.TYPE_SYMBOL] = type;
        obj[JSONUtils.VALUE_SYMBOL] = value;
        return obj;
    }
}

JSONUtils.TYPE_SYMBOL = '__';
JSONUtils.VALUE_SYMBOL = 'v';
JSONUtils.UINT8_ARRAY = 'UINT8_ARRAY';
