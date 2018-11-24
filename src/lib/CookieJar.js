/* global KeyInfo */

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
     * @returns {KeyInfo[] | AccountInfo[]}
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
     * @returns {string}
     */
    static _encodeCookie(keys) {
        return keys.map(
            keyInfo => `${keyInfo.type}${keyInfo.encrypted ? 1 : 0}${keyInfo.hasPin ? 1 : 0}${keyInfo.id}`,
        ).join('');
    }

    /**
     * @param {string} str
     * @returns {KeyInfo[]}
     */
    static _decodeCookie(str) {
        if (!str) return [];

        if (str.length % 15 !== 0) throw new Error('Malformed cookie');

        const keys = str.match(/.{15}/g);
        if (!keys) return []; // Make TS happy (match() can potentially return NULL)

        return keys.map(key => {
            const type = /** @type {Key.Type} */ (parseInt(key[0], 10));
            const encrypted = key[1] === '1';
            const hasPin = key[2] === '1';
            const id = key.substr(3);
            return new KeyInfo(id, type, encrypted, hasPin);
        });
    }
}
