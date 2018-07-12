describe('AccountStore', () => {

    beforeEach(async () => {
        await Dummy.createDummyAccountStore();
    });

    afterEach(async () => {
        await AccountStore.instance.close();
    });

    it('is a singleton', () => {
        const instance1 = AccountStore.instance;
        const instance2 = AccountStore.instance;
        expect(instance1).toBe(instance2);
    });

    it('can open and close a connection', async () => {
        const db = await AccountStore.instance.connect();
        expect(AccountStore.instance._dbPromise).toBeTruthy();
        expect(db.name).toBe(AccountStore.ACCOUNT_DATABASE);
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

    // TODO add test for drop
});
