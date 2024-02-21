/* global KeyInfo */
/* global Errors */

class CookieJar { // eslint-disable-line no-unused-vars
    /**
     * @param {string} name
     * @param {string} value
     * @param {number} [maxAge] Time in seconds after which the cookie gets automatically deleted.
     * @returns {string | null} Potential leftover data that did not fit the cookie.
     */
    static writeCookie(name, value, maxAge = CookieJar.DEFAULT_MAX_AGE) {
        if (!name || CookieJar.INVALID_NAME_CHARS_REGEX.test(name)) {
            throw new Errors.KeyguardError(`Invalid cookie name ${name}.`);
        }
        if (CookieJar.INVALID_VALUE_CHARS_REGEX.test(value)) {
            throw new Errors.KeyguardError(`Invalid cookie value ${value}.`);
        }

        const initialRawCookies = document.cookie;
        const maxPayloadSize = CookieJar.MAX_COOKIE_SIZE - name.length;
        const payload = value.substring(0, maxPayloadSize);
        const cookieOptions = this._generateCookieOptions(maxAge); // do not count towards max size
        document.cookie = `${name}=${payload}${cookieOptions}`;

        // Check storage quota limits, in case we're not deleting a cookie.
        if (maxAge > 0) {
            if (this.readCookie(name) !== payload) {
                throw new Errors.KeyguardError('Failed to write cookie. Quota exceeded?');
            }
            const initialCookies = this.readCookies(initialRawCookies);
            const currentCookies = this.readCookies();
            let isMissingCookies = false;
            for (const [initialCookieName, initialCookieValue] of initialCookies) {
                if (currentCookies.has(initialCookieName)) continue;
                // The browser deleted this initial cookie, and potentially others, as for example done by Chrome, in
                // order to write the new one.
                if (!isMissingCookies) {
                    // Delete the new cookie, the first time we encounter a missing cookie.
                    isMissingCookies = true;
                    this.deleteCookie(name);
                }
                // Restore the initial cookie.
                // Write document.cookie directly to avoid unnecessary size and quota checks in recursion.
                document.cookie = `${initialCookieName}=${initialCookieValue}${this._generateCookieOptions()}`;
            }
            if (isMissingCookies) throw new Errors.KeyguardError('Cookie quota exceeded.');
        }

        return payload !== value ? value.substring(payload.length) : null;
    }

    /**
     * @param {string} name
     * @returns {string | null}
     */
    static readCookie(name) {
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars.
        const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
        return cookieMatch ? cookieMatch[1] : null;
    }

    /**
     * @param {string} [cookies]
     * @returns {Map<string, string>}
     */
    static readCookies(cookies) {
        cookies = cookies || document.cookie;
        /** @type {Map<string, string>} */
        const parsedCookies = new Map();
        const cookieRegex = /(?:^|; )([^=]+)=([^;]*)/g;
        /** @type {RegExpExecArray | null} */
        let cookieMatch = null;
        while (cookieMatch = cookieRegex.exec(cookies)) { // eslint-disable-line no-cond-assign
            parsedCookies.set(cookieMatch[1], cookieMatch[2]);
        }
        return parsedCookies;
    }

    /**
     * @param {string} name
     */
    static deleteCookie(name) {
        this.writeCookie(name, '', 0);
    }

    /**
     * @param {string} name
     * @param {boolean} [encodeInvalidChars = true]
     * @returns {string}
     */
    static sanitizeCookieName(name, encodeInvalidChars = true) {
        if (encodeInvalidChars) return name.replace(CookieJar.INVALID_NAME_CHARS_REGEX, c => encodeURIComponent(c));
        // truncate invalid chars
        const truncatedName = name.replace(CookieJar.INVALID_NAME_CHARS_REGEX, '');
        if (!truncatedName) return this.sanitizeCookieName(name, true);
        return truncatedName;
    }

    /**
     * @param {KeyInfo[]} keys
     */
    static fillKeys(keys) {
        this.writeCookie(CookieJar.Cookie.KEYS, this._encodeKeysCookie(keys));
    }

    /**
     * @returns {KeyInfo[]}
     */
    static eatKeys() {
        const keysCookie = this.readCookie(CookieJar.Cookie.KEYS);
        return keysCookie ? this._decodeKeysCookie(keysCookie) : [];
    }

