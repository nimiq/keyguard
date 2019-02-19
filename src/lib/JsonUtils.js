/* global Nimiq */
/* global Errors */

class JsonUtils {
    /**
     * @param {any} value
     * @returns {string}
     */
    static stringify(value) {
        return JSON.stringify(value, JsonUtils._jsonifyType);
    }

    /**
     * @param {string} value
     * @returns {any}
     */
    static parse(value) {
        return JSON.parse(value, JsonUtils._parseType);
    }

    /**
     * @param {string} key
     * @param {any} value
     * @returns {any}
     */
    static _parseType(key, value) {
        /* eslint-disable no-prototype-builtins */
        if (value && value.hasOwnProperty
            && value.hasOwnProperty(JsonUtils.TYPE_SYMBOL)
            && value.hasOwnProperty(JsonUtils.VALUE_SYMBOL)) {
            switch (value[JsonUtils.TYPE_SYMBOL]) {
                case JsonUtils.UINT8_ARRAY:
                    return Nimiq.BufferUtils.fromBase64(value[JsonUtils.VALUE_SYMBOL]);
                default:
                    throw new Errors.KeyguardError(`Unknown type ${value[JsonUtils.TYPE_SYMBOL]}`);
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
            return JsonUtils._typedObject(JsonUtils.UINT8_ARRAY, Nimiq.BufferUtils.toBase64(value));
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
        obj[JsonUtils.TYPE_SYMBOL] = type;
        obj[JsonUtils.VALUE_SYMBOL] = value;
        return obj;
    }
}

JsonUtils.TYPE_SYMBOL = '__';
JsonUtils.VALUE_SYMBOL = 'v';
JsonUtils.UINT8_ARRAY = 'UINT8_ARRAY';
