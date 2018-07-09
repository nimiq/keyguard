const Dummy = {};

/** @type {Uint8Array[]} */
Dummy.encryptedKeyPairs = [
    Uint8Array.from([1, 8, 215, 153, 111, 73, 91, 52, 123, 4, 239, 220, 7, 14, 93, 251, 59, 38, 70, 158, 1, 234, 212, 68, 6, 28, 84, 136, 116, 37, 140, 148, 170, 105, 195, 128, 51, 5, 249, 52, 237, 61, 135, 66, 214, 60, 25, 63, 131, 34, 148, 79, 189, 210]),
    Uint8Array.from([1, 8, 125, 65, 222, 86, 59, 184, 231, 64, 4, 46, 42, 1, 176, 66, 218, 214, 251, 158, 49, 189, 117, 38, 96, 146, 174, 103, 151, 146, 185, 119, 146, 61, 91, 97, 160, 243, 81, 100, 173, 104, 233, 83, 154, 232, 152, 109, 64, 114, 172, 58, 18, 145])
];

/** @type {string} */
Dummy.encryptionPassword = 'password';

/** @type {AccountInfo[]} */
Dummy.deprecatedAccountInfo = [
    {
        userFriendlyAddress: 'NQ32 473Y R5T3 979R 325K S8UT 7E3A NRNS VBX2',
        type: 'high',
        label: 'Dummy account'
    },
    {
        userFriendlyAddress: 'NQ60 DUNG SUCK PAPA K1UM XB4A MTLL A189 2N4C',
        type: 'low',
        label: 'Another dummy account'
    }
];

/** @type {AccountEntry[]} */
Dummy.deprecatedAccountDatabaseEntries = [
    Object.assign({}, Dummy.deprecatedAccountInfo[0], {encryptedKeyPair: Dummy.encryptedKeyPairs[0]}),
    Object.assign({}, Dummy.deprecatedAccountInfo[1], {encryptedKeyPair: Dummy.encryptedKeyPairs[1]})
];

/** @type {KeyInfo[]} */
Dummy.keyInfo = [
    {
        userFriendlyAddress: 'NQ32 473Y R5T3 979R 325K S8UT 7E3A NRNS VBX2',
        type: /** @type {1 | 2} */ (2)
    },
    {
        userFriendlyAddress: 'NQ60 DUNG SUCK PAPA K1UM XB4A MTLL A189 2N4C',
        type: /** @type {1 | 2} */ (1)
    }
];

Dummy.keyInfoCookieEncoded = '2Icf8l2NJ05GIs9I5s7hqtm2ur8I1by0NcZO6rqmHlfLIqu6UUFCRWIw';

/** @type {string} */
Dummy.cookie = `k=${Dummy.keyInfoCookieEncoded};accounts=${JSON.stringify(Dummy.deprecatedAccountInfo)};some=thing;`;

Dummy.DUMMY_ACCOUNT_DATABASE_NAME = 'keyguard-dummy-account-database';

/** @type {AccountStore} */
Dummy.accountStore = new AccountStore(Dummy.DUMMY_ACCOUNT_DATABASE_NAME);

(() => {
    /**
     * @param {IDBDatabase} db
     * @param {string} objectStoreName
     * @param {object} entry
     * @returns {Promise.<void>}
     */
    async function addEntryToDataBase(db, objectStoreName, entry) {
        return new Promise((resolve, reject) => {
            const putTx = db.transaction([objectStoreName], 'readwrite')
                .objectStore(objectStoreName)
                .put(entry);
            putTx.onsuccess = () => resolve(putTx.result);
            putTx.onerror = reject;
        });
    }

    async function createDummyAccountStore() {
        // create database
        const db = await new Promise((resolve, reject) => {
            const request = window.indexedDB.open(Dummy.DUMMY_ACCOUNT_DATABASE_NAME, AccountStore.VERSION);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            request.onupgradeneeded = () => {
                const db = request.result;
                db.createObjectStore(AccountStore.ACCOUNT_DATABASE, { keyPath: 'userFriendlyAddress' });
            };
        });

        // fill database
        await Promise.all([
            addEntryToDataBase(db, AccountStore.ACCOUNT_DATABASE, Dummy.deprecatedAccountDatabaseEntries[0]),
            addEntryToDataBase(db, AccountStore.ACCOUNT_DATABASE, Dummy.deprecatedAccountDatabaseEntries[1])
        ]);

        db.close();
    }

    /** @param {string} dbName */
    async function deleteDatabase(dbName) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(dbName);
            request.onerror = () => reject;
            request.onsuccess = resolve;
        });
    }

    beforeAll(async () => {
        Nimiq.GenesisConfig.test();
        await Promise.all([
            Nimiq.WasmHelper.doImportBrowser(),
            createDummyAccountStore()
        ]);

        AccountStore._instance = Dummy.accountStore;
    });

    afterAll(async () => {
        Dummy.accountStore.close();
        await deleteDatabase(Dummy.DUMMY_ACCOUNT_DATABASE_NAME);
        console.log('Clean up finished');
    });
})();
