/* eslint-disable no-unused-vars */

/* global BrowserDetection */
/* global CookieJar */
/* global AccountStore */
/* global KeyStore */
/* global Nimiq */
/* global loadNimiq */
/* global Errors */

class IFrameApi {
    /**
     * @param {Rpc.State?} state
     * @returns {Promise<KeyguardRequest.KeyInfoObject[]>}
     */
    async list(state) {
        const keyInfos = await this._getKeys();
        return keyInfos.map(ki => ki.toObject());
    }

    /**
     * @param {Rpc.State?} state
     * @returns {Promise<KeyguardRequest.SimpleResult>}
     */
    async hasKeys(state) {
        const keyInfos = await this._getKeys();
        return {
            success: keyInfos.length > 0,
        };
    }

    /**
     * @param {Rpc.State?} state
     * @param {KeyguardRequest.DeriveAddressesRequest} request
     * @returns {Promise<Nimiq.SerialBuffer[]>}
     */
    async deriveAddresses(state, request) {
        const storedEntropy = sessionStorage.getItem(IFrameApi.SESSION_STORAGE_KEY_PREFIX + request.keyId);
        if (!storedEntropy) throw new Errors.KeyNotFoundError();

        await loadNimiq();

        const entropy = new Nimiq.Entropy(Nimiq.BufferUtils.fromBase64(storedEntropy));
        const master = entropy.toExtendedPrivateKey();

        return request.paths.map(path => master.derivePath(path).toAddress().serialize());
    }

    /**
     * @param {Rpc.State?} state
     * @param {KeyguardRequest.ReleaseKeyRequest} request
     * @returns {KeyguardRequest.SimpleResult}
     */
    releaseKey(state, request) {
        if (request.shouldBeRemoved && sessionStorage.getItem(IFrameApi.SESSION_STORAGE_KEY_PREFIX + request.keyId)) {
            if (BrowserDetection.isIOS() || BrowserDetection.isSafari()) {
                const match = document.cookie.match(new RegExp('removeKey=([^;]+)'));
                /** @type {number[]} */
                let removeKeyArray;
                if (match && match[1]) {
                    removeKeyArray = JSON.parse(match[1]);
                } else {
                    removeKeyArray = [];
                }
                removeKeyArray.push(request.keyId);
                document.cookie = `removeKey=${JSON.stringify(removeKeyArray)};max-age=31536000`;
            } else {
                KeyStore.instance.remove(request.keyId);
            }
        }
        sessionStorage.removeItem(IFrameApi.SESSION_STORAGE_KEY_PREFIX + request.keyId);
        return {
            success: true,
        };
    }

    /**
     * @param {Rpc.State?} state
     * @returns {Promise<KeyguardRequest.LegacyKeyInfoObject[]>}
     * @deprecated
     */
    async listLegacyAccounts(state) {
        const accounts = await this._getAccounts();
        if (accounts.length === 0) return [];

        // Convert to KeyInfoObjects
        await loadNimiq();
        return KeyStore.accountInfos2KeyInfos(accounts);
    }

    /**
     * @param {Rpc.State?} state
     * @returns {Promise<boolean>}
     * @deprecated
     */
    async hasLegacyAccounts(state) {
        const accounts = await this._getAccounts();
        return accounts.length > 0;
    }

    /**
     * @param {Rpc.State?} state
     * @returns {Promise<boolean>}
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
            document.cookie = 'migrate=1;max-age=31536000';
            return true;
        }

        // Requires Nimiq lib to be loaded, to derive keyIds from legacy accounts' user-friendly addresses
        await loadNimiq();

        await KeyStore.instance.migrateAccountsToKeys();
        return true;
    }

    /**
     * @returns {Promise<AccountInfo[]>}
     */
    async _getAccounts() {
        if (BrowserDetection.isIOS() || BrowserDetection.isSafari()) {
            return CookieJar.eatDeprecated();
        }

        return AccountStore.instance.list();
    }

    /**
     * @returns {Promise<KeyInfo[]>}
     */
    async _getKeys() {
        if (BrowserDetection.isIOS() || BrowserDetection.isSafari()) {
            return CookieJar.eat();
        }

        return KeyStore.instance.list();
    }
}

IFrameApi.SESSION_STORAGE_KEY_PREFIX = 'nimiq_key_';
