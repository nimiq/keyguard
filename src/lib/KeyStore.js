/* global Nimiq */
/* global Key */
/* global KeyInfo */
/* global AccountStore */
/* global BrowserDetection */
/* global Errors */

/**
 * Usage:
 * <script src="lib/key.js"></script>
 * <script src="lib/key-store-indexeddb.js"></script>
 *
 * const keyStore = KeyStore.instance;
 * const accounts = await keyStore.list();
 */
class KeyStore {
    /** @type {KeyStore} */
    static get instance() {
        KeyStore._instance = KeyStore._instance || new KeyStore();
        return KeyStore._instance;
    }

    /**
     * @param {KeyRecord} keyRecord
     * @returns {boolean}
     */
    static isEncrypted(keyRecord) {
        // Because we are supporting legacy secrets which cannot be converted during migration,
        // a KeyRecord can be both V2 (legacy) and V3 (Imagewallet, default) encrypted.
        return keyRecord.secret.byteLength === KeyStore.ENCRYPTED_SECRET_SIZE_V2
            || keyRecord.secret.byteLength === KeyStore.ENCRYPTED_SECRET_SIZE;
    }

    constructor() {
        /** @type {Promise<IDBDatabase>?} */
        this._dbPromise = null;
    }

    /**
     * @returns {Promise<IDBDatabase>}
     * @private
     */
    async connect() {
        if (this._dbPromise) return this._dbPromise;

        this._dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(KeyStore.DB_NAME, KeyStore.DB_VERSION);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            request.onupgradeneeded = event => {
                /** @type {IDBDatabase} */
                const db = request.result;

                if (event.oldVersion < 1) {
                    // Version 1 is the first version of the database.
                    db.createObjectStore(KeyStore.DB_KEY_STORE_NAME, { keyPath: 'id' });
                }

                if (event.oldVersion < 2) {
                    // Version 2 changes the key id calculation, thus we drop and recreate the whole database.
                    // (Version 1 was only in use in testnet)
                    db.deleteObjectStore(KeyStore.DB_KEY_STORE_NAME);
                    db.createObjectStore(KeyStore.DB_KEY_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                }

                if (event.oldVersion < 3) {
                    // Version 3 changes the key id calculation, thus we drop and recreate the whole database.
                    // (Version 2 was only in use in testnet)
                    db.deleteObjectStore(KeyStore.DB_KEY_STORE_NAME);
                    db.createObjectStore(KeyStore.DB_KEY_STORE_NAME, { keyPath: 'id' });
                }
            };
        });

