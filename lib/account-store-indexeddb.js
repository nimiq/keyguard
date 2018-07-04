class AccountStore {

    static get instance() {
        /** @type {AccountStore} */
        this._instance = this._instance || new AccountStore();
        return this._instance;
    }

    /**
     * @param {string} dbName
     * @constructor
     */
    constructor(dbName = 'accounts') {
        this._dbName = dbName;
        this._db = null;
        this._connected = false;
    }

    /**
     * @returns {Promise.<IDBDatabase>}
     * @private
     */
    connect() {
        if (this._connected) return Promise.resolve(this._db);

        return new Promise((resolve, reject) => {
            const request = self.indexedDB.open(this._dbName, AccountStore.VERSION);

            request.onsuccess = () => {
                this._connected = true;
                this._db = request.result;
                resolve(this._db);
            };

            request.onerror = () => reject(request.error);
            request.onupgradeneeded = () => {
                const db = request.result;
                db.createObjectStore(AccountStore.ACCOUNT_DATABASE, { keyPath: 'userFriendlyAddress' });
                // TODO: multiSigStore
            };
        });
    }

    /**
     * @param {string} userFriendlyAddress
     * @returns {Promise.<object>}
     */
    async getPlain(userFriendlyAddress) {
        const db = await this.connect();
        return new Promise((resolve, reject) => {
            const getTx = db.transaction([AccountStore.ACCOUNT_DATABASE])
                .objectStore(AccountStore.ACCOUNT_DATABASE)
                .get(userFriendlyAddress);
            getTx.onsuccess = () => {
                resolve(getTx.result);
            };
            getTx.onerror = reject;
        });
    }

    /**
     * @param {string} userFriendlyAddress
     * @param {Uint8Array|string} passphrase
     * @returns {Promise.<Key>}
     */
    async get(userFriendlyAddress, passphrase) {
        const key = await this.getPlain(userFriendlyAddress);
        const result = await Key.loadEncrypted(key.encryptedKeyPair, passphrase);
        result.type = key.type;
        result.label = key.label;

        return result;
    }

    /**
     * @param {Key} key
     * @param {Uint8Array|string} passphrase
     * @param {Uint8Array|string} [unlockKey]
     * @returns {Promise}
     */
    async put(key, passphrase, unlockKey) {
        /** @type {Uint8Array} */
        const encryptedKeyPair = await key.exportEncrypted(passphrase, unlockKey);

        const keyInfo = {
            encryptedKeyPair: encryptedKeyPair,
            userFriendlyAddress: key.userFriendlyAddress,
            type: key.type,
            label: key.label
        };

        return await this.putPlain(keyInfo);
    }

    /**
     * @param {object} keyInfo
     */
    async putPlain(keyInfo) {
        const db = await this.connect();
        return new Promise((resolve, reject) => {
            const putTx = db.transaction([AccountStore.ACCOUNT_DATABASE], 'readwrite')
                .objectStore(AccountStore.ACCOUNT_DATABASE)
                .put(keyInfo);
            putTx.onsuccess = () => resolve(putTx.result);
            putTx.onerror = reject;
        });
    }

    /**
     * @param {string} userFriendlyAddress
     * @returns {Promise}
     */
    async remove(userFriendlyAddress) {
        const db = await this.connect();
        return new Promise((resolve, reject) => {
            const deleteTx = db.transaction([AccountStore.ACCOUNT_DATABASE], 'readwrite')
                .objectStore(AccountStore.ACCOUNT_DATABASE)
                .delete(userFriendlyAddress);
            deleteTx.onsuccess = () => resolve(deleteTx.result);
            deleteTx.onerror = reject;
        });
    }

    /**
     * @returns {Promise.<Array.<object>>}
     */
    async list() {
        const db = await this.connect();
        return new Promise((resolve, reject) => {
            const results = /** @type {any[]} */ ([]);
            const openCursorRequest = db.transaction([AccountStore.ACCOUNT_DATABASE], 'readonly')
                .objectStore(AccountStore.ACCOUNT_DATABASE)
                .openCursor();
            openCursorRequest.onsuccess = () => {
                const cursor = openCursorRequest.result;
                if (cursor) {
                    const key = cursor.value;

                    // Because: To use Key.getPublicInfo(), we would need to create Key instances out of the key object that we receive from the DB.
                    const keyInfo = {
                        address: key.userFriendlyAddress,
                        type: key.type,
                        label: key.label
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
        if (!this._connected) return;
        return this._db.close();
    }
}

AccountStore.VERSION = 2;
AccountStore.ACCOUNT_DATABASE = 'accounts';
AccountStore.MULTISIG_WALLET_DATABASE = 'multisig-wallets';
