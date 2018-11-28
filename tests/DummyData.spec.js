/* global loadNimiq */
/* global AccountStore */
/* global Key */
/* global KeyInfo */
/* global KeyStore */

beforeAll(async () => {
    await loadNimiq();
});

const Dummy = {};

Dummy.keys = [
    // eslint-disable-next-line max-len
    Uint8Array.from([0x68, 0x2d, 0xf0, 0x35, 0xc3, 0x0e, 0x8c, 0x55, 0xbd, 0xa4, 0xab, 0x51, 0x72, 0x13, 0x79, 0x2c, 0x2a, 0xf4, 0xb4, 0xe9, 0xc2, 0x3a, 0xc2, 0xcf, 0x11, 0xbd, 0x28, 0xb2, 0x37, 0xa6, 0x54, 0x4e]),
    // eslint-disable-next-line max-len
    Uint8Array.from([0x50, 0x07, 0xdf, 0x4a, 0xb4, 0x57, 0x2d, 0x5c, 0x3a, 0x30, 0xbf, 0x71, 0x2b, 0xd6, 0x22, 0x37, 0x2e, 0x7a, 0x48, 0x0b, 0x6b, 0x08, 0x41, 0xf1, 0x73, 0x5c, 0x82, 0xaf, 0xf1, 0xb9, 0xa9, 0xb7]),
];

/** @type {Uint8Array[]} */
Dummy.encryptedKeys = [
    // eslint-disable-next-line max-len
    Uint8Array.from([0x01, 0x08, 0x18, 0xb1, 0x0b, 0x3e, 0x07, 0x2d, 0x4e, 0x52, 0x39, 0x3e, 0x80, 0x22, 0x17, 0x4d, 0x7d, 0x0a, 0x2d, 0x07, 0x87, 0x8d, 0xf0, 0x9f, 0xc5, 0x31, 0x2a, 0x6b, 0x0e, 0xb6, 0xc7, 0x45, 0xb3, 0xcc, 0x45, 0x11, 0x2c, 0xef, 0xcb, 0xe5, 0x91, 0xf8, 0x26, 0xbd, 0xbf, 0x03, 0x19, 0x7f, 0x4e, 0x8c, 0x66, 0xc9, 0x33, 0xe5]),
    // eslint-disable-next-line max-len
    Uint8Array.from([0x01, 0x08, 0x50, 0x96, 0xba, 0xbd, 0x96, 0x39, 0x4f, 0x60, 0xae, 0x4e, 0xdf, 0x75, 0xa9, 0x84, 0xee, 0xe5, 0x8b, 0xc6, 0x1a, 0x33, 0xc8, 0x6e, 0x28, 0xd3, 0x07, 0xc5, 0xfe, 0x27, 0xf2, 0x0d, 0xa7, 0x13, 0xce, 0xce, 0x08, 0xd8, 0xfa, 0x71, 0x40, 0xab, 0x78, 0x8f, 0x8a, 0x20, 0xc3, 0x54, 0x1f, 0x22, 0x48, 0xff, 0xea, 0xdb]),
];

/** @type {string} */
Dummy.encryptionPassword = 'password';

/** @type {KeyInfo[]} */
Dummy.keyInfos = [
    new KeyInfo(
        '2ec615522906',
        Key.Type.LEGACY,
        true,
        false,
    ),
    new KeyInfo(
        'ef553f34a779',
        Key.Type.BIP39,
        false,
        false,
    ),
];

/** @type {KeyguardRequest.KeyInfoObject[]} */
Dummy.keyInfoObjects = [
    {
        id: Dummy.keyInfos[0].id,
        type: Dummy.keyInfos[0].type,
        encrypted: Dummy.keyInfos[0].encrypted,
        hasPin: Dummy.keyInfos[0].hasPin,
    },
    {
        id: Dummy.keyInfos[1].id,
        type: Dummy.keyInfos[1].type,
        encrypted: Dummy.keyInfos[1].encrypted,
        hasPin: Dummy.keyInfos[1].hasPin,
    },
];

/** @type {KeyRecord[]} */
Dummy.keyRecords = [
    Object.assign({}, Dummy.keyInfoObjects[0], { secret: Dummy.encryptedKeys[0] }),
    Object.assign({}, Dummy.keyInfoObjects[1], { secret: Dummy.keys[1] }),
];