        return this._dbPromise;
    }

    /**
     * @param {string} id
     * @param {Uint8Array} [password]
     * @returns {Promise<Key?>}
     */
    async get(id, password) {
        const keyRecord = await this._get(id);
        if (!keyRecord) {
            return null;
        }

        if (!KeyStore.isEncrypted(keyRecord)) {
            // Compare stored type with purposeID to make sure there was no storage error.
            const purposeId = new Nimiq.SerialBuffer(keyRecord.secret).readUint32();
            const expectedPurposeId = keyRecord.type === Nimiq.Secret.Type.PRIVATE_KEY
                ? Nimiq.PrivateKey.PURPOSE_ID
                : Nimiq.Entropy.PURPOSE_ID;
            if (purposeId !== expectedPurposeId) {
                throw new Errors.KeyguardError('Stored type does not match secret\'s purposeId');
            }

            const secret = keyRecord.type === Nimiq.Secret.Type.PRIVATE_KEY
                ? new Nimiq.PrivateKey(keyRecord.secret.subarray(4)) // The first 4 bytes are the purposeId
                : new Nimiq.Entropy(keyRecord.secret.subarray(4));

            return new Key(secret, keyRecord.hasPin);
        }

        if (!password) {
            throw new Error('Password required');
        }

        const secret = await Nimiq.Secret.fromEncrypted(new Nimiq.SerialBuffer(keyRecord.secret), password);
        return new Key(secret, keyRecord.hasPin);
    }

    /**
     * @param {string} id
     * @returns {Promise<KeyInfo?>}
     */
    async getInfo(id) {
        const keyRecord = await this._get(id);
        return keyRecord
            ? KeyInfo.fromObject(keyRecord, KeyStore.isEncrypted(keyRecord), keyRecord.defaultAddress)
            : null;
    }

    /**
     * @param {string} id
     * @returns {Promise<KeyRecord?>}
     * @private
     */
    async _get(id) {
        const db = await this.connect();
        const transaction = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readonly');
        const request = transaction.objectStore(KeyStore.DB_KEY_STORE_NAME).get(id);
        return KeyStore._requestToPromise(request, transaction);
    }

    /**
     * @param {Key} key
     * @param {Uint8Array} [password]
     * @returns {Promise<string>}
     */
    async put(key, password) {
        /** @type {Nimiq.SerialBuffer} */
        let buffer;
        if (password) {
            buffer = await key.secret.exportEncrypted(password);
        } else {
            buffer = new Nimiq.SerialBuffer(KeyStore.UNENCRYPTED_SECRET_SIZE);

            // When storing the secret unencrypted, we prepend the
            // purposeID to the secret as a safety redundancy.
            const purposeId = key.secret instanceof Nimiq.PrivateKey
                ? Nimiq.PrivateKey.PURPOSE_ID
                : Nimiq.Entropy.PURPOSE_ID;

            buffer.writeUint32(purposeId);
            key.secret.serialize(buffer);
        }

        const keyRecord = /** @type {KeyRecord} */ {
            id: key.id,
            type: key.type,
            hasPin: key.hasPin,
            secret: buffer.subarray(0, buffer.byteLength),
            defaultAddress: key.defaultAddress.serialize(),
        };

        return this.putPlain(keyRecord);
    }

    /**
     * @param {KeyRecord} keyRecord
     * @returns {Promise<string>}
     */
    async putPlain(keyRecord) {
        if (keyRecord.secret.byteLength !== KeyStore.ENCRYPTED_SECRET_SIZE
            && keyRecord.secret.byteLength !== KeyStore.ENCRYPTED_SECRET_SIZE_V2 // Required for migration
            && keyRecord.secret.byteLength !== KeyStore.UNENCRYPTED_SECRET_SIZE) {
            throw new Errors.KeyguardError('KeyRecord.secret has invalid length');
        }
        const db = await this.connect();
        const transaction = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite');
        const request = transaction.objectStore(KeyStore.DB_KEY_STORE_NAME).put(keyRecord);

        const dbKey = await KeyStore._requestToPromise(request, transaction);

        /** @type {string} */
        const newId = (dbKey.valueOf());

        return newId;
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async remove(id) {
        const db = await this.connect();
        const transaction = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite');
        const request = transaction.objectStore(KeyStore.DB_KEY_STORE_NAME).delete(id);
        return KeyStore._requestToPromise(request, transaction);
    }

    /**
     * @returns {Promise<KeyInfo[]>}
     */
    async list() {
        const results = await this._listRecords();
        return results.map(
            keyRecord => KeyInfo.fromObject(keyRecord, KeyStore.isEncrypted(keyRecord), keyRecord.defaultAddress),
        );
    }

    /**
     * @returns {Promise<void>}
     */
    async close() {
        if (!this._dbPromise) return;
        // If failed to open database (i.e. _dbPromise rejects) we don't need to close the db
        const db = await this._dbPromise.catch(() => null);
        this._dbPromise = null;
        if (db) db.close();
    }

    /**
     * To migrate from the 'account' database and store (AccountStore) to this new
     * 'nimiq-keyguard' database with the 'keys' store, this function is called by
     * the account manager (via IFrameApi.migrateAccountstoKeys()) after it successfully
     * stored the existing account labels. Both the 'accounts' database and cookie are
     * deleted afterwards.
     *
     * @returns {Promise<void>}
     * @deprecated Only for database migration
     */
    async migrateAccountsToKeys() {
        const accounts = await AccountStore.instance.dangerousListPlain();
        const keysRecords = KeyStore.accountRecords2KeyRecords(accounts);
        await Promise.all(keysRecords.map(keyRecord => this.putPlain(keyRecord)));

        await AccountStore.instance.drop();

        if (BrowserDetection.isIOS() || BrowserDetection.isSafari()) {
            // Delete migrate cookie
            document.cookie = 'migrate=0; expires=Thu, 01 Jan 1970 00:00:01 GMT';

            // Delete accounts cookie
            document.cookie = 'accounts=; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        }
    }

    /**
     * @param {AccountRecord[]} accounts
     * @returns {KeyRecord[]}
     */
    static accountRecords2KeyRecords(accounts) {
        return accounts.map(account => {
            const address = Nimiq.Address.fromUserFriendlyAddress(account.userFriendlyAddress);
            const legacyKeyHash = Key.deriveHash(address.serialize());

            return {
                id: legacyKeyHash,
                type: Nimiq.Secret.Type.PRIVATE_KEY,
                hasPin: account.type === 'low',
                secret: account.encryptedKeyPair,
                defaultAddress: address.serialize(),
            };
        });
    }

    /**
     * @param {AccountInfo[]} accounts
     * @returns {KeyguardRequest.LegacyKeyInfoObject[]}
     */
    static accountInfos2KeyInfos(accounts) {
        return accounts.map(account => {
            const address = Nimiq.Address.fromUserFriendlyAddress(account.userFriendlyAddress);
            const legacyKeyHash = Key.deriveHash(address.serialize());

            /** @type {KeyguardRequest.LegacyKeyInfoObject} */
            const legacyKeyObject = {
                id: legacyKeyHash,
                type: Nimiq.Secret.Type.PRIVATE_KEY,
                hasPin: account.type === 'low',
                legacyAccount: {
                    label: account.label,
                    address: address.serialize(),
                },
            };

            return legacyKeyObject;
        });
    }

    /**
     * @returns {Promise<KeyRecord[]>}
     */
    async _listRecords() {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readonly')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .openCursor();

        return KeyStore._readAllFromCursor(request);
    }

    /**
     * @param {IDBRequest} request
     * @param {IDBTransaction} transaction
     * @returns {Promise<any>}
     * @private
     */
    static async _requestToPromise(request, transaction) {
        const done = await Promise.all([
            new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            }),
            new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onabort = () => reject(transaction.error);
                transaction.onerror = () => reject(transaction.error);
            }),
        ]);

        // In case of rejection of any one of the above promises,
        // the 'await' keyword makes sure that the error is thrown
        // and this async function is itself rejected.

        // Promise.all returns an array of resolved promises, but we are only
        // interested in the request.result, which is the first item.
        return done[0];
    }

    /**
     * @param {IDBRequest} request
     * @returns {Promise<KeyRecord[]>}
     * @private
     */
    static _readAllFromCursor(request) {
        return new Promise((resolve, reject) => {
            /** @type {KeyRecord[]} */
            const results = [];
            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }
}
/** @type {KeyStore?} */
KeyStore._instance = null;

KeyStore.DB_VERSION = 3;
KeyStore.DB_NAME = 'nimiq-keyguard';
KeyStore.DB_KEY_STORE_NAME = 'keys';

// The current default (V3/Imagewallet format)
KeyStore.ENCRYPTED_SECRET_SIZE = 56; /* version + rounds: 2, salt: 16, checksum: 2, purposeId: 4, secret: 32 */

// 'Legacy' format, used by migrated keys
KeyStore.ENCRYPTED_SECRET_SIZE_V2 = 54; /* version + rounds: 2, secret: 32, salt: 16, checksum: 4 */

// Default unencrypted format (legacy keys could not be stored unencrypted)
KeyStore.UNENCRYPTED_SECRET_SIZE = /* purposeId */ 4 + /* secret */ 32;
