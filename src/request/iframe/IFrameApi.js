/* global BrowserDetection */
/* global CookieJar */
/* global AccountStore */
/* global KeyStore */
/* global Nimiq */
/* global loadNimiq */

class IFrameApi {
    /**
     * @param {Rpc.State | null} state
     * @param {boolean} [fromLegacyStore] - Deprecated, only for database migration
     * @returns {Promise<KeyInfoObject[]>}
     */
    async list(state, fromLegacyStore) {
        if (fromLegacyStore) {
            /** @type {AccountInfo[]} */
            let accounts = [];
            if (BrowserDetection.isIOS() || BrowserDetection.isSafari()) {
                accounts = /** @type {AccountInfo[]} */ (CookieJar.eat(true));
            } else {
                accounts = await AccountStore.instance.list();
            }

            if (accounts.length === 0) return [];

            // Convert to KeyInfoObjects
            await loadNimiq();
            return KeyStore.accounts2Keys(accounts, true);
        }

        /** @type {KeyInfo[]} */
        let keyInfos;
        if (BrowserDetection.isIOS() || BrowserDetection.isSafari()) {
            keyInfos = /** @type {KeyInfo[]} */ (CookieJar.eat());
        } else {
            keyInfos = await KeyStore.instance.list();
        }

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
        if (BrowserDetection.isIOS() || BrowserDetection.isSafari()) {
            // Set migrate flag cookie
            document.cookie = 'migrate=1;max-age=31536000';
            return;
        }

        // Requires Nimiq lib to be loaded, to derive keyIds from legacy accounts' user-friendly addresses
        await loadNimiq();

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
