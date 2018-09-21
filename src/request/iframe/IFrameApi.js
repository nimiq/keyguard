/* global BrowserDetection */
/* global CookieJar */
/* global AccountStore */
/* global KeyStore */

class IFrameApi { // eslint-disable-line no-unused-vars
    /**
     * @param {boolean} [listFromLegacyStore] - Deprecated, only for database migration
     * @returns {Promise<KeyInfoObject[] | AccountInfo[]>}
     */
    async list(listFromLegacyStore) {
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            return CookieJar.eat(listFromLegacyStore);
        }

        if (listFromLegacyStore) {
            return AccountStore.instance.list();
        }

        const keyInfos = await KeyStore.instance.list();
        return keyInfos.map(ki => ki.toObject());
    }

    /**
     * @returns {Promise<void>}
     * @deprecated Only for database migration
     */
    async migrateAccountsToKeys() {
        /**
         * IndexedDB is not accessible in iframes on iOS browsers and Safari.
         * Thus when the Keyguard client requests the iframe to migrate the
         * database, the iframe needs to signal to the popup that it should run
         * the migration the next time it is opened. Thus this signalling cookie.
         * The cookie is then detected in the TopLevelApi.request() method.
         */
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Set migrate flag cookie
            document.cookie = 'migrate=1;max-age=31536000';
            return;
        }

        // FIXME: Requires Nimiq lib to be loaded, which it currently isn't in the iframe
        await KeyStore.instance.migrateAccountsToKeys();
    }
}
