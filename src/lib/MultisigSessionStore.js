/**
 * Persists, per Keyguard instance (i.e. per browser profile), a random device ID and a record of every MuSig2 signing
 * session that has been used for signing, to prevent signing the same session twice with differing inputs, which would
 * leak the private key.
 *
 * Neither the device ID nor the records are secret, which is why they are stored outside the KeyStore. Notably, they
 * are not removed when keys are removed (logout), as the records need to outlive a logout and a re-login.
 *
 * If the stored data gets lost, for example because site data got cleared, the device ID changes. States created by
 * this device then look like states from a foreign device, such that a replay results in a warning to the user, and
 * is never silently accepted.
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
     * @param {{ isOwnDevice: boolean, usage: MultisigSessionStore.UsageRecord | null, inputsHash: Uint8Array }} params
     * @returns {MultisigSessionStore.Decision}
     */
    static decide({ isOwnDevice, usage, inputsHash }) {
        if (usage) {
            // Re-signing identical inputs reproduces the identical partial signature, and is therefore harmless.
            return MultisigSessionStore._equals(usage.inputsHash, inputsHash)
                ? MultisigSessionStore.Decision.SIGN
                : MultisigSessionStore.Decision.REFUSE;
        }
        return isOwnDevice
            ? MultisigSessionStore.Decision.SIGN
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
     * Returns the ID of this Keyguard instance, creating it on first use.
     *
     * @returns {Promise<Uint8Array>}
     */
    async getDeviceId() {
        const db = await this._connect();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([MultisigSessionStore.META_STORE], 'readwrite');
            const store = transaction.objectStore(MultisigSessionStore.META_STORE);
            /** @type {Uint8Array} */
            let deviceId;
            const getRequest = store.get(MultisigSessionStore.DEVICE_ID_KEY);
            getRequest.onsuccess = () => {
                const record = /** @type {{ value: Uint8Array } | undefined} */ (getRequest.result);
                if (record && record.value instanceof Uint8Array
                    && record.value.length === MultisigSessionStore.DEVICE_ID_SIZE) {
                    deviceId = record.value;
                    return;
                }
                deviceId = window.crypto.getRandomValues(new Uint8Array(MultisigSessionStore.DEVICE_ID_SIZE));
                store.put({ key: MultisigSessionStore.DEVICE_ID_KEY, value: deviceId });
            };
            transaction.oncomplete = () => resolve(deviceId);
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });
    }

    /**
     * @param {Uint8Array} stateHash
     * @returns {Promise<MultisigSessionStore.UsageRecord | null>}
     */
    async getUsage(stateHash) {
        const db = await this._connect();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([MultisigSessionStore.USAGE_STORE], 'readonly');
            const getRequest = transaction.objectStore(MultisigSessionStore.USAGE_STORE)
                .get(MultisigSessionStore._toHex(stateHash));
            getRequest.onsuccess = () => resolve(getRequest.result || null);
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Atomically records the use of a signing state with the given inputs, unless it has already been used. Must be
     * called, and must have returned `true`, before signing.
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
            const transaction = db.transaction([MultisigSessionStore.USAGE_STORE], 'readwrite');
            const store = transaction.objectStore(MultisigSessionStore.USAGE_STORE);
            const key = MultisigSessionStore._toHex(stateHash);
            let allowed = false;
            const getRequest = store.get(key);
            getRequest.onsuccess = () => {
                const existing = /** @type {MultisigSessionStore.UsageRecord | undefined} */ (getRequest.result);
                if (existing) {
                    allowed = MultisigSessionStore._equals(existing.inputsHash, inputsHash);
                    return;
                }
                /** @type {MultisigSessionStore.UsageRecord} */
                const record = {
                    stateHash: key,
                    inputsHash,
                    usedAt: Date.now(),
                    pruneAfter: expiresAt + MultisigSessionStore.PRUNE_GRACE_PERIOD,
                };
                store.add(record);
                allowed = true;
            };
            transaction.oncomplete = () => resolve(allowed);
            transaction.onerror = () => reject(transaction.error);
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
            const transaction = db.transaction([MultisigSessionStore.USAGE_STORE], 'readwrite');
            const index = transaction.objectStore(MultisigSessionStore.USAGE_STORE).index('pruneAfter');
            const cursorRequest = index.openCursor(IDBKeyRange.upperBound(now, true));
            cursorRequest.onsuccess = () => {
                const cursor = cursorRequest.result;
                if (!cursor) return;
                cursor.delete();
                cursor.continue();
            };
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
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
                    const usageStore = db.createObjectStore(MultisigSessionStore.USAGE_STORE, { keyPath: 'stateHash' });
                    usageStore.createIndex('pruneAfter', 'pruneAfter');
                }
            };
        });
        this._dbPromise.catch(() => { this._dbPromise = null; });

        return this._dbPromise;
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
 *     inputsHash: Uint8Array,
 *     usedAt: number,
 *     pruneAfter: number,
 * }} MultisigSessionStore.UsageRecord
 */

/**
 * @typedef {'sign' | 'refuse' | 'confirm'} MultisigSessionStore.Decision
 */

/** @type {MultisigSessionStore | null} */
MultisigSessionStore._instance = null;
MultisigSessionStore.DB_NAME = 'nimiq-keyguard-multisig';
MultisigSessionStore.DB_VERSION = 1;
MultisigSessionStore.META_STORE = 'meta';
MultisigSessionStore.USAGE_STORE = 'used-signing-states';
MultisigSessionStore.DEVICE_ID_KEY = 'deviceId';
MultisigSessionStore.DEVICE_ID_SIZE = 16;
MultisigSessionStore.PRUNE_GRACE_PERIOD = 30 * 24 * 60 * 60 * 1000; // 30 days

MultisigSessionStore.Decision = Object.freeze({
    /** Sign without asking. Either a new state from this device, or a repetition with identical inputs. */
    SIGN: /** @type {'sign'} */ ('sign'),
    /** Never sign. The state has already been used with different inputs. */
    REFUSE: /** @type {'refuse'} */ ('refuse'),
    /** Only sign after the user confirmed a warning. The state is from a foreign device and not yet used here. */
    CONFIRM: /** @type {'confirm'} */ ('confirm'),
});
