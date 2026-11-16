/* global Nimiq */

/**
 * Persists, per Keyguard instance (i.e. per browser profile), a random device secret and a record of every MuSig2
 * signing session that was created (round 1) or used for signing (round 2) here, to prevent signing the same session
 * twice with differing inputs, which would leak the private key.
 *
 * The data is stored outside the KeyStore, as it is not removed when keys are removed (logout): the records need to
 * outlive a logout and a re-login.
 *
 * A signing session without a record is never silently signed:
 * - If it was created by another device, or if the stored data got lost entirely, for example because site data got
 *   cleared, which also changes the device IDs, the user has to confirm a warning.
 * - If it was created by this device, the stored data is incomplete, for example because it was restored from a backup.
 *   As this device can then not know whether it already signed the session, it is refused.
 */
class MultisigSessionStore {
    /** @type {MultisigSessionStore} */
    static get instance() {
        MultisigSessionStore._instance = MultisigSessionStore._instance || new MultisigSessionStore();
        return MultisigSessionStore._instance;
    }

    /**
     * Decides how to handle a signing request for a verified signing state.
     *
     * @param {{
     *     isOwnDevice: boolean,
     *     record: MultisigSessionStore.SessionRecord | null,
     *     inputsHash: Uint8Array,
     * }} params
     * @returns {MultisigSessionStore.Decision}
     */
    static decide({ isOwnDevice, record, inputsHash }) {
        if (record && record.inputsHash) {
            // Re-signing identical inputs reproduces the identical partial signature, and is therefore harmless.
            return MultisigSessionStore._equals(record.inputsHash, inputsHash)
                ? MultisigSessionStore.Decision.SIGN
                : MultisigSessionStore.Decision.REFUSE;
        }
        // The session was recorded in round 1, and has not been used since.
        if (record) return MultisigSessionStore.Decision.SIGN;

        return isOwnDevice
            ? MultisigSessionStore.Decision.REFUSE_UNKNOWN
            : MultisigSessionStore.Decision.CONFIRM;
    }

    /**
     * @param {string} [dbName]
     */
    constructor(dbName = MultisigSessionStore.DB_NAME) {
        this._dbName = dbName;
        /** @type {Promise<IDBDatabase>?} */
        this._dbPromise = null;
    }

    /**
     * Returns the ID of this Keyguard instance for the given signer. The ID is specific to the signer, such that the
     * signing states of different signers, which are handed to the caller, can not be linked to the same device.
     *
     * @param {Nimiq.PublicKey} signerPublicKey
     * @returns {Promise<Uint8Array>}
     */
    async getDeviceId(signerPublicKey) {
        const deviceSecret = await this._getDeviceSecret();
        return Nimiq.CryptoUtils.computeHmacSha512(deviceSecret, signerPublicKey.serialize())
            .slice(0, MultisigSessionStore.DEVICE_ID_SIZE);
    }

    /**
     * Records a new signing session, which has not been used for signing yet. Must be called before the signing state
     * is handed to the caller in round 1.
     *
     * @param {Uint8Array} stateHash
     * @param {number} expiresAt - Expiry of the signing state
     * @returns {Promise<void>}
     */
    async register(stateHash, expiresAt) {
        const db = await this._connect();
        return new Promise((resolve, reject) => {
            const transaction = MultisigSessionStore._writeTransaction(db, MultisigSessionStore.SESSION_STORE);
            /** @type {MultisigSessionStore.SessionRecord} */
            const record = {
                stateHash: MultisigSessionStore._toHex(stateHash),
                inputsHash: null,
                usedAt: null,
                pruneAfter: expiresAt + MultisigSessionStore.PRUNE_GRACE_PERIOD,
            };
            // Fails for an existing record, such that a used session can never be reset to unused.
            transaction.objectStore(MultisigSessionStore.SESSION_STORE).add(record);
            transaction.oncomplete = () => resolve();
            // A failed request aborts its transaction, and only an aborted transaction has its error set.
            transaction.onabort = () => reject(transaction.error);
        });
    }

