/* global loadNimiq */
/* global AccountStore */
/* global Key */
/* global KeyInfo */
/* global KeyStore */

beforeAll(async () => {
    Nimiq._path = `${window.location.origin}/base/node_modules/@nimiq/core-web/`;
    await loadNimiq();
});

/* To generate HEX arrays, you can use [...].map(n => '0x' + n.toString(16)) from a decimal array, and then remove the quotes. */

const keys = [
    // eslint-disable-next-line max-len
    Uint8Array.from([ 0x50, 0x07, 0xdf, 0x4a, 0xb4, 0x57, 0x2d, 0x5c, 0x3a, 0x30, 0xbf, 0x71, 0x2b, 0xd6, 0x22, 0x37, 0x2e, 0x7a, 0x48, 0x0b, 0x6b, 0x08, 0x41, 0xf1, 0x73, 0x5c, 0x82, 0xaf, 0xf1, 0xb9, 0xa9, 0xb7 ]),
    // eslint-disable-next-line max-len
    Uint8Array.from([ 0x68, 0x2d, 0xf0, 0x35, 0xc3, 0x0e, 0x8c, 0x55, 0xbd, 0xa4, 0xab, 0x51, 0x72, 0x13, 0x79, 0x2c, 0x2a, 0xf4, 0xb4, 0xe9, 0xc2, 0x3a, 0xc2, 0xcf, 0x11, 0xbd, 0x28, 0xb2, 0x37, 0xa6, 0x54, 0x4e ]),
];

const secrets = [
    new Nimiq.Entropy(keys[0]),
    new Nimiq.PrivateKey(keys[1]),
];

const encryptedKeys = [
    // eslint-disable-next-line max-len
    Uint8Array.from([ 0x03, 0x08, 0x38, 0x8f, 0x65, 0x9f, 0x23, 0xfb, 0x80, 0x13, 0xd5, 0xef, 0x86, 0xdc, 0x4d, 0xdc, 0xd7, 0x13, 0xf4, 0x00, 0x34, 0x90, 0xe4, 0xc7, 0x9e, 0x78, 0x84, 0xa5, 0x5e, 0x21, 0x3a, 0xdb, 0x6a, 0xe1, 0x94, 0x48, 0xbd, 0x93, 0xed, 0xd1, 0x2b, 0xfd, 0x0e, 0x1f, 0x34, 0xd5, 0x4b, 0x38, 0x17, 0x4b, 0x8b, 0xf2, 0xd7, 0x4e, 0x1c, 0x10 ]),
    // eslint-disable-next-line max-len
    Uint8Array.from([ 0x03, 0x08, 0x44, 0x88, 0xd9, 0xbd, 0x82, 0xf8, 0x7b, 0x88, 0x69, 0xc4, 0xde, 0x03, 0x19, 0xe2, 0xc3, 0x95, 0xd3, 0x7d, 0x57, 0x17, 0x5a, 0x34, 0x48, 0xd2, 0x4c, 0x0d, 0xa5, 0x3d, 0xe8, 0xb4, 0x1a, 0x41, 0x13, 0xa2, 0xdc, 0xae, 0x54, 0x03, 0x0d, 0xce, 0xaf, 0x2a, 0x59, 0x10, 0xf1, 0x71, 0x7b, 0x0b, 0x2a, 0x90, 0x05, 0x6f, 0xb3, 0x46 ]),
];

/** @type {string[]} */
let __hashes = [];
const hashes = () => {
    return __hashes.length ? __hashes : (__hashes = secrets.map(secret => {
        const input = secret instanceof Nimiq.Entropy
            ? secret.serialize()
            : Nimiq.PublicKey.derive(secret).toAddress().serialize();

        return Nimiq.Hash.blake2b(input).toBase64();
    }));
};

const encryptionPassword = 'password';
const encryptionPassword2 = 'password2';

const keyInfos = () => [
    new KeyInfo(
        hashes()[0],
        Nimiq.Secret.Type.ENTROPY,
        false,
        false,
        new Uint8Array(new Nimiq.Entropy(keys[0]).toExtendedPrivateKey().derivePath(Constants.DEFAULT_DERIVATION_PATH).toAddress().serialize()),
    ),
    new KeyInfo(
        hashes()[1],
        Nimiq.Secret.Type.PRIVATE_KEY,
        true,
        false,
        new Uint8Array(Nimiq.PublicKey.derive(new Nimiq.PrivateKey(keys[1])).toAddress().serialize()),
    ),
];

const cookieKeyInfos = () => keyInfos().map(x => new KeyInfo(x.id, x.type, true, x.hasPin, new Uint8Array(20)));

const keyInfoObjects = () => keyInfos().map(x => ({
    id: x.id,
    type: x.type,
    hasPin: x.hasPin,
}));

const _purposeIdBuf = new Nimiq.SerialBuffer(4);
_purposeIdBuf.writeUint32(Nimiq.Entropy.PURPOSE_ID);
const _purposeIdArray = Array.from(_purposeIdBuf);