/** @type {AccountInfo[]} */
Dummy.deprecatedAccountInfos = [
    {
        userFriendlyAddress: 'NQ71 CT4K 7R9R EHSB 7HY9 TSTP XNRQ L2RK 8U4U',
        type: 'high',
        label: 'Dummy account 1',
    },
];

/** @type {AccountRecord[]} */
Dummy.deprecatedAccountRecords = [
    Object.assign({}, Dummy.deprecatedAccountInfos[0], { encryptedKeyPair: Dummy.encryptedKeys[0] }),
];

/** @type {KeyguardRequest.LegacyKeyInfoObject[]} */
Dummy.deprecatedAccount2KeyInfoObject = [{
    id: '2ec615522906',
    type: Key.Type.LEGACY,
    encrypted: true,
    hasPin: false,
    legacyAccount: {
        label: Dummy.deprecatedAccountInfos[0].label,
        address: Nimiq.Address.fromUserFriendlyAddress(Dummy.deprecatedAccountInfos[0].userFriendlyAddress).serialize(),
    },
}];

Dummy.keyInfoCookieEncoded = '0102ec615522906100ef553f34a779';

/** @type {string} */
Dummy.cookie = `k=${Dummy.keyInfoCookieEncoded};accounts=${JSON.stringify(Dummy.deprecatedAccountInfos)};some=thing;`;

Dummy.DUMMY_ACCOUNT_DATABASE_NAME = 'keyguard-dummy-account-database';
Dummy.DUMMY_KEY_DATABASE_NAME = 'keyguard-dummy-key-database';
AccountStore.ACCOUNT_DATABASE = Dummy.DUMMY_ACCOUNT_DATABASE_NAME;
KeyStore.DB_NAME = Dummy.DUMMY_KEY_DATABASE_NAME;

Dummy.Utils = {
    /**
     * @param {IDBDatabase} db
     * @param {string} objectStoreName
     * @param {object} entry
     * @returns {Promise<any>}
     */
    addEntryToDatabase: (db, objectStoreName, entry) => {
        return new Promise((resolve, reject) => {
            const request = db.transaction([objectStoreName], 'readwrite')
                .objectStore(objectStoreName)
                .put(entry);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /** @returns {Promise<void>} */
    createDummyAccountStore: async () => {
        // create database
        const db = await new Promise((resolve, reject) => {
            const request = window.indexedDB.open(Dummy.DUMMY_ACCOUNT_DATABASE_NAME, AccountStore.VERSION);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            request.onupgradeneeded = () => {
                const _db = request.result;
                _db.createObjectStore(AccountStore.ACCOUNT_DATABASE, { keyPath: 'userFriendlyAddress' });
            };
        });

        // fill database
        await Dummy.Utils.addEntryToDatabase(db, AccountStore.ACCOUNT_DATABASE, Dummy.deprecatedAccountRecords[0]);

        db.close();
    },

    /** @returns {Promise<void>} */
    createDummyKeyStore: async () => {
        // The key store can be created and filled by its api
        await KeyStore.instance.connect();
        await Promise.all([
            KeyStore.instance._put(Dummy.keyRecords[0]),
            KeyStore.instance._put(Dummy.keyRecords[1]),
        ]);
        await KeyStore.instance.close();
    },

    /**
     * @param {string} dbName
     * @returns {Promise<void>}
     */
    deleteDatabase: async dbName => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(dbName);
            request.onerror = () => reject;
            request.onsuccess = resolve;
            request.onblocked = () => {
                // wait for open connections to get closed
                setTimeout(() => reject(new Error('Can\'t delete database, there is still an open connection.')), 1000);
            };
        });
    },

    /** @returns {Promise<void>} */
    deleteDummyAccountStore: async () => {
        await AccountStore.instance.close();
        await Dummy.Utils.deleteDatabase(Dummy.DUMMY_ACCOUNT_DATABASE_NAME);
        delete AccountStore._instance;
    },

    /** @returns {Promise<void>} */
    deleteDummyKeyStore: async () => {
        await KeyStore.instance.close();
        await Dummy.Utils.deleteDatabase(Dummy.DUMMY_KEY_DATABASE_NAME);
        delete KeyStore._instance;
    },
};