    /**
     * @param {Uint8Array} stateHash
     * @returns {Promise<MultisigSessionStore.SessionRecord | null>}
     */
    async getRecord(stateHash) {
        const db = await this._connect();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([MultisigSessionStore.SESSION_STORE], 'readonly');
            const getRequest = transaction.objectStore(MultisigSessionStore.SESSION_STORE)
                .get(MultisigSessionStore._toHex(stateHash));
            getRequest.onsuccess = () => resolve(getRequest.result || null);
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Atomically records the use of a signing state with the given inputs, unless it has already been used. Must be
     * called, and must have returned `true`, before a signature leaves the Keyguard.
     *
     * @param {Uint8Array} stateHash
     * @param {Uint8Array} inputsHash
     * @param {number} expiresAt - Expiry of the signing state
     * @returns {Promise<boolean>} Whether signing is allowed, i.e. whether the state has not been used before, or has
     *     been used with identical inputs.
     */
    async claim(stateHash, inputsHash, expiresAt) {
        const db = await this._connect();
        return new Promise((resolve, reject) => {
            const transaction = MultisigSessionStore._writeTransaction(db, MultisigSessionStore.SESSION_STORE);
            const store = transaction.objectStore(MultisigSessionStore.SESSION_STORE);
            const key = MultisigSessionStore._toHex(stateHash);
            let allowed = false;
            const getRequest = store.get(key);
            getRequest.onsuccess = () => {
                const existing = /** @type {MultisigSessionStore.SessionRecord | undefined} */ (getRequest.result);
                if (existing && existing.inputsHash) {
                    allowed = MultisigSessionStore._equals(existing.inputsHash, inputsHash);
                    return;
                }
                /** @type {MultisigSessionStore.SessionRecord} */
                const record = {
                    stateHash: key,
                    inputsHash,
                    usedAt: Date.now(),
                    pruneAfter: expiresAt + MultisigSessionStore.PRUNE_GRACE_PERIOD,
                };
                store.put(record);
                allowed = true;
            };
            transaction.oncomplete = () => resolve(allowed);
            transaction.onabort = () => reject(transaction.error);
        });
    }

    /**
     * Removes records of signing states which are expired, and thus can not be used for signing anymore anyway. A grace
     * period after expiry protects against clocks moving backwards.
     *
     * @param {number} [now]
     * @returns {Promise<void>}
     */
    async prune(now = Date.now()) {
        const db = await this._connect();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([MultisigSessionStore.SESSION_STORE], 'readwrite');
            const index = transaction.objectStore(MultisigSessionStore.SESSION_STORE).index('pruneAfter');
            const cursorRequest = index.openCursor(IDBKeyRange.upperBound(now, true));
            cursorRequest.onsuccess = () => {
                const cursor = cursorRequest.result;
                if (!cursor) return;
                cursor.delete();
                cursor.continue();
            };
            transaction.oncomplete = () => resolve();
            transaction.onabort = () => reject(transaction.error);
        });
    }

    /**
     * @returns {Promise<void>}
     */
    async close() {
        if (!this._dbPromise) return;
        const db = await this._dbPromise.catch(() => null);
        this._dbPromise = null;
        if (db) db.close();
    }

    /**
     * Returns the secret from which the device IDs are derived, creating it on first use. It never leaves the Keyguard.
     *
     * @private
     * @returns {Promise<Uint8Array>}
     */
    async _getDeviceSecret() {
        const db = await this._connect();
        return new Promise((resolve, reject) => {
            const transaction = MultisigSessionStore._writeTransaction(db, MultisigSessionStore.META_STORE);
            const store = transaction.objectStore(MultisigSessionStore.META_STORE);
            /** @type {Uint8Array} */
            let deviceSecret;
            const getRequest = store.get(MultisigSessionStore.DEVICE_SECRET_KEY);
            getRequest.onsuccess = () => {
                const record = /** @type {{ value: Uint8Array } | undefined} */ (getRequest.result);
                if (record && record.value instanceof Uint8Array
                    && record.value.length === MultisigSessionStore.DEVICE_SECRET_SIZE) {
                    deviceSecret = record.value;
                    return;
                }
                deviceSecret = window.crypto.getRandomValues(new Uint8Array(MultisigSessionStore.DEVICE_SECRET_SIZE));
                store.put({ key: MultisigSessionStore.DEVICE_SECRET_KEY, value: deviceSecret });
            };
            transaction.oncomplete = () => resolve(deviceSecret);
            transaction.onabort = () => reject(transaction.error);
        });
    }

    /**
     * @private
     * @returns {Promise<IDBDatabase>}
     */
    async _connect() {
        if (this._dbPromise) return this._dbPromise;

        this._dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this._dbName, MultisigSessionStore.DB_VERSION);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            request.onupgradeneeded = event => {
                const db = request.result;
                if (event.oldVersion < 1) {
                    db.createObjectStore(MultisigSessionStore.META_STORE, { keyPath: 'key' });
                    const sessionStore = db.createObjectStore(
                        MultisigSessionStore.SESSION_STORE,
                        { keyPath: 'stateHash' },
                    );
                    sessionStore.createIndex('pruneAfter', 'pruneAfter');
                }
            };
        });
        this._dbPromise.catch(() => { this._dbPromise = null; });

        return this._dbPromise;
    }

    /**
     * Starts a transaction for writing records which signing decisions depend on. By default, browsers report a
     * transaction as complete before its data is flushed to disk. With strict durability, a record can not get lost
     * in a crash or power loss after a signature already left the Keyguard.
     *
     * @private
     * @param {IDBDatabase} db
     * @param {string} storeName
     * @returns {IDBTransaction}
     */
    static _writeTransaction(db, storeName) {
        return db.transaction([storeName], 'readwrite', { durability: 'strict' });
    }

    /**
     * @private
     * @param {Uint8Array} bytes
     * @returns {string}
     */
    static _toHex(bytes) {
        return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * @private
     * @param {Uint8Array} a
     * @param {Uint8Array} b
     * @returns {boolean}
     */
    static _equals(a, b) {
        return a.length === b.length && a.every((byte, i) => byte === b[i]);
    }
}