/** @type {() => KeyRecord[]} */
const keyRecords = () => [
    {
        id: hashes()[0],
        type: keyInfoObjects()[0].type,
        hasPin: keyInfoObjects()[0].hasPin,
        secret: new Uint8Array(_purposeIdArray.concat(Array.from(keys[0]))),
        defaultAddress: new Uint8Array(keyInfos()[0].defaultAddress.serialize()),
    },
    {
        id: hashes()[1],
        type: keyInfoObjects()[1].type,
        hasPin: keyInfoObjects()[1].hasPin,
        secret: encryptedKeys[1],
        defaultAddress: new Uint8Array(keyInfos()[1].defaultAddress.serialize()),
    },
];

const deprecatedAccountInfos = [
    {
        userFriendlyAddress: 'NQ71 CT4K 7R9R EHSB 7HY9 TSTP XNRQ L2RK 8U4U',
        type: 'high',
        label: 'Dummy account 1',
    },
];

const deprecatedAccountCookies = [
    {
        address: 'NQ71 CT4K 7R9R EHSB 7HY9 TSTP XNRQ L2RK 8U4U',
        type: 'high',
        label: 'Dummy account 1',
    },
];

const deprecatedAccountRecords = [
    Object.assign({}, deprecatedAccountInfos[0], { encryptedKeyPair: encryptedKeys[1] }),
];

const deprecatedAccount2KeyInfoObjects = () => [{
    id: hashes()[1],
    type: Nimiq.Secret.Type.PRIVATE_KEY,
    hasPin: false,
    legacyAccount: {
        label: deprecatedAccountInfos[0].label,
        address: Nimiq.Address.fromUserFriendlyAddress(deprecatedAccountInfos[0].userFriendlyAddress).serialize(),
    },
}];

const deprecatedAccount2KeyInfos = () => [
    KeyInfo.fromObject(
        deprecatedAccount2KeyInfoObjects()[0],
        true,
        deprecatedAccount2KeyInfoObjects()[0].legacyAccount.address,
    ),
];

const deprecatedAccount2Keys = () => [
    new Key(secrets[1], false)
];

const keyInfoCookieEncoded = '2071U/NKd5KzeimvyflGLYku6JfI9Mms2wGxWoCLmx9+0=,10LsYVUikGJA5z8p37+LqkH3EZ5opDz2zQRT1r8cGJ8dE=';

/** @type {string} */
const cookie = `k=${keyInfoCookieEncoded};accounts=${JSON.stringify(deprecatedAccountCookies)};some=thing;`;

const DUMMY_ACCOUNT_DATABASE_NAME = 'keyguard-dummy-account-database';
const DUMMY_KEY_DATABASE_NAME = 'keyguard-dummy-key-database';
AccountStore.ACCOUNT_DATABASE = DUMMY_ACCOUNT_DATABASE_NAME;
KeyStore.DB_NAME = DUMMY_KEY_DATABASE_NAME;

const Utils = {
    /**
     * @param {IDBDatabase} db
     * @param {string} objectStoreName
     * @param {object} entry
     * @returns {Promise<any>}
     */
    addEntryToDatabase: (db, objectStoreName, entry) => new Promise((resolve, reject) => {
        const request = db.transaction([objectStoreName], 'readwrite')
            .objectStore(objectStoreName)
            .put(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    }),

    /** @returns {Promise<void>} */
    createDummyAccountStore: async () => {
        // create database
        const db = await new Promise((resolve, reject) => {
            const request = window.indexedDB.open(DUMMY_ACCOUNT_DATABASE_NAME, AccountStore.VERSION);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            request.onupgradeneeded = () => {
                const _db = request.result;
                _db.createObjectStore(AccountStore.ACCOUNT_DATABASE, { keyPath: 'userFriendlyAddress' });
            };
        });

        // fill database
        await Utils.addEntryToDatabase(db, AccountStore.ACCOUNT_DATABASE, deprecatedAccountRecords[0]);

        db.close();
    },

    /** @returns {Promise<void>} */
    createDummyKeyStore: async () => {
        // The key store can be created and filled by its api
        await KeyStore.instance.connect();
        await Promise.all([
            KeyStore.instance.putPlain(keyRecords()[0]),
            KeyStore.instance.putPlain(keyRecords()[1]),
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
            request.onerror = () => { reject() };
            request.onsuccess = () => { resolve() };
            request.onblocked = () => {
                // wait for open connections to get closed
                setTimeout(() => reject(new Error('Can\'t delete database, there is still an open connection.')), 2000);
            };
        });
    },

    /** @returns {Promise<void>} */
    deleteDummyAccountStore: async () => {
        await AccountStore.instance.close();
        await Utils.deleteDatabase(DUMMY_ACCOUNT_DATABASE_NAME);
        delete AccountStore._instance;
    },

    /** @returns {Promise<void>} */
    deleteDummyKeyStore: async () => {
        await KeyStore.instance.close();
        await Utils.deleteDatabase(DUMMY_KEY_DATABASE_NAME);
        delete KeyStore._instance;
    },
};

const Dummy = {
    keys,
    secrets,
    Utils,
    encryptedKeys,
    hashes,
    keyInfos,
    cookieKeyInfos,
    keyRecords,
    keyInfoCookieEncoded,
    deprecatedAccountInfos,
    cookie,
    encryptionPassword,
    encryptionPassword2,
    keyInfoObjects,
    deprecatedAccount2KeyInfoObjects,
    deprecatedAccount2KeyInfos,
    deprecatedAccount2Keys,
    DUMMY_ACCOUNT_DATABASE_NAME,
    DUMMY_KEY_DATABASE_NAME,
    deprecatedAccountRecords,
};
