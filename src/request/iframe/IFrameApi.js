/* global BrowserDetection */
/* global CookieJar */
/* global AccountStore */
/* global KeyStore */
/* global Nimiq */
/* global loadNimiq */

class IFrameApi {
    /**
     * @param {Rpc.State | null} state
     * @param {boolean} [listFromLegacyStore] - Deprecated, only for database migration
     * @returns {Promise<KeyInfoObject[] | AccountInfo[]>}
     */
    async list(state, listFromLegacyStore) {
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
     * @param {Rpc.State | null} state
     * @returns {Promise<void>}
     * @deprecated Only for database migration
     */
    async migrateAccountsToKeys(state) { // eslint-disable-line no-unused-vars
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

    /**
     * @param {Rpc.State | null} state
     * @param {string} keyId
     * @param {string[]} paths
     * @returns {Promise<Nimiq.SerialBuffer[]>}
     */
    async deriveAddresses(state, keyId, paths) {
        const storedEntropy = sessionStorage.getItem(IFrameApi.SESSION_STORAGE_KEY_PREFIX + keyId);
        if (!storedEntropy) throw new Error('Key not found');

        await loadNimiq();

        const entropy = new Nimiq.Entropy(Nimiq.BufferUtils.fromBase64(storedEntropy));
        const master = entropy.toExtendedPrivateKey();

        return paths.map(path => master.derivePath(path).toAddress().serialize());
    }

    /**
     * @param {Rpc.State | null} state
     * @param {string} keyId
     * @returns {boolean}
     */
    releaseKey(state, keyId) {
        try {
            sessionStorage.removeItem(IFrameApi.SESSION_STORAGE_KEY_PREFIX + keyId);
        } catch (e) {
            throw e;
        }

        return true;
    }
}

IFrameApi.SESSION_STORAGE_KEY_PREFIX = 'nimiq_key_';
