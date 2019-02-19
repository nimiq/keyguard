/* eslint-disable no-bitwise, no-plusplus, no-mixed-operators */

class Base64 {
    /**
     * @param {string} b64
     * @returns {Uint8Array}
     */
    static decode(b64) {
        Base64._initRevLookup();
        const [validLength, placeHoldersLength] = Base64._getLengths(b64);
        const arr = new Uint8Array(Base64._byteLength(validLength, placeHoldersLength));
        let curByte = 0;
        // if there are placeholders, only get up to the last complete 4 chars
        const len = placeHoldersLength > 0 ? validLength - 4 : validLength;
        let i = 0;
        for (; i < len; i += 4) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 18)
                | (Base64._revLookup[b64.charCodeAt(i + 1)] << 12)
                | (Base64._revLookup[b64.charCodeAt(i + 2)] << 6)
                | Base64._revLookup[b64.charCodeAt(i + 3)];
            arr[curByte++] = (tmp >> 16) & 0xFF;
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 2) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 2)
                | (Base64._revLookup[b64.charCodeAt(i + 1)] >> 4);
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 1) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 10)
                | (Base64._revLookup[b64.charCodeAt(i + 1)] << 4)
                | (Base64._revLookup[b64.charCodeAt(i + 2)] >> 2);
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte] = tmp & 0xFF;
        }
        return arr;
    }

    /**
     * @param {Uint8Array} uint8
     * @returns {string}
     */
    static encode(uint8) {
        const length = uint8.length;
        const extraBytes = length % 3; // if we have 1 byte left, pad 2 bytes
        const parts = [];
        const maxChunkLength = 16383; // must be multiple of 3
        // go through the array every three bytes, we'll deal with trailing stuff later
        for (let i = 0, len2 = length - extraBytes; i < len2; i += maxChunkLength) {
            parts.push(Base64._encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
        }
        // pad the end with zeros, but make sure to not forget the extra bytes
        if (extraBytes === 1) {
            const tmp = uint8[length - 1];
            parts.push(`${Base64._lookup[tmp >> 2]
                + Base64._lookup[(tmp << 4) & 0x3F]
            }==`);
        } else if (extraBytes === 2) {
            const tmp = (uint8[length - 2] << 8) + uint8[length - 1];
            parts.push(`${Base64._lookup[tmp >> 10]
                + Base64._lookup[(tmp >> 4) & 0x3F]
                + Base64._lookup[(tmp << 2) & 0x3F]
            }=`);
        }
        return parts.join('');
    }

    static _initRevLookup() {
        if (Base64._revLookup.length !== 0) return;
        Base64._revLookup = [];
        for (let i = 0, len = Base64._lookup.length; i < len; i++) {
            Base64._revLookup[Base64._lookup.charCodeAt(i)] = i;
        }
        // Support decoding URL-safe base64 strings, as Node.js does.
        // See: https://en.wikipedia.org/wiki/Base64#URL_applications
        Base64._revLookup['-'.charCodeAt(0)] = 62;
        Base64._revLookup['_'.charCodeAt(0)] = 63;
    }

    /**
     * @param {string} b64
     * @returns {number[]}
     */
    static _getLengths(b64) {
        const length = b64.length;
        if (length % 4 > 0) {
            throw new Error('Invalid string. Length must be a multiple of 4');
        }
        // Trim off extra bytes after placeholder bytes are found
        // See: https://github.com/beatgammit/base64-js/issues/42
        let validLength = b64.indexOf('=');
        if (validLength === -1) validLength = length;
        const placeHoldersLength = validLength === length ? 0 : 4 - (validLength % 4);
        return [validLength, placeHoldersLength];
    }

    /**
     * @param {number} validLength
     * @param {number} placeHoldersLength
     * @returns {number}
     */
    static _byteLength(validLength, placeHoldersLength) {
        return ((validLength + placeHoldersLength) * 3 / 4) - placeHoldersLength;
    }

    /**
     * @param {number} num
     * @returns {string}
     */
    static _tripletToBase64(num) {
        return Base64._lookup[num >> 18 & 0x3F]
            + Base64._lookup[num >> 12 & 0x3F]
            + Base64._lookup[num >> 6 & 0x3F]
            + Base64._lookup[num & 0x3F];
    }

    /**
     * @param {Uint8Array} uint8
     * @param {number} start
     * @param {number} end
     * @returns {string}
     */
    static _encodeChunk(uint8, start, end) {
        const output = [];
        for (let i = start; i < end; i += 3) {
            const tmp = ((uint8[i] << 16) & 0xFF0000)
                + ((uint8[i + 1] << 8) & 0xFF00)
                + (uint8[i + 2] & 0xFF);
            output.push(Base64._tripletToBase64(tmp));
        }
        return output.join('');
    }
}

/** @type {number[]} */
Base64._revLookup = [];
Base64._lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
