/* global Dummy */
/* global IFrameApi */
/* global KeyStore */
/* global BrowserDetection */
/* global CookieJar */
/* global AccountStore */

describe('IframeApi', () => {
    const iframeApi = new IFrameApi();

    beforeEach(() => {
        spyOn(CookieJar, 'eat').and.callThrough();
        spyOn(AccountStore.instance, 'list').and.callThrough();
        spyOn(KeyStore.instance, 'list').and.callThrough();
        spyOn(KeyStore.instance, 'migrateAccountsToKeys').and.callThrough();
        spyOnProperty(document, 'cookie', 'get').and.returnValue(Dummy.cookie);
    });

    it('can list deprecated accounts from cookies on iOS.', async () => {
        spyOn(BrowserDetection, 'isIOS').and.returnValue(true);

        const listedAccounts = await iframeApi.listLegacyAccounts(null);

        expect(CookieJar.eat).toHaveBeenCalledWith(true);
        expect(AccountStore.instance.list).not.toHaveBeenCalled();
        expect(KeyStore.instance.list).not.toHaveBeenCalled();
        expect(listedAccounts).toEqual(Dummy.deprecatedAccount2KeyInfoObject);
    });

    it('can list key info from cookies on iOS', async () => {
        spyOn(BrowserDetection, 'isIOS').and.returnValue(true);

        const listedKeys = await iframeApi.list(null);

        expect(CookieJar.eat).toHaveBeenCalledWith();
        expect(AccountStore.instance.list).not.toHaveBeenCalled();
        expect(KeyStore.instance.list).not.toHaveBeenCalled();
        expect(listedKeys).toEqual(Dummy.keyInfoObjects);
    });

    it('can list deprecated accounts from AccountStore on non-iOS', async () => {
        await Dummy.Utils.createDummyAccountStore();
        spyOn(BrowserDetection, 'isIOS').and.returnValue(false);

        const listedAccounts = await iframeApi.listLegacyAccounts(null);

        expect(CookieJar.eat).not.toHaveBeenCalled();
        expect(AccountStore.instance.list).toHaveBeenCalled();
        expect(KeyStore.instance.list).not.toHaveBeenCalled();
        expect(listedAccounts).toEqual(Dummy.deprecatedAccount2KeyInfoObject);

        await Dummy.Utils.deleteDummyAccountStore();
    });

    it('can list key info from KeyStore on non-iOS', async () => {
        await Dummy.Utils.createDummyKeyStore();
        spyOn(BrowserDetection, 'isIOS').and.returnValue(false);

        const listedKeyObjects = await iframeApi.list(null);

        expect(CookieJar.eat).not.toHaveBeenCalled();
        expect(AccountStore.instance.list).not.toHaveBeenCalled();
        expect(KeyStore.instance.list).toHaveBeenCalled();
        expect(listedKeyObjects).toEqual(Dummy.keyInfoObjects);

        await Dummy.Utils.deleteDummyKeyStore();
    });

    it('can migrate by setting the migration flag on iOS', async () => {
        let cookieSet = false;
        spyOn(BrowserDetection, 'isIOS').and.returnValue(true);
        spyOnProperty(document, 'cookie', 'set').and.callFake((/** @type {string} */ cookie) => {
            expect(cookie.startsWith('migrate=1;')).toBe(true);
            cookieSet = true;
        });

        await iframeApi.migrateAccountsToKeys(null);

        expect(cookieSet).toBe(true);
        expect(KeyStore.instance.migrateAccountsToKeys).not.toHaveBeenCalled();
    });

    it('can migrate by copying keys from deprecated accounts on non-iOS', async () => {
        await Dummy.Utils.createDummyAccountStore();
        spyOn(BrowserDetection, 'isIOS').and.returnValue(false);

        await iframeApi.migrateAccountsToKeys(null);
        expect(KeyStore.instance.migrateAccountsToKeys).toHaveBeenCalled();

        // check that keys have been copied correctly
        const key1 = await KeyStore.instance._get(Dummy.keyInfos[0].id);
        expect(key1).toEqual(Dummy.keyRecords[0]);

        await Promise.all([
            Dummy.Utils.deleteDummyAccountStore(),
            Dummy.Utils.deleteDummyKeyStore(),
        ]);
    });
});
