class IFrameApi {
    /**
     * @param {boolean} [listFromAccountStore] - @deprecated Only for database migration
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

runKeyguard(IFrameApi, {
    loadNimiq: false,
    whitelist: [
        'list',
        'migrateAccountsToKeys',
    ],
});