/**
 * @typedef {{
 *     stateHash: string,
 *     inputsHash: Uint8Array | null,
 *     usedAt: number | null,
 *     pruneAfter: number,
 * }} MultisigSessionStore.SessionRecord - `inputsHash` and `usedAt` are `null` until the session is used for signing.
 */

/**
 * @typedef {'sign' | 'refuse' | 'refuse-unknown' | 'confirm'} MultisigSessionStore.Decision
 */

/** @type {MultisigSessionStore | null} */
MultisigSessionStore._instance = null;
MultisigSessionStore.DB_NAME = 'nimiq-keyguard-multisig';
MultisigSessionStore.DB_VERSION = 1;
MultisigSessionStore.META_STORE = 'meta';
MultisigSessionStore.SESSION_STORE = 'signing-sessions';
MultisigSessionStore.DEVICE_SECRET_KEY = 'deviceSecret';
MultisigSessionStore.DEVICE_SECRET_SIZE = 32;
MultisigSessionStore.DEVICE_ID_SIZE = 16;
MultisigSessionStore.PRUNE_GRACE_PERIOD = 30 * 24 * 60 * 60 * 1000; // 30 days

MultisigSessionStore.Decision = Object.freeze({
    /** Sign without asking. Either an unused state recorded by this device, or a repetition with identical inputs. */
    SIGN: /** @type {'sign'} */ ('sign'),
    /** Never sign. The state has already been used with different inputs. */
    REFUSE: /** @type {'refuse'} */ ('refuse'),
    /** Never sign. The state is from this device, which has no record of it, so its records are incomplete. */
    REFUSE_UNKNOWN: /** @type {'refuse-unknown'} */ ('refuse-unknown'),
    /** Only sign after the user confirmed a warning. The state is from a foreign device and not yet used here. */
    CONFIRM: /** @type {'confirm'} */ ('confirm'),
});
