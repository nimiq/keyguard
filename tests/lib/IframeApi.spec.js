/* global Dummy */
/* global IFrameApi */
/* global KeyStore */
/* global BrowserDetection */
/* global CookieJar */
/* global AccountStore */

describe('IframeApi', () => {
    const iframeApi = new IFrameApi();
    /** @type {string} */
    let cookies = '';

    beforeEach(() => {
        cookies = Dummy.cookie;
        spyOn(CookieJar, 'eatKeys').and.callThrough();
        spyOn(CookieJar, 'eatDeprecatedAccounts').and.callThrough();
        spyOn(AccountStore.prototype, 'list').and.callThrough();
        spyOn(KeyStore.prototype, 'list').and.callThrough();
        spyOn(KeyStore.prototype, 'migrateAccountsToKeys').and.callThrough();
        spyOnProperty(document, 'cookie', 'get').and.callFake(() => cookies);
    });

    it('can list deprecated accounts from cookies on iOS.', async () => {
        spyOn(BrowserDetection, 'isIOS').and.returnValue(true);

        const listedAccounts = await iframeApi.listLegacyAccounts(null);

        expect(CookieJar.eatDeprecatedAccounts).toHaveBeenCalled();
        expect(AccountStore.instance.list).not.toHaveBeenCalled();
        expect(KeyStore.instance.list).not.toHaveBeenCalled();
        expect(listedAccounts).toEqual(Dummy.deprecatedAccount2KeyInfoObjects());
    });

    it('can list key info from cookies on iOS', async () => {
        spyOn(BrowserDetection, 'isIOS').and.returnValue(true);

        const listedKeys = await iframeApi.list(null);

        expect(CookieJar.eatKeys).toHaveBeenCalled();
        expect(AccountStore.instance.list).not.toHaveBeenCalled();
        expect(KeyStore.instance.list).not.toHaveBeenCalled();
        expect(listedKeys).toEqual(Dummy.keyInfoObjects());
    });

    it('can list deprecated accounts from AccountStore on non-iOS', async () => {
        await Dummy.Utils.createDummyAccountStore();
        spyOn(BrowserDetection, 'isIOS').and.returnValue(false);

        const listedAccounts = await iframeApi.listLegacyAccounts(null);

        expect(CookieJar.eatKeys).not.toHaveBeenCalled();
        expect(AccountStore.instance.list).toHaveBeenCalled();
        expect(KeyStore.instance.list).not.toHaveBeenCalled();
        expect(listedAccounts).toEqual(Dummy.deprecatedAccount2KeyInfoObjects());

        await Dummy.Utils.deleteDummyAccountStore();
    });

    it('can list key info from KeyStore on non-iOS', async () => {
        await Dummy.Utils.createDummyKeyStore();
        spyOn(BrowserDetection, 'isIOS').and.returnValue(false);

        const listedKeyObjects = await iframeApi.list(null);

        expect(CookieJar.eatKeys).not.toHaveBeenCalled();
        expect(AccountStore.instance.list).not.toHaveBeenCalled();
        expect(KeyStore.instance.list).toHaveBeenCalled();
        expect(listedKeyObjects).toEqual(Dummy.keyInfoObjects());

        await Dummy.Utils.deleteDummyKeyStore();
    });

    it('can migrate by setting the migration flag on iOS', async () => {
        await Dummy.Utils.createDummyAccountStore();

        let cookieSet = false;
        spyOn(BrowserDetection, 'isIOS').and.returnValue(true);
        spyOnProperty(document, 'cookie', 'set').and.callFake((/** @type {string} */ cookie) => {
            expect(cookie.startsWith('migrate=1;')).toBe(true);
            cookieSet = true;
            cookies = `${cookies ? `${cookies}; ` : ''}${cookie.split(';')[0]}`;
        });

        await iframeApi.migrateAccountsToKeys(null);

        expect(cookieSet).toBe(true);
        expect(KeyStore.instance.migrateAccountsToKeys).not.toHaveBeenCalled();

        const accountsDbAfter = await AccountStore.instance.connect();
        expect(accountsDbAfter).not.toBe(null);

        Dummy.Utils.deleteDummyAccountStore();
    });

    it('can migrate by copying keys from deprecated accounts on non-iOS', async () => {
        await Dummy.Utils.createDummyAccountStore();
        spyOn(BrowserDetection, 'isIOS').and.returnValue(false);

        const accountsDbBefore = await AccountStore.instance.connect();
        expect(accountsDbBefore).not.toBe(null);

        await iframeApi.migrateAccountsToKeys(null);
        expect(KeyStore.instance.migrateAccountsToKeys).toHaveBeenCalled();

        // check that keys have been copied correctly
        const ids = (await KeyStore.instance.list()).map(record => record.id);
        for (let id of ids) {
            const keyRecord = await KeyStore.instance._get(id);
            const expectedKeyRecord = /** @type {KeyRecord} */(Dummy.keyRecords().find(record => record.id === id));
            expect(keyRecord).toEqual(expectedKeyRecord);
        }

        const accountsDb = await AccountStore.instance.connect();
        expect(accountsDb).toBe(null);

        await Promise.all([
            Dummy.Utils.deleteDummyAccountStore(),
            Dummy.Utils.deleteDummyKeyStore(),
        ]);
    });
});
