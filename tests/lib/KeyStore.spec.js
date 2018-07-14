describe('KeyStore', () => {
    beforeEach(async () => Dummy.Utils.createDummyKeyStore());
    afterEach(async () => Dummy.Utils.deleteDummyKeyStore());

    it('is a singleton', () => {
        const instance1 = KeyStore.instance;
        const instance2 = KeyStore.instance;
        expect(instance1).toBe(instance2);
    });

    it('can open and close a connection', async () => {
        const db = await KeyStore.instance.connect();
        expect(db.constructor).toBe(IDBDatabase);
        expect(KeyStore.instance._dbPromise).toBeTruthy();
        expect(db.name).toBe(Dummy.DUMMY_KEY_DATABASE_NAME);
        await KeyStore.instance.close();
        expect(KeyStore.instance._dbPromise).toBeNull();
    });

    it('can get plain keys', async () => {
        const [key1, key2] = await Promise.all([
            KeyStore.instance._getPlain(Dummy.keyInfo[0].userFriendlyAddress),
            KeyStore.instance._getPlain(Dummy.keyInfo[1].userFriendlyAddress)
        ]);
        expect(key1).toEqual(Dummy.keyDatabaseEntries[0]);
        expect(key2).toEqual(Dummy.keyDatabaseEntries[1]);
    });

    it('can get and decrypt keys', async () => {
        const [key1, key2] = await Promise.all([
            KeyStore.instance.get(Dummy.keyInfo[0].userFriendlyAddress, Dummy.encryptionPassword),
            KeyStore.instance.get(Dummy.keyInfo[1].userFriendlyAddress, Dummy.encryptionPassword)
        ]);
        expect(key1.getPublicInfo()).toEqual(Dummy.keyInfo[0]);
        expect(key2.getPublicInfo()).toEqual(Dummy.keyInfo[1]);
        expect(Nimiq.BufferUtils.equals(key1.exportPlain(), Dummy.keyPairs[0])).toBe(true);
        expect(Nimiq.BufferUtils.equals(key2.exportPlain(), Dummy.keyPairs[1])).toBe(true);
    });

    it('can get the type of keys', async () => {
        const [type1, type2] = await Promise.all([
            KeyStore.instance.getType(Dummy.keyInfo[0].userFriendlyAddress),
            KeyStore.instance.getType(Dummy.keyInfo[1].userFriendlyAddress)
        ]);
        expect(type1).toBe(Dummy.keyInfo[0].type);
        expect(type2).toBe(Dummy.keyInfo[1].type);
    });

    it('can list keys', async () => {
        const keyInfo = await KeyStore.instance.list();
        expect(keyInfo).toEqual(Dummy.keyInfo);
    });

    it('can remove keys', async () => {
        let currentKeys = await KeyStore.instance.list();
        expect(currentKeys).toEqual(Dummy.keyInfo);

        await KeyStore.instance.remove(Dummy.keyInfo[0].userFriendlyAddress);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(1);
        expect(currentKeys[0].userFriendlyAddress).not.toBe(Dummy.keyInfo[0].userFriendlyAddress);

        await KeyStore.instance.remove(Dummy.keyInfo[1].userFriendlyAddress);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(0);

        // check that we can't get a removed key by address
        const removedKeys = await Promise.all([
            KeyStore.instance._getPlain(Dummy.keyInfo[0].userFriendlyAddress),
            KeyStore.instance._getPlain(Dummy.keyInfo[1].userFriendlyAddress)
        ]);
        expect(removedKeys[0]).toBeUndefined();
        expect(removedKeys[1]).toBeUndefined();
    });

    it('can add and update keys', async () => {
        // first clear database
        await Dummy.Utils.deleteDummyKeyStore();

        let currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(0);

        // add a plain key
        await KeyStore.instance.putPlain(Dummy.keyDatabaseEntries[0]);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(1);

        // encrypt and put key in DB
        const dummyKey2 = new Key(Nimiq.KeyPair.unserialize(new Nimiq.SerialBuffer(Dummy.keyPairs[1])),
            Dummy.keyInfo[1].type);
        await KeyStore.instance.put(dummyKey2, Dummy.encryptionPassword);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(2);

        // check that the keys have been stored correctly
        const [plainKey1, key2] = await Promise.all([
            KeyStore.instance._getPlain(Dummy.keyInfo[0].userFriendlyAddress),
            KeyStore.instance.get(Dummy.keyInfo[1].userFriendlyAddress, Dummy.encryptionPassword)
        ]);
        expect(plainKey1).toEqual(Dummy.keyDatabaseEntries[0]);
        expect(key2.getPublicInfo()).toEqual(Dummy.keyInfo[1]);
        expect(Nimiq.BufferUtils.equals(key2.keyPair.serialize(), Dummy.keyPairs[1])).toBe(true);

        // encryption of keys is not deterministic, thus reencrypted key bytes differ from Dummy.encryptedKeyPairs[1]
        let plainKey2 = await KeyStore.instance._getPlain(Dummy.keyInfo[1].userFriendlyAddress);
        expect(plainKey2.encryptedKeyPair).not.toEqual(Dummy.encryptedKeyPairs[1]);

        // update the key2 database entry with the original Dummy.keyDatabaseEntries[1]
        await KeyStore.instance.putPlain(Dummy.keyDatabaseEntries[1]);
        plainKey2 = await KeyStore.instance._getPlain(Dummy.keyInfo[1].userFriendlyAddress);
        expect(plainKey2.encryptedKeyPair).toEqual(Dummy.encryptedKeyPairs[1]);
    });

    it('can migrate accounts from deprecated AccountStore', async () => {
        // clear key store and fill account store
        await Promise.all([
            Dummy.Utils.deleteDummyKeyStore(),
            Dummy.Utils.createDummyAccountStore()
        ]);

        spyOnProperty(document, 'cookie', 'set').and.callFake((/** @type {string} */ cookie) => {
            expect(cookie.startsWith('migrate') || cookie.startsWith('accounts')).toBe(true);
            expect(cookie.endsWith('expires=Thu, 01 Jan 1970 00:00:01 GMT')).toBe(true);
        });

        await KeyStore.instance.doMigrateAccountsToKeys();

        const [key1, key2] = await Promise.all([
            KeyStore.instance._getPlain(Dummy.keyInfo[0].userFriendlyAddress),
            KeyStore.instance._getPlain(Dummy.keyInfo[1].userFriendlyAddress)
        ]);
        expect(key1).toEqual(Dummy.keyDatabaseEntries[0]);
        expect(key2).toEqual(Dummy.keyDatabaseEntries[1]);

        await Dummy.Utils.deleteDummyAccountStore();
    });
});
