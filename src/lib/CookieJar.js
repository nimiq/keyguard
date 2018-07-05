class CookieJar {

    /**
     * @param {KeyInfo[]} keys
     */
    static fill(keys) {
        const maxAge = 60 * 60 * 24 * 365 * 10; // A looooooooong time (~10 years)
        const encodedKeys = this._encodeCookie(keys);
        document.cookie = `k=${encodedKeys};max-age=${maxAge.toString()}`;
    }

    /**
     * @param {boolean} [listFromAccountStore] - Deprecated, used for reading keys from old database
     */
    static eat(listFromAccountStore) {
        const store = listFromAccountStore ? 'accounts' : 'k'; // Legacy support
        const match = document.cookie.match(new RegExp(`${store}=([^;]+)`));

        // Legacy support
        if (match && listFromAccountStore) {
            // Legacy format
            const decoded = decodeURIComponent(match[1]);
            return JSON.parse(decoded);
        }

        if (match) {
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
            const encodedKey = /** @type {string} */ (address.toBase64());
            str += keyInfo.type.toString() + encodedKey.slice(0, 27);
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