    /**
     * @deprecated Only for database migration
     * @returns {AccountInfo[]}
     */
    static eatDeprecatedAccounts() {
        const accountsCookie = this.readCookie(CookieJar.Cookie.DEPRECATED_ACCOUNTS);
        if (accountsCookie) {
            const decoded = decodeURIComponent(accountsCookie);
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
     * @param {number} [maxAge]
     * @returns {string}
     * @private
     */
    static _generateCookieOptions(maxAge = CookieJar.DEFAULT_MAX_AGE) {
        const secure = window.location.protocol === 'https:' ? 'Secure;' : '';
        return `;max-age=${maxAge};${secure}SameSite=strict;Path=/`;
    }

    /**
     * @param {KeyInfo[]} keys
     * @returns {string}
     */
    static _encodeKeysCookie(keys) {
        return keys.map(
            keyInfo => `${keyInfo.type}`
                     + `${keyInfo.hasPin ? 1 : 0}`
                     + `${keyInfo.id}`,
        ).join('#');
    }

    /**
     * @param {string} str
     * @returns {KeyInfo[]}
     */
    static _decodeKeysCookie(str) {
        if (!str) return [];

        // previous versions used "," as separator which is strictly speaking not allowed in cookie values
        const keys = str.split(/[#,]/g);

        return keys.map(key => {
            const type = /** @type {Nimiq.Secret.Type} */ (parseInt(key[0], 10));
            const hasPin = key[1] === '1';
            const id = key.substr(2);
            return new KeyInfo(id, type, true, hasPin, new Uint8Array(20 /* Nimiq.Address.SERIALIZED_SIZE */));
            // Cookies are only eaten during IframeApi.list(), in which the KeyInfo is
            // converted into a KeyguardRequest.KeyInfoObject, losing the 'encrypted' status flag.
            // Thus it does not matter what we pass to the KeyInfo constructor here for that flag.
        });
    }
}

/**
 * @readonly
 * @enum { 'lang' | 'k' | 'removeKey' | 'ssp' | 'cs.' | 'npss.' | 'accounts' | 'migrate' }
 */
CookieJar.Cookie = {
    LANGUAGE: /** @type {'lang'} */ ('lang'),
    KEYS: /** @type {'k'} */ ('k'),
    REMOVE_KEY: /** @type {'removeKey'} */ ('removeKey'),
    FLAG_SESSION_STORAGE_PARTITIONED: /** @type {'ssp'} */ ('ssp'),
    NAMESPACE_COOKIE_STORAGE: /** @type {'cs.'} */ ('cs.'), // no other cookies start with 'cs.'
    NAMESPACE_NON_PARTITIONED_SESSION_STORAGE: /** @type {'npss.'} */ ('npss.'), // no other cookies start with 'npss.'
    /**
     * @deprecated
     * @type {'accounts'}
     */
    DEPRECATED_ACCOUNTS: ('accounts'),
    /**
     * @deprecated
     * @type {'migrate'}
     */
    DEPRECATED_MIGRATION_FLAG: ('migrate'),
};
CookieJar.DEFAULT_MAX_AGE = 31536000; // 1 year; in seconds
// Maximum size per cookie which should be safe for all browsers, measured as the sum of the cookie name and value,
// but excluding the equal sign and cookie options. The maximum size for different browsers can be tested with
// http://browsercookielimits.iain.guru/, but note that the tool counts the equal sign, for which 1 should be
// subtracted. This size limit is used for example by Chrome, Firefox and Safari. Cookies above this size are silently
// dropped when being set.
// Regarding the maximum number of Cookies, Chrome allows up to 180 cookies, regardless of size, others at least 1000
// (the iain tool stops checking at 1000). If the limit is reached, the oldest cookies are typically deleted first.
// Chrome deletes 31 of the old cookies at once as soon as the limit is reached. Deleted cookies are detected by
// writeCookie, rather than checking for a browser-specific max count.
CookieJar.MAX_COOKIE_SIZE = 4096;
// See https://stackoverflow.com/a/1969339, especially the description of RFC 6265.
CookieJar.INVALID_NAME_CHARS_REGEX = /[^\w!#$%&'*+\-.^`|~]/g;
CookieJar.INVALID_VALUE_CHARS_REGEX = /[^\w!#$%&'()*+\-./:<=>?@[\]^`{|}~]/g;
