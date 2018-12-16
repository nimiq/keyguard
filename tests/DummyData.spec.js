/* global loadNimiq */
/* global AccountStore */
/* global Key */
/* global KeyInfo */
/* global KeyStore */

beforeAll(async () => {
    await loadNimiq();
});

/** @type {{[key: string]: any}} */
const Dummy = {};

Dummy.keys = [
    // eslint-disable-next-line max-len
    Uint8Array.from([0x68, 0x2d, 0xf0, 0x35, 0xc3, 0x0e, 0x8c, 0x55, 0xbd, 0xa4, 0xab, 0x51, 0x72, 0x13, 0x79, 0x2c, 0x2a, 0xf4, 0xb4, 0xe9, 0xc2, 0x3a, 0xc2, 0xcf, 0x11, 0xbd, 0x28, 0xb2, 0x37, 0xa6, 0x54, 0x4e]),
    // eslint-disable-next-line max-len
    Uint8Array.from([0x50, 0x07, 0xdf, 0x4a, 0xb4, 0x57, 0x2d, 0x5c, 0x3a, 0x30, 0xbf, 0x71, 0x2b, 0xd6, 0x22, 0x37, 0x2e, 0x7a, 0x48, 0x0b, 0x6b, 0x08, 0x41, 0xf1, 0x73, 0x5c, 0x82, 0xaf, 0xf1, 0xb9, 0xa9, 0xb7]),
];

Dummy.secrets = [
    new Nimiq.PrivateKey(Dummy.keys[0]),
    new Nimiq.Entropy(Dummy.keys[1]),
];

/** @type {Uint8Array[]} */
Dummy.encryptedKeys = [
    // eslint-disable-next-line max-len
    Uint8Array.from([ 0x03, 0x08, 0x4d, 0x35, 0x7c, 0x6a, 0x74, 0x85, 0xa7, 0x35, 0xc5, 0xe5, 0x55, 0x80, 0xc9, 0x86, 0xb6, 0xa4, 0x7f, 0x3e, 0xbf, 0xcb, 0xfa, 0xeb, 0x1e, 0x43, 0x0f, 0xe7, 0x19, 0xb5, 0x47, 0x2a, 0x82, 0xea, 0xff, 0xe3, 0x48, 0xb6, 0xb3, 0xc1, 0x50, 0x06, 0xf3, 0x19, 0xde, 0x44, 0x9f, 0x2e, 0xdf, 0xdc, 0x5b, 0x49, 0x03, 0x2a, 0x07, 0xda ]),
    // eslint-disable-next-line max-len
    Uint8Array.from([ 0x03, 0x08, 0x79, 0x9b, 0x93, 0x41, 0xfa, 0x6d, 0x6a, 0xde, 0xbd, 0x8d, 0x97, 0xc7, 0x18, 0xec, 0xfb, 0x64, 0xb3, 0xfe, 0x9d, 0x9b, 0x40, 0x02, 0x0a, 0x36, 0x59, 0xba, 0xb0, 0xbc, 0xc9, 0xf7, 0xa8, 0xaf, 0xe7, 0x47, 0xea, 0x4d, 0x71, 0x20, 0xd2, 0x29, 0x96, 0x72, 0x9a, 0x7e, 0x28, 0x66, 0xc9, 0xfd, 0x99, 0x43, 0x95, 0x39, 0x45, 0xab ]),
];

/** @type {string} */
Dummy.encryptionPassword = 'password';

/** @type {KeyInfo[]} */
Dummy.keyInfos = [
    new KeyInfo(
        '2ec615522906',
        Nimiq.Secret.Type.PRIVATE_KEY,
        true,
        false,
    ),
    new KeyInfo(
        'ef553f34a779',
        Nimiq.Secret.Type.ENTROPY,
        false,
        false,
    ),
];

/** @type {KeyInfo[]} */
Dummy.cookieKeyInfos = [
    new KeyInfo(
        '2ec615522906',
        Nimiq.Secret.Type.PRIVATE_KEY,
        true,
        false,
    ),
    new KeyInfo(
        'ef553f34a779',
        Nimiq.Secret.Type.ENTROPY,
        true,
        false,
    ),
];

/** @type {KeyguardRequest.KeyInfoObject[]} */
Dummy.keyInfoObjects = [
    {
        id: Dummy.keyInfos[0].id,
        type: Dummy.keyInfos[0].type,
        hasPin: Dummy.keyInfos[0].hasPin,
    },
    {
        id: Dummy.keyInfos[1].id,
        type: Dummy.keyInfos[1].type,
        hasPin: Dummy.keyInfos[1].hasPin,
    },
];

const _purposeIdBuf = new Nimiq.SerialBuffer(4);
_purposeIdBuf.writeUint32(Nimiq.Entropy.PURPOSE_ID);
const _purposeIdArray = Array.from(_purposeIdBuf.subarray(0, 4));

/** @type {KeyRecord[]} */
Dummy.keyRecords = [
    Object.assign({}, Dummy.keyInfoObjects[0], { secret: Dummy.encryptedKeys[0] }),
    Object.assign({}, Dummy.keyInfoObjects[1], { secret: new Uint8Array(_purposeIdArray.concat(Array.from(Dummy.keys[1]))) }),
];

/** @type {AccountInfo[]} */
Dummy.deprecatedAccountInfos = [
    {
        userFriendlyAddress: 'NQ71 CT4K 7R9R EHSB 7HY9 TSTP XNRQ L2RK 8U4U',
        type: 'high',
        label: 'Dummy account 1',
    },
];

Dummy.deprecatedAccountCookie = [
    {
        address: 'NQ71 CT4K 7R9R EHSB 7HY9 TSTP XNRQ L2RK 8U4U',
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
    type: Nimiq.Secret.Type.PRIVATE_KEY,
    hasPin: false,
    legacyAccount: {
        label: Dummy.deprecatedAccountInfos[0].label,
        address: Nimiq.Address.fromUserFriendlyAddress(Dummy.deprecatedAccountInfos[0].userFriendlyAddress).serialize(),
    },
}];

Dummy.keyInfoCookieEncoded = '102ec615522906' + '20ef553f34a779';

/** @type {string} */
Dummy.cookie = `k=${Dummy.keyInfoCookieEncoded};accounts=${JSON.stringify(Dummy.deprecatedAccountCookie)};some=thing;`;

Dummy.DUMMY_ACCOUNT_DATABASE_NAME = 'keyguard-dummy-account-database';
Dummy.DUMMY_KEY_DATABASE_NAME = 'keyguard-dummy-key-database';
AccountStore.ACCOUNT_DATABASE = Dummy.DUMMY_ACCOUNT_DATABASE_NAME;
KeyStore.DB_NAME = Dummy.DUMMY_KEY_DATABASE_NAME;

Dummy.Utils = {
    /**
     * @param {IDBDatabase} db
     * @param {string} objectStoreName
     * @param {object} entry
     * @returns {Promise<void>}
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
            KeyStore.instance.putPlain(Dummy.keyRecords[0]),
            KeyStore.instance.putPlain(Dummy.keyRecords[1]),
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
