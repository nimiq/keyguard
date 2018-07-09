/**
 * DEPRECATED
 * This class is only used for retrieving keys and accounts from the old KeyStore.
 *
 * Usage:
 * <script src="lib/account-store-indexeddb.js"></script>
 *
 * const accountStore = AccountStore.instance;
 * const accounts = await accountStore.list();
 * accountStore.drop();
 */

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
        this._dropped = false;
        /** @type {IDBDatabase | null} */
        this._db = null;
    }

    /**
     * @returns {Promise.<IDBDatabase>}
     * @private
     */
    async connect() {
        if (this._db) return Promise.resolve(this._db);

        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this._dbName, AccountStore.VERSION);

            request.onsuccess = () => {
                this._db = request.result;
                resolve(this._db);
            };

            request.onerror = () => reject(request.error);
            request.onupgradeneeded = () => {
                this._dropped = true;
                reject(new Error('Account database does not exist'));
            };
        });
    }

    /**
     * @returns {Promise.<Array.<AccountInfo>>}
     */
    async list() {
        const db = await this.connect();
        return new Promise((resolve, reject) => {
            const results = /** @type {AccountInfo[]} */ ([]);
            const openCursorRequest = db.transaction([AccountStore.ACCOUNT_DATABASE], 'readonly')
                .objectStore(AccountStore.ACCOUNT_DATABASE)
                .openCursor();
            openCursorRequest.onsuccess = () => {
                const cursor = openCursorRequest.result;
                if (cursor) {
                    const key = cursor.value;

                    // Because: To use Key.getPublicInfo(), we would need to create Key
                    // instances out of the key object that we receive from the DB.
                    const accountInfo = {
                        userFriendlyAddress: key.userFriendlyAddress,
                        type: key.type,
                        label: key.label,
                    };

                    results.push(accountInfo);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            openCursorRequest.onerror = () => reject(openCursorRequest.error);
        });
    }

    /**
     * @returns {Promise.<Array.<AccountEntry>>}
     * @deprecated Only for database migration
     *
     * @description Returns the encrypted keypairs!
     */
    async dangerousListPlain() {
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
                    results.push(key);
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

    async drop() {
        if (this._dropped) return true;
        if (this._db) this.close();

        return new Promise((resolve, reject) => {
            const request = window.indexedDB.deleteDatabase(this._dbName);

            request.onsuccess = () => {
                this._dropped = true;
                this._db = null;
                resolve(true);
            };

            request.onerror = () => reject(request.error);
        });
    }
}

AccountStore.VERSION = 2;
AccountStore.ACCOUNT_DATABASE = 'accounts';
