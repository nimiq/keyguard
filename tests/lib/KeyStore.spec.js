/* global Nimiq */
/* global Key */
/* global KeyStore */
/* global Dummy */

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
            KeyStore.instance._get(Dummy.keyInfos[0].id),
            KeyStore.instance._get(Dummy.keyInfos[1].id),
        ]);
        expect(key1).toEqual(Dummy.storedKeyRecords()[0]);
        expect(key2).toEqual(Dummy.storedKeyRecords()[1]);
    });

    it('can get and decrypt keys', async () => {
        const [key1, key2] = await Promise.all([
            KeyStore.instance.get(Dummy.keyInfos[0].id, Nimiq.BufferUtils.fromAscii(Dummy.encryptionPassword)),
            KeyStore.instance.get(Dummy.keyInfos[1].id),
        ]);
        if (!key1 || !key2) throw new Error();
        expect(key1.id).toEqual(Dummy.keyInfos[0].id);
        expect(key1.type).toEqual(Dummy.keyInfos[0].type);
        expect(key1.secret).toEqual(Dummy.keys[0]);
        expect(key1.hasPin).toEqual(Dummy.keyInfos[0].hasPin);

        expect(key2.id).toEqual(Dummy.keyInfos[1].id);
        expect(key2.type).toEqual(Dummy.keyInfos[1].type);
        expect(key2.secret).toEqual(Dummy.keys[1]);
        expect(key2.hasPin).toEqual(Dummy.keyInfos[1].hasPin);
    });

    it('can list keys', async () => {
        const keyInfos = await KeyStore.instance.list();
        expect(keyInfos).toEqual(Dummy.keyInfos);
    });

    it('can remove keys', async () => {
        let currentKeys = await KeyStore.instance.list();
        expect(currentKeys).toEqual(Dummy.keyInfos);

        await KeyStore.instance.remove(Dummy.keyInfos[0].id);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(1);
        expect(currentKeys[0].id).not.toBe(Dummy.keyInfos[0].id);

        await KeyStore.instance.remove(Dummy.keyInfos[1].id);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(0);

        // check that we can't get a removed key by address
        const removedKeys = await Promise.all([
            KeyStore.instance._get(Dummy.keyInfos[0].id),
            KeyStore.instance._get(Dummy.keyInfos[1].id),
        ]);
        expect(removedKeys[0]).toBeUndefined();
        expect(removedKeys[1]).toBeUndefined();
    });

    it('can add and update keys', async () => {
        // first clear database
        await Dummy.Utils.deleteDummyKeyStore();

        let currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(0);

        // add an encrypted key
        const passphrase = Nimiq.BufferUtils.fromAscii(Dummy.encryptionPassword);
        await KeyStore.instance.put(new Key(Dummy.keys[0], Key.Type.LEGACY), passphrase);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(1);

        // add a plain key
        await KeyStore.instance.put(new Key(Dummy.keys[1], Key.Type.BIP39));
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys).toEqual(Dummy.keyInfos);

        // check that the keys have been stored correctly
        const [key1, key2] = await Promise.all([
            KeyStore.instance.get(Dummy.keyInfos[0].id, passphrase),
            KeyStore.instance.get(Dummy.keyInfos[1].id),
        ]);
        if (!key1 || !key2) throw new Error();
        expect(Nimiq.BufferUtils.equals(key1.secret, Dummy.keys[0])).toBe(true);
        expect(Nimiq.BufferUtils.equals(key2.secret, Dummy.keys[1])).toBe(true);
    });

    it('can migrate accounts', async () => {
        // clear key store and fill account store
        await Promise.all([
            Dummy.Utils.deleteDummyKeyStore(),
            Dummy.Utils.createDummyAccountStore(),
        ]);
        spyOn(BrowserDetection, 'isIOS').and.returnValue(false);

        let cookieSet = false;
        spyOnProperty(document, 'cookie', 'set').and.callFake(() => {
            cookieSet = true;
        });

        await KeyStore.instance.migrateAccountsToKeys();

        expect(cookieSet).toBe(false);
        const key1 = await KeyStore.instance._get(Dummy.keyInfos[0].id);
        expect(key1).toEqual(Dummy.storedKeyRecords[0]);

        // TODO: Expect Accounts DB to be deleted

        await Dummy.Utils.deleteDummyAccountStore();
    });

    it('can migrate accounts on iOS', async () => {
        // clear key store and fill account store
        await Promise.all([
            Dummy.Utils.deleteDummyKeyStore(),
            Dummy.Utils.createDummyAccountStore(),
        ]);
        spyOn(BrowserDetection, 'isIOS').and.returnValue(true);

        let migrationCookieDeleted = false,
            accountsCookieDeleted = false;
        spyOnProperty(document, 'cookie', 'set').and.callFake((/** @type {string} */ cookie) => {
            if (cookie.startsWith('migrate=')) {
                migrationCookieDeleted = true;
            } else if (cookie.startsWith('accounts=')) {
                accountsCookieDeleted = true;
            }
            expect(migrationCookieDeleted || accountsCookieDeleted).toBe(true);
            expect(cookie.includes('expires=Thu, 01 Jan 1970 00:00:01 GMT')).toBe(true);
        });

        await KeyStore.instance.migrateAccountsToKeys();

        expect(migrationCookieDeleted && accountsCookieDeleted).toBe(true);
        const key1 = await KeyStore.instance._get(Dummy.keyInfos[0].id);
        expect(key1).toEqual(Dummy.storedKeyRecords()[0]);

        // TODO: Expect Accounts DB to not be deleted

        await Dummy.Utils.deleteDummyAccountStore();
    });

    it('don\'n store same key twice', async () => {
        // first clear database
        await Dummy.Utils.deleteDummyKeyStore();

        let currentKeys = await KeyStore.instance.list();

        // add key
        const passphrase = Nimiq.BufferUtils.fromAscii(Dummy.encryptionPassword);
        await KeyStore.instance.put(new Key(Dummy.keys[1], Key.Type.BIP39), passphrase);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(1);

        // add key again
        await KeyStore.instance.put(new Key(Dummy.keys[1], Key.Type.BIP39), passphrase);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(1);

         // add key again with different password
        const passphrase2 = Nimiq.BufferUtils.fromAscii(Dummy.encryptionPassword2);
        await KeyStore.instance.put(new Key(Dummy.keys[1], Key.Type.BIP39), passphrase2);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(1);

        // same for legacy keys
        await KeyStore.instance.put(new Key(Dummy.keys[1], Key.Type.LEGACY), passphrase);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(2);

        // add key again
        await KeyStore.instance.put(new Key(Dummy.keys[1], Key.Type.LEGACY), passphrase);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(2);

         // add key again with different password
        await KeyStore.instance.put(new Key(Dummy.keys[1], Key.Type.LEGACY), passphrase2);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(2);
    });

    // TODO: can migrate accounts on iOS when migration cookie is set
});
