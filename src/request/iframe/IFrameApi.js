/* eslint-disable no-unused-vars */

/* global BrowserDetection */
/* global CookieJar */
/* global NonPartitionedSessionStorage */
/* global AccountStore */
/* global KeyStore */
/* global Nimiq */
/* global Errors */

class IFrameApi {
    /**
     * @param {RpcState?} state
     * @returns {Promise<KeyguardRequest.KeyInfoObject[]>}
     */
    async list(state) {
        const keyInfos = await this._getKeys();
        return keyInfos.map(ki => ki.toObject());
    }

    /**
     * @param {RpcState?} state
     * @returns {Promise<KeyguardRequest.SimpleResult>}
     */
    async hasKeys(state) {
        const keyInfos = await this._getKeys();
        return { success: keyInfos.length > 0 };
    }

    /**
     * @param {RpcState?} state
     * @param {KeyguardRequest.DeriveAddressesRequest} request
     * @returns {Promise<KeyguardRequest.DerivedAddress[]>}
     */
    async deriveAddresses(state, request) {
        const storedEntropy = await NonPartitionedSessionStorage.get(
            IFrameApi.SESSION_STORAGE_KEY_PREFIX + request.keyId,
            request.tmpCookieEncryptionKey,
        );
        if (!storedEntropy) throw new Errors.KeyNotFoundError();
        if ('newEncryptionKey' in storedEntropy) {
            // Top-level sessionStorage shouldn't ever have to be migrated over to CookieStorage in iframes, see
            // NonPartitionedSessionStorage.get, therefore we don't handle this case here.
            throw new Errors.KeyguardError('Unexpected: top-level sessionStorage got migrated in iframe.');
        }

        const entropy = new Nimiq.Entropy(storedEntropy);
        const master = entropy.toExtendedPrivateKey();

        return request.paths.map(path => ({
            address: master.derivePath(path).toAddress().serialize(),
            keyPath: path,
        }));
    }

    /**
     * @param {RpcState?} state
     * @param {KeyguardRequest.ReleaseKeyRequest} request
     * @returns {Promise<KeyguardRequest.SimpleResult>}
     */
    async releaseKey(state, request) {
        if (request.shouldBeRemoved
            && NonPartitionedSessionStorage.has(IFrameApi.SESSION_STORAGE_KEY_PREFIX + request.keyId)) {
            if (BrowserDetection.isIOS() || BrowserDetection.isSafari()) {
                // In Safari, the KeyStore's indexeddb is not accessible in iframes. Instead, set a cookie as marker to
                // delete the key in TopLevelApi the next time the Keyguard is opened in a top-level window.
                const removeKeyCookie = CookieJar.readCookie(CookieJar.Cookie.REMOVE_KEY);
                const removeKeyArray = removeKeyCookie ? JSON.parse(removeKeyCookie) : [];
                removeKeyArray.push(request.keyId);
                CookieJar.writeCookie(CookieJar.Cookie.REMOVE_KEY, JSON.stringify(removeKeyArray));
            } else {
                await KeyStore.instance.remove(request.keyId);
            }
        }
        NonPartitionedSessionStorage.delete(IFrameApi.SESSION_STORAGE_KEY_PREFIX + request.keyId);
        return { success: true };
    }

    /**
     * @param {RpcState?} state
     * @returns {Promise<KeyguardRequest.LegacyKeyInfoObject[]>}
     * @deprecated
     */
    async listLegacyAccounts(state) {
        const accounts = await this._getAccounts();
        if (accounts.length === 0) return [];

        // Convert to KeyInfoObjects
        return KeyStore.accountInfos2KeyInfos(accounts);
    }

    /**
     * @param {RpcState?} state
     * @returns {Promise<KeyguardRequest.SimpleResult>}
     * @deprecated
     */
    async hasLegacyAccounts(state) {
        const accounts = await this._getAccounts();
        return { success: accounts.length > 0 };
    }

    /**
     * @param {RpcState?} state
     * @returns {Promise<KeyguardRequest.SimpleResult>}
     * @deprecated
     */
    async migrateAccountsToKeys(state) {
        /**
         * IndexedDB is not accessible in iframes on iOS browsers and Safari.
         * Thus when the Keyguard client requests the iframe to migrate the
         * database, the iframe needs to signal to the popup that it should run
         * the migration the next time it is opened. Thus this signalling cookie.
         * The cookie is then detected in the TopLevelApi.request() method.
         */
        if (BrowserDetection.isIOS() || BrowserDetection.isSafari()) {
            // Set migrate flag cookie
            CookieJar.writeCookie(CookieJar.Cookie.DEPRECATED_MIGRATION_FLAG, '1');
            return { success: true };
        }

        await KeyStore.instance.migrateAccountsToKeys();
        return { success: true };
    }

    /**
     * @returns {Promise<AccountInfo[]>}
     */
    async _getAccounts() {
        if (BrowserDetection.isIOS() || BrowserDetection.isSafari()) {
            return CookieJar.eatDeprecatedAccounts();
        }

        return AccountStore.instance.list();
    }

    /**
     * @returns {Promise<KeyInfo[]>}
     */
    async _getKeys() {
        if (BrowserDetection.isIOS() || BrowserDetection.isSafari()) {
            return CookieJar.eatKeys();
        }

        return KeyStore.instance.list();
    }
}

IFrameApi.SESSION_STORAGE_KEY_PREFIX = 'nimiq_key_';
