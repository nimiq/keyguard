/* global KeyInfo */

class CookieJar { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyInfo[]} keys
     */
    static fill(keys) {
        this.writeCookie('k', this._encodeCookie(keys));
    }

    /**
     * @returns {KeyInfo[]}
     */
    static eat() {
        const match = document.cookie.match(new RegExp('k=([^;]+)'));
        if (match && match[1]) {
            return this._decodeCookie(match[1]);
        }

        return [];
    }

    /**
     * @deprecated Only for database migration
     * @returns {AccountInfo[]}
     */
    static eatDeprecated() {
        const match = document.cookie.match(new RegExp('accounts=([^;]+)'));
        if (match && match[1]) {
            const decoded = decodeURIComponent(match[1]);
            const cookieAccounts = JSON.parse(decoded);

            // Map from cookie format to AccountInfo format
            return cookieAccounts.map(
                /**
                 * @param {any} acc
                 * @returns {AccountInfo}
                 */
                acc => ({
                    userFriendlyAddress: acc.address,
                    type: acc.type,
                    label: acc.label,
                }),
            );
        }
        return [];
    }

    /**
     * @param {string} name
     * @param {string} value
     * @param {number} [maxAge]
     */
    static writeCookie(name, value, maxAge = 31536000 /* 1 year */) {
        const secure = window.location.protocol === 'https:' ? 'Secure;' : '';
        document.cookie = `${name}=${value};max-age=${maxAge.toString()};${secure}SameSite=strict;Path=/`;
    }

    /**
     * @param {string} name
     */
    static deleteCookie(name) {
        this.writeCookie(name, '', 0);
    }

    /**
     * @param {KeyInfo[]} keys
     * @returns {string}
     */
    static _encodeCookie(keys) {
        return keys.map(
            keyInfo => `${keyInfo.type}`
                     + `${keyInfo.hasPin ? 1 : 0}`
                     + `${keyInfo.id}`,
        ).join(',');
    }

    /**
     * @param {string} str
     * @returns {KeyInfo[]}
     */
    static _decodeCookie(str) {
        if (!str) return [];

        const keys = str.split(',');

        return keys.map(key => {
            const type = /** @type {Nimiq.Secret.Type} */ (parseInt(key[0], 10));
            const hasPin = key[1] === '1';
            const id = key.substr(2);
            return new KeyInfo(id, type, true, hasPin, new Uint8Array(20 /* Nimiq.Address.SERIALIZED_SIZE */));
            // Cookies are only eaten during IframeApi.list(), in which the KeyInfo is
            // converted into a KeyguardRequest.KeyInfoObject, loosing the 'encrypted' status flag.
            // Thus it does not matter what we pass to the KeyInfo contructor here for that flag.
        });
    }
}
