class IFrameApi {

    /**
     * @param {boolean} [listFromAccountStore] - Deprecated, used for migrating keys to new database
     */
    async list(listFromAccountStore) {

        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            return CookieJar.eat(listFromAccountStore);
        }

        if (listFromAccountStore) {
            const accountStore = AccountStore.instance;
            return accountStore.list();
        }

        const keyStore = KeyStore.instance;
        return keyStore.list();
    }

    /**
     * @deprecated Only for migrating databases during the transition period
     */
    async migrateAccountsToKeys() {
        const accountStore = AccountStore.instance;
        const keyStore = KeyStore.instance;

        const keys = await accountStore.dangerouslistPlain();

        for (const key of keys) {
            const keyEntry = {
                encryptedKeyPair: key.encryptedKeyPair,
                userFriendlyAddress: key.userFriendlyAddress,
                // Translate between old text type and new number type
                type: /** @type {EncryptionType} */ (key.type === 'high' ? EncryptionType.HIGH : EncryptionType.LOW)
            };
            await keyStore.putPlain(keyEntry);
        }

        // await accountStore.drop();
        return true;
    }
}

runKeyguard(IFrameApi);
