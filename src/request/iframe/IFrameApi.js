/* global BrowserDetection */
/* global CookieJar */
/* global AccountStore */
/* global KeyStore */

class IFrameApi { // eslint-disable-line no-unused-vars
    /**
     * @param {boolean} [listFromAccountStore] - Deprecated, only for database migration
     * @returns {Promise<KeyInfo[] | AccountInfo[]>}
     */
    async list(listFromAccountStore) {
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            return CookieJar.eat(listFromAccountStore);
        }

        if (listFromAccountStore) {
            return AccountStore.instance.list();
        }

        return KeyStore.instance.list();
    }

    /**
     * @returns {Promise<boolean>}
     * @deprecated Only for database migration
     */
    async migrateAccountsToKeys() {
        /**
         * IndexedDB is not accessible in iframes on iOS browsers and Safari.
         * Thus when the Keyguard client requests the iframe to migrate the
         * database, the iframe needs to signal to the popup that it should run
         * the migration the next time it is opened. Thus this signalling cookie.
         * The cookie is then detected in the PopupApi.request() method.
         */
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Set migrate flag cookie
            document.cookie = 'migrate=1;max-age=31536000';
            return true;
        }

        return KeyStore.instance.doMigrateAccountsToKeys();
    }
}
