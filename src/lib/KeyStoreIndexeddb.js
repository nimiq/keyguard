/**
 * Usage:
 * <script src="lib/key.js"></script>
 * <script src="lib/key-store-indexeddb.js"></script>
 *
 * const keyStore = KeyStore.instance;
 * const accounts = await keyStore.list();
 */
class KeyStore {
    static get instance() {
        /** @type {KeyStore} */
        this._instance = this._instance || new KeyStore();
        return this._instance;
    }

    /**
     * @returns {Promise.<IDBDatabase>}
     * @private
     */
    async connect() {
        if (this._db) return Promise.resolve(this._db);

        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open(KeyStore.DB_NAME, KeyStore.DB_VERSION);

            request.onsuccess = () => {
                /** @type {IDBDatabase | null} */
                this._db = request.result;
                resolve(this._db);
            };

            request.onerror = () => reject(request.error);

            request.onupgradeneeded = event => {
                /** @type {IDBDatabase} */
                const db = request.result;

                if (event.oldVersion < 1) {
                    // Version 1 is the first version of the database.
                    const store = db.createObjectStore(KeyStore.DB_KEY_STORE_NAME, { keyPath: 'userFriendlyAddress' });
                    store.createIndex('by_type', 'type');
                }

                // if (event.oldVersion < 2) {
                //     // Version 2 ...
                // }
            };
        });
    }

    /**
     * @param {string} userFriendlyAddress
     * @param {Uint8Array | string} passphrase
     * @returns {Promise.<Key>}
     */
    async get(userFriendlyAddress, passphrase) {
        const key = await this._getPlain(userFriendlyAddress);
        return Key.loadEncrypted(key.encryptedKeyPair, passphrase, key.type);
    }

    /**
     * @param {string} userFriendlyAddress
     * @returns {Promise.<EncryptionType>}
     */
    async getType(userFriendlyAddress) {
        const key = await this._getPlain(userFriendlyAddress);
        return key.type;
    }

    /**
     * @param {string} userFriendlyAddress
     * @returns {Promise.<KeyEntry>}
     */
    async _getPlain(userFriendlyAddress) {
        userFriendlyAddress = this._formatAddress(userFriendlyAddress);

        const db = await this.connect();
        return new Promise((resolve, reject) => {
            const getTx = db.transaction([KeyStore.DB_KEY_STORE_NAME])
                .objectStore(KeyStore.DB_KEY_STORE_NAME)
                .get(userFriendlyAddress);
            getTx.onsuccess = () => {
                resolve(getTx.result);
            };
            getTx.onerror = reject;
        });
    }

    /**
     * @param {Key} key
     * @param {Uint8Array | string} passphrase
     * @param {Uint8Array | string} [unlockKey]
     * @returns {Promise}
     */
    async put(key, passphrase, unlockKey) {
        const encryptedKeyPair = await key.exportEncrypted(passphrase, unlockKey);

        const keyEntry = {
            encryptedKeyPair,
            userFriendlyAddress: key.userFriendlyAddress,
            type: key.type,
        };

        return this._putPlain(keyEntry);
    }

    /**
     * @param {KeyEntry} keyEntry
     * @returns {Promise<any>}
     * @deprecated Only for database migration
     */
    putPlain(keyEntry) {
        return this._putPlain(keyEntry);
    }

    /**
     * @param {KeyEntry} keyEntry
     * @returns {Promise<any>}
     */
    async _putPlain(keyEntry) {
        keyEntry.userFriendlyAddress = this._formatAddress(keyEntry.userFriendlyAddress);

        const db = await this.connect();
        return new Promise((resolve, reject) => {
            const putTx = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
                .objectStore(KeyStore.DB_KEY_STORE_NAME)
                .put(keyEntry);
            putTx.onsuccess = () => resolve(putTx.result);
            putTx.onerror = reject;
        });
    }

    /**
     * @param {string} userFriendlyAddress
     * @returns {Promise}
     */
    async remove(userFriendlyAddress) {
        userFriendlyAddress = this._formatAddress(userFriendlyAddress);

        const db = await this.connect();
        return new Promise((resolve, reject) => {
            const deleteTx = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
                .objectStore(KeyStore.DB_KEY_STORE_NAME)
                .delete(userFriendlyAddress);
            deleteTx.onsuccess = () => resolve(deleteTx.result);
            deleteTx.onerror = reject;
        });
    }

    /**
     * @returns {Promise<KeyInfo[]>}
     */
    async list() {
        const db = await this.connect();
        return new Promise((resolve, reject) => {
            const results = /** @type {KeyInfo[]} */ ([]);
            const openCursorRequest = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readonly')
                .objectStore(KeyStore.DB_KEY_STORE_NAME)
                .openCursor();
            openCursorRequest.onsuccess = () => {
                const cursor = openCursorRequest.result;
                if (cursor) {
                    const key = cursor.value;

                    // Because: To use Key.getPublicInfo(), we would need to create Key
                    // instances out of the key object that we receive from the DB.
                    /** @type {KeyInfo} */
                    const keyInfo = {
                        userFriendlyAddress: key.userFriendlyAddress,
                        type: key.type,
                    };

                    results.push(keyInfo);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            openCursorRequest.onerror = () => reject(openCursorRequest.error);
        });
    }

    close() {
        if (!this._db) return;
        this._db.close();
        this._db = null;
    }

    /**
     * @param {string} userFriendlyAddress
     */
    _formatAddress(userFriendlyAddress) {
        if (!AddressUtils.isValidAddress(userFriendlyAddress)) throw new InvalidAddressError();
        return AddressUtils.formatAddress(userFriendlyAddress);
    }

    /**
     * To migrate from the 'account' database and store (AccountStore) to this new
     * 'nimiq-keyguard' database with the 'keys' store, this function is called by
     * the account manager (via IFrameApi.migrateAccountstoKeys()) after it successfully
     * stored the existing account labels. Both the 'accounts' database and cookie are
     * deleted afterwards.
     *
     * @deprecated Only for database migration
     */
    async doMigrateAccountsToKeys() {
        const accountStore = AccountStore.instance;

        const keys = await accountStore.dangerousListPlain();

        keys.forEach(async key => {
            const keyEntry = {
                encryptedKeyPair: key.encryptedKeyPair,
                userFriendlyAddress: key.userFriendlyAddress,
                // Translate between old text type and new number type
                type: /** @type {EncryptionType} */ (key.type === 'high' ? EncryptionType.HIGH : EncryptionType.LOW),
            };
            await this.putPlain(keyEntry);
        });

        // FIXME Uncomment after/for testing
        // await accountStore.drop();

        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Delete migrate cookie
            document.cookie = 'migrate=0;expires=0';

            // Delete accounts cookie
            document.cookie = 'accounts=;expires=0';
        }

        return true;
    }
}

KeyStore.DB_VERSION = 1;
KeyStore.DB_NAME = 'nimiq-keyguard';
KeyStore.DB_KEY_STORE_NAME = 'keys';
