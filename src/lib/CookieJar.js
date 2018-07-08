class CookieJar { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyInfo[]} keys
     */
    static fill(keys) {
        const maxAge = 60 * 60 * 24 * 365;
        const encodedKeys = this._encodeCookie(keys);
        document.cookie = `k=${encodedKeys};max-age=${maxAge.toString()}`;
    }

    /**
     * @param {boolean} [listDeprecatedAccounts] - @deprecated Only for database migration
     */
    static eat(listDeprecatedAccounts) {
        // Legacy cookie
        if (listDeprecatedAccounts) {
            const match = document.cookie.match(new RegExp('accounts=([^;]+)'));
            if (match && match[1]) {
                const decoded = decodeURIComponent(match[1]);
                return JSON.parse(decoded);
            }
            return [];
        }

        const match = document.cookie.match(new RegExp('k=([^;]+)'));

        if (match && match[1]) {
            return this._decodeCookie(match[1]);
        }

        return [];
    }

    /**
     * @param {KeyInfo[]} keys
     */
    static _encodeCookie(keys) {
        const str = keys.map(keyInfo => {
            const address = Nimiq.Address.fromUserFriendlyAddress(keyInfo.userFriendlyAddress);
            const encodedAddress = /** @type {string} */ (address.toBase64());
            return keyInfo.type.toString() + encodedAddress.slice(0, 27);
        }).join('');

        return str;
    }

    /**
     * @param {string} str
     * @returns {KeyInfo[]}
     */
    static _decodeCookie(str) {
        if (!str) return [];

        if (str.length % 28 !== 0) throw new Error('Malformed cookie');

        const keys = str.match(/.{28}/g);
        if (!keys) return []; // Make TS happy (match() can potentially return NULL)

        return keys.map(key => {
            const type = parseInt(key[0], 10);
            const userFriendlyAddress = Nimiq.Address.fromBase64(key.substr(1)).toUserFriendlyAddress();

            return /** @type {KeyInfo} */ ({
                userFriendlyAddress,
                type,
            });
        });
    }
}
