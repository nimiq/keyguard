/* global Dummy */
/* global AccountStore */
describe('AccountStore', () => {
    beforeEach(async () => Dummy.Utils.createDummyAccountStore());
    afterEach(async () => Dummy.Utils.deleteDummyAccountStore());

    it('is a singleton', () => {
        const instance1 = AccountStore.instance;
        const instance2 = AccountStore.instance;
        expect(instance1).toBe(instance2);
    });

    it('can open and close a connection', async () => {
        const db = await AccountStore.instance.connect();
        expect(db.constructor).toBe(IDBDatabase);
        expect(AccountStore.instance._dbPromise).toBeTruthy();
        expect(db.name).toBe(Dummy.DUMMY_ACCOUNT_DATABASE_NAME);
        await AccountStore.instance.close();
        expect(AccountStore.instance._dbPromise).toBeNull();
    });

    it('can list the account info', async () => {
        const accountInfo = await AccountStore.instance.list();
        expect(accountInfo).toEqual(Dummy.deprecatedAccountInfos);
    });

    it('can list the accounts including encrypted keys', async () => {
        const accounts = await AccountStore.instance.dangerousListPlain();
        expect(accounts).toEqual(Dummy.deprecatedAccountRecords);
    });

    it('lists no accounts if the database doesn\'t exist', async () => {
        await Dummy.Utils.deleteDummyAccountStore();

        const accounts = await AccountStore.instance.dangerousListPlain();
        expect(accounts.length).toBe(0);

        const accountInfo = await AccountStore.instance.list();
        expect(accountInfo.length).toBe(0);
    });

    it('can be dropped', async function () {
        await AccountStore.instance.drop();
        // database should not exist anymore
        const db = await AccountStore.instance.connect();
        expect(db).toBeNull();
    });
});
