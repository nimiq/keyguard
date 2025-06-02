class Utf8Tools { // eslint-disable-line no-unused-vars
    /**
     * @param {string} str
     * @returns {Uint8Array}
     */
    static stringToUtf8ByteArray(str) {
        const encoder = new TextEncoder(); // utf-8 is the default
        return encoder.encode(str);
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {string}
     */
    static utf8ByteArrayToString(bytes) {
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(bytes);
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {boolean}
     */
    static isValidUtf8(bytes) {
        const controlCharsWhitelist = [
            0x09, /* horizontal tab (\t) */
            0x0A, /* line feed (\n) */
            0x0D, /* carriage return (\r) */
        ];

        try {
            const decoder = new TextDecoder('utf-8', { fatal: true });
            const decoded = decoder.decode(bytes); // throws for invalid input
            // Search for control characters (utf-8 single byte characters (0x00-0x7F) which are not in the range
            // 0x20-0x7E (space-tilde)). Note that we use the unicode u flag to avoid astral symbols (symbols
            // outside the range 0x0000 - 0xFFFF) getting split up into two surrogate halves.
            // See https://mathiasbynens.be/notes/javascript-unicode#regex
            // eslint-disable-next-line no-control-regex
            const controlCharsMatch = decoded.match(/[\u0000-\u001F\u007F]/gu);
            if (!controlCharsMatch) return true;
            return controlCharsMatch.every(char => controlCharsWhitelist.includes(char.charCodeAt(0)));
        } catch (e) {
            return false;
        }
    }
}
