class CookieJar {

    /**
     * @param {KeyInfo[]} keys
     */
    static fill(keys) {
        const maxAge = 60 * 60 * 24 * 365;
        const encodedKeys = this._encodeCookie(keys);
        document.cookie = `k=${encodedKeys};max-age=${maxAge.toString()}`;
    }

    /**
     * @param {boolean} [listFromAccountStore] - Deprecated, used for reading keys from old database
     */
    static eat(listFromAccountStore) {
        // Legacy cookie
        if (listFromAccountStore) {
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
        let str = '';

        for (const keyInfo of keys) {
            const address = Nimiq.Address.fromUserFriendlyAddress(keyInfo.userFriendlyAddress);
            const encodedAddress = /** @type {string} */ (address.toBase64());
            str += keyInfo.type.toString() + encodedAddress.slice(0, 27);
        }

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
            const type = parseInt(key[0]);
            const userFriendlyAddress = Nimiq.Address.fromBase64(key.substr(1)).toUserFriendlyAddress();

            return /** @type {KeyInfo} */ ({
                userFriendlyAddress,
                type
            });
        });
    }
}
