describe('IframeApi', () => {
    const iframeApi = new IFrameApi();

    beforeEach(() => {
        spyOn(CookieJar, 'eat').and.callThrough();
        spyOn(AccountStore.instance, 'list').and.callThrough();
        spyOn(KeyStore.instance, 'list').and.callThrough();
        spyOn(KeyStore.instance, 'doMigrateAccountsToKeys').and.callThrough();
        spyOnProperty(document, 'cookie', 'get').and.returnValue(Dummy.cookie);
    });

    it('can list deprecated accounts from cookies on iOS.', async () => {
        spyOn(BrowserDetection, 'isIos').and.returnValue(true);

        const listedAccounts = await iframeApi.list(true);

        expect(CookieJar.eat).toHaveBeenCalledWith(true);
        expect(AccountStore.instance.list).not.toHaveBeenCalled();
        expect(KeyStore.instance.list).not.toHaveBeenCalled();
        expect(listedAccounts).toEqual(Dummy.deprecatedAccountInfo);
    });

    it('can list key info from cookies on iOS', async () => {
        spyOn(BrowserDetection, 'isIos').and.returnValue(true);

        const listedKeys = await iframeApi.list();

        expect(CookieJar.eat).toHaveBeenCalledWith(undefined);
        expect(AccountStore.instance.list).not.toHaveBeenCalled();
        expect(KeyStore.instance.list).not.toHaveBeenCalled();
        expect(listedKeys).toEqual(Dummy.keyInfo);
    });

    it('can list deprecated accounts from AccountStore on non-iOS', async () => {
        await Dummy.Utils.createDummyAccountStore();
        spyOn(BrowserDetection, 'isIos').and.returnValue(false);

        const listedAccounts = await iframeApi.list(true);

        expect(CookieJar.eat).not.toHaveBeenCalled();
        expect(AccountStore.instance.list).toHaveBeenCalled();
        expect(KeyStore.instance.list).not.toHaveBeenCalled();
        expect(listedAccounts).toEqual(Dummy.deprecatedAccountInfo);

        await Dummy.Utils.deleteDummyAccountStore();
    });

    it('can list key info from KeyStore on non-iOS', async () => {
        await Dummy.Utils.createDummyKeyStore();
        spyOn(BrowserDetection, 'isIos').and.returnValue(false);

        const listedKeys = await iframeApi.list();

        expect(CookieJar.eat).not.toHaveBeenCalled();
        expect(AccountStore.instance.list).not.toHaveBeenCalled();
        expect(KeyStore.instance.list).toHaveBeenCalled();
        expect(listedKeys).toEqual(Dummy.keyInfo);

        await Dummy.Utils.deleteDummyKeyStore();
    });

    it('can migrate by setting the migration flag on iOS', async () => {
        let cookieSet = false;
        spyOn(BrowserDetection, 'isIos').and.returnValue(true);
        spyOnProperty(document, 'cookie', 'set').and.callFake((/** @type {string} */ cookie) => {
            expect(cookie.startsWith('migrate=1;')).toBe(true);
            cookieSet = true;
        });

        await iframeApi.migrateAccountsToKeys();

        expect(cookieSet).toBe(true);
        expect(KeyStore.instance.doMigrateAccountsToKeys).not.toHaveBeenCalled();
    });

    it('can migrate by copying keys from deprecated accounts on non-iOS', async () => {
        await Dummy.Utils.createDummyAccountStore();
        spyOn(BrowserDetection, 'isIos').and.returnValue(false);

        await iframeApi.migrateAccountsToKeys();
        expect(KeyStore.instance.doMigrateAccountsToKeys).toHaveBeenCalled();

        // check that keys have been copied correctly
        const [key1, key2] = await Promise.all([
            KeyStore.instance._getPlain(Dummy.keyInfo[0].userFriendlyAddress),
            KeyStore.instance._getPlain(Dummy.keyInfo[1].userFriendlyAddress)
        ]);
        expect(key1).toEqual(Dummy.keyDatabaseEntries[0]);
        expect(key2).toEqual(Dummy.keyDatabaseEntries[1]);

        await Promise.all([
            Dummy.Utils.deleteDummyAccountStore(),
            Dummy.Utils.deleteDummyKeyStore()
        ]);
    });
});
