describe('AccountStore', () => {
    it('is a singleton', () => {
        const instance1 = AccountStore.instance;
        const instance2 = AccountStore.instance;
        expect(instance1).toBe(instance2);
    });

    it('connection can be opened and closed', async () => {
        const db = await AccountStore.instance.connect();
        expect(AccountStore.instance._dbPromise).toBeTruthy();
        expect(db.name).toBe(Dummy.DUMMY_ACCOUNT_DATABASE_NAME);
        await AccountStore.instance.close();
        expect(AccountStore.instance._dbPromise).toBeNull();
    });

    it('can list the account info', async () => {
        const accountInfo = await AccountStore.instance.list();
        expect(accountInfo).toEqual(Dummy.deprecatedAccountInfo);
    });

    it('can list the accounts including encrypted keys', async () => {
        const accounts = await AccountStore.instance.dangerousListPlain();
        expect(accounts).toEqual(Dummy.deprecatedAccountDatabaseEntries);
    });
});
