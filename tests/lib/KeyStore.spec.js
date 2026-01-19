/* global Nimiq */
/* global Key */
/* global KeyStore */
/* global Dummy */

describe('KeyStore', () => {
    beforeEach(async () => await Dummy.Utils.createDummyKeyStore());
    afterEach(async () => await Dummy.Utils.deleteDummyKeyStore());

    it('is a singleton', () => {
        const instance1 = KeyStore.instance;
        const instance2 = KeyStore.instance;
        expect(instance1).toBe(instance2);
    });

    it('can open and close a connection', async () => {
        const db = await KeyStore.instance['connect']();
        expect(db.constructor).toBe(IDBDatabase);
        expect(KeyStore.instance._dbPromise).toBeTruthy();
        expect(db.name).toBe(Dummy.DUMMY_KEY_DATABASE_NAME);
        await KeyStore.instance.close();
        expect(KeyStore.instance._dbPromise).toBeNull();
    });

    it('can get plain keys', async () => {
        const [key1, key2] = await Promise.all([
            KeyStore.instance.getPlain(Dummy.keyInfos()[0].id),
            KeyStore.instance.getPlain(Dummy.keyInfos()[1].id),
        ]);
        expect(key1).toEqual(Dummy.keyRecords()[0]);
        expect(key2).toEqual(Dummy.keyRecords()[1]);
    });

    it('can get and decrypt keys', async () => {
        const keys = await Promise.all([
            KeyStore.instance.get(Dummy.keyInfos()[0].id),
            KeyStore.instance.get(Dummy.keyInfos()[1].id, Nimiq.BufferUtils.fromUtf8(Dummy.encryptionPassword)),
        ]);

        for (let [i, key] of keys.entries()) {
            if (!key) throw new Error(`Key with id ${Dummy.keyInfos()[i].id} not found!`);
            const expected = Dummy.keyInfos()[i];
            expect(key.id).toEqual(expected.id);
            expect(key.type).toEqual(expected.type);
            expect(key.secret.equals(/** @type {Nimiq.PrivateKey} */ (Dummy.secrets[i]))).toBe(true);
            expect(key.hasPin).toEqual(expected.hasPin);
        }
    });

    it('can list keys', async () => {
        const keyInfos = await KeyStore.instance.list();

        const expected = Dummy.keyInfos();
        for (let i = 0; i < Math.max(keyInfos.length, expected.length); i++) {
            expect(keyInfos[i].equals(expected[i])).toBe(true);
        }
    });

    it('can remove keys', async () => {
        let currentKeys = await KeyStore.instance.list();

        const expected = Dummy.keyInfos();
        for (let i = 0; i < Math.max(currentKeys.length, expected.length); i++) {
            expect(currentKeys[i].equals(expected[i])).toBe(true);
        }

        await KeyStore.instance.remove(Dummy.keyInfos()[0].id);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(1);
        expect(currentKeys[0].id).not.toBe(Dummy.keyInfos()[0].id);

        await KeyStore.instance.remove(Dummy.keyInfos()[1].id);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(0);

        // check that we can't get a removed key by address
        const removedKeys = await Promise.all([
            KeyStore.instance.getPlain(Dummy.keyInfos()[0].id),
            KeyStore.instance.getPlain(Dummy.keyInfos()[1].id),
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
        const password = Nimiq.BufferUtils.fromUtf8(Dummy.encryptionPassword);
        await KeyStore.instance.put(new Key(
            Dummy.secrets[1],
            { hasPin: Dummy.keyInfos()[1].hasPin },
        ), password);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(1);

        // add a plain key
        await KeyStore.instance.put(new Key(
            Dummy.secrets[0],
            { hasPin: Dummy.keyInfos()[0].hasPin },
        ));
        currentKeys = await KeyStore.instance.list();
        const expected = Dummy.keyInfos();
        for (let i = 0; i < Math.max(currentKeys.length, expected.length); i++) {
            expect(currentKeys[i].equals(expected[i])).toBe(true);
        }

        // check that the keys have been stored correctly
        const [key1, key2] = await Promise.all([
            KeyStore.instance.get(Dummy.keyInfos()[0].id),
            KeyStore.instance.get(Dummy.keyInfos()[1].id, password),
        ]);
        if (!key1 || !key2) throw new Error();
        expect(/** @type {Nimiq.Entropy} */ (key1.secret).equals(Dummy.secrets[0])).toBe(true);
        expect(key2.secret.equals(Dummy.secrets[1])).toBe(true);
    });

    it('can migrate accounts', async () => {
        // clear key store and fill account store
        await Promise.all([
            Dummy.Utils.deleteDummyKeyStore(),
            Dummy.Utils.createDummyAccountStore(),
        ]);

        const accountsDbBefore = await AccountStore.instance['connect']();
        expect(accountsDbBefore).not.toBe(null);

        spyOn(BrowserDetection, 'isIOS').and.returnValue(false);

        let cookieSet = false;
        spyOnProperty(document, 'cookie', 'set').and.callFake(() => {
            cookieSet = true;
        });

        await KeyStore.instance.migrateAccountsToKeys();

        expect(cookieSet).toBe(false);
        const key1 = await KeyStore.instance.getPlain(Dummy.keyInfos()[1].id);
        expect(key1).toEqual(Dummy.keyRecords()[1]);

        const accountsDbAfter = await AccountStore.instance['connect']();
        expect(accountsDbAfter).toBe(null);

        await Dummy.Utils.deleteDummyAccountStore();
    });

    it('can migrate accounts on iOS', async () => {
        // clear key store and fill account store
        await Promise.all([
            Dummy.Utils.deleteDummyKeyStore(),
            Dummy.Utils.createDummyAccountStore(),
        ]);

        const accountsDbBefore = await AccountStore.instance['connect']();
        expect(accountsDbBefore).not.toBe(null);

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
            expect(cookie.includes('max-age=0')).toBe(true);
        });

        await KeyStore.instance.migrateAccountsToKeys();

        expect(migrationCookieDeleted && accountsCookieDeleted).toBe(true);
        const key1 = await KeyStore.instance.getPlain(Dummy.keyInfos()[1].id);
        expect(key1).toEqual(Dummy.keyRecords()[1]);

        const accountsDb = await AccountStore.instance['connect']();
        expect(accountsDb).toBe(null);

        await Dummy.Utils.deleteDummyAccountStore();
    });

    it('doesn\'t store same key twice', async () => {
        // first clear database
        await Dummy.Utils.deleteDummyKeyStore();

        const password1 = Nimiq.BufferUtils.fromUtf8(Dummy.encryptionPassword);
        const password2 = Nimiq.BufferUtils.fromUtf8(Dummy.encryptionPassword2);

        let currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(0); // Just to be sure

        // add key
        await KeyStore.instance.put(new Key(Dummy.secrets[1]), password1);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(1);

        // add key again
        await KeyStore.instance.put(new Key(Dummy.secrets[1]), password1);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(1);

        // add key again with different password
        await KeyStore.instance.put(new Key(Dummy.secrets[1]), password2);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(1);

        // same for legacy keys
        await KeyStore.instance.put(new Key(Dummy.secrets[0]), password1);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(2);

        // add key again
        await KeyStore.instance.put(new Key(Dummy.secrets[0]), password1);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(2);

         // add key again with different password
        await KeyStore.instance.put(new Key(Dummy.secrets[0]), password2);
        currentKeys = await KeyStore.instance.list();
        expect(currentKeys.length).toBe(2);
    });

    it('returns existing id when storing existing key', async () => {
        // first clear database
        await Dummy.Utils.deleteDummyKeyStore();

        const password = Nimiq.BufferUtils.fromUtf8(Dummy.encryptionPassword);

        // add key
        const id1 = await KeyStore.instance.put(new Key(Dummy.secrets[1]), password);
        const id2 = await KeyStore.instance.put(new Key(Dummy.secrets[1]), password);
        expect(id1).toBe(id2);
    });

    // TODO: can migrate accounts on iOS when migration cookie is set
});
