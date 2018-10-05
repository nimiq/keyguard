// @ts-nocheck
/* eslint-disable */

/**
 * This file was generated from the @nimiq/rpc package source, with `RpcServer` being the only target.
 *
 * HOWTO:
 * - Remove `export * from './RpcClient';` from @nimiq/rpc/src/main.ts
 * - Run `yarn build` in the @nimiq/rpc directory
 * - @nimiq/rpc/dist/rpc.es.js is the wanted module file
 * - The following changes where made to this file afterwards:
 *   https://github.com/nimiq/keyguard-next/pull/93/commits/0a9797cbe195f7eda8b66a75927cc11786ea9625
 */

var ResponseStatus;
(function (ResponseStatus) {
    ResponseStatus["OK"] = "ok";
    ResponseStatus["ERROR"] = "error";
})(ResponseStatus || (ResponseStatus = {}));

/* tslint:disable:no-bitwise */
class Base64 {
    static decode(b64) {
        Base64._initRevLookup();
        const [validLength, placeHoldersLength] = Base64._getLengths(b64);
        const arr = new Uint8Array(Base64._byteLength(validLength, placeHoldersLength));
        let curByte = 0;
        // if there are placeholders, only get up to the last complete 4 chars
        const len = placeHoldersLength > 0 ? validLength - 4 : validLength;
        let i = 0;
        for (; i < len; i += 4) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 18) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] << 12) |
                (Base64._revLookup[b64.charCodeAt(i + 2)] << 6) |
                Base64._revLookup[b64.charCodeAt(i + 3)];
            arr[curByte++] = (tmp >> 16) & 0xFF;
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 2) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 2) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] >> 4);
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 1) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 10) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] << 4) |
                (Base64._revLookup[b64.charCodeAt(i + 2)] >> 2);
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte /*++ not needed*/] = tmp & 0xFF;
        }
        return arr;
    }
    static encode(uint8) {
        const length = uint8.length;
        const extraBytes = length % 3; // if we have 1 byte left, pad 2 bytes
        const parts = [];
        const maxChunkLength = 16383; // must be multiple of 3
        // go through the array every three bytes, we'll deal with trailing stuff later
        for (let i = 0, len2 = length - extraBytes; i < len2; i += maxChunkLength) {
            parts.push(Base64._encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
        }
        // pad the end with zeros, but make sure to not forget the extra bytes
        if (extraBytes === 1) {
            const tmp = uint8[length - 1];
            parts.push(Base64._lookup[tmp >> 2] +
                Base64._lookup[(tmp << 4) & 0x3F] +
                '==');
        }
        else if (extraBytes === 2) {
            const tmp = (uint8[length - 2] << 8) + uint8[length - 1];
            parts.push(Base64._lookup[tmp >> 10] +
                Base64._lookup[(tmp >> 4) & 0x3F] +
                Base64._lookup[(tmp << 2) & 0x3F] +
                '=');
        }
        return parts.join('');
    }
    static _initRevLookup() {
        if (Base64._revLookup.length !== 0)
            return;
        Base64._revLookup = [];
        for (let i = 0, len = Base64._lookup.length; i < len; i++) {
            Base64._revLookup[Base64._lookup.charCodeAt(i)] = i;
        }
        // Support decoding URL-safe base64 strings, as Node.js does.
        // See: https://en.wikipedia.org/wiki/Base64#URL_applications
        Base64._revLookup['-'.charCodeAt(0)] = 62;
        Base64._revLookup['_'.charCodeAt(0)] = 63;
    }
    static _getLengths(b64) {
        const length = b64.length;
        if (length % 4 > 0) {
            throw new Error('Invalid string. Length must be a multiple of 4');
        }
        // Trim off extra bytes after placeholder bytes are found
        // See: https://github.com/beatgammit/base64-js/issues/42
        let validLength = b64.indexOf('=');
        if (validLength === -1)
            validLength = length;
        const placeHoldersLength = validLength === length ? 0 : 4 - (validLength % 4);
        return [validLength, placeHoldersLength];
    }
    static _byteLength(validLength, placeHoldersLength) {
        return ((validLength + placeHoldersLength) * 3 / 4) - placeHoldersLength;
    }
    static _tripletToBase64(num) {
        return Base64._lookup[num >> 18 & 0x3F] +
            Base64._lookup[num >> 12 & 0x3F] +
            Base64._lookup[num >> 6 & 0x3F] +
            Base64._lookup[num & 0x3F];
    }
    static _encodeChunk(uint8, start, end) {
        const output = [];
        for (let i = start; i < end; i += 3) {
            const tmp = ((uint8[i] << 16) & 0xFF0000) +
                ((uint8[i + 1] << 8) & 0xFF00) +
                (uint8[i + 2] & 0xFF);
            output.push(Base64._tripletToBase64(tmp));
        }
        return output.join('');
    }
}
Base64._lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
Base64._revLookup = [];

var ExtraJSONTypes;
(function (ExtraJSONTypes) {
    ExtraJSONTypes[ExtraJSONTypes["UINT8_ARRAY"] = 0] = "UINT8_ARRAY";
})(ExtraJSONTypes || (ExtraJSONTypes = {}));
class JSONUtils {
    static stringify(value) {
        return JSON.stringify(value, JSONUtils._jsonifyType);
    }
    static parse(value) {
        return JSON.parse(value, JSONUtils._parseType);
    }
    static _parseType(key, value) {
        if (value && value.hasOwnProperty &&
            value.hasOwnProperty(JSONUtils.TYPE_SYMBOL) && value.hasOwnProperty(JSONUtils.VALUE_SYMBOL)) {
            switch (value[JSONUtils.TYPE_SYMBOL]) {
                case ExtraJSONTypes.UINT8_ARRAY:
                    return Base64.decode(value[JSONUtils.VALUE_SYMBOL]);
            }
        }
        return value;
    }
    static _jsonifyType(key, value) {
        if (value instanceof Uint8Array) {
            return JSONUtils._typedObject(ExtraJSONTypes.UINT8_ARRAY, Base64.encode(value));
        }
        return value;
    }
    static _typedObject(type, value) {
        const obj = {};
        obj[JSONUtils.TYPE_SYMBOL] = type;
        obj[JSONUtils.VALUE_SYMBOL] = value;
        return obj;
    }
}
JSONUtils.TYPE_SYMBOL = '__';
JSONUtils.VALUE_SYMBOL = 'v';

class UrlRpcEncoder {
    static receiveRedirectCommand(url) {
        // Need referrer for origin check
        if (!document.referrer)
            return null;
        // Parse query
        const params = new URLSearchParams(url.search);
        const referrer = new URL(document.referrer);
        // Ignore messages without a command
        if (!params.has('command'))
            return null;
        // Ignore messages without an ID
        if (!params.has('id'))
            return null;
        // Ignore messages without a valid return path
        if (!params.has('returnURL'))
            return null;
        // Only allow returning to same origin
        const returnURL = new URL(params.get('returnURL'));
        if (returnURL.origin !== referrer.origin)
            return null;
        // Parse args
        let args = [];
        if (params.has('args')) {
            try {
                args = JSONUtils.parse(params.get('args'));
            }
            catch (e) {
                // Do nothing
            }
        }
        args = Array.isArray(args) ? args : [];
        return {
            origin: referrer.origin,
            data: {
                id: parseInt(params.get('id'), 10),
                command: params.get('command'),
                args,
            },
            returnURL: params.get('returnURL'),
        };
    }
    static prepareRedirectReply(state, status, result) {
        const params = new URLSearchParams();
        params.set('status', status);
        params.set('result', JSONUtils.stringify(result));
        params.set('id', state.id.toString());
        // TODO: what if it already includes a query string
        return `${state.returnURL}?${params.toString()}`;
    }
}

class State {
    get id() {
        return this._id;
    }
    get origin() {
        return this._origin;
    }
    get data() {
        return this._data;
    }
    get returnURL() {
        return this._returnURL;
    }
    static fromJSON(json) {
        const obj = JSON.parse(json);
        return new State(obj);
    }
    constructor(message) {
        if (!message.data.id)
            throw Error('Missing id');
        this._origin = message.origin;
        this._id = message.data.id;
        this._returnURL = 'returnURL' in message ? message.returnURL : null;
        this._data = message.data;
    }
    toJSON() {
        const obj = {
            origin: this._origin,
            data: this._data,
        };
        obj.returnURL = this._returnURL;
        return JSON.stringify(obj);
    }
    reply(status, result) {
        console.debug('RpcServer REPLY', result);
        if (status === ResponseStatus.ERROR) {
            // serialize error objects
            result = typeof result === 'object'
                ? { message: result.message, stack: result.stack }
                : { message: result };
        }

        // Send via top-level navigation
        window.location.href = UrlRpcEncoder.prepareRedirectReply(this, status, result);
    }
}

class RpcServer {
    static _ok(state, result) {
        state.reply(ResponseStatus.OK, result);
    }
    static _error(state, error) {
        state.reply(ResponseStatus.ERROR, error);
    }
    constructor(allowedOrigin) {
        this._allowedOrigin = allowedOrigin;
        this._responseHandlers = new Map();
        this._responseHandlers.set('ping', () => 'pong');
        this._receiveListener = this._receive.bind(this);
    }
    onRequest(command, fn) {
        this._responseHandlers.set(command, fn);
    }
    init() {
        window.addEventListener('message', this._receiveListener);
        this._receiveRedirect();
    }
    close() {
        window.removeEventListener('message', this._receiveListener);
    }
    _receiveRedirect() {
        const message = UrlRpcEncoder.receiveRedirectCommand(window.location);
        if (message) {
            this._receive(message);
        }
    }
    _receive(message) {
        let state = null;
        try {
            state = new State(message);
            // Cannot reply to a message that has no return URL
            if (!('returnURL' in message))
                return;
            // Ignore messages without a command
            if (!('command' in state.data)) {
                return;
            }
            if (this._allowedOrigin !== '*' && message.origin !== this._allowedOrigin) {
                throw new Error('Unauthorized');
            }
            const args = message.data.args && Array.isArray(message.data.args) ? message.data.args : [];
            // Test if request calls a valid handler with the correct number of arguments
            if (!this._responseHandlers.has(state.data.command)) {
                throw new Error(`Unknown command: ${state.data.command}`);
            }
            const requestedMethod = this._responseHandlers.get(state.data.command);
            // Do not include state argument
            if (Math.max(requestedMethod.length - 1, 0) < args.length) {
                throw new Error(`Too many arguments passed: ${message}`);
            }
            console.debug('RpcServer ACCEPT', state.data);
            // Call method
            const result = requestedMethod(state, ...args);
            // If a value is returned, we take care of the reply,
            // otherwise we assume the handler to do the reply when appropriate.
            if (result instanceof Promise) {
                result
                    .then((finalResult) => {
                    if (finalResult !== undefined) {
                        RpcServer._ok(state, finalResult);
                    }
                })
                    .catch((error) => RpcServer._error(state, error));
            }
            else if (result !== undefined) {
                RpcServer._ok(state, result);
            }
        }
        catch (error) {
            if (state) {
                RpcServer._error(state, error);
            }
        }
    }
}
class BrowserDetection { // eslint-disable-line no-unused-vars
    /**
     * @returns {boolean}
     */
    static isDesktopSafari() {
        // see https://stackoverflow.com/a/23522755
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !/mobile/i.test(navigator.userAgent);
    }

    /**
     * @returns {boolean}
     */
    static isSafari() {
        return !!navigator.userAgent.match(/Version\/[\d.]+.*Safari/);
    }

    /**
     * @returns {boolean}
     */
    static isIos() {
        // @ts-ignore (MSStream is not on window)
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    /**
     * @returns {number[]}
     */
    static iosVersion() {
        if (BrowserDetection.isIos()) {
            const v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
            if (v) {
                return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || '0', 10)];
            }
        }

        throw new Error('No iOS version detected');
    }

    /**
     * @returns {boolean}
     */
    static isBadIos() {
        const version = this.iosVersion();
        return version[0] < 11 || (version[0] === 11 && version[1] === 2); // Only 11.2 has the WASM bug
    }
}
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
    /** @type {AccountStore} */
    static get instance() {
        /** @type {AccountStore} */
        this._instance = this._instance || new AccountStore();
        return this._instance;
    }

    /**
     * @param {string} dbName
     * @constructor
     */
    constructor(dbName = AccountStore.ACCOUNT_DATABASE) {
        this._dbName = dbName;
        this._dropped = false;
        /** @type {Promise<IDBDatabase>|null} */
        this._dbPromise = null;
    }

    /**
     * @returns {Promise.<IDBDatabase>}
     * @private
     */
    async connect() {
        if (this._dbPromise) return this._dbPromise;

        this._dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this._dbName, AccountStore.VERSION);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => reject(request.error);
            request.onupgradeneeded = () => {
                // account database doesn't exist
                this._dropped = true;
                request.transaction.abort();
                resolve(null);
            };
        });

        return this._dbPromise;
    }

    /**
     * @returns {Promise<AccountInfo[]>}
     */
    async list() {
        const db = await this.connect();
        if (!db) return [];
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
                    /** @type {AccountInfo} */
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
     * @returns {Promise<AccountRecord[]>}
     * @deprecated Only for database migration
     *
     * @description Returns the encrypted keypairs!
     */
    async dangerousListPlain() {
        const db = await this.connect();
        if (!db) return [];
        return new Promise((resolve, reject) => {
            const results = /** @type {AccountRecord[]} */ ([]);
            const openCursorRequest = db.transaction([AccountStore.ACCOUNT_DATABASE], 'readonly')
                .objectStore(AccountStore.ACCOUNT_DATABASE)
                .openCursor();
            openCursorRequest.onsuccess = () => {
                const cursor = openCursorRequest.result;
                if (cursor) {
                    const key = /** @type {AccountRecord} */ (cursor.value);
                    results.push(key);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            openCursorRequest.onerror = () => reject(openCursorRequest.error);
        });
    }

    async close() {
        if (!this._dbPromise) return;
        // If failed to open database (i.e. _dbPromise rejects) we don't need to close the db
        const db = await this._dbPromise.catch(() => null);
        this._dbPromise = null;
        if (db) db.close();
    }

    /**
     * @returns {Promise<void>}
     */
    async drop() {
        if (this._dropped) return Promise.resolve();
        await this.close();

        return new Promise((resolve, reject) => {
            const request = window.indexedDB.deleteDatabase(this._dbName);

            request.onsuccess = () => {
                this._dropped = true;
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }
}

AccountStore.VERSION = 2;
AccountStore.ACCOUNT_DATABASE = 'accounts';
/* global Nimiq */
/* global Key */
/* global KeyInfo */
/* global AccountStore */
/* global BrowserDetection */

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
        /** @type {KeyStore} */
        KeyStore._instance = KeyStore._instance || new KeyStore();
        return KeyStore._instance;
    }

    constructor() {
        /** @type {?Promise<IDBDatabase>} */
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
            };
        });

        return this._dbPromise;
    }

    /**
     * @param {string} id
     * @param {Uint8Array} [passphrase]
     * @returns {Promise<?Key>}
     */
    async get(id, passphrase) {
        /** @type {?KeyRecord} */
        const keyRecord = await this._get(id);
        if (!keyRecord) {
            return null;
        }

        if (!keyRecord.encrypted) {
            return new Key(keyRecord.secret, keyRecord.type);
        }

        if (!passphrase) {
            throw new Error('Passphrase required');
        }

        const plainSecret = await Nimiq.CryptoUtils.decryptOtpKdf(new Nimiq.SerialBuffer(keyRecord.secret), passphrase);
        return new Key(plainSecret, keyRecord.type);
    }

    /**
     * @param {string} id
     * @returns {Promise<?KeyInfo>}
     */
    async getInfo(id) {
        /** @type {?KeyRecord} */
        const keyRecord = await this._get(id);
        return keyRecord ? new KeyInfo(keyRecord.id, keyRecord.type, keyRecord.encrypted) : null;
    }

    /**
     * @param {string} id
     * @returns {Promise<?KeyRecord>}
     * @private
     */
    async _get(id) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME])
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .get(id);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @param {Key} key
     * @param {Uint8Array} [passphrase]
     * @returns {Promise<void>}
     */
    async put(key, passphrase) {
        const secret = !passphrase
            ? key.secret
            : await Nimiq.CryptoUtils.encryptOtpKdf(new Nimiq.SerialBuffer(key.secret), passphrase);

        const keyRecord = /** @type {KeyRecord} */ {
            id: key.id,
            type: key.type,
            encrypted: !!passphrase && passphrase.length > 0,
            secret,
        };

        return this._put(keyRecord);
    }

    /**
     * @param {KeyRecord} keyRecord
     * @returns {Promise<void>}
     */
    async _put(keyRecord) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .put(keyRecord);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async remove(id) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .delete(id);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @returns {Promise<KeyInfo[]>}
     */
    async list() {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readonly')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .openCursor();

        const results = /** KeyRecord[] */ await KeyStore._readAllFromCursor(request);
        return results.map(keyRecord => new KeyInfo(keyRecord.id, keyRecord.type, keyRecord.encrypted));
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
        const keys = await AccountStore.instance.dangerousListPlain();
        keys.forEach(async key => {
            const address = Nimiq.Address.fromUserFriendlyAddress(key.userFriendlyAddress);
            const legacyKeyId = Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(address.serialize()).subarray(0, 6));

            const keyRecord = /** @type {KeyRecord} */ {
                id: legacyKeyId,
                type: Key.Type.LEGACY,
                encrypted: true,
                secret: key.encryptedKeyPair,
            };

            await this._put(keyRecord);
        });

        // FIXME Uncomment after/for testing (and also adapt KeyStoreIndexeddb.spec.js)
        // await AccountStore.instance.drop();

        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Delete migrate cookie
            document.cookie = 'migrate=0; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

            // Delete accounts cookie
            document.cookie = 'accounts=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
    }

    /**
     * @param {IDBRequest} request
     * @returns {Promise<*>}
     * @private
     */
    static _requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
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
/** @type {?KeyStore} */
KeyStore._instance = null;

KeyStore.DB_VERSION = 1;
KeyStore.DB_NAME = 'nimiq-keyguard';
KeyStore.DB_KEY_STORE_NAME = 'keys';
/* global Nimiq */

class Key {
    /**
     * @param {Uint8Array} secret
     * @param {Key.Type} [type]
     */
    constructor(secret, type = Key.Type.BIP39) {
        this._secret = secret;
        this._type = type;
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PublicKey}
     */
    derivePublicKey(path) {
        return Nimiq.PublicKey.derive(this._derivePrivateKey(path));
    }

    /**
     * @param {string} path
     * @returns {Nimiq.Address}
     */
    deriveAddress(path) {
        return this.derivePublicKey(path).toAddress();
    }

    /**
     * @param {string} path
     * @param {Uint8Array} data
     * @returns {Nimiq.Signature}
     */
    sign(path, data) {
        const privateKey = this._derivePrivateKey(path);
        const publicKey = Nimiq.PublicKey.derive(privateKey);
        return Nimiq.Signature.create(privateKey, publicKey, data);
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PrivateKey}
     * @private
     */
    _derivePrivateKey(path) {
        return this._type === Key.Type.LEGACY
            ? new Nimiq.PrivateKey(this._secret)
            : new Nimiq.Entropy(this._secret).toExtendedPrivateKey().derivePath(path).privateKey;
    }

    /**
     * @type {Uint8Array}
     */
    get secret() {
        return this._secret;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {string}
     */
    get id() {
        const input = this._type === Key.Type.LEGACY
            ? Nimiq.PublicKey.derive(new Nimiq.PrivateKey(this._secret)).toAddress().serialize()
            : this._secret;
        return Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(input).subarray(0, 6));
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this.id);
    }

    /**
     * @param {string} id
     * @returns {string}
     */
    static idToUserFriendlyId(id) {
        // Stub
        return `UserFriendly ${id}`;
    }
}
Key.Type = {
    LEGACY: /** @type {Key.Type} */ 0,
    BIP39: /** @type {Key.Type} */ 1,
};
/* global Key */

// eslint-disable-next-line no-unused-vars
class KeyInfo {
    /**
     * @param {string} id
     * @param {Key.Type} type
     * @param {boolean} encrypted
     */
    constructor(id, type, encrypted) {
        /** @private */
        this._id = id;
        /** @private */
        this._type = type;
        /** @private */
        this._encrypted = encrypted;
    }

    /**
     * @type {string}
     */
    get id() {
        return this._id;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {boolean}
     */
    get encrypted() {
        return this._encrypted;
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this._id);
    }

    /**
     * @returns {KeyInfoObject}
     */
    toObject() {
        return {
            id: this.id,
            type: this.type,
            encrypted: this.encrypted,
            // userFriendlyId: this.userFriendlyId,
        };
    }

    /**
     * @param {KeyInfoObject} obj
     * @returns {KeyInfo}
     */
    static fromObject(obj) {
        return new KeyInfo(obj.id, obj.type, obj.encrypted);
    }
}
/* global KeyInfo */

class CookieJar { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyInfo[]} keys
     */
    static fill(keys) {
        const maxAge = 60 * 60 * 24 * 365;
        const encodedKeys = this._encodeCookie(keys);
        document.cookie = `k=${encodedKeys};max-age=${maxAge.toString()}`;
    }

    /**
     * @param {boolean} [listDeprecatedAccounts] - @deprecated Only for database migration
     * @returns {KeyInfo[] | AccountInfo[]}
     */
    static eat(listDeprecatedAccounts) {
        // Legacy cookie
        if (listDeprecatedAccounts) {
            const match = document.cookie.match(new RegExp('accounts=([^;]+)'));
            if (match && match[1]) {
                const decoded = decodeURIComponent(match[1]);
                return JSON.parse(decoded);
            }
            return [];
        }

        const match = document.cookie.match(new RegExp('k=([^;]+)'));
        if (match && match[1]) {
            return this._decodeCookie(match[1]);
        }

        return [];
    }

    /**
     * @param {KeyInfo[]} keys
     * @returns {string}
     */
    static _encodeCookie(keys) {
        return keys.map(keyInfo => `${keyInfo.type}${keyInfo.encrypted ? 1 : 0}${keyInfo.id}`).join('');
    }

    /**
     * @param {string} str
     * @returns {KeyInfo[]}
     */
    static _decodeCookie(str) {
        if (!str) return [];

        if (str.length % 14 !== 0) throw new Error('Malformed cookie');

        const keys = str.match(/.{14}/g);
        if (!keys) return []; // Make TS happy (match() can potentially return NULL)

        return keys.map(key => {
            const type = /** @type {Key.Type} */ (parseInt(key[0], 10));
            const encrypted = key[1] === '1';
            const id = key.substr(2);
            return new KeyInfo(id, type, encrypted);
        });
    }
}
/* global Nimiq */
/* global RpcServer */

/**
 * @returns {string}
 */
function allowedOrigin() {
    switch (window.location.origin) {
    case 'https://keyguard-next.nimiq.com': return 'https://accounts.nimiq.com';
    case 'https://keyguard-next.nimiq-testnet.com': return 'https://accounts.nimiq-testnet.com';
    default: return '*';
    }
}

/**
 * @param {Newable} RequestApiClass - Class object of the API which is to be exposed via postMessage RPC
 * @param {object} [options]
 */
async function runKeyguard(RequestApiClass, options) { // eslint-disable-line no-unused-vars
    const defaultOptions = {
        loadNimiq: true,
        whitelist: ['request'],
    };

    options = Object.assign(defaultOptions, options);

    if (options.loadNimiq) {
        // Load web assembly encryption library into browser (if supported)
        await Nimiq.WasmHelper.doImportBrowser();
        // Configure to use test net for now
        Nimiq.GenesisConfig.test();
    }

    // If user navigates back to loading screen, skip it
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '') {
            window.history.back();
        }
    });

    // Back arrow functionality
    document.body.addEventListener('click', event => {
        // @ts-ignore
        if (!event.target || !event.target.matches('a.page-header-back-button')) return;
        window.history.back();
    });

    // Instantiate handler.
    /** @type {TopLevelApi} */
    const api = new RequestApiClass();

    window.rpcServer = new RpcServer(allowedOrigin());

    // TODO: Use options.whitelist when adding onRequest handlers (iframe uses different methods)
    window.rpcServer.onRequest('request', (state, request) => api.request(request));

    window.rpcServer.init();
}
/* global BrowserDetection */
/* global CookieJar */
/* global AccountStore */
/* global KeyStore */

class IFrameApi { // eslint-disable-line no-unused-vars
    /**
     * @param {boolean} [listFromLegacyStore] - Deprecated, only for database migration
     * @returns {Promise<KeyInfoObject[] | AccountInfo[]>}
     */
    async list(listFromLegacyStore) {
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            return CookieJar.eat(listFromLegacyStore);
        }

        if (listFromLegacyStore) {
            return AccountStore.instance.list();
        }

        const keyInfos = await KeyStore.instance.list();
        return keyInfos.map(ki => ki.toObject());
    }

    /**
     * @returns {Promise<void>}
     * @deprecated Only for database migration
     */
    async migrateAccountsToKeys() {
        /**
         * IndexedDB is not accessible in iframes on iOS browsers and Safari.
         * Thus when the Keyguard client requests the iframe to migrate the
         * database, the iframe needs to signal to the popup that it should run
         * the migration the next time it is opened. Thus this signalling cookie.
         * The cookie is then detected in the TopLevelApi.request() method.
         */
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Set migrate flag cookie
            document.cookie = 'migrate=1;max-age=31536000';
            return;
        }

        // FIXME: Requires Nimiq lib to be loaded, which it currently isn't in the iframe
        await KeyStore.instance.migrateAccountsToKeys();
    }
}
/* global runKeyguard */
/* global IFrameApi */

runKeyguard(IFrameApi, {
    loadNimiq: false,
    whitelist: [
        'list',
        'migrateAccountsToKeys',
    ],
});
// @ts-nocheck
/* eslint-disable */

/**
 * This file was generated from the @nimiq/rpc package source, with `RpcServer` being the only target.
 *
 * HOWTO:
 * - Remove `export * from './RpcClient';` from @nimiq/rpc/src/main.ts
 * - Run `yarn build` in the @nimiq/rpc directory
 * - @nimiq/rpc/dist/rpc.es.js is the wanted module file
 * - The following changes where made to this file afterwards:
 *   https://github.com/nimiq/keyguard-next/pull/93/commits/0a9797cbe195f7eda8b66a75927cc11786ea9625
 */

var ResponseStatus;
(function (ResponseStatus) {
    ResponseStatus["OK"] = "ok";
    ResponseStatus["ERROR"] = "error";
})(ResponseStatus || (ResponseStatus = {}));

/* tslint:disable:no-bitwise */
class Base64 {
    static decode(b64) {
        Base64._initRevLookup();
        const [validLength, placeHoldersLength] = Base64._getLengths(b64);
        const arr = new Uint8Array(Base64._byteLength(validLength, placeHoldersLength));
        let curByte = 0;
        // if there are placeholders, only get up to the last complete 4 chars
        const len = placeHoldersLength > 0 ? validLength - 4 : validLength;
        let i = 0;
        for (; i < len; i += 4) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 18) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] << 12) |
                (Base64._revLookup[b64.charCodeAt(i + 2)] << 6) |
                Base64._revLookup[b64.charCodeAt(i + 3)];
            arr[curByte++] = (tmp >> 16) & 0xFF;
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 2) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 2) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] >> 4);
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 1) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 10) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] << 4) |
                (Base64._revLookup[b64.charCodeAt(i + 2)] >> 2);
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte /*++ not needed*/] = tmp & 0xFF;
        }
        return arr;
    }
    static encode(uint8) {
        const length = uint8.length;
        const extraBytes = length % 3; // if we have 1 byte left, pad 2 bytes
        const parts = [];
        const maxChunkLength = 16383; // must be multiple of 3
        // go through the array every three bytes, we'll deal with trailing stuff later
        for (let i = 0, len2 = length - extraBytes; i < len2; i += maxChunkLength) {
            parts.push(Base64._encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
        }
        // pad the end with zeros, but make sure to not forget the extra bytes
        if (extraBytes === 1) {
            const tmp = uint8[length - 1];
            parts.push(Base64._lookup[tmp >> 2] +
                Base64._lookup[(tmp << 4) & 0x3F] +
                '==');
        }
        else if (extraBytes === 2) {
            const tmp = (uint8[length - 2] << 8) + uint8[length - 1];
            parts.push(Base64._lookup[tmp >> 10] +
                Base64._lookup[(tmp >> 4) & 0x3F] +
                Base64._lookup[(tmp << 2) & 0x3F] +
                '=');
        }
        return parts.join('');
    }
    static _initRevLookup() {
        if (Base64._revLookup.length !== 0)
            return;
        Base64._revLookup = [];
        for (let i = 0, len = Base64._lookup.length; i < len; i++) {
            Base64._revLookup[Base64._lookup.charCodeAt(i)] = i;
        }
        // Support decoding URL-safe base64 strings, as Node.js does.
        // See: https://en.wikipedia.org/wiki/Base64#URL_applications
        Base64._revLookup['-'.charCodeAt(0)] = 62;
        Base64._revLookup['_'.charCodeAt(0)] = 63;
    }
    static _getLengths(b64) {
        const length = b64.length;
        if (length % 4 > 0) {
            throw new Error('Invalid string. Length must be a multiple of 4');
        }
        // Trim off extra bytes after placeholder bytes are found
        // See: https://github.com/beatgammit/base64-js/issues/42
        let validLength = b64.indexOf('=');
        if (validLength === -1)
            validLength = length;
        const placeHoldersLength = validLength === length ? 0 : 4 - (validLength % 4);
        return [validLength, placeHoldersLength];
    }
    static _byteLength(validLength, placeHoldersLength) {
        return ((validLength + placeHoldersLength) * 3 / 4) - placeHoldersLength;
    }
    static _tripletToBase64(num) {
        return Base64._lookup[num >> 18 & 0x3F] +
            Base64._lookup[num >> 12 & 0x3F] +
            Base64._lookup[num >> 6 & 0x3F] +
            Base64._lookup[num & 0x3F];
    }
    static _encodeChunk(uint8, start, end) {
        const output = [];
        for (let i = start; i < end; i += 3) {
            const tmp = ((uint8[i] << 16) & 0xFF0000) +
                ((uint8[i + 1] << 8) & 0xFF00) +
                (uint8[i + 2] & 0xFF);
            output.push(Base64._tripletToBase64(tmp));
        }
        return output.join('');
    }
}
Base64._lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
Base64._revLookup = [];

var ExtraJSONTypes;
(function (ExtraJSONTypes) {
    ExtraJSONTypes[ExtraJSONTypes["UINT8_ARRAY"] = 0] = "UINT8_ARRAY";
})(ExtraJSONTypes || (ExtraJSONTypes = {}));
class JSONUtils {
    static stringify(value) {
        return JSON.stringify(value, JSONUtils._jsonifyType);
    }
    static parse(value) {
        return JSON.parse(value, JSONUtils._parseType);
    }
    static _parseType(key, value) {
        if (value && value.hasOwnProperty &&
            value.hasOwnProperty(JSONUtils.TYPE_SYMBOL) && value.hasOwnProperty(JSONUtils.VALUE_SYMBOL)) {
            switch (value[JSONUtils.TYPE_SYMBOL]) {
                case ExtraJSONTypes.UINT8_ARRAY:
                    return Base64.decode(value[JSONUtils.VALUE_SYMBOL]);
            }
        }
        return value;
    }
    static _jsonifyType(key, value) {
        if (value instanceof Uint8Array) {
            return JSONUtils._typedObject(ExtraJSONTypes.UINT8_ARRAY, Base64.encode(value));
        }
        return value;
    }
    static _typedObject(type, value) {
        const obj = {};
        obj[JSONUtils.TYPE_SYMBOL] = type;
        obj[JSONUtils.VALUE_SYMBOL] = value;
        return obj;
    }
}
JSONUtils.TYPE_SYMBOL = '__';
JSONUtils.VALUE_SYMBOL = 'v';

class UrlRpcEncoder {
    static receiveRedirectCommand(url) {
        // Need referrer for origin check
        if (!document.referrer)
            return null;
        // Parse query
        const params = new URLSearchParams(url.search);
        const referrer = new URL(document.referrer);
        // Ignore messages without a command
        if (!params.has('command'))
            return null;
        // Ignore messages without an ID
        if (!params.has('id'))
            return null;
        // Ignore messages without a valid return path
        if (!params.has('returnURL'))
            return null;
        // Only allow returning to same origin
        const returnURL = new URL(params.get('returnURL'));
        if (returnURL.origin !== referrer.origin)
            return null;
        // Parse args
        let args = [];
        if (params.has('args')) {
            try {
                args = JSONUtils.parse(params.get('args'));
            }
            catch (e) {
                // Do nothing
            }
        }
        args = Array.isArray(args) ? args : [];
        return {
            origin: referrer.origin,
            data: {
                id: parseInt(params.get('id'), 10),
                command: params.get('command'),
                args,
            },
            returnURL: params.get('returnURL'),
        };
    }
    static prepareRedirectReply(state, status, result) {
        const params = new URLSearchParams();
        params.set('status', status);
        params.set('result', JSONUtils.stringify(result));
        params.set('id', state.id.toString());
        // TODO: what if it already includes a query string
        return `${state.returnURL}?${params.toString()}`;
    }
}

class State {
    get id() {
        return this._id;
    }
    get origin() {
        return this._origin;
    }
    get data() {
        return this._data;
    }
    get returnURL() {
        return this._returnURL;
    }
    static fromJSON(json) {
        const obj = JSON.parse(json);
        return new State(obj);
    }
    constructor(message) {
        if (!message.data.id)
            throw Error('Missing id');
        this._origin = message.origin;
        this._id = message.data.id;
        this._returnURL = 'returnURL' in message ? message.returnURL : null;
        this._data = message.data;
    }
    toJSON() {
        const obj = {
            origin: this._origin,
            data: this._data,
        };
        obj.returnURL = this._returnURL;
        return JSON.stringify(obj);
    }
    reply(status, result) {
        console.debug('RpcServer REPLY', result);
        if (status === ResponseStatus.ERROR) {
            // serialize error objects
            result = typeof result === 'object'
                ? { message: result.message, stack: result.stack }
                : { message: result };
        }

        // Send via top-level navigation
        window.location.href = UrlRpcEncoder.prepareRedirectReply(this, status, result);
    }
}

class RpcServer {
    static _ok(state, result) {
        state.reply(ResponseStatus.OK, result);
    }
    static _error(state, error) {
        state.reply(ResponseStatus.ERROR, error);
    }
    constructor(allowedOrigin) {
        this._allowedOrigin = allowedOrigin;
        this._responseHandlers = new Map();
        this._responseHandlers.set('ping', () => 'pong');
        this._receiveListener = this._receive.bind(this);
    }
    onRequest(command, fn) {
        this._responseHandlers.set(command, fn);
    }
    init() {
        window.addEventListener('message', this._receiveListener);
        this._receiveRedirect();
    }
    close() {
        window.removeEventListener('message', this._receiveListener);
    }
    _receiveRedirect() {
        const message = UrlRpcEncoder.receiveRedirectCommand(window.location);
        if (message) {
            this._receive(message);
        }
    }
    _receive(message) {
        let state = null;
        try {
            state = new State(message);
            // Cannot reply to a message that has no return URL
            if (!('returnURL' in message))
                return;
            // Ignore messages without a command
            if (!('command' in state.data)) {
                return;
            }
            if (this._allowedOrigin !== '*' && message.origin !== this._allowedOrigin) {
                throw new Error('Unauthorized');
            }
            const args = message.data.args && Array.isArray(message.data.args) ? message.data.args : [];
            // Test if request calls a valid handler with the correct number of arguments
            if (!this._responseHandlers.has(state.data.command)) {
                throw new Error(`Unknown command: ${state.data.command}`);
            }
            const requestedMethod = this._responseHandlers.get(state.data.command);
            // Do not include state argument
            if (Math.max(requestedMethod.length - 1, 0) < args.length) {
                throw new Error(`Too many arguments passed: ${message}`);
            }
            console.debug('RpcServer ACCEPT', state.data);
            // Call method
            const result = requestedMethod(state, ...args);
            // If a value is returned, we take care of the reply,
            // otherwise we assume the handler to do the reply when appropriate.
            if (result instanceof Promise) {
                result
                    .then((finalResult) => {
                    if (finalResult !== undefined) {
                        RpcServer._ok(state, finalResult);
                    }
                })
                    .catch((error) => RpcServer._error(state, error));
            }
            else if (result !== undefined) {
                RpcServer._ok(state, result);
            }
        }
        catch (error) {
            if (state) {
                RpcServer._error(state, error);
            }
        }
    }
}
class BrowserDetection { // eslint-disable-line no-unused-vars
    /**
     * @returns {boolean}
     */
    static isDesktopSafari() {
        // see https://stackoverflow.com/a/23522755
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !/mobile/i.test(navigator.userAgent);
    }

    /**
     * @returns {boolean}
     */
    static isSafari() {
        return !!navigator.userAgent.match(/Version\/[\d.]+.*Safari/);
    }

    /**
     * @returns {boolean}
     */
    static isIos() {
        // @ts-ignore (MSStream is not on window)
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    /**
     * @returns {number[]}
     */
    static iosVersion() {
        if (BrowserDetection.isIos()) {
            const v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
            if (v) {
                return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || '0', 10)];
            }
        }

        throw new Error('No iOS version detected');
    }

    /**
     * @returns {boolean}
     */
    static isBadIos() {
        const version = this.iosVersion();
        return version[0] < 11 || (version[0] === 11 && version[1] === 2); // Only 11.2 has the WASM bug
    }
}
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
    /** @type {AccountStore} */
    static get instance() {
        /** @type {AccountStore} */
        this._instance = this._instance || new AccountStore();
        return this._instance;
    }

    /**
     * @param {string} dbName
     * @constructor
     */
    constructor(dbName = AccountStore.ACCOUNT_DATABASE) {
        this._dbName = dbName;
        this._dropped = false;
        /** @type {Promise<IDBDatabase>|null} */
        this._dbPromise = null;
    }

    /**
     * @returns {Promise.<IDBDatabase>}
     * @private
     */
    async connect() {
        if (this._dbPromise) return this._dbPromise;

        this._dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this._dbName, AccountStore.VERSION);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => reject(request.error);
            request.onupgradeneeded = () => {
                // account database doesn't exist
                this._dropped = true;
                request.transaction.abort();
                resolve(null);
            };
        });

        return this._dbPromise;
    }

    /**
     * @returns {Promise<AccountInfo[]>}
     */
    async list() {
        const db = await this.connect();
        if (!db) return [];
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
                    /** @type {AccountInfo} */
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
     * @returns {Promise<AccountRecord[]>}
     * @deprecated Only for database migration
     *
     * @description Returns the encrypted keypairs!
     */
    async dangerousListPlain() {
        const db = await this.connect();
        if (!db) return [];
        return new Promise((resolve, reject) => {
            const results = /** @type {AccountRecord[]} */ ([]);
            const openCursorRequest = db.transaction([AccountStore.ACCOUNT_DATABASE], 'readonly')
                .objectStore(AccountStore.ACCOUNT_DATABASE)
                .openCursor();
            openCursorRequest.onsuccess = () => {
                const cursor = openCursorRequest.result;
                if (cursor) {
                    const key = /** @type {AccountRecord} */ (cursor.value);
                    results.push(key);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            openCursorRequest.onerror = () => reject(openCursorRequest.error);
        });
    }

    async close() {
        if (!this._dbPromise) return;
        // If failed to open database (i.e. _dbPromise rejects) we don't need to close the db
        const db = await this._dbPromise.catch(() => null);
        this._dbPromise = null;
        if (db) db.close();
    }

    /**
     * @returns {Promise<void>}
     */
    async drop() {
        if (this._dropped) return Promise.resolve();
        await this.close();

        return new Promise((resolve, reject) => {
            const request = window.indexedDB.deleteDatabase(this._dbName);

            request.onsuccess = () => {
                this._dropped = true;
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }
}

AccountStore.VERSION = 2;
AccountStore.ACCOUNT_DATABASE = 'accounts';
/* global Nimiq */
/* global Key */
/* global KeyInfo */
/* global AccountStore */
/* global BrowserDetection */

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
        /** @type {KeyStore} */
        KeyStore._instance = KeyStore._instance || new KeyStore();
        return KeyStore._instance;
    }

    constructor() {
        /** @type {?Promise<IDBDatabase>} */
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
            };
        });

        return this._dbPromise;
    }

    /**
     * @param {string} id
     * @param {Uint8Array} [passphrase]
     * @returns {Promise<?Key>}
     */
    async get(id, passphrase) {
        /** @type {?KeyRecord} */
        const keyRecord = await this._get(id);
        if (!keyRecord) {
            return null;
        }

        if (!keyRecord.encrypted) {
            return new Key(keyRecord.secret, keyRecord.type);
        }

        if (!passphrase) {
            throw new Error('Passphrase required');
        }

        const plainSecret = await Nimiq.CryptoUtils.decryptOtpKdf(new Nimiq.SerialBuffer(keyRecord.secret), passphrase);
        return new Key(plainSecret, keyRecord.type);
    }

    /**
     * @param {string} id
     * @returns {Promise<?KeyInfo>}
     */
    async getInfo(id) {
        /** @type {?KeyRecord} */
        const keyRecord = await this._get(id);
        return keyRecord ? new KeyInfo(keyRecord.id, keyRecord.type, keyRecord.encrypted) : null;
    }

    /**
     * @param {string} id
     * @returns {Promise<?KeyRecord>}
     * @private
     */
    async _get(id) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME])
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .get(id);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @param {Key} key
     * @param {Uint8Array} [passphrase]
     * @returns {Promise<void>}
     */
    async put(key, passphrase) {
        const secret = !passphrase
            ? key.secret
            : await Nimiq.CryptoUtils.encryptOtpKdf(new Nimiq.SerialBuffer(key.secret), passphrase);

        const keyRecord = /** @type {KeyRecord} */ {
            id: key.id,
            type: key.type,
            encrypted: !!passphrase && passphrase.length > 0,
            secret,
        };

        return this._put(keyRecord);
    }

    /**
     * @param {KeyRecord} keyRecord
     * @returns {Promise<void>}
     */
    async _put(keyRecord) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .put(keyRecord);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async remove(id) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .delete(id);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @returns {Promise<KeyInfo[]>}
     */
    async list() {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readonly')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .openCursor();

        const results = /** KeyRecord[] */ await KeyStore._readAllFromCursor(request);
        return results.map(keyRecord => new KeyInfo(keyRecord.id, keyRecord.type, keyRecord.encrypted));
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
        const keys = await AccountStore.instance.dangerousListPlain();
        keys.forEach(async key => {
            const address = Nimiq.Address.fromUserFriendlyAddress(key.userFriendlyAddress);
            const legacyKeyId = Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(address.serialize()).subarray(0, 6));

            const keyRecord = /** @type {KeyRecord} */ {
                id: legacyKeyId,
                type: Key.Type.LEGACY,
                encrypted: true,
                secret: key.encryptedKeyPair,
            };

            await this._put(keyRecord);
        });

        // FIXME Uncomment after/for testing (and also adapt KeyStoreIndexeddb.spec.js)
        // await AccountStore.instance.drop();

        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Delete migrate cookie
            document.cookie = 'migrate=0; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

            // Delete accounts cookie
            document.cookie = 'accounts=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
    }

    /**
     * @param {IDBRequest} request
     * @returns {Promise<*>}
     * @private
     */
    static _requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
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
/** @type {?KeyStore} */
KeyStore._instance = null;

KeyStore.DB_VERSION = 1;
KeyStore.DB_NAME = 'nimiq-keyguard';
KeyStore.DB_KEY_STORE_NAME = 'keys';
/* global Nimiq */

class Key {
    /**
     * @param {Uint8Array} secret
     * @param {Key.Type} [type]
     */
    constructor(secret, type = Key.Type.BIP39) {
        this._secret = secret;
        this._type = type;
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PublicKey}
     */
    derivePublicKey(path) {
        return Nimiq.PublicKey.derive(this._derivePrivateKey(path));
    }

    /**
     * @param {string} path
     * @returns {Nimiq.Address}
     */
    deriveAddress(path) {
        return this.derivePublicKey(path).toAddress();
    }

    /**
     * @param {string} path
     * @param {Uint8Array} data
     * @returns {Nimiq.Signature}
     */
    sign(path, data) {
        const privateKey = this._derivePrivateKey(path);
        const publicKey = Nimiq.PublicKey.derive(privateKey);
        return Nimiq.Signature.create(privateKey, publicKey, data);
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PrivateKey}
     * @private
     */
    _derivePrivateKey(path) {
        return this._type === Key.Type.LEGACY
            ? new Nimiq.PrivateKey(this._secret)
            : new Nimiq.Entropy(this._secret).toExtendedPrivateKey().derivePath(path).privateKey;
    }

    /**
     * @type {Uint8Array}
     */
    get secret() {
        return this._secret;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {string}
     */
    get id() {
        const input = this._type === Key.Type.LEGACY
            ? Nimiq.PublicKey.derive(new Nimiq.PrivateKey(this._secret)).toAddress().serialize()
            : this._secret;
        return Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(input).subarray(0, 6));
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this.id);
    }

    /**
     * @param {string} id
     * @returns {string}
     */
    static idToUserFriendlyId(id) {
        // Stub
        return `UserFriendly ${id}`;
    }
}
Key.Type = {
    LEGACY: /** @type {Key.Type} */ 0,
    BIP39: /** @type {Key.Type} */ 1,
};
/* global Key */

// eslint-disable-next-line no-unused-vars
class KeyInfo {
    /**
     * @param {string} id
     * @param {Key.Type} type
     * @param {boolean} encrypted
     */
    constructor(id, type, encrypted) {
        /** @private */
        this._id = id;
        /** @private */
        this._type = type;
        /** @private */
        this._encrypted = encrypted;
    }

    /**
     * @type {string}
     */
    get id() {
        return this._id;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {boolean}
     */
    get encrypted() {
        return this._encrypted;
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this._id);
    }

    /**
     * @returns {KeyInfoObject}
     */
    toObject() {
        return {
            id: this.id,
            type: this.type,
            encrypted: this.encrypted,
            // userFriendlyId: this.userFriendlyId,
        };
    }

    /**
     * @param {KeyInfoObject} obj
     * @returns {KeyInfo}
     */
    static fromObject(obj) {
        return new KeyInfo(obj.id, obj.type, obj.encrypted);
    }
}
/* global KeyInfo */

class CookieJar { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyInfo[]} keys
     */
    static fill(keys) {
        const maxAge = 60 * 60 * 24 * 365;
        const encodedKeys = this._encodeCookie(keys);
        document.cookie = `k=${encodedKeys};max-age=${maxAge.toString()}`;
    }

    /**
     * @param {boolean} [listDeprecatedAccounts] - @deprecated Only for database migration
     * @returns {KeyInfo[] | AccountInfo[]}
     */
    static eat(listDeprecatedAccounts) {
        // Legacy cookie
        if (listDeprecatedAccounts) {
            const match = document.cookie.match(new RegExp('accounts=([^;]+)'));
            if (match && match[1]) {
                const decoded = decodeURIComponent(match[1]);
                return JSON.parse(decoded);
            }
            return [];
        }

        const match = document.cookie.match(new RegExp('k=([^;]+)'));
        if (match && match[1]) {
            return this._decodeCookie(match[1]);
        }

        return [];
    }

    /**
     * @param {KeyInfo[]} keys
     * @returns {string}
     */
    static _encodeCookie(keys) {
        return keys.map(keyInfo => `${keyInfo.type}${keyInfo.encrypted ? 1 : 0}${keyInfo.id}`).join('');
    }

    /**
     * @param {string} str
     * @returns {KeyInfo[]}
     */
    static _decodeCookie(str) {
        if (!str) return [];

        if (str.length % 14 !== 0) throw new Error('Malformed cookie');

        const keys = str.match(/.{14}/g);
        if (!keys) return []; // Make TS happy (match() can potentially return NULL)

        return keys.map(key => {
            const type = /** @type {Key.Type} */ (parseInt(key[0], 10));
            const encrypted = key[1] === '1';
            const id = key.substr(2);
            return new KeyInfo(id, type, encrypted);
        });
    }
}
/* global Nimiq */
/* global RpcServer */

/**
 * @returns {string}
 */
function allowedOrigin() {
    switch (window.location.origin) {
    case 'https://keyguard-next.nimiq.com': return 'https://accounts.nimiq.com';
    case 'https://keyguard-next.nimiq-testnet.com': return 'https://accounts.nimiq-testnet.com';
    default: return '*';
    }
}

/**
 * @param {Newable} RequestApiClass - Class object of the API which is to be exposed via postMessage RPC
 * @param {object} [options]
 */
async function runKeyguard(RequestApiClass, options) { // eslint-disable-line no-unused-vars
    const defaultOptions = {
        loadNimiq: true,
        whitelist: ['request'],
    };

    options = Object.assign(defaultOptions, options);

    if (options.loadNimiq) {
        // Load web assembly encryption library into browser (if supported)
        await Nimiq.WasmHelper.doImportBrowser();
        // Configure to use test net for now
        Nimiq.GenesisConfig.test();
    }

    // If user navigates back to loading screen, skip it
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '') {
            window.history.back();
        }
    });

    // Back arrow functionality
    document.body.addEventListener('click', event => {
        // @ts-ignore
        if (!event.target || !event.target.matches('a.page-header-back-button')) return;
        window.history.back();
    });

    // Instantiate handler.
    /** @type {TopLevelApi} */
    const api = new RequestApiClass();

    window.rpcServer = new RpcServer(allowedOrigin());

    // TODO: Use options.whitelist when adding onRequest handlers (iframe uses different methods)
    window.rpcServer.onRequest('request', (state, request) => api.request(request));

    window.rpcServer.init();
}
/* global BrowserDetection */
/* global CookieJar */
/* global AccountStore */
/* global KeyStore */

class IFrameApi { // eslint-disable-line no-unused-vars
    /**
     * @param {boolean} [listFromLegacyStore] - Deprecated, only for database migration
     * @returns {Promise<KeyInfoObject[] | AccountInfo[]>}
     */
    async list(listFromLegacyStore) {
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            return CookieJar.eat(listFromLegacyStore);
        }

        if (listFromLegacyStore) {
            return AccountStore.instance.list();
        }

        const keyInfos = await KeyStore.instance.list();
        return keyInfos.map(ki => ki.toObject());
    }

    /**
     * @returns {Promise<void>}
     * @deprecated Only for database migration
     */
    async migrateAccountsToKeys() {
        /**
         * IndexedDB is not accessible in iframes on iOS browsers and Safari.
         * Thus when the Keyguard client requests the iframe to migrate the
         * database, the iframe needs to signal to the popup that it should run
         * the migration the next time it is opened. Thus this signalling cookie.
         * The cookie is then detected in the TopLevelApi.request() method.
         */
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Set migrate flag cookie
            document.cookie = 'migrate=1;max-age=31536000';
            return;
        }

        // FIXME: Requires Nimiq lib to be loaded, which it currently isn't in the iframe
        await KeyStore.instance.migrateAccountsToKeys();
    }
}
/* global runKeyguard */
/* global IFrameApi */

runKeyguard(IFrameApi, {
    loadNimiq: false,
    whitelist: [
        'list',
        'migrateAccountsToKeys',
    ],
});
// @ts-nocheck
/* eslint-disable */

/**
 * This file was generated from the @nimiq/rpc package source, with `RpcServer` being the only target.
 *
 * HOWTO:
 * - Remove `export * from './RpcClient';` from @nimiq/rpc/src/main.ts
 * - Run `yarn build` in the @nimiq/rpc directory
 * - @nimiq/rpc/dist/rpc.es.js is the wanted module file
 * - The following changes where made to this file afterwards:
 *   https://github.com/nimiq/keyguard-next/pull/93/commits/0a9797cbe195f7eda8b66a75927cc11786ea9625
 */

var ResponseStatus;
(function (ResponseStatus) {
    ResponseStatus["OK"] = "ok";
    ResponseStatus["ERROR"] = "error";
})(ResponseStatus || (ResponseStatus = {}));

/* tslint:disable:no-bitwise */
class Base64 {
    static decode(b64) {
        Base64._initRevLookup();
        const [validLength, placeHoldersLength] = Base64._getLengths(b64);
        const arr = new Uint8Array(Base64._byteLength(validLength, placeHoldersLength));
        let curByte = 0;
        // if there are placeholders, only get up to the last complete 4 chars
        const len = placeHoldersLength > 0 ? validLength - 4 : validLength;
        let i = 0;
        for (; i < len; i += 4) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 18) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] << 12) |
                (Base64._revLookup[b64.charCodeAt(i + 2)] << 6) |
                Base64._revLookup[b64.charCodeAt(i + 3)];
            arr[curByte++] = (tmp >> 16) & 0xFF;
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 2) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 2) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] >> 4);
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 1) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 10) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] << 4) |
                (Base64._revLookup[b64.charCodeAt(i + 2)] >> 2);
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte /*++ not needed*/] = tmp & 0xFF;
        }
        return arr;
    }
    static encode(uint8) {
        const length = uint8.length;
        const extraBytes = length % 3; // if we have 1 byte left, pad 2 bytes
        const parts = [];
        const maxChunkLength = 16383; // must be multiple of 3
        // go through the array every three bytes, we'll deal with trailing stuff later
        for (let i = 0, len2 = length - extraBytes; i < len2; i += maxChunkLength) {
            parts.push(Base64._encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
        }
        // pad the end with zeros, but make sure to not forget the extra bytes
        if (extraBytes === 1) {
            const tmp = uint8[length - 1];
            parts.push(Base64._lookup[tmp >> 2] +
                Base64._lookup[(tmp << 4) & 0x3F] +
                '==');
        }
        else if (extraBytes === 2) {
            const tmp = (uint8[length - 2] << 8) + uint8[length - 1];
            parts.push(Base64._lookup[tmp >> 10] +
                Base64._lookup[(tmp >> 4) & 0x3F] +
                Base64._lookup[(tmp << 2) & 0x3F] +
                '=');
        }
        return parts.join('');
    }
    static _initRevLookup() {
        if (Base64._revLookup.length !== 0)
            return;
        Base64._revLookup = [];
        for (let i = 0, len = Base64._lookup.length; i < len; i++) {
            Base64._revLookup[Base64._lookup.charCodeAt(i)] = i;
        }
        // Support decoding URL-safe base64 strings, as Node.js does.
        // See: https://en.wikipedia.org/wiki/Base64#URL_applications
        Base64._revLookup['-'.charCodeAt(0)] = 62;
        Base64._revLookup['_'.charCodeAt(0)] = 63;
    }
    static _getLengths(b64) {
        const length = b64.length;
        if (length % 4 > 0) {
            throw new Error('Invalid string. Length must be a multiple of 4');
        }
        // Trim off extra bytes after placeholder bytes are found
        // See: https://github.com/beatgammit/base64-js/issues/42
        let validLength = b64.indexOf('=');
        if (validLength === -1)
            validLength = length;
        const placeHoldersLength = validLength === length ? 0 : 4 - (validLength % 4);
        return [validLength, placeHoldersLength];
    }
    static _byteLength(validLength, placeHoldersLength) {
        return ((validLength + placeHoldersLength) * 3 / 4) - placeHoldersLength;
    }
    static _tripletToBase64(num) {
        return Base64._lookup[num >> 18 & 0x3F] +
            Base64._lookup[num >> 12 & 0x3F] +
            Base64._lookup[num >> 6 & 0x3F] +
            Base64._lookup[num & 0x3F];
    }
    static _encodeChunk(uint8, start, end) {
        const output = [];
        for (let i = start; i < end; i += 3) {
            const tmp = ((uint8[i] << 16) & 0xFF0000) +
                ((uint8[i + 1] << 8) & 0xFF00) +
                (uint8[i + 2] & 0xFF);
            output.push(Base64._tripletToBase64(tmp));
        }
        return output.join('');
    }
}
Base64._lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
Base64._revLookup = [];

var ExtraJSONTypes;
(function (ExtraJSONTypes) {
    ExtraJSONTypes[ExtraJSONTypes["UINT8_ARRAY"] = 0] = "UINT8_ARRAY";
})(ExtraJSONTypes || (ExtraJSONTypes = {}));
class JSONUtils {
    static stringify(value) {
        return JSON.stringify(value, JSONUtils._jsonifyType);
    }
    static parse(value) {
        return JSON.parse(value, JSONUtils._parseType);
    }
    static _parseType(key, value) {
        if (value && value.hasOwnProperty &&
            value.hasOwnProperty(JSONUtils.TYPE_SYMBOL) && value.hasOwnProperty(JSONUtils.VALUE_SYMBOL)) {
            switch (value[JSONUtils.TYPE_SYMBOL]) {
                case ExtraJSONTypes.UINT8_ARRAY:
                    return Base64.decode(value[JSONUtils.VALUE_SYMBOL]);
            }
        }
        return value;
    }
    static _jsonifyType(key, value) {
        if (value instanceof Uint8Array) {
            return JSONUtils._typedObject(ExtraJSONTypes.UINT8_ARRAY, Base64.encode(value));
        }
        return value;
    }
    static _typedObject(type, value) {
        const obj = {};
        obj[JSONUtils.TYPE_SYMBOL] = type;
        obj[JSONUtils.VALUE_SYMBOL] = value;
        return obj;
    }
}
JSONUtils.TYPE_SYMBOL = '__';
JSONUtils.VALUE_SYMBOL = 'v';

class UrlRpcEncoder {
    static receiveRedirectCommand(url) {
        // Need referrer for origin check
        if (!document.referrer)
            return null;
        // Parse query
        const params = new URLSearchParams(url.search);
        const referrer = new URL(document.referrer);
        // Ignore messages without a command
        if (!params.has('command'))
            return null;
        // Ignore messages without an ID
        if (!params.has('id'))
            return null;
        // Ignore messages without a valid return path
        if (!params.has('returnURL'))
            return null;
        // Only allow returning to same origin
        const returnURL = new URL(params.get('returnURL'));
        if (returnURL.origin !== referrer.origin)
            return null;
        // Parse args
        let args = [];
        if (params.has('args')) {
            try {
                args = JSONUtils.parse(params.get('args'));
            }
            catch (e) {
                // Do nothing
            }
        }
        args = Array.isArray(args) ? args : [];
        return {
            origin: referrer.origin,
            data: {
                id: parseInt(params.get('id'), 10),
                command: params.get('command'),
                args,
            },
            returnURL: params.get('returnURL'),
        };
    }
    static prepareRedirectReply(state, status, result) {
        const params = new URLSearchParams();
        params.set('status', status);
        params.set('result', JSONUtils.stringify(result));
        params.set('id', state.id.toString());
        // TODO: what if it already includes a query string
        return `${state.returnURL}?${params.toString()}`;
    }
}

class State {
    get id() {
        return this._id;
    }
    get origin() {
        return this._origin;
    }
    get data() {
        return this._data;
    }
    get returnURL() {
        return this._returnURL;
    }
    static fromJSON(json) {
        const obj = JSON.parse(json);
        return new State(obj);
    }
    constructor(message) {
        if (!message.data.id)
            throw Error('Missing id');
        this._origin = message.origin;
        this._id = message.data.id;
        this._returnURL = 'returnURL' in message ? message.returnURL : null;
        this._data = message.data;
    }
    toJSON() {
        const obj = {
            origin: this._origin,
            data: this._data,
        };
        obj.returnURL = this._returnURL;
        return JSON.stringify(obj);
    }
    reply(status, result) {
        console.debug('RpcServer REPLY', result);
        if (status === ResponseStatus.ERROR) {
            // serialize error objects
            result = typeof result === 'object'
                ? { message: result.message, stack: result.stack }
                : { message: result };
        }

        // Send via top-level navigation
        window.location.href = UrlRpcEncoder.prepareRedirectReply(this, status, result);
    }
}

class RpcServer {
    static _ok(state, result) {
        state.reply(ResponseStatus.OK, result);
    }
    static _error(state, error) {
        state.reply(ResponseStatus.ERROR, error);
    }
    constructor(allowedOrigin) {
        this._allowedOrigin = allowedOrigin;
        this._responseHandlers = new Map();
        this._responseHandlers.set('ping', () => 'pong');
        this._receiveListener = this._receive.bind(this);
    }
    onRequest(command, fn) {
        this._responseHandlers.set(command, fn);
    }
    init() {
        window.addEventListener('message', this._receiveListener);
        this._receiveRedirect();
    }
    close() {
        window.removeEventListener('message', this._receiveListener);
    }
    _receiveRedirect() {
        const message = UrlRpcEncoder.receiveRedirectCommand(window.location);
        if (message) {
            this._receive(message);
        }
    }
    _receive(message) {
        let state = null;
        try {
            state = new State(message);
            // Cannot reply to a message that has no return URL
            if (!('returnURL' in message))
                return;
            // Ignore messages without a command
            if (!('command' in state.data)) {
                return;
            }
            if (this._allowedOrigin !== '*' && message.origin !== this._allowedOrigin) {
                throw new Error('Unauthorized');
            }
            const args = message.data.args && Array.isArray(message.data.args) ? message.data.args : [];
            // Test if request calls a valid handler with the correct number of arguments
            if (!this._responseHandlers.has(state.data.command)) {
                throw new Error(`Unknown command: ${state.data.command}`);
            }
            const requestedMethod = this._responseHandlers.get(state.data.command);
            // Do not include state argument
            if (Math.max(requestedMethod.length - 1, 0) < args.length) {
                throw new Error(`Too many arguments passed: ${message}`);
            }
            console.debug('RpcServer ACCEPT', state.data);
            // Call method
            const result = requestedMethod(state, ...args);
            // If a value is returned, we take care of the reply,
            // otherwise we assume the handler to do the reply when appropriate.
            if (result instanceof Promise) {
                result
                    .then((finalResult) => {
                    if (finalResult !== undefined) {
                        RpcServer._ok(state, finalResult);
                    }
                })
                    .catch((error) => RpcServer._error(state, error));
            }
            else if (result !== undefined) {
                RpcServer._ok(state, result);
            }
        }
        catch (error) {
            if (state) {
                RpcServer._error(state, error);
            }
        }
    }
}
class BrowserDetection { // eslint-disable-line no-unused-vars
    /**
     * @returns {boolean}
     */
    static isDesktopSafari() {
        // see https://stackoverflow.com/a/23522755
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !/mobile/i.test(navigator.userAgent);
    }

    /**
     * @returns {boolean}
     */
    static isSafari() {
        return !!navigator.userAgent.match(/Version\/[\d.]+.*Safari/);
    }

    /**
     * @returns {boolean}
     */
    static isIos() {
        // @ts-ignore (MSStream is not on window)
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    /**
     * @returns {number[]}
     */
    static iosVersion() {
        if (BrowserDetection.isIos()) {
            const v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
            if (v) {
                return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || '0', 10)];
            }
        }

        throw new Error('No iOS version detected');
    }

    /**
     * @returns {boolean}
     */
    static isBadIos() {
        const version = this.iosVersion();
        return version[0] < 11 || (version[0] === 11 && version[1] === 2); // Only 11.2 has the WASM bug
    }
}
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
    /** @type {AccountStore} */
    static get instance() {
        /** @type {AccountStore} */
        this._instance = this._instance || new AccountStore();
        return this._instance;
    }

    /**
     * @param {string} dbName
     * @constructor
     */
    constructor(dbName = AccountStore.ACCOUNT_DATABASE) {
        this._dbName = dbName;
        this._dropped = false;
        /** @type {Promise<IDBDatabase>|null} */
        this._dbPromise = null;
    }

    /**
     * @returns {Promise.<IDBDatabase>}
     * @private
     */
    async connect() {
        if (this._dbPromise) return this._dbPromise;

        this._dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this._dbName, AccountStore.VERSION);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => reject(request.error);
            request.onupgradeneeded = () => {
                // account database doesn't exist
                this._dropped = true;
                request.transaction.abort();
                resolve(null);
            };
        });

        return this._dbPromise;
    }

    /**
     * @returns {Promise<AccountInfo[]>}
     */
    async list() {
        const db = await this.connect();
        if (!db) return [];
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
                    /** @type {AccountInfo} */
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
     * @returns {Promise<AccountRecord[]>}
     * @deprecated Only for database migration
     *
     * @description Returns the encrypted keypairs!
     */
    async dangerousListPlain() {
        const db = await this.connect();
        if (!db) return [];
        return new Promise((resolve, reject) => {
            const results = /** @type {AccountRecord[]} */ ([]);
            const openCursorRequest = db.transaction([AccountStore.ACCOUNT_DATABASE], 'readonly')
                .objectStore(AccountStore.ACCOUNT_DATABASE)
                .openCursor();
            openCursorRequest.onsuccess = () => {
                const cursor = openCursorRequest.result;
                if (cursor) {
                    const key = /** @type {AccountRecord} */ (cursor.value);
                    results.push(key);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            openCursorRequest.onerror = () => reject(openCursorRequest.error);
        });
    }

    async close() {
        if (!this._dbPromise) return;
        // If failed to open database (i.e. _dbPromise rejects) we don't need to close the db
        const db = await this._dbPromise.catch(() => null);
        this._dbPromise = null;
        if (db) db.close();
    }

    /**
     * @returns {Promise<void>}
     */
    async drop() {
        if (this._dropped) return Promise.resolve();
        await this.close();

        return new Promise((resolve, reject) => {
            const request = window.indexedDB.deleteDatabase(this._dbName);

            request.onsuccess = () => {
                this._dropped = true;
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }
}

AccountStore.VERSION = 2;
AccountStore.ACCOUNT_DATABASE = 'accounts';
/* global Nimiq */
/* global Key */
/* global KeyInfo */
/* global AccountStore */
/* global BrowserDetection */

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
        /** @type {KeyStore} */
        KeyStore._instance = KeyStore._instance || new KeyStore();
        return KeyStore._instance;
    }

    constructor() {
        /** @type {?Promise<IDBDatabase>} */
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
            };
        });

        return this._dbPromise;
    }

    /**
     * @param {string} id
     * @param {Uint8Array} [passphrase]
     * @returns {Promise<?Key>}
     */
    async get(id, passphrase) {
        /** @type {?KeyRecord} */
        const keyRecord = await this._get(id);
        if (!keyRecord) {
            return null;
        }

        if (!keyRecord.encrypted) {
            return new Key(keyRecord.secret, keyRecord.type);
        }

        if (!passphrase) {
            throw new Error('Passphrase required');
        }

        const plainSecret = await Nimiq.CryptoUtils.decryptOtpKdf(new Nimiq.SerialBuffer(keyRecord.secret), passphrase);
        return new Key(plainSecret, keyRecord.type);
    }

    /**
     * @param {string} id
     * @returns {Promise<?KeyInfo>}
     */
    async getInfo(id) {
        /** @type {?KeyRecord} */
        const keyRecord = await this._get(id);
        return keyRecord ? new KeyInfo(keyRecord.id, keyRecord.type, keyRecord.encrypted) : null;
    }

    /**
     * @param {string} id
     * @returns {Promise<?KeyRecord>}
     * @private
     */
    async _get(id) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME])
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .get(id);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @param {Key} key
     * @param {Uint8Array} [passphrase]
     * @returns {Promise<void>}
     */
    async put(key, passphrase) {
        const secret = !passphrase
            ? key.secret
            : await Nimiq.CryptoUtils.encryptOtpKdf(new Nimiq.SerialBuffer(key.secret), passphrase);

        const keyRecord = /** @type {KeyRecord} */ {
            id: key.id,
            type: key.type,
            encrypted: !!passphrase && passphrase.length > 0,
            secret,
        };

        return this._put(keyRecord);
    }

    /**
     * @param {KeyRecord} keyRecord
     * @returns {Promise<void>}
     */
    async _put(keyRecord) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .put(keyRecord);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async remove(id) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .delete(id);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @returns {Promise<KeyInfo[]>}
     */
    async list() {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readonly')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .openCursor();

        const results = /** KeyRecord[] */ await KeyStore._readAllFromCursor(request);
        return results.map(keyRecord => new KeyInfo(keyRecord.id, keyRecord.type, keyRecord.encrypted));
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
        const keys = await AccountStore.instance.dangerousListPlain();
        keys.forEach(async key => {
            const address = Nimiq.Address.fromUserFriendlyAddress(key.userFriendlyAddress);
            const legacyKeyId = Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(address.serialize()).subarray(0, 6));

            const keyRecord = /** @type {KeyRecord} */ {
                id: legacyKeyId,
                type: Key.Type.LEGACY,
                encrypted: true,
                secret: key.encryptedKeyPair,
            };

            await this._put(keyRecord);
        });

        // FIXME Uncomment after/for testing (and also adapt KeyStoreIndexeddb.spec.js)
        // await AccountStore.instance.drop();

        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Delete migrate cookie
            document.cookie = 'migrate=0; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

            // Delete accounts cookie
            document.cookie = 'accounts=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
    }

    /**
     * @param {IDBRequest} request
     * @returns {Promise<*>}
     * @private
     */
    static _requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
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
/** @type {?KeyStore} */
KeyStore._instance = null;

KeyStore.DB_VERSION = 1;
KeyStore.DB_NAME = 'nimiq-keyguard';
KeyStore.DB_KEY_STORE_NAME = 'keys';
/* global Nimiq */

class Key {
    /**
     * @param {Uint8Array} secret
     * @param {Key.Type} [type]
     */
    constructor(secret, type = Key.Type.BIP39) {
        this._secret = secret;
        this._type = type;
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PublicKey}
     */
    derivePublicKey(path) {
        return Nimiq.PublicKey.derive(this._derivePrivateKey(path));
    }

    /**
     * @param {string} path
     * @returns {Nimiq.Address}
     */
    deriveAddress(path) {
        return this.derivePublicKey(path).toAddress();
    }

    /**
     * @param {string} path
     * @param {Uint8Array} data
     * @returns {Nimiq.Signature}
     */
    sign(path, data) {
        const privateKey = this._derivePrivateKey(path);
        const publicKey = Nimiq.PublicKey.derive(privateKey);
        return Nimiq.Signature.create(privateKey, publicKey, data);
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PrivateKey}
     * @private
     */
    _derivePrivateKey(path) {
        return this._type === Key.Type.LEGACY
            ? new Nimiq.PrivateKey(this._secret)
            : new Nimiq.Entropy(this._secret).toExtendedPrivateKey().derivePath(path).privateKey;
    }

    /**
     * @type {Uint8Array}
     */
    get secret() {
        return this._secret;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {string}
     */
    get id() {
        const input = this._type === Key.Type.LEGACY
            ? Nimiq.PublicKey.derive(new Nimiq.PrivateKey(this._secret)).toAddress().serialize()
            : this._secret;
        return Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(input).subarray(0, 6));
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this.id);
    }

    /**
     * @param {string} id
     * @returns {string}
     */
    static idToUserFriendlyId(id) {
        // Stub
        return `UserFriendly ${id}`;
    }
}
Key.Type = {
    LEGACY: /** @type {Key.Type} */ 0,
    BIP39: /** @type {Key.Type} */ 1,
};
/* global Key */

// eslint-disable-next-line no-unused-vars
class KeyInfo {
    /**
     * @param {string} id
     * @param {Key.Type} type
     * @param {boolean} encrypted
     */
    constructor(id, type, encrypted) {
        /** @private */
        this._id = id;
        /** @private */
        this._type = type;
        /** @private */
        this._encrypted = encrypted;
    }

    /**
     * @type {string}
     */
    get id() {
        return this._id;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {boolean}
     */
    get encrypted() {
        return this._encrypted;
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this._id);
    }

    /**
     * @returns {KeyInfoObject}
     */
    toObject() {
        return {
            id: this.id,
            type: this.type,
            encrypted: this.encrypted,
            // userFriendlyId: this.userFriendlyId,
        };
    }

    /**
     * @param {KeyInfoObject} obj
     * @returns {KeyInfo}
     */
    static fromObject(obj) {
        return new KeyInfo(obj.id, obj.type, obj.encrypted);
    }
}
/* global KeyInfo */

class CookieJar { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyInfo[]} keys
     */
    static fill(keys) {
        const maxAge = 60 * 60 * 24 * 365;
        const encodedKeys = this._encodeCookie(keys);
        document.cookie = `k=${encodedKeys};max-age=${maxAge.toString()}`;
    }

    /**
     * @param {boolean} [listDeprecatedAccounts] - @deprecated Only for database migration
     * @returns {KeyInfo[] | AccountInfo[]}
     */
    static eat(listDeprecatedAccounts) {
        // Legacy cookie
        if (listDeprecatedAccounts) {
            const match = document.cookie.match(new RegExp('accounts=([^;]+)'));
            if (match && match[1]) {
                const decoded = decodeURIComponent(match[1]);
                return JSON.parse(decoded);
            }
            return [];
        }

        const match = document.cookie.match(new RegExp('k=([^;]+)'));
        if (match && match[1]) {
            return this._decodeCookie(match[1]);
        }

        return [];
    }

    /**
     * @param {KeyInfo[]} keys
     * @returns {string}
     */
    static _encodeCookie(keys) {
        return keys.map(keyInfo => `${keyInfo.type}${keyInfo.encrypted ? 1 : 0}${keyInfo.id}`).join('');
    }

    /**
     * @param {string} str
     * @returns {KeyInfo[]}
     */
    static _decodeCookie(str) {
        if (!str) return [];

        if (str.length % 14 !== 0) throw new Error('Malformed cookie');

        const keys = str.match(/.{14}/g);
        if (!keys) return []; // Make TS happy (match() can potentially return NULL)

        return keys.map(key => {
            const type = /** @type {Key.Type} */ (parseInt(key[0], 10));
            const encrypted = key[1] === '1';
            const id = key.substr(2);
            return new KeyInfo(id, type, encrypted);
        });
    }
}
/* global Nimiq */
/* global RpcServer */

/**
 * @returns {string}
 */
function allowedOrigin() {
    switch (window.location.origin) {
    case 'https://keyguard-next.nimiq.com': return 'https://accounts.nimiq.com';
    case 'https://keyguard-next.nimiq-testnet.com': return 'https://accounts.nimiq-testnet.com';
    default: return '*';
    }
}

/**
 * @param {Newable} RequestApiClass - Class object of the API which is to be exposed via postMessage RPC
 * @param {object} [options]
 */
async function runKeyguard(RequestApiClass, options) { // eslint-disable-line no-unused-vars
    const defaultOptions = {
        loadNimiq: true,
        whitelist: ['request'],
    };

    options = Object.assign(defaultOptions, options);

    if (options.loadNimiq) {
        // Load web assembly encryption library into browser (if supported)
        await Nimiq.WasmHelper.doImportBrowser();
        // Configure to use test net for now
        Nimiq.GenesisConfig.test();
    }

    // If user navigates back to loading screen, skip it
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '') {
            window.history.back();
        }
    });

    // Back arrow functionality
    document.body.addEventListener('click', event => {
        // @ts-ignore
        if (!event.target || !event.target.matches('a.page-header-back-button')) return;
        window.history.back();
    });

    // Instantiate handler.
    /** @type {TopLevelApi} */
    const api = new RequestApiClass();

    window.rpcServer = new RpcServer(allowedOrigin());

    // TODO: Use options.whitelist when adding onRequest handlers (iframe uses different methods)
    window.rpcServer.onRequest('request', (state, request) => api.request(request));

    window.rpcServer.init();
}
/* global BrowserDetection */
/* global CookieJar */
/* global AccountStore */
/* global KeyStore */

class IFrameApi { // eslint-disable-line no-unused-vars
    /**
     * @param {boolean} [listFromLegacyStore] - Deprecated, only for database migration
     * @returns {Promise<KeyInfoObject[] | AccountInfo[]>}
     */
    async list(listFromLegacyStore) {
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            return CookieJar.eat(listFromLegacyStore);
        }

        if (listFromLegacyStore) {
            return AccountStore.instance.list();
        }

        const keyInfos = await KeyStore.instance.list();
        return keyInfos.map(ki => ki.toObject());
    }

    /**
     * @returns {Promise<void>}
     * @deprecated Only for database migration
     */
    async migrateAccountsToKeys() {
        /**
         * IndexedDB is not accessible in iframes on iOS browsers and Safari.
         * Thus when the Keyguard client requests the iframe to migrate the
         * database, the iframe needs to signal to the popup that it should run
         * the migration the next time it is opened. Thus this signalling cookie.
         * The cookie is then detected in the TopLevelApi.request() method.
         */
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Set migrate flag cookie
            document.cookie = 'migrate=1;max-age=31536000';
            return;
        }

        // FIXME: Requires Nimiq lib to be loaded, which it currently isn't in the iframe
        await KeyStore.instance.migrateAccountsToKeys();
    }
}
/* global runKeyguard */
/* global IFrameApi */

runKeyguard(IFrameApi, {
    loadNimiq: false,
    whitelist: [
        'list',
        'migrateAccountsToKeys',
    ],
});
// @ts-nocheck
/* eslint-disable */

/**
 * This file was generated from the @nimiq/rpc package source, with `RpcServer` being the only target.
 *
 * HOWTO:
 * - Remove `export * from './RpcClient';` from @nimiq/rpc/src/main.ts
 * - Run `yarn build` in the @nimiq/rpc directory
 * - @nimiq/rpc/dist/rpc.es.js is the wanted module file
 * - The following changes where made to this file afterwards:
 *   https://github.com/nimiq/keyguard-next/pull/93/commits/0a9797cbe195f7eda8b66a75927cc11786ea9625
 */

var ResponseStatus;
(function (ResponseStatus) {
    ResponseStatus["OK"] = "ok";
    ResponseStatus["ERROR"] = "error";
})(ResponseStatus || (ResponseStatus = {}));

/* tslint:disable:no-bitwise */
class Base64 {
    static decode(b64) {
        Base64._initRevLookup();
        const [validLength, placeHoldersLength] = Base64._getLengths(b64);
        const arr = new Uint8Array(Base64._byteLength(validLength, placeHoldersLength));
        let curByte = 0;
        // if there are placeholders, only get up to the last complete 4 chars
        const len = placeHoldersLength > 0 ? validLength - 4 : validLength;
        let i = 0;
        for (; i < len; i += 4) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 18) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] << 12) |
                (Base64._revLookup[b64.charCodeAt(i + 2)] << 6) |
                Base64._revLookup[b64.charCodeAt(i + 3)];
            arr[curByte++] = (tmp >> 16) & 0xFF;
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 2) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 2) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] >> 4);
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 1) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 10) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] << 4) |
                (Base64._revLookup[b64.charCodeAt(i + 2)] >> 2);
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte /*++ not needed*/] = tmp & 0xFF;
        }
        return arr;
    }
    static encode(uint8) {
        const length = uint8.length;
        const extraBytes = length % 3; // if we have 1 byte left, pad 2 bytes
        const parts = [];
        const maxChunkLength = 16383; // must be multiple of 3
        // go through the array every three bytes, we'll deal with trailing stuff later
        for (let i = 0, len2 = length - extraBytes; i < len2; i += maxChunkLength) {
            parts.push(Base64._encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
        }
        // pad the end with zeros, but make sure to not forget the extra bytes
        if (extraBytes === 1) {
            const tmp = uint8[length - 1];
            parts.push(Base64._lookup[tmp >> 2] +
                Base64._lookup[(tmp << 4) & 0x3F] +
                '==');
        }
        else if (extraBytes === 2) {
            const tmp = (uint8[length - 2] << 8) + uint8[length - 1];
            parts.push(Base64._lookup[tmp >> 10] +
                Base64._lookup[(tmp >> 4) & 0x3F] +
                Base64._lookup[(tmp << 2) & 0x3F] +
                '=');
        }
        return parts.join('');
    }
    static _initRevLookup() {
        if (Base64._revLookup.length !== 0)
            return;
        Base64._revLookup = [];
        for (let i = 0, len = Base64._lookup.length; i < len; i++) {
            Base64._revLookup[Base64._lookup.charCodeAt(i)] = i;
        }
        // Support decoding URL-safe base64 strings, as Node.js does.
        // See: https://en.wikipedia.org/wiki/Base64#URL_applications
        Base64._revLookup['-'.charCodeAt(0)] = 62;
        Base64._revLookup['_'.charCodeAt(0)] = 63;
    }
    static _getLengths(b64) {
        const length = b64.length;
        if (length % 4 > 0) {
            throw new Error('Invalid string. Length must be a multiple of 4');
        }
        // Trim off extra bytes after placeholder bytes are found
        // See: https://github.com/beatgammit/base64-js/issues/42
        let validLength = b64.indexOf('=');
        if (validLength === -1)
            validLength = length;
        const placeHoldersLength = validLength === length ? 0 : 4 - (validLength % 4);
        return [validLength, placeHoldersLength];
    }
    static _byteLength(validLength, placeHoldersLength) {
        return ((validLength + placeHoldersLength) * 3 / 4) - placeHoldersLength;
    }
    static _tripletToBase64(num) {
        return Base64._lookup[num >> 18 & 0x3F] +
            Base64._lookup[num >> 12 & 0x3F] +
            Base64._lookup[num >> 6 & 0x3F] +
            Base64._lookup[num & 0x3F];
    }
    static _encodeChunk(uint8, start, end) {
        const output = [];
        for (let i = start; i < end; i += 3) {
            const tmp = ((uint8[i] << 16) & 0xFF0000) +
                ((uint8[i + 1] << 8) & 0xFF00) +
                (uint8[i + 2] & 0xFF);
            output.push(Base64._tripletToBase64(tmp));
        }
        return output.join('');
    }
}
Base64._lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
Base64._revLookup = [];

var ExtraJSONTypes;
(function (ExtraJSONTypes) {
    ExtraJSONTypes[ExtraJSONTypes["UINT8_ARRAY"] = 0] = "UINT8_ARRAY";
})(ExtraJSONTypes || (ExtraJSONTypes = {}));
class JSONUtils {
    static stringify(value) {
        return JSON.stringify(value, JSONUtils._jsonifyType);
    }
    static parse(value) {
        return JSON.parse(value, JSONUtils._parseType);
    }
    static _parseType(key, value) {
        if (value && value.hasOwnProperty &&
            value.hasOwnProperty(JSONUtils.TYPE_SYMBOL) && value.hasOwnProperty(JSONUtils.VALUE_SYMBOL)) {
            switch (value[JSONUtils.TYPE_SYMBOL]) {
                case ExtraJSONTypes.UINT8_ARRAY:
                    return Base64.decode(value[JSONUtils.VALUE_SYMBOL]);
            }
        }
        return value;
    }
    static _jsonifyType(key, value) {
        if (value instanceof Uint8Array) {
            return JSONUtils._typedObject(ExtraJSONTypes.UINT8_ARRAY, Base64.encode(value));
        }
        return value;
    }
    static _typedObject(type, value) {
        const obj = {};
        obj[JSONUtils.TYPE_SYMBOL] = type;
        obj[JSONUtils.VALUE_SYMBOL] = value;
        return obj;
    }
}
JSONUtils.TYPE_SYMBOL = '__';
JSONUtils.VALUE_SYMBOL = 'v';

class UrlRpcEncoder {
    static receiveRedirectCommand(url) {
        // Need referrer for origin check
        if (!document.referrer)
            return null;
        // Parse query
        const params = new URLSearchParams(url.search);
        const referrer = new URL(document.referrer);
        // Ignore messages without a command
        if (!params.has('command'))
            return null;
        // Ignore messages without an ID
        if (!params.has('id'))
            return null;
        // Ignore messages without a valid return path
        if (!params.has('returnURL'))
            return null;
        // Only allow returning to same origin
        const returnURL = new URL(params.get('returnURL'));
        if (returnURL.origin !== referrer.origin)
            return null;
        // Parse args
        let args = [];
        if (params.has('args')) {
            try {
                args = JSONUtils.parse(params.get('args'));
            }
            catch (e) {
                // Do nothing
            }
        }
        args = Array.isArray(args) ? args : [];
        return {
            origin: referrer.origin,
            data: {
                id: parseInt(params.get('id'), 10),
                command: params.get('command'),
                args,
            },
            returnURL: params.get('returnURL'),
        };
    }
    static prepareRedirectReply(state, status, result) {
        const params = new URLSearchParams();
        params.set('status', status);
        params.set('result', JSONUtils.stringify(result));
        params.set('id', state.id.toString());
        // TODO: what if it already includes a query string
        return `${state.returnURL}?${params.toString()}`;
    }
}

class State {
    get id() {
        return this._id;
    }
    get origin() {
        return this._origin;
    }
    get data() {
        return this._data;
    }
    get returnURL() {
        return this._returnURL;
    }
    static fromJSON(json) {
        const obj = JSON.parse(json);
        return new State(obj);
    }
    constructor(message) {
        if (!message.data.id)
            throw Error('Missing id');
        this._origin = message.origin;
        this._id = message.data.id;
        this._returnURL = 'returnURL' in message ? message.returnURL : null;
        this._data = message.data;
    }
    toJSON() {
        const obj = {
            origin: this._origin,
            data: this._data,
        };
        obj.returnURL = this._returnURL;
        return JSON.stringify(obj);
    }
    reply(status, result) {
        console.debug('RpcServer REPLY', result);
        if (status === ResponseStatus.ERROR) {
            // serialize error objects
            result = typeof result === 'object'
                ? { message: result.message, stack: result.stack }
                : { message: result };
        }

        // Send via top-level navigation
        window.location.href = UrlRpcEncoder.prepareRedirectReply(this, status, result);
    }
}

class RpcServer {
    static _ok(state, result) {
        state.reply(ResponseStatus.OK, result);
    }
    static _error(state, error) {
        state.reply(ResponseStatus.ERROR, error);
    }
    constructor(allowedOrigin) {
        this._allowedOrigin = allowedOrigin;
        this._responseHandlers = new Map();
        this._responseHandlers.set('ping', () => 'pong');
        this._receiveListener = this._receive.bind(this);
    }
    onRequest(command, fn) {
        this._responseHandlers.set(command, fn);
    }
    init() {
        window.addEventListener('message', this._receiveListener);
        this._receiveRedirect();
    }
    close() {
        window.removeEventListener('message', this._receiveListener);
    }
    _receiveRedirect() {
        const message = UrlRpcEncoder.receiveRedirectCommand(window.location);
        if (message) {
            this._receive(message);
        }
    }
    _receive(message) {
        let state = null;
        try {
            state = new State(message);
            // Cannot reply to a message that has no return URL
            if (!('returnURL' in message))
                return;
            // Ignore messages without a command
            if (!('command' in state.data)) {
                return;
            }
            if (this._allowedOrigin !== '*' && message.origin !== this._allowedOrigin) {
                throw new Error('Unauthorized');
            }
            const args = message.data.args && Array.isArray(message.data.args) ? message.data.args : [];
            // Test if request calls a valid handler with the correct number of arguments
            if (!this._responseHandlers.has(state.data.command)) {
                throw new Error(`Unknown command: ${state.data.command}`);
            }
            const requestedMethod = this._responseHandlers.get(state.data.command);
            // Do not include state argument
            if (Math.max(requestedMethod.length - 1, 0) < args.length) {
                throw new Error(`Too many arguments passed: ${message}`);
            }
            console.debug('RpcServer ACCEPT', state.data);
            // Call method
            const result = requestedMethod(state, ...args);
            // If a value is returned, we take care of the reply,
            // otherwise we assume the handler to do the reply when appropriate.
            if (result instanceof Promise) {
                result
                    .then((finalResult) => {
                    if (finalResult !== undefined) {
                        RpcServer._ok(state, finalResult);
                    }
                })
                    .catch((error) => RpcServer._error(state, error));
            }
            else if (result !== undefined) {
                RpcServer._ok(state, result);
            }
        }
        catch (error) {
            if (state) {
                RpcServer._error(state, error);
            }
        }
    }
}
class BrowserDetection { // eslint-disable-line no-unused-vars
    /**
     * @returns {boolean}
     */
    static isDesktopSafari() {
        // see https://stackoverflow.com/a/23522755
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !/mobile/i.test(navigator.userAgent);
    }

    /**
     * @returns {boolean}
     */
    static isSafari() {
        return !!navigator.userAgent.match(/Version\/[\d.]+.*Safari/);
    }

    /**
     * @returns {boolean}
     */
    static isIos() {
        // @ts-ignore (MSStream is not on window)
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    /**
     * @returns {number[]}
     */
    static iosVersion() {
        if (BrowserDetection.isIos()) {
            const v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
            if (v) {
                return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || '0', 10)];
            }
        }

        throw new Error('No iOS version detected');
    }

    /**
     * @returns {boolean}
     */
    static isBadIos() {
        const version = this.iosVersion();
        return version[0] < 11 || (version[0] === 11 && version[1] === 2); // Only 11.2 has the WASM bug
    }
}
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
    /** @type {AccountStore} */
    static get instance() {
        /** @type {AccountStore} */
        this._instance = this._instance || new AccountStore();
        return this._instance;
    }

    /**
     * @param {string} dbName
     * @constructor
     */
    constructor(dbName = AccountStore.ACCOUNT_DATABASE) {
        this._dbName = dbName;
        this._dropped = false;
        /** @type {Promise<IDBDatabase>|null} */
        this._dbPromise = null;
    }

    /**
     * @returns {Promise.<IDBDatabase>}
     * @private
     */
    async connect() {
        if (this._dbPromise) return this._dbPromise;

        this._dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this._dbName, AccountStore.VERSION);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => reject(request.error);
            request.onupgradeneeded = () => {
                // account database doesn't exist
                this._dropped = true;
                request.transaction.abort();
                resolve(null);
            };
        });

        return this._dbPromise;
    }

    /**
     * @returns {Promise<AccountInfo[]>}
     */
    async list() {
        const db = await this.connect();
        if (!db) return [];
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
                    /** @type {AccountInfo} */
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
     * @returns {Promise<AccountRecord[]>}
     * @deprecated Only for database migration
     *
     * @description Returns the encrypted keypairs!
     */
    async dangerousListPlain() {
        const db = await this.connect();
        if (!db) return [];
        return new Promise((resolve, reject) => {
            const results = /** @type {AccountRecord[]} */ ([]);
            const openCursorRequest = db.transaction([AccountStore.ACCOUNT_DATABASE], 'readonly')
                .objectStore(AccountStore.ACCOUNT_DATABASE)
                .openCursor();
            openCursorRequest.onsuccess = () => {
                const cursor = openCursorRequest.result;
                if (cursor) {
                    const key = /** @type {AccountRecord} */ (cursor.value);
                    results.push(key);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            openCursorRequest.onerror = () => reject(openCursorRequest.error);
        });
    }

    async close() {
        if (!this._dbPromise) return;
        // If failed to open database (i.e. _dbPromise rejects) we don't need to close the db
        const db = await this._dbPromise.catch(() => null);
        this._dbPromise = null;
        if (db) db.close();
    }

    /**
     * @returns {Promise<void>}
     */
    async drop() {
        if (this._dropped) return Promise.resolve();
        await this.close();

        return new Promise((resolve, reject) => {
            const request = window.indexedDB.deleteDatabase(this._dbName);

            request.onsuccess = () => {
                this._dropped = true;
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }
}

AccountStore.VERSION = 2;
AccountStore.ACCOUNT_DATABASE = 'accounts';
/* global Nimiq */
/* global Key */
/* global KeyInfo */
/* global AccountStore */
/* global BrowserDetection */

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
        /** @type {KeyStore} */
        KeyStore._instance = KeyStore._instance || new KeyStore();
        return KeyStore._instance;
    }

    constructor() {
        /** @type {?Promise<IDBDatabase>} */
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
            };
        });

        return this._dbPromise;
    }

    /**
     * @param {string} id
     * @param {Uint8Array} [passphrase]
     * @returns {Promise<?Key>}
     */
    async get(id, passphrase) {
        /** @type {?KeyRecord} */
        const keyRecord = await this._get(id);
        if (!keyRecord) {
            return null;
        }

        if (!keyRecord.encrypted) {
            return new Key(keyRecord.secret, keyRecord.type);
        }

        if (!passphrase) {
            throw new Error('Passphrase required');
        }

        const plainSecret = await Nimiq.CryptoUtils.decryptOtpKdf(new Nimiq.SerialBuffer(keyRecord.secret), passphrase);
        return new Key(plainSecret, keyRecord.type);
    }

    /**
     * @param {string} id
     * @returns {Promise<?KeyInfo>}
     */
    async getInfo(id) {
        /** @type {?KeyRecord} */
        const keyRecord = await this._get(id);
        return keyRecord ? new KeyInfo(keyRecord.id, keyRecord.type, keyRecord.encrypted) : null;
    }

    /**
     * @param {string} id
     * @returns {Promise<?KeyRecord>}
     * @private
     */
    async _get(id) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME])
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .get(id);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @param {Key} key
     * @param {Uint8Array} [passphrase]
     * @returns {Promise<void>}
     */
    async put(key, passphrase) {
        const secret = !passphrase
            ? key.secret
            : await Nimiq.CryptoUtils.encryptOtpKdf(new Nimiq.SerialBuffer(key.secret), passphrase);

        const keyRecord = /** @type {KeyRecord} */ {
            id: key.id,
            type: key.type,
            encrypted: !!passphrase && passphrase.length > 0,
            secret,
        };

        return this._put(keyRecord);
    }

    /**
     * @param {KeyRecord} keyRecord
     * @returns {Promise<void>}
     */
    async _put(keyRecord) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .put(keyRecord);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async remove(id) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .delete(id);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @returns {Promise<KeyInfo[]>}
     */
    async list() {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readonly')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .openCursor();

        const results = /** KeyRecord[] */ await KeyStore._readAllFromCursor(request);
        return results.map(keyRecord => new KeyInfo(keyRecord.id, keyRecord.type, keyRecord.encrypted));
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
        const keys = await AccountStore.instance.dangerousListPlain();
        keys.forEach(async key => {
            const address = Nimiq.Address.fromUserFriendlyAddress(key.userFriendlyAddress);
            const legacyKeyId = Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(address.serialize()).subarray(0, 6));

            const keyRecord = /** @type {KeyRecord} */ {
                id: legacyKeyId,
                type: Key.Type.LEGACY,
                encrypted: true,
                secret: key.encryptedKeyPair,
            };

            await this._put(keyRecord);
        });

        // FIXME Uncomment after/for testing (and also adapt KeyStoreIndexeddb.spec.js)
        // await AccountStore.instance.drop();

        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Delete migrate cookie
            document.cookie = 'migrate=0; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

            // Delete accounts cookie
            document.cookie = 'accounts=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
    }

    /**
     * @param {IDBRequest} request
     * @returns {Promise<*>}
     * @private
     */
    static _requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
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
/** @type {?KeyStore} */
KeyStore._instance = null;

KeyStore.DB_VERSION = 1;
KeyStore.DB_NAME = 'nimiq-keyguard';
KeyStore.DB_KEY_STORE_NAME = 'keys';
/* global Nimiq */

class Key {
    /**
     * @param {Uint8Array} secret
     * @param {Key.Type} [type]
     */
    constructor(secret, type = Key.Type.BIP39) {
        this._secret = secret;
        this._type = type;
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PublicKey}
     */
    derivePublicKey(path) {
        return Nimiq.PublicKey.derive(this._derivePrivateKey(path));
    }

    /**
     * @param {string} path
     * @returns {Nimiq.Address}
     */
    deriveAddress(path) {
        return this.derivePublicKey(path).toAddress();
    }

    /**
     * @param {string} path
     * @param {Uint8Array} data
     * @returns {Nimiq.Signature}
     */
    sign(path, data) {
        const privateKey = this._derivePrivateKey(path);
        const publicKey = Nimiq.PublicKey.derive(privateKey);
        return Nimiq.Signature.create(privateKey, publicKey, data);
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PrivateKey}
     * @private
     */
    _derivePrivateKey(path) {
        return this._type === Key.Type.LEGACY
            ? new Nimiq.PrivateKey(this._secret)
            : new Nimiq.Entropy(this._secret).toExtendedPrivateKey().derivePath(path).privateKey;
    }

    /**
     * @type {Uint8Array}
     */
    get secret() {
        return this._secret;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {string}
     */
    get id() {
        const input = this._type === Key.Type.LEGACY
            ? Nimiq.PublicKey.derive(new Nimiq.PrivateKey(this._secret)).toAddress().serialize()
            : this._secret;
        return Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(input).subarray(0, 6));
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this.id);
    }

    /**
     * @param {string} id
     * @returns {string}
     */
    static idToUserFriendlyId(id) {
        // Stub
        return `UserFriendly ${id}`;
    }
}
Key.Type = {
    LEGACY: /** @type {Key.Type} */ 0,
    BIP39: /** @type {Key.Type} */ 1,
};
/* global Key */

// eslint-disable-next-line no-unused-vars
class KeyInfo {
    /**
     * @param {string} id
     * @param {Key.Type} type
     * @param {boolean} encrypted
     */
    constructor(id, type, encrypted) {
        /** @private */
        this._id = id;
        /** @private */
        this._type = type;
        /** @private */
        this._encrypted = encrypted;
    }

    /**
     * @type {string}
     */
    get id() {
        return this._id;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {boolean}
     */
    get encrypted() {
        return this._encrypted;
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this._id);
    }

    /**
     * @returns {KeyInfoObject}
     */
    toObject() {
        return {
            id: this.id,
            type: this.type,
            encrypted: this.encrypted,
            // userFriendlyId: this.userFriendlyId,
        };
    }

    /**
     * @param {KeyInfoObject} obj
     * @returns {KeyInfo}
     */
    static fromObject(obj) {
        return new KeyInfo(obj.id, obj.type, obj.encrypted);
    }
}
/* global KeyInfo */

class CookieJar { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyInfo[]} keys
     */
    static fill(keys) {
        const maxAge = 60 * 60 * 24 * 365;
        const encodedKeys = this._encodeCookie(keys);
        document.cookie = `k=${encodedKeys};max-age=${maxAge.toString()}`;
    }

    /**
     * @param {boolean} [listDeprecatedAccounts] - @deprecated Only for database migration
     * @returns {KeyInfo[] | AccountInfo[]}
     */
    static eat(listDeprecatedAccounts) {
        // Legacy cookie
        if (listDeprecatedAccounts) {
            const match = document.cookie.match(new RegExp('accounts=([^;]+)'));
            if (match && match[1]) {
                const decoded = decodeURIComponent(match[1]);
                return JSON.parse(decoded);
            }
            return [];
        }

        const match = document.cookie.match(new RegExp('k=([^;]+)'));
        if (match && match[1]) {
            return this._decodeCookie(match[1]);
        }

        return [];
    }

    /**
     * @param {KeyInfo[]} keys
     * @returns {string}
     */
    static _encodeCookie(keys) {
        return keys.map(keyInfo => `${keyInfo.type}${keyInfo.encrypted ? 1 : 0}${keyInfo.id}`).join('');
    }

    /**
     * @param {string} str
     * @returns {KeyInfo[]}
     */
    static _decodeCookie(str) {
        if (!str) return [];

        if (str.length % 14 !== 0) throw new Error('Malformed cookie');

        const keys = str.match(/.{14}/g);
        if (!keys) return []; // Make TS happy (match() can potentially return NULL)

        return keys.map(key => {
            const type = /** @type {Key.Type} */ (parseInt(key[0], 10));
            const encrypted = key[1] === '1';
            const id = key.substr(2);
            return new KeyInfo(id, type, encrypted);
        });
    }
}
/* global Nimiq */
/* global RpcServer */

/**
 * @returns {string}
 */
function allowedOrigin() {
    switch (window.location.origin) {
    case 'https://keyguard-next.nimiq.com': return 'https://accounts.nimiq.com';
    case 'https://keyguard-next.nimiq-testnet.com': return 'https://accounts.nimiq-testnet.com';
    default: return '*';
    }
}

/**
 * @param {Newable} RequestApiClass - Class object of the API which is to be exposed via postMessage RPC
 * @param {object} [options]
 */
async function runKeyguard(RequestApiClass, options) { // eslint-disable-line no-unused-vars
    const defaultOptions = {
        loadNimiq: true,
        whitelist: ['request'],
    };

    options = Object.assign(defaultOptions, options);

    if (options.loadNimiq) {
        // Load web assembly encryption library into browser (if supported)
        await Nimiq.WasmHelper.doImportBrowser();
        // Configure to use test net for now
        Nimiq.GenesisConfig.test();
    }

    // If user navigates back to loading screen, skip it
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '') {
            window.history.back();
        }
    });

    // Back arrow functionality
    document.body.addEventListener('click', event => {
        // @ts-ignore
        if (!event.target || !event.target.matches('a.page-header-back-button')) return;
        window.history.back();
    });

    // Instantiate handler.
    /** @type {TopLevelApi} */
    const api = new RequestApiClass();

    window.rpcServer = new RpcServer(allowedOrigin());

    // TODO: Use options.whitelist when adding onRequest handlers (iframe uses different methods)
    window.rpcServer.onRequest('request', (state, request) => api.request(request));

    window.rpcServer.init();
}
/* global BrowserDetection */
/* global CookieJar */
/* global AccountStore */
/* global KeyStore */

class IFrameApi { // eslint-disable-line no-unused-vars
    /**
     * @param {boolean} [listFromLegacyStore] - Deprecated, only for database migration
     * @returns {Promise<KeyInfoObject[] | AccountInfo[]>}
     */
    async list(listFromLegacyStore) {
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            return CookieJar.eat(listFromLegacyStore);
        }

        if (listFromLegacyStore) {
            return AccountStore.instance.list();
        }

        const keyInfos = await KeyStore.instance.list();
        return keyInfos.map(ki => ki.toObject());
    }

    /**
     * @returns {Promise<void>}
     * @deprecated Only for database migration
     */
    async migrateAccountsToKeys() {
        /**
         * IndexedDB is not accessible in iframes on iOS browsers and Safari.
         * Thus when the Keyguard client requests the iframe to migrate the
         * database, the iframe needs to signal to the popup that it should run
         * the migration the next time it is opened. Thus this signalling cookie.
         * The cookie is then detected in the TopLevelApi.request() method.
         */
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Set migrate flag cookie
            document.cookie = 'migrate=1;max-age=31536000';
            return;
        }

        // FIXME: Requires Nimiq lib to be loaded, which it currently isn't in the iframe
        await KeyStore.instance.migrateAccountsToKeys();
    }
}
/* global runKeyguard */
/* global IFrameApi */

runKeyguard(IFrameApi, {
    loadNimiq: false,
    whitelist: [
        'list',
        'migrateAccountsToKeys',
    ],
});
// @ts-nocheck
/* eslint-disable */

/**
 * This file was generated from the @nimiq/rpc package source, with `RpcServer` being the only target.
 *
 * HOWTO:
 * - Remove `export * from './RpcClient';` from @nimiq/rpc/src/main.ts
 * - Run `yarn build` in the @nimiq/rpc directory
 * - @nimiq/rpc/dist/rpc.es.js is the wanted module file
 * - The following changes where made to this file afterwards:
 *   https://github.com/nimiq/keyguard-next/pull/93/commits/0a9797cbe195f7eda8b66a75927cc11786ea9625
 */

var ResponseStatus;
(function (ResponseStatus) {
    ResponseStatus["OK"] = "ok";
    ResponseStatus["ERROR"] = "error";
})(ResponseStatus || (ResponseStatus = {}));

/* tslint:disable:no-bitwise */
class Base64 {
    static decode(b64) {
        Base64._initRevLookup();
        const [validLength, placeHoldersLength] = Base64._getLengths(b64);
        const arr = new Uint8Array(Base64._byteLength(validLength, placeHoldersLength));
        let curByte = 0;
        // if there are placeholders, only get up to the last complete 4 chars
        const len = placeHoldersLength > 0 ? validLength - 4 : validLength;
        let i = 0;
        for (; i < len; i += 4) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 18) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] << 12) |
                (Base64._revLookup[b64.charCodeAt(i + 2)] << 6) |
                Base64._revLookup[b64.charCodeAt(i + 3)];
            arr[curByte++] = (tmp >> 16) & 0xFF;
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 2) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 2) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] >> 4);
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 1) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 10) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] << 4) |
                (Base64._revLookup[b64.charCodeAt(i + 2)] >> 2);
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte /*++ not needed*/] = tmp & 0xFF;
        }
        return arr;
    }
    static encode(uint8) {
        const length = uint8.length;
        const extraBytes = length % 3; // if we have 1 byte left, pad 2 bytes
        const parts = [];
        const maxChunkLength = 16383; // must be multiple of 3
        // go through the array every three bytes, we'll deal with trailing stuff later
        for (let i = 0, len2 = length - extraBytes; i < len2; i += maxChunkLength) {
            parts.push(Base64._encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
        }
        // pad the end with zeros, but make sure to not forget the extra bytes
        if (extraBytes === 1) {
            const tmp = uint8[length - 1];
            parts.push(Base64._lookup[tmp >> 2] +
                Base64._lookup[(tmp << 4) & 0x3F] +
                '==');
        }
        else if (extraBytes === 2) {
            const tmp = (uint8[length - 2] << 8) + uint8[length - 1];
            parts.push(Base64._lookup[tmp >> 10] +
                Base64._lookup[(tmp >> 4) & 0x3F] +
                Base64._lookup[(tmp << 2) & 0x3F] +
                '=');
        }
        return parts.join('');
    }
    static _initRevLookup() {
        if (Base64._revLookup.length !== 0)
            return;
        Base64._revLookup = [];
        for (let i = 0, len = Base64._lookup.length; i < len; i++) {
            Base64._revLookup[Base64._lookup.charCodeAt(i)] = i;
        }
        // Support decoding URL-safe base64 strings, as Node.js does.
        // See: https://en.wikipedia.org/wiki/Base64#URL_applications
        Base64._revLookup['-'.charCodeAt(0)] = 62;
        Base64._revLookup['_'.charCodeAt(0)] = 63;
    }
    static _getLengths(b64) {
        const length = b64.length;
        if (length % 4 > 0) {
            throw new Error('Invalid string. Length must be a multiple of 4');
        }
        // Trim off extra bytes after placeholder bytes are found
        // See: https://github.com/beatgammit/base64-js/issues/42
        let validLength = b64.indexOf('=');
        if (validLength === -1)
            validLength = length;
        const placeHoldersLength = validLength === length ? 0 : 4 - (validLength % 4);
        return [validLength, placeHoldersLength];
    }
    static _byteLength(validLength, placeHoldersLength) {
        return ((validLength + placeHoldersLength) * 3 / 4) - placeHoldersLength;
    }
    static _tripletToBase64(num) {
        return Base64._lookup[num >> 18 & 0x3F] +
            Base64._lookup[num >> 12 & 0x3F] +
            Base64._lookup[num >> 6 & 0x3F] +
            Base64._lookup[num & 0x3F];
    }
    static _encodeChunk(uint8, start, end) {
        const output = [];
        for (let i = start; i < end; i += 3) {
            const tmp = ((uint8[i] << 16) & 0xFF0000) +
                ((uint8[i + 1] << 8) & 0xFF00) +
                (uint8[i + 2] & 0xFF);
            output.push(Base64._tripletToBase64(tmp));
        }
        return output.join('');
    }
}
Base64._lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
Base64._revLookup = [];

var ExtraJSONTypes;
(function (ExtraJSONTypes) {
    ExtraJSONTypes[ExtraJSONTypes["UINT8_ARRAY"] = 0] = "UINT8_ARRAY";
})(ExtraJSONTypes || (ExtraJSONTypes = {}));
class JSONUtils {
    static stringify(value) {
        return JSON.stringify(value, JSONUtils._jsonifyType);
    }
    static parse(value) {
        return JSON.parse(value, JSONUtils._parseType);
    }
    static _parseType(key, value) {
        if (value && value.hasOwnProperty &&
            value.hasOwnProperty(JSONUtils.TYPE_SYMBOL) && value.hasOwnProperty(JSONUtils.VALUE_SYMBOL)) {
            switch (value[JSONUtils.TYPE_SYMBOL]) {
                case ExtraJSONTypes.UINT8_ARRAY:
                    return Base64.decode(value[JSONUtils.VALUE_SYMBOL]);
            }
        }
        return value;
    }
    static _jsonifyType(key, value) {
        if (value instanceof Uint8Array) {
            return JSONUtils._typedObject(ExtraJSONTypes.UINT8_ARRAY, Base64.encode(value));
        }
        return value;
    }
    static _typedObject(type, value) {
        const obj = {};
        obj[JSONUtils.TYPE_SYMBOL] = type;
        obj[JSONUtils.VALUE_SYMBOL] = value;
        return obj;
    }
}
JSONUtils.TYPE_SYMBOL = '__';
JSONUtils.VALUE_SYMBOL = 'v';

class UrlRpcEncoder {
    static receiveRedirectCommand(url) {
        // Need referrer for origin check
        if (!document.referrer)
            return null;
        // Parse query
        const params = new URLSearchParams(url.search);
        const referrer = new URL(document.referrer);
        // Ignore messages without a command
        if (!params.has('command'))
            return null;
        // Ignore messages without an ID
        if (!params.has('id'))
            return null;
        // Ignore messages without a valid return path
        if (!params.has('returnURL'))
            return null;
        // Only allow returning to same origin
        const returnURL = new URL(params.get('returnURL'));
        if (returnURL.origin !== referrer.origin)
            return null;
        // Parse args
        let args = [];
        if (params.has('args')) {
            try {
                args = JSONUtils.parse(params.get('args'));
            }
            catch (e) {
                // Do nothing
            }
        }
        args = Array.isArray(args) ? args : [];
        return {
            origin: referrer.origin,
            data: {
                id: parseInt(params.get('id'), 10),
                command: params.get('command'),
                args,
            },
            returnURL: params.get('returnURL'),
        };
    }
    static prepareRedirectReply(state, status, result) {
        const params = new URLSearchParams();
        params.set('status', status);
        params.set('result', JSONUtils.stringify(result));
        params.set('id', state.id.toString());
        // TODO: what if it already includes a query string
        return `${state.returnURL}?${params.toString()}`;
    }
}

class State {
    get id() {
        return this._id;
    }
    get origin() {
        return this._origin;
    }
    get data() {
        return this._data;
    }
    get returnURL() {
        return this._returnURL;
    }
    static fromJSON(json) {
        const obj = JSON.parse(json);
        return new State(obj);
    }
    constructor(message) {
        if (!message.data.id)
            throw Error('Missing id');
        this._origin = message.origin;
        this._id = message.data.id;
        this._returnURL = 'returnURL' in message ? message.returnURL : null;
        this._data = message.data;
    }
    toJSON() {
        const obj = {
            origin: this._origin,
            data: this._data,
        };
        obj.returnURL = this._returnURL;
        return JSON.stringify(obj);
    }
    reply(status, result) {
        console.debug('RpcServer REPLY', result);
        if (status === ResponseStatus.ERROR) {
            // serialize error objects
            result = typeof result === 'object'
                ? { message: result.message, stack: result.stack }
                : { message: result };
        }

        // Send via top-level navigation
        window.location.href = UrlRpcEncoder.prepareRedirectReply(this, status, result);
    }
}

class RpcServer {
    static _ok(state, result) {
        state.reply(ResponseStatus.OK, result);
    }
    static _error(state, error) {
        state.reply(ResponseStatus.ERROR, error);
    }
    constructor(allowedOrigin) {
        this._allowedOrigin = allowedOrigin;
        this._responseHandlers = new Map();
        this._responseHandlers.set('ping', () => 'pong');
        this._receiveListener = this._receive.bind(this);
    }
    onRequest(command, fn) {
        this._responseHandlers.set(command, fn);
    }
    init() {
        window.addEventListener('message', this._receiveListener);
        this._receiveRedirect();
    }
    close() {
        window.removeEventListener('message', this._receiveListener);
    }
    _receiveRedirect() {
        const message = UrlRpcEncoder.receiveRedirectCommand(window.location);
        if (message) {
            this._receive(message);
        }
    }
    _receive(message) {
        let state = null;
        try {
            state = new State(message);
            // Cannot reply to a message that has no return URL
            if (!('returnURL' in message))
                return;
            // Ignore messages without a command
            if (!('command' in state.data)) {
                return;
            }
            if (this._allowedOrigin !== '*' && message.origin !== this._allowedOrigin) {
                throw new Error('Unauthorized');
            }
            const args = message.data.args && Array.isArray(message.data.args) ? message.data.args : [];
            // Test if request calls a valid handler with the correct number of arguments
            if (!this._responseHandlers.has(state.data.command)) {
                throw new Error(`Unknown command: ${state.data.command}`);
            }
            const requestedMethod = this._responseHandlers.get(state.data.command);
            // Do not include state argument
            if (Math.max(requestedMethod.length - 1, 0) < args.length) {
                throw new Error(`Too many arguments passed: ${message}`);
            }
            console.debug('RpcServer ACCEPT', state.data);
            // Call method
            const result = requestedMethod(state, ...args);
            // If a value is returned, we take care of the reply,
            // otherwise we assume the handler to do the reply when appropriate.
            if (result instanceof Promise) {
                result
                    .then((finalResult) => {
                    if (finalResult !== undefined) {
                        RpcServer._ok(state, finalResult);
                    }
                })
                    .catch((error) => RpcServer._error(state, error));
            }
            else if (result !== undefined) {
                RpcServer._ok(state, result);
            }
        }
        catch (error) {
            if (state) {
                RpcServer._error(state, error);
            }
        }
    }
}
class BrowserDetection { // eslint-disable-line no-unused-vars
    /**
     * @returns {boolean}
     */
    static isDesktopSafari() {
        // see https://stackoverflow.com/a/23522755
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !/mobile/i.test(navigator.userAgent);
    }

    /**
     * @returns {boolean}
     */
    static isSafari() {
        return !!navigator.userAgent.match(/Version\/[\d.]+.*Safari/);
    }

    /**
     * @returns {boolean}
     */
    static isIos() {
        // @ts-ignore (MSStream is not on window)
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    /**
     * @returns {number[]}
     */
    static iosVersion() {
        if (BrowserDetection.isIos()) {
            const v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
            if (v) {
                return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || '0', 10)];
            }
        }

        throw new Error('No iOS version detected');
    }

    /**
     * @returns {boolean}
     */
    static isBadIos() {
        const version = this.iosVersion();
        return version[0] < 11 || (version[0] === 11 && version[1] === 2); // Only 11.2 has the WASM bug
    }
}
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
    /** @type {AccountStore} */
    static get instance() {
        /** @type {AccountStore} */
        this._instance = this._instance || new AccountStore();
        return this._instance;
    }

    /**
     * @param {string} dbName
     * @constructor
     */
    constructor(dbName = AccountStore.ACCOUNT_DATABASE) {
        this._dbName = dbName;
        this._dropped = false;
        /** @type {Promise<IDBDatabase>|null} */
        this._dbPromise = null;
    }

    /**
     * @returns {Promise.<IDBDatabase>}
     * @private
     */
    async connect() {
        if (this._dbPromise) return this._dbPromise;

        this._dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this._dbName, AccountStore.VERSION);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => reject(request.error);
            request.onupgradeneeded = () => {
                // account database doesn't exist
                this._dropped = true;
                request.transaction.abort();
                resolve(null);
            };
        });

        return this._dbPromise;
    }

    /**
     * @returns {Promise<AccountInfo[]>}
     */
    async list() {
        const db = await this.connect();
        if (!db) return [];
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
                    /** @type {AccountInfo} */
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
     * @returns {Promise<AccountRecord[]>}
     * @deprecated Only for database migration
     *
     * @description Returns the encrypted keypairs!
     */
    async dangerousListPlain() {
        const db = await this.connect();
        if (!db) return [];
        return new Promise((resolve, reject) => {
            const results = /** @type {AccountRecord[]} */ ([]);
            const openCursorRequest = db.transaction([AccountStore.ACCOUNT_DATABASE], 'readonly')
                .objectStore(AccountStore.ACCOUNT_DATABASE)
                .openCursor();
            openCursorRequest.onsuccess = () => {
                const cursor = openCursorRequest.result;
                if (cursor) {
                    const key = /** @type {AccountRecord} */ (cursor.value);
                    results.push(key);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            openCursorRequest.onerror = () => reject(openCursorRequest.error);
        });
    }

    async close() {
        if (!this._dbPromise) return;
        // If failed to open database (i.e. _dbPromise rejects) we don't need to close the db
        const db = await this._dbPromise.catch(() => null);
        this._dbPromise = null;
        if (db) db.close();
    }

    /**
     * @returns {Promise<void>}
     */
    async drop() {
        if (this._dropped) return Promise.resolve();
        await this.close();

        return new Promise((resolve, reject) => {
            const request = window.indexedDB.deleteDatabase(this._dbName);

            request.onsuccess = () => {
                this._dropped = true;
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }
}

AccountStore.VERSION = 2;
AccountStore.ACCOUNT_DATABASE = 'accounts';
/* global Nimiq */
/* global Key */
/* global KeyInfo */
/* global AccountStore */
/* global BrowserDetection */

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
        /** @type {KeyStore} */
        KeyStore._instance = KeyStore._instance || new KeyStore();
        return KeyStore._instance;
    }

    constructor() {
        /** @type {?Promise<IDBDatabase>} */
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
            };
        });

        return this._dbPromise;
    }

    /**
     * @param {string} id
     * @param {Uint8Array} [passphrase]
     * @returns {Promise<?Key>}
     */
    async get(id, passphrase) {
        /** @type {?KeyRecord} */
        const keyRecord = await this._get(id);
        if (!keyRecord) {
            return null;
        }

        if (!keyRecord.encrypted) {
            return new Key(keyRecord.secret, keyRecord.type);
        }

        if (!passphrase) {
            throw new Error('Passphrase required');
        }

        const plainSecret = await Nimiq.CryptoUtils.decryptOtpKdf(new Nimiq.SerialBuffer(keyRecord.secret), passphrase);
        return new Key(plainSecret, keyRecord.type);
    }

    /**
     * @param {string} id
     * @returns {Promise<?KeyInfo>}
     */
    async getInfo(id) {
        /** @type {?KeyRecord} */
        const keyRecord = await this._get(id);
        return keyRecord ? new KeyInfo(keyRecord.id, keyRecord.type, keyRecord.encrypted) : null;
    }

    /**
     * @param {string} id
     * @returns {Promise<?KeyRecord>}
     * @private
     */
    async _get(id) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME])
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .get(id);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @param {Key} key
     * @param {Uint8Array} [passphrase]
     * @returns {Promise<void>}
     */
    async put(key, passphrase) {
        const secret = !passphrase
            ? key.secret
            : await Nimiq.CryptoUtils.encryptOtpKdf(new Nimiq.SerialBuffer(key.secret), passphrase);

        const keyRecord = /** @type {KeyRecord} */ {
            id: key.id,
            type: key.type,
            encrypted: !!passphrase && passphrase.length > 0,
            secret,
        };

        return this._put(keyRecord);
    }

    /**
     * @param {KeyRecord} keyRecord
     * @returns {Promise<void>}
     */
    async _put(keyRecord) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .put(keyRecord);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async remove(id) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .delete(id);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @returns {Promise<KeyInfo[]>}
     */
    async list() {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readonly')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .openCursor();

        const results = /** KeyRecord[] */ await KeyStore._readAllFromCursor(request);
        return results.map(keyRecord => new KeyInfo(keyRecord.id, keyRecord.type, keyRecord.encrypted));
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
        const keys = await AccountStore.instance.dangerousListPlain();
        keys.forEach(async key => {
            const address = Nimiq.Address.fromUserFriendlyAddress(key.userFriendlyAddress);
            const legacyKeyId = Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(address.serialize()).subarray(0, 6));

            const keyRecord = /** @type {KeyRecord} */ {
                id: legacyKeyId,
                type: Key.Type.LEGACY,
                encrypted: true,
                secret: key.encryptedKeyPair,
            };

            await this._put(keyRecord);
        });

        // FIXME Uncomment after/for testing (and also adapt KeyStoreIndexeddb.spec.js)
        // await AccountStore.instance.drop();

        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Delete migrate cookie
            document.cookie = 'migrate=0; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

            // Delete accounts cookie
            document.cookie = 'accounts=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
    }

    /**
     * @param {IDBRequest} request
     * @returns {Promise<*>}
     * @private
     */
    static _requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
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
/** @type {?KeyStore} */
KeyStore._instance = null;

KeyStore.DB_VERSION = 1;
KeyStore.DB_NAME = 'nimiq-keyguard';
KeyStore.DB_KEY_STORE_NAME = 'keys';
/* global Nimiq */

class Key {
    /**
     * @param {Uint8Array} secret
     * @param {Key.Type} [type]
     */
    constructor(secret, type = Key.Type.BIP39) {
        this._secret = secret;
        this._type = type;
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PublicKey}
     */
    derivePublicKey(path) {
        return Nimiq.PublicKey.derive(this._derivePrivateKey(path));
    }

    /**
     * @param {string} path
     * @returns {Nimiq.Address}
     */
    deriveAddress(path) {
        return this.derivePublicKey(path).toAddress();
    }

    /**
     * @param {string} path
     * @param {Uint8Array} data
     * @returns {Nimiq.Signature}
     */
    sign(path, data) {
        const privateKey = this._derivePrivateKey(path);
        const publicKey = Nimiq.PublicKey.derive(privateKey);
        return Nimiq.Signature.create(privateKey, publicKey, data);
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PrivateKey}
     * @private
     */
    _derivePrivateKey(path) {
        return this._type === Key.Type.LEGACY
            ? new Nimiq.PrivateKey(this._secret)
            : new Nimiq.Entropy(this._secret).toExtendedPrivateKey().derivePath(path).privateKey;
    }

    /**
     * @type {Uint8Array}
     */
    get secret() {
        return this._secret;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {string}
     */
    get id() {
        const input = this._type === Key.Type.LEGACY
            ? Nimiq.PublicKey.derive(new Nimiq.PrivateKey(this._secret)).toAddress().serialize()
            : this._secret;
        return Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(input).subarray(0, 6));
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this.id);
    }

    /**
     * @param {string} id
     * @returns {string}
     */
    static idToUserFriendlyId(id) {
        // Stub
        return `UserFriendly ${id}`;
    }
}
Key.Type = {
    LEGACY: /** @type {Key.Type} */ 0,
    BIP39: /** @type {Key.Type} */ 1,
};
/* global Key */

// eslint-disable-next-line no-unused-vars
class KeyInfo {
    /**
     * @param {string} id
     * @param {Key.Type} type
     * @param {boolean} encrypted
     */
    constructor(id, type, encrypted) {
        /** @private */
        this._id = id;
        /** @private */
        this._type = type;
        /** @private */
        this._encrypted = encrypted;
    }

    /**
     * @type {string}
     */
    get id() {
        return this._id;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {boolean}
     */
    get encrypted() {
        return this._encrypted;
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this._id);
    }

    /**
     * @returns {KeyInfoObject}
     */
    toObject() {
        return {
            id: this.id,
            type: this.type,
            encrypted: this.encrypted,
            // userFriendlyId: this.userFriendlyId,
        };
    }

    /**
     * @param {KeyInfoObject} obj
     * @returns {KeyInfo}
     */
    static fromObject(obj) {
        return new KeyInfo(obj.id, obj.type, obj.encrypted);
    }
}
/* global KeyInfo */

class CookieJar { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyInfo[]} keys
     */
    static fill(keys) {
        const maxAge = 60 * 60 * 24 * 365;
        const encodedKeys = this._encodeCookie(keys);
        document.cookie = `k=${encodedKeys};max-age=${maxAge.toString()}`;
    }

    /**
     * @param {boolean} [listDeprecatedAccounts] - @deprecated Only for database migration
     * @returns {KeyInfo[] | AccountInfo[]}
     */
    static eat(listDeprecatedAccounts) {
        // Legacy cookie
        if (listDeprecatedAccounts) {
            const match = document.cookie.match(new RegExp('accounts=([^;]+)'));
            if (match && match[1]) {
                const decoded = decodeURIComponent(match[1]);
                return JSON.parse(decoded);
            }
            return [];
        }

        const match = document.cookie.match(new RegExp('k=([^;]+)'));
        if (match && match[1]) {
            return this._decodeCookie(match[1]);
        }

        return [];
    }

    /**
     * @param {KeyInfo[]} keys
     * @returns {string}
     */
    static _encodeCookie(keys) {
        return keys.map(keyInfo => `${keyInfo.type}${keyInfo.encrypted ? 1 : 0}${keyInfo.id}`).join('');
    }

    /**
     * @param {string} str
     * @returns {KeyInfo[]}
     */
    static _decodeCookie(str) {
        if (!str) return [];

        if (str.length % 14 !== 0) throw new Error('Malformed cookie');

        const keys = str.match(/.{14}/g);
        if (!keys) return []; // Make TS happy (match() can potentially return NULL)

        return keys.map(key => {
            const type = /** @type {Key.Type} */ (parseInt(key[0], 10));
            const encrypted = key[1] === '1';
            const id = key.substr(2);
            return new KeyInfo(id, type, encrypted);
        });
    }
}
/* global Nimiq */
/* global RpcServer */

/**
 * @returns {string}
 */
function allowedOrigin() {
    switch (window.location.origin) {
    case 'https://keyguard-next.nimiq.com': return 'https://accounts.nimiq.com';
    case 'https://keyguard-next.nimiq-testnet.com': return 'https://accounts.nimiq-testnet.com';
    default: return '*';
    }
}

/**
 * @param {Newable} RequestApiClass - Class object of the API which is to be exposed via postMessage RPC
 * @param {object} [options]
 */
async function runKeyguard(RequestApiClass, options) { // eslint-disable-line no-unused-vars
    const defaultOptions = {
        loadNimiq: true,
        whitelist: ['request'],
    };

    options = Object.assign(defaultOptions, options);

    if (options.loadNimiq) {
        // Load web assembly encryption library into browser (if supported)
        await Nimiq.WasmHelper.doImportBrowser();
        // Configure to use test net for now
        Nimiq.GenesisConfig.test();
    }

    // If user navigates back to loading screen, skip it
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '') {
            window.history.back();
        }
    });

    // Back arrow functionality
    document.body.addEventListener('click', event => {
        // @ts-ignore
        if (!event.target || !event.target.matches('a.page-header-back-button')) return;
        window.history.back();
    });

    // Instantiate handler.
    /** @type {TopLevelApi} */
    const api = new RequestApiClass();

    window.rpcServer = new RpcServer(allowedOrigin());

    // TODO: Use options.whitelist when adding onRequest handlers (iframe uses different methods)
    window.rpcServer.onRequest('request', (state, request) => api.request(request));

    window.rpcServer.init();
}
/* global BrowserDetection */
/* global CookieJar */
/* global AccountStore */
/* global KeyStore */

class IFrameApi { // eslint-disable-line no-unused-vars
    /**
     * @param {boolean} [listFromLegacyStore] - Deprecated, only for database migration
     * @returns {Promise<KeyInfoObject[] | AccountInfo[]>}
     */
    async list(listFromLegacyStore) {
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            return CookieJar.eat(listFromLegacyStore);
        }

        if (listFromLegacyStore) {
            return AccountStore.instance.list();
        }

        const keyInfos = await KeyStore.instance.list();
        return keyInfos.map(ki => ki.toObject());
    }

    /**
     * @returns {Promise<void>}
     * @deprecated Only for database migration
     */
    async migrateAccountsToKeys() {
        /**
         * IndexedDB is not accessible in iframes on iOS browsers and Safari.
         * Thus when the Keyguard client requests the iframe to migrate the
         * database, the iframe needs to signal to the popup that it should run
         * the migration the next time it is opened. Thus this signalling cookie.
         * The cookie is then detected in the TopLevelApi.request() method.
         */
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Set migrate flag cookie
            document.cookie = 'migrate=1;max-age=31536000';
            return;
        }

        // FIXME: Requires Nimiq lib to be loaded, which it currently isn't in the iframe
        await KeyStore.instance.migrateAccountsToKeys();
    }
}
/* global runKeyguard */
/* global IFrameApi */

runKeyguard(IFrameApi, {
    loadNimiq: false,
    whitelist: [
        'list',
        'migrateAccountsToKeys',
    ],
});
// @ts-nocheck
/* eslint-disable */

/**
 * This file was generated from the @nimiq/rpc package source, with `RpcServer` being the only target.
 *
 * HOWTO:
 * - Remove `export * from './RpcClient';` from @nimiq/rpc/src/main.ts
 * - Run `yarn build` in the @nimiq/rpc directory
 * - @nimiq/rpc/dist/rpc.es.js is the wanted module file
 * - The following changes where made to this file afterwards:
 *   https://github.com/nimiq/keyguard-next/pull/93/commits/0a9797cbe195f7eda8b66a75927cc11786ea9625
 */

var ResponseStatus;
(function (ResponseStatus) {
    ResponseStatus["OK"] = "ok";
    ResponseStatus["ERROR"] = "error";
})(ResponseStatus || (ResponseStatus = {}));

/* tslint:disable:no-bitwise */
class Base64 {
    static decode(b64) {
        Base64._initRevLookup();
        const [validLength, placeHoldersLength] = Base64._getLengths(b64);
        const arr = new Uint8Array(Base64._byteLength(validLength, placeHoldersLength));
        let curByte = 0;
        // if there are placeholders, only get up to the last complete 4 chars
        const len = placeHoldersLength > 0 ? validLength - 4 : validLength;
        let i = 0;
        for (; i < len; i += 4) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 18) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] << 12) |
                (Base64._revLookup[b64.charCodeAt(i + 2)] << 6) |
                Base64._revLookup[b64.charCodeAt(i + 3)];
            arr[curByte++] = (tmp >> 16) & 0xFF;
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 2) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 2) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] >> 4);
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 1) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 10) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] << 4) |
                (Base64._revLookup[b64.charCodeAt(i + 2)] >> 2);
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte /*++ not needed*/] = tmp & 0xFF;
        }
        return arr;
    }
    static encode(uint8) {
        const length = uint8.length;
        const extraBytes = length % 3; // if we have 1 byte left, pad 2 bytes
        const parts = [];
        const maxChunkLength = 16383; // must be multiple of 3
        // go through the array every three bytes, we'll deal with trailing stuff later
        for (let i = 0, len2 = length - extraBytes; i < len2; i += maxChunkLength) {
            parts.push(Base64._encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
        }
        // pad the end with zeros, but make sure to not forget the extra bytes
        if (extraBytes === 1) {
            const tmp = uint8[length - 1];
            parts.push(Base64._lookup[tmp >> 2] +
                Base64._lookup[(tmp << 4) & 0x3F] +
                '==');
        }
        else if (extraBytes === 2) {
            const tmp = (uint8[length - 2] << 8) + uint8[length - 1];
            parts.push(Base64._lookup[tmp >> 10] +
                Base64._lookup[(tmp >> 4) & 0x3F] +
                Base64._lookup[(tmp << 2) & 0x3F] +
                '=');
        }
        return parts.join('');
    }
    static _initRevLookup() {
        if (Base64._revLookup.length !== 0)
            return;
        Base64._revLookup = [];
        for (let i = 0, len = Base64._lookup.length; i < len; i++) {
            Base64._revLookup[Base64._lookup.charCodeAt(i)] = i;
        }
        // Support decoding URL-safe base64 strings, as Node.js does.
        // See: https://en.wikipedia.org/wiki/Base64#URL_applications
        Base64._revLookup['-'.charCodeAt(0)] = 62;
        Base64._revLookup['_'.charCodeAt(0)] = 63;
    }
    static _getLengths(b64) {
        const length = b64.length;
        if (length % 4 > 0) {
            throw new Error('Invalid string. Length must be a multiple of 4');
        }
        // Trim off extra bytes after placeholder bytes are found
        // See: https://github.com/beatgammit/base64-js/issues/42
        let validLength = b64.indexOf('=');
        if (validLength === -1)
            validLength = length;
        const placeHoldersLength = validLength === length ? 0 : 4 - (validLength % 4);
        return [validLength, placeHoldersLength];
    }
    static _byteLength(validLength, placeHoldersLength) {
        return ((validLength + placeHoldersLength) * 3 / 4) - placeHoldersLength;
    }
    static _tripletToBase64(num) {
        return Base64._lookup[num >> 18 & 0x3F] +
            Base64._lookup[num >> 12 & 0x3F] +
            Base64._lookup[num >> 6 & 0x3F] +
            Base64._lookup[num & 0x3F];
    }
    static _encodeChunk(uint8, start, end) {
        const output = [];
        for (let i = start; i < end; i += 3) {
            const tmp = ((uint8[i] << 16) & 0xFF0000) +
                ((uint8[i + 1] << 8) & 0xFF00) +
                (uint8[i + 2] & 0xFF);
            output.push(Base64._tripletToBase64(tmp));
        }
        return output.join('');
    }
}
Base64._lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
Base64._revLookup = [];

var ExtraJSONTypes;
(function (ExtraJSONTypes) {
    ExtraJSONTypes[ExtraJSONTypes["UINT8_ARRAY"] = 0] = "UINT8_ARRAY";
})(ExtraJSONTypes || (ExtraJSONTypes = {}));
class JSONUtils {
    static stringify(value) {
        return JSON.stringify(value, JSONUtils._jsonifyType);
    }
    static parse(value) {
        return JSON.parse(value, JSONUtils._parseType);
    }
    static _parseType(key, value) {
        if (value && value.hasOwnProperty &&
            value.hasOwnProperty(JSONUtils.TYPE_SYMBOL) && value.hasOwnProperty(JSONUtils.VALUE_SYMBOL)) {
            switch (value[JSONUtils.TYPE_SYMBOL]) {
                case ExtraJSONTypes.UINT8_ARRAY:
                    return Base64.decode(value[JSONUtils.VALUE_SYMBOL]);
            }
        }
        return value;
    }
    static _jsonifyType(key, value) {
        if (value instanceof Uint8Array) {
            return JSONUtils._typedObject(ExtraJSONTypes.UINT8_ARRAY, Base64.encode(value));
        }
        return value;
    }
    static _typedObject(type, value) {
        const obj = {};
        obj[JSONUtils.TYPE_SYMBOL] = type;
        obj[JSONUtils.VALUE_SYMBOL] = value;
        return obj;
    }
}
JSONUtils.TYPE_SYMBOL = '__';
JSONUtils.VALUE_SYMBOL = 'v';

class UrlRpcEncoder {
    static receiveRedirectCommand(url) {
        // Need referrer for origin check
        if (!document.referrer)
            return null;
        // Parse query
        const params = new URLSearchParams(url.search);
        const referrer = new URL(document.referrer);
        // Ignore messages without a command
        if (!params.has('command'))
            return null;
        // Ignore messages without an ID
        if (!params.has('id'))
            return null;
        // Ignore messages without a valid return path
        if (!params.has('returnURL'))
            return null;
        // Only allow returning to same origin
        const returnURL = new URL(params.get('returnURL'));
        if (returnURL.origin !== referrer.origin)
            return null;
        // Parse args
        let args = [];
        if (params.has('args')) {
            try {
                args = JSONUtils.parse(params.get('args'));
            }
            catch (e) {
                // Do nothing
            }
        }
        args = Array.isArray(args) ? args : [];
        return {
            origin: referrer.origin,
            data: {
                id: parseInt(params.get('id'), 10),
                command: params.get('command'),
                args,
            },
            returnURL: params.get('returnURL'),
        };
    }
    static prepareRedirectReply(state, status, result) {
        const params = new URLSearchParams();
        params.set('status', status);
        params.set('result', JSONUtils.stringify(result));
        params.set('id', state.id.toString());
        // TODO: what if it already includes a query string
        return `${state.returnURL}?${params.toString()}`;
    }
}

class State {
    get id() {
        return this._id;
    }
    get origin() {
        return this._origin;
    }
    get data() {
        return this._data;
    }
    get returnURL() {
        return this._returnURL;
    }
    static fromJSON(json) {
        const obj = JSON.parse(json);
        return new State(obj);
    }
    constructor(message) {
        if (!message.data.id)
            throw Error('Missing id');
        this._origin = message.origin;
        this._id = message.data.id;
        this._returnURL = 'returnURL' in message ? message.returnURL : null;
        this._data = message.data;
    }
    toJSON() {
        const obj = {
            origin: this._origin,
            data: this._data,
        };
        obj.returnURL = this._returnURL;
        return JSON.stringify(obj);
    }
    reply(status, result) {
        console.debug('RpcServer REPLY', result);
        if (status === ResponseStatus.ERROR) {
            // serialize error objects
            result = typeof result === 'object'
                ? { message: result.message, stack: result.stack }
                : { message: result };
        }

        // Send via top-level navigation
        window.location.href = UrlRpcEncoder.prepareRedirectReply(this, status, result);
    }
}

class RpcServer {
    static _ok(state, result) {
        state.reply(ResponseStatus.OK, result);
    }
    static _error(state, error) {
        state.reply(ResponseStatus.ERROR, error);
    }
    constructor(allowedOrigin) {
        this._allowedOrigin = allowedOrigin;
        this._responseHandlers = new Map();
        this._responseHandlers.set('ping', () => 'pong');
        this._receiveListener = this._receive.bind(this);
    }
    onRequest(command, fn) {
        this._responseHandlers.set(command, fn);
    }
    init() {
        window.addEventListener('message', this._receiveListener);
        this._receiveRedirect();
    }
    close() {
        window.removeEventListener('message', this._receiveListener);
    }
    _receiveRedirect() {
        const message = UrlRpcEncoder.receiveRedirectCommand(window.location);
        if (message) {
            this._receive(message);
        }
    }
    _receive(message) {
        let state = null;
        try {
            state = new State(message);
            // Cannot reply to a message that has no return URL
            if (!('returnURL' in message))
                return;
            // Ignore messages without a command
            if (!('command' in state.data)) {
                return;
            }
            if (this._allowedOrigin !== '*' && message.origin !== this._allowedOrigin) {
                throw new Error('Unauthorized');
            }
            const args = message.data.args && Array.isArray(message.data.args) ? message.data.args : [];
            // Test if request calls a valid handler with the correct number of arguments
            if (!this._responseHandlers.has(state.data.command)) {
                throw new Error(`Unknown command: ${state.data.command}`);
            }
            const requestedMethod = this._responseHandlers.get(state.data.command);
            // Do not include state argument
            if (Math.max(requestedMethod.length - 1, 0) < args.length) {
                throw new Error(`Too many arguments passed: ${message}`);
            }
            console.debug('RpcServer ACCEPT', state.data);
            // Call method
            const result = requestedMethod(state, ...args);
            // If a value is returned, we take care of the reply,
            // otherwise we assume the handler to do the reply when appropriate.
            if (result instanceof Promise) {
                result
                    .then((finalResult) => {
                    if (finalResult !== undefined) {
                        RpcServer._ok(state, finalResult);
                    }
                })
                    .catch((error) => RpcServer._error(state, error));
            }
            else if (result !== undefined) {
                RpcServer._ok(state, result);
            }
        }
        catch (error) {
            if (state) {
                RpcServer._error(state, error);
            }
        }
    }
}
class BrowserDetection { // eslint-disable-line no-unused-vars
    /**
     * @returns {boolean}
     */
    static isDesktopSafari() {
        // see https://stackoverflow.com/a/23522755
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !/mobile/i.test(navigator.userAgent);
    }

    /**
     * @returns {boolean}
     */
    static isSafari() {
        return !!navigator.userAgent.match(/Version\/[\d.]+.*Safari/);
    }

    /**
     * @returns {boolean}
     */
    static isIos() {
        // @ts-ignore (MSStream is not on window)
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    /**
     * @returns {number[]}
     */
    static iosVersion() {
        if (BrowserDetection.isIos()) {
            const v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
            if (v) {
                return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || '0', 10)];
            }
        }

        throw new Error('No iOS version detected');
    }

    /**
     * @returns {boolean}
     */
    static isBadIos() {
        const version = this.iosVersion();
        return version[0] < 11 || (version[0] === 11 && version[1] === 2); // Only 11.2 has the WASM bug
    }
}
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
    /** @type {AccountStore} */
    static get instance() {
        /** @type {AccountStore} */
        this._instance = this._instance || new AccountStore();
        return this._instance;
    }

    /**
     * @param {string} dbName
     * @constructor
     */
    constructor(dbName = AccountStore.ACCOUNT_DATABASE) {
        this._dbName = dbName;
        this._dropped = false;
        /** @type {Promise<IDBDatabase>|null} */
        this._dbPromise = null;
    }

    /**
     * @returns {Promise.<IDBDatabase>}
     * @private
     */
    async connect() {
        if (this._dbPromise) return this._dbPromise;

        this._dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this._dbName, AccountStore.VERSION);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => reject(request.error);
            request.onupgradeneeded = () => {
                // account database doesn't exist
                this._dropped = true;
                request.transaction.abort();
                resolve(null);
            };
        });

        return this._dbPromise;
    }

    /**
     * @returns {Promise<AccountInfo[]>}
     */
    async list() {
        const db = await this.connect();
        if (!db) return [];
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
                    /** @type {AccountInfo} */
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
     * @returns {Promise<AccountRecord[]>}
     * @deprecated Only for database migration
     *
     * @description Returns the encrypted keypairs!
     */
    async dangerousListPlain() {
        const db = await this.connect();
        if (!db) return [];
        return new Promise((resolve, reject) => {
            const results = /** @type {AccountRecord[]} */ ([]);
            const openCursorRequest = db.transaction([AccountStore.ACCOUNT_DATABASE], 'readonly')
                .objectStore(AccountStore.ACCOUNT_DATABASE)
                .openCursor();
            openCursorRequest.onsuccess = () => {
                const cursor = openCursorRequest.result;
                if (cursor) {
                    const key = /** @type {AccountRecord} */ (cursor.value);
                    results.push(key);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            openCursorRequest.onerror = () => reject(openCursorRequest.error);
        });
    }

    async close() {
        if (!this._dbPromise) return;
        // If failed to open database (i.e. _dbPromise rejects) we don't need to close the db
        const db = await this._dbPromise.catch(() => null);
        this._dbPromise = null;
        if (db) db.close();
    }

    /**
     * @returns {Promise<void>}
     */
    async drop() {
        if (this._dropped) return Promise.resolve();
        await this.close();

        return new Promise((resolve, reject) => {
            const request = window.indexedDB.deleteDatabase(this._dbName);

            request.onsuccess = () => {
                this._dropped = true;
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }
}

AccountStore.VERSION = 2;
AccountStore.ACCOUNT_DATABASE = 'accounts';
/* global Nimiq */
/* global Key */
/* global KeyInfo */
/* global AccountStore */
/* global BrowserDetection */

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
        /** @type {KeyStore} */
        KeyStore._instance = KeyStore._instance || new KeyStore();
        return KeyStore._instance;
    }

    constructor() {
        /** @type {?Promise<IDBDatabase>} */
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
            };
        });

        return this._dbPromise;
    }

    /**
     * @param {string} id
     * @param {Uint8Array} [passphrase]
     * @returns {Promise<?Key>}
     */
    async get(id, passphrase) {
        /** @type {?KeyRecord} */
        const keyRecord = await this._get(id);
        if (!keyRecord) {
            return null;
        }

        if (!keyRecord.encrypted) {
            return new Key(keyRecord.secret, keyRecord.type);
        }

        if (!passphrase) {
            throw new Error('Passphrase required');
        }

        const plainSecret = await Nimiq.CryptoUtils.decryptOtpKdf(new Nimiq.SerialBuffer(keyRecord.secret), passphrase);
        return new Key(plainSecret, keyRecord.type);
    }

    /**
     * @param {string} id
     * @returns {Promise<?KeyInfo>}
     */
    async getInfo(id) {
        /** @type {?KeyRecord} */
        const keyRecord = await this._get(id);
        return keyRecord ? new KeyInfo(keyRecord.id, keyRecord.type, keyRecord.encrypted) : null;
    }

    /**
     * @param {string} id
     * @returns {Promise<?KeyRecord>}
     * @private
     */
    async _get(id) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME])
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .get(id);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @param {Key} key
     * @param {Uint8Array} [passphrase]
     * @returns {Promise<void>}
     */
    async put(key, passphrase) {
        const secret = !passphrase
            ? key.secret
            : await Nimiq.CryptoUtils.encryptOtpKdf(new Nimiq.SerialBuffer(key.secret), passphrase);

        const keyRecord = /** @type {KeyRecord} */ {
            id: key.id,
            type: key.type,
            encrypted: !!passphrase && passphrase.length > 0,
            secret,
        };

        return this._put(keyRecord);
    }

    /**
     * @param {KeyRecord} keyRecord
     * @returns {Promise<void>}
     */
    async _put(keyRecord) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .put(keyRecord);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async remove(id) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .delete(id);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @returns {Promise<KeyInfo[]>}
     */
    async list() {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readonly')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .openCursor();

        const results = /** KeyRecord[] */ await KeyStore._readAllFromCursor(request);
        return results.map(keyRecord => new KeyInfo(keyRecord.id, keyRecord.type, keyRecord.encrypted));
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
        const keys = await AccountStore.instance.dangerousListPlain();
        keys.forEach(async key => {
            const address = Nimiq.Address.fromUserFriendlyAddress(key.userFriendlyAddress);
            const legacyKeyId = Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(address.serialize()).subarray(0, 6));

            const keyRecord = /** @type {KeyRecord} */ {
                id: legacyKeyId,
                type: Key.Type.LEGACY,
                encrypted: true,
                secret: key.encryptedKeyPair,
            };

            await this._put(keyRecord);
        });

        // FIXME Uncomment after/for testing (and also adapt KeyStoreIndexeddb.spec.js)
        // await AccountStore.instance.drop();

        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Delete migrate cookie
            document.cookie = 'migrate=0; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

            // Delete accounts cookie
            document.cookie = 'accounts=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
    }

    /**
     * @param {IDBRequest} request
     * @returns {Promise<*>}
     * @private
     */
    static _requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
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
/** @type {?KeyStore} */
KeyStore._instance = null;

KeyStore.DB_VERSION = 1;
KeyStore.DB_NAME = 'nimiq-keyguard';
KeyStore.DB_KEY_STORE_NAME = 'keys';
/* global Nimiq */

class Key {
    /**
     * @param {Uint8Array} secret
     * @param {Key.Type} [type]
     */
    constructor(secret, type = Key.Type.BIP39) {
        this._secret = secret;
        this._type = type;
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PublicKey}
     */
    derivePublicKey(path) {
        return Nimiq.PublicKey.derive(this._derivePrivateKey(path));
    }

    /**
     * @param {string} path
     * @returns {Nimiq.Address}
     */
    deriveAddress(path) {
        return this.derivePublicKey(path).toAddress();
    }

    /**
     * @param {string} path
     * @param {Uint8Array} data
     * @returns {Nimiq.Signature}
     */
    sign(path, data) {
        const privateKey = this._derivePrivateKey(path);
        const publicKey = Nimiq.PublicKey.derive(privateKey);
        return Nimiq.Signature.create(privateKey, publicKey, data);
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PrivateKey}
     * @private
     */
    _derivePrivateKey(path) {
        return this._type === Key.Type.LEGACY
            ? new Nimiq.PrivateKey(this._secret)
            : new Nimiq.Entropy(this._secret).toExtendedPrivateKey().derivePath(path).privateKey;
    }

    /**
     * @type {Uint8Array}
     */
    get secret() {
        return this._secret;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {string}
     */
    get id() {
        const input = this._type === Key.Type.LEGACY
            ? Nimiq.PublicKey.derive(new Nimiq.PrivateKey(this._secret)).toAddress().serialize()
            : this._secret;
        return Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(input).subarray(0, 6));
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this.id);
    }

    /**
     * @param {string} id
     * @returns {string}
     */
    static idToUserFriendlyId(id) {
        // Stub
        return `UserFriendly ${id}`;
    }
}
Key.Type = {
    LEGACY: /** @type {Key.Type} */ 0,
    BIP39: /** @type {Key.Type} */ 1,
};
/* global Key */

// eslint-disable-next-line no-unused-vars
class KeyInfo {
    /**
     * @param {string} id
     * @param {Key.Type} type
     * @param {boolean} encrypted
     */
    constructor(id, type, encrypted) {
        /** @private */
        this._id = id;
        /** @private */
        this._type = type;
        /** @private */
        this._encrypted = encrypted;
    }

    /**
     * @type {string}
     */
    get id() {
        return this._id;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {boolean}
     */
    get encrypted() {
        return this._encrypted;
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this._id);
    }

    /**
     * @returns {KeyInfoObject}
     */
    toObject() {
        return {
            id: this.id,
            type: this.type,
            encrypted: this.encrypted,
            // userFriendlyId: this.userFriendlyId,
        };
    }

    /**
     * @param {KeyInfoObject} obj
     * @returns {KeyInfo}
     */
    static fromObject(obj) {
        return new KeyInfo(obj.id, obj.type, obj.encrypted);
    }
}
/* global KeyInfo */

class CookieJar { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyInfo[]} keys
     */
    static fill(keys) {
        const maxAge = 60 * 60 * 24 * 365;
        const encodedKeys = this._encodeCookie(keys);
        document.cookie = `k=${encodedKeys};max-age=${maxAge.toString()}`;
    }

    /**
     * @param {boolean} [listDeprecatedAccounts] - @deprecated Only for database migration
     * @returns {KeyInfo[] | AccountInfo[]}
     */
    static eat(listDeprecatedAccounts) {
        // Legacy cookie
        if (listDeprecatedAccounts) {
            const match = document.cookie.match(new RegExp('accounts=([^;]+)'));
            if (match && match[1]) {
                const decoded = decodeURIComponent(match[1]);
                return JSON.parse(decoded);
            }
            return [];
        }

        const match = document.cookie.match(new RegExp('k=([^;]+)'));
        if (match && match[1]) {
            return this._decodeCookie(match[1]);
        }

        return [];
    }

    /**
     * @param {KeyInfo[]} keys
     * @returns {string}
     */
    static _encodeCookie(keys) {
        return keys.map(keyInfo => `${keyInfo.type}${keyInfo.encrypted ? 1 : 0}${keyInfo.id}`).join('');
    }

    /**
     * @param {string} str
     * @returns {KeyInfo[]}
     */
    static _decodeCookie(str) {
        if (!str) return [];

        if (str.length % 14 !== 0) throw new Error('Malformed cookie');

        const keys = str.match(/.{14}/g);
        if (!keys) return []; // Make TS happy (match() can potentially return NULL)

        return keys.map(key => {
            const type = /** @type {Key.Type} */ (parseInt(key[0], 10));
            const encrypted = key[1] === '1';
            const id = key.substr(2);
            return new KeyInfo(id, type, encrypted);
        });
    }
}
/* global Nimiq */
/* global RpcServer */

/**
 * @returns {string}
 */
function allowedOrigin() {
    switch (window.location.origin) {
    case 'https://keyguard-next.nimiq.com': return 'https://accounts.nimiq.com';
    case 'https://keyguard-next.nimiq-testnet.com': return 'https://accounts.nimiq-testnet.com';
    default: return '*';
    }
}

/**
 * @param {Newable} RequestApiClass - Class object of the API which is to be exposed via postMessage RPC
 * @param {object} [options]
 */
async function runKeyguard(RequestApiClass, options) { // eslint-disable-line no-unused-vars
    const defaultOptions = {
        loadNimiq: true,
        whitelist: ['request'],
    };

    options = Object.assign(defaultOptions, options);

    if (options.loadNimiq) {
        // Load web assembly encryption library into browser (if supported)
        await Nimiq.WasmHelper.doImportBrowser();
        // Configure to use test net for now
        Nimiq.GenesisConfig.test();
    }

    // If user navigates back to loading screen, skip it
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '') {
            window.history.back();
        }
    });

    // Back arrow functionality
    document.body.addEventListener('click', event => {
        // @ts-ignore
        if (!event.target || !event.target.matches('a.page-header-back-button')) return;
        window.history.back();
    });

    // Instantiate handler.
    /** @type {TopLevelApi} */
    const api = new RequestApiClass();

    window.rpcServer = new RpcServer(allowedOrigin());

    // TODO: Use options.whitelist when adding onRequest handlers (iframe uses different methods)
    window.rpcServer.onRequest('request', (state, request) => api.request(request));

    window.rpcServer.init();
}
/* global BrowserDetection */
/* global CookieJar */
/* global AccountStore */
/* global KeyStore */

class IFrameApi { // eslint-disable-line no-unused-vars
    /**
     * @param {boolean} [listFromLegacyStore] - Deprecated, only for database migration
     * @returns {Promise<KeyInfoObject[] | AccountInfo[]>}
     */
    async list(listFromLegacyStore) {
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            return CookieJar.eat(listFromLegacyStore);
        }

        if (listFromLegacyStore) {
            return AccountStore.instance.list();
        }

        const keyInfos = await KeyStore.instance.list();
        return keyInfos.map(ki => ki.toObject());
    }

    /**
     * @returns {Promise<void>}
     * @deprecated Only for database migration
     */
    async migrateAccountsToKeys() {
        /**
         * IndexedDB is not accessible in iframes on iOS browsers and Safari.
         * Thus when the Keyguard client requests the iframe to migrate the
         * database, the iframe needs to signal to the popup that it should run
         * the migration the next time it is opened. Thus this signalling cookie.
         * The cookie is then detected in the TopLevelApi.request() method.
         */
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Set migrate flag cookie
            document.cookie = 'migrate=1;max-age=31536000';
            return;
        }

        // FIXME: Requires Nimiq lib to be loaded, which it currently isn't in the iframe
        await KeyStore.instance.migrateAccountsToKeys();
    }
}
/* global runKeyguard */
/* global IFrameApi */

runKeyguard(IFrameApi, {
    loadNimiq: false,
    whitelist: [
        'list',
        'migrateAccountsToKeys',
    ],
});
// @ts-nocheck
/* eslint-disable */

/**
 * This file was generated from the @nimiq/rpc package source, with `RpcServer` being the only target.
 *
 * HOWTO:
 * - Remove `export * from './RpcClient';` from @nimiq/rpc/src/main.ts
 * - Run `yarn build` in the @nimiq/rpc directory
 * - @nimiq/rpc/dist/rpc.es.js is the wanted module file
 * - The following changes where made to this file afterwards:
 *   https://github.com/nimiq/keyguard-next/pull/93/commits/0a9797cbe195f7eda8b66a75927cc11786ea9625
 */

var ResponseStatus;
(function (ResponseStatus) {
    ResponseStatus["OK"] = "ok";
    ResponseStatus["ERROR"] = "error";
})(ResponseStatus || (ResponseStatus = {}));

/* tslint:disable:no-bitwise */
class Base64 {
    static decode(b64) {
        Base64._initRevLookup();
        const [validLength, placeHoldersLength] = Base64._getLengths(b64);
        const arr = new Uint8Array(Base64._byteLength(validLength, placeHoldersLength));
        let curByte = 0;
        // if there are placeholders, only get up to the last complete 4 chars
        const len = placeHoldersLength > 0 ? validLength - 4 : validLength;
        let i = 0;
        for (; i < len; i += 4) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 18) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] << 12) |
                (Base64._revLookup[b64.charCodeAt(i + 2)] << 6) |
                Base64._revLookup[b64.charCodeAt(i + 3)];
            arr[curByte++] = (tmp >> 16) & 0xFF;
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 2) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 2) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] >> 4);
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 1) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 10) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] << 4) |
                (Base64._revLookup[b64.charCodeAt(i + 2)] >> 2);
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte /*++ not needed*/] = tmp & 0xFF;
        }
        return arr;
    }
    static encode(uint8) {
        const length = uint8.length;
        const extraBytes = length % 3; // if we have 1 byte left, pad 2 bytes
        const parts = [];
        const maxChunkLength = 16383; // must be multiple of 3
        // go through the array every three bytes, we'll deal with trailing stuff later
        for (let i = 0, len2 = length - extraBytes; i < len2; i += maxChunkLength) {
            parts.push(Base64._encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
        }
        // pad the end with zeros, but make sure to not forget the extra bytes
        if (extraBytes === 1) {
            const tmp = uint8[length - 1];
            parts.push(Base64._lookup[tmp >> 2] +
                Base64._lookup[(tmp << 4) & 0x3F] +
                '==');
        }
        else if (extraBytes === 2) {
            const tmp = (uint8[length - 2] << 8) + uint8[length - 1];
            parts.push(Base64._lookup[tmp >> 10] +
                Base64._lookup[(tmp >> 4) & 0x3F] +
                Base64._lookup[(tmp << 2) & 0x3F] +
                '=');
        }
        return parts.join('');
    }
    static _initRevLookup() {
        if (Base64._revLookup.length !== 0)
            return;
        Base64._revLookup = [];
        for (let i = 0, len = Base64._lookup.length; i < len; i++) {
            Base64._revLookup[Base64._lookup.charCodeAt(i)] = i;
        }
        // Support decoding URL-safe base64 strings, as Node.js does.
        // See: https://en.wikipedia.org/wiki/Base64#URL_applications
        Base64._revLookup['-'.charCodeAt(0)] = 62;
        Base64._revLookup['_'.charCodeAt(0)] = 63;
    }
    static _getLengths(b64) {
        const length = b64.length;
        if (length % 4 > 0) {
            throw new Error('Invalid string. Length must be a multiple of 4');
        }
        // Trim off extra bytes after placeholder bytes are found
        // See: https://github.com/beatgammit/base64-js/issues/42
        let validLength = b64.indexOf('=');
        if (validLength === -1)
            validLength = length;
        const placeHoldersLength = validLength === length ? 0 : 4 - (validLength % 4);
        return [validLength, placeHoldersLength];
    }
    static _byteLength(validLength, placeHoldersLength) {
        return ((validLength + placeHoldersLength) * 3 / 4) - placeHoldersLength;
    }
    static _tripletToBase64(num) {
        return Base64._lookup[num >> 18 & 0x3F] +
            Base64._lookup[num >> 12 & 0x3F] +
            Base64._lookup[num >> 6 & 0x3F] +
            Base64._lookup[num & 0x3F];
    }
    static _encodeChunk(uint8, start, end) {
        const output = [];
        for (let i = start; i < end; i += 3) {
            const tmp = ((uint8[i] << 16) & 0xFF0000) +
                ((uint8[i + 1] << 8) & 0xFF00) +
                (uint8[i + 2] & 0xFF);
            output.push(Base64._tripletToBase64(tmp));
        }
        return output.join('');
    }
}
Base64._lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
Base64._revLookup = [];

var ExtraJSONTypes;
(function (ExtraJSONTypes) {
    ExtraJSONTypes[ExtraJSONTypes["UINT8_ARRAY"] = 0] = "UINT8_ARRAY";
})(ExtraJSONTypes || (ExtraJSONTypes = {}));
class JSONUtils {
    static stringify(value) {
        return JSON.stringify(value, JSONUtils._jsonifyType);
    }
    static parse(value) {
        return JSON.parse(value, JSONUtils._parseType);
    }
    static _parseType(key, value) {
        if (value && value.hasOwnProperty &&
            value.hasOwnProperty(JSONUtils.TYPE_SYMBOL) && value.hasOwnProperty(JSONUtils.VALUE_SYMBOL)) {
            switch (value[JSONUtils.TYPE_SYMBOL]) {
                case ExtraJSONTypes.UINT8_ARRAY:
                    return Base64.decode(value[JSONUtils.VALUE_SYMBOL]);
            }
        }
        return value;
    }
    static _jsonifyType(key, value) {
        if (value instanceof Uint8Array) {
            return JSONUtils._typedObject(ExtraJSONTypes.UINT8_ARRAY, Base64.encode(value));
        }
        return value;
    }
    static _typedObject(type, value) {
        const obj = {};
        obj[JSONUtils.TYPE_SYMBOL] = type;
        obj[JSONUtils.VALUE_SYMBOL] = value;
        return obj;
    }
}
JSONUtils.TYPE_SYMBOL = '__';
JSONUtils.VALUE_SYMBOL = 'v';

class UrlRpcEncoder {
    static receiveRedirectCommand(url) {
        // Need referrer for origin check
        if (!document.referrer)
            return null;
        // Parse query
        const params = new URLSearchParams(url.search);
        const referrer = new URL(document.referrer);
        // Ignore messages without a command
        if (!params.has('command'))
            return null;
        // Ignore messages without an ID
        if (!params.has('id'))
            return null;
        // Ignore messages without a valid return path
        if (!params.has('returnURL'))
            return null;
        // Only allow returning to same origin
        const returnURL = new URL(params.get('returnURL'));
        if (returnURL.origin !== referrer.origin)
            return null;
        // Parse args
        let args = [];
        if (params.has('args')) {
            try {
                args = JSONUtils.parse(params.get('args'));
            }
            catch (e) {
                // Do nothing
            }
        }
        args = Array.isArray(args) ? args : [];
        return {
            origin: referrer.origin,
            data: {
                id: parseInt(params.get('id'), 10),
                command: params.get('command'),
                args,
            },
            returnURL: params.get('returnURL'),
        };
    }
    static prepareRedirectReply(state, status, result) {
        const params = new URLSearchParams();
        params.set('status', status);
        params.set('result', JSONUtils.stringify(result));
        params.set('id', state.id.toString());
        // TODO: what if it already includes a query string
        return `${state.returnURL}?${params.toString()}`;
    }
}

class State {
    get id() {
        return this._id;
    }
    get origin() {
        return this._origin;
    }
    get data() {
        return this._data;
    }
    get returnURL() {
        return this._returnURL;
    }
    static fromJSON(json) {
        const obj = JSON.parse(json);
        return new State(obj);
    }
    constructor(message) {
        if (!message.data.id)
            throw Error('Missing id');
        this._origin = message.origin;
        this._id = message.data.id;
        this._returnURL = 'returnURL' in message ? message.returnURL : null;
        this._data = message.data;
    }
    toJSON() {
        const obj = {
            origin: this._origin,
            data: this._data,
        };
        obj.returnURL = this._returnURL;
        return JSON.stringify(obj);
    }
    reply(status, result) {
        console.debug('RpcServer REPLY', result);
        if (status === ResponseStatus.ERROR) {
            // serialize error objects
            result = typeof result === 'object'
                ? { message: result.message, stack: result.stack }
                : { message: result };
        }

        // Send via top-level navigation
        window.location.href = UrlRpcEncoder.prepareRedirectReply(this, status, result);
    }
}

class RpcServer {
    static _ok(state, result) {
        state.reply(ResponseStatus.OK, result);
    }
    static _error(state, error) {
        state.reply(ResponseStatus.ERROR, error);
    }
    constructor(allowedOrigin) {
        this._allowedOrigin = allowedOrigin;
        this._responseHandlers = new Map();
        this._responseHandlers.set('ping', () => 'pong');
        this._receiveListener = this._receive.bind(this);
    }
    onRequest(command, fn) {
        this._responseHandlers.set(command, fn);
    }
    init() {
        window.addEventListener('message', this._receiveListener);
        this._receiveRedirect();
    }
    close() {
        window.removeEventListener('message', this._receiveListener);
    }
    _receiveRedirect() {
        const message = UrlRpcEncoder.receiveRedirectCommand(window.location);
        if (message) {
            this._receive(message);
        }
    }
    _receive(message) {
        let state = null;
        try {
            state = new State(message);
            // Cannot reply to a message that has no return URL
            if (!('returnURL' in message))
                return;
            // Ignore messages without a command
            if (!('command' in state.data)) {
                return;
            }
            if (this._allowedOrigin !== '*' && message.origin !== this._allowedOrigin) {
                throw new Error('Unauthorized');
            }
            const args = message.data.args && Array.isArray(message.data.args) ? message.data.args : [];
            // Test if request calls a valid handler with the correct number of arguments
            if (!this._responseHandlers.has(state.data.command)) {
                throw new Error(`Unknown command: ${state.data.command}`);
            }
            const requestedMethod = this._responseHandlers.get(state.data.command);
            // Do not include state argument
            if (Math.max(requestedMethod.length - 1, 0) < args.length) {
                throw new Error(`Too many arguments passed: ${message}`);
            }
            console.debug('RpcServer ACCEPT', state.data);
            // Call method
            const result = requestedMethod(state, ...args);
            // If a value is returned, we take care of the reply,
            // otherwise we assume the handler to do the reply when appropriate.
            if (result instanceof Promise) {
                result
                    .then((finalResult) => {
                    if (finalResult !== undefined) {
                        RpcServer._ok(state, finalResult);
                    }
                })
                    .catch((error) => RpcServer._error(state, error));
            }
            else if (result !== undefined) {
                RpcServer._ok(state, result);
            }
        }
        catch (error) {
            if (state) {
                RpcServer._error(state, error);
            }
        }
    }
}
class BrowserDetection { // eslint-disable-line no-unused-vars
    /**
     * @returns {boolean}
     */
    static isDesktopSafari() {
        // see https://stackoverflow.com/a/23522755
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !/mobile/i.test(navigator.userAgent);
    }

    /**
     * @returns {boolean}
     */
    static isSafari() {
        return !!navigator.userAgent.match(/Version\/[\d.]+.*Safari/);
    }

    /**
     * @returns {boolean}
     */
    static isIos() {
        // @ts-ignore (MSStream is not on window)
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    /**
     * @returns {number[]}
     */
    static iosVersion() {
        if (BrowserDetection.isIos()) {
            const v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
            if (v) {
                return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || '0', 10)];
            }
        }

        throw new Error('No iOS version detected');
    }

    /**
     * @returns {boolean}
     */
    static isBadIos() {
        const version = this.iosVersion();
        return version[0] < 11 || (version[0] === 11 && version[1] === 2); // Only 11.2 has the WASM bug
    }
}
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
    /** @type {AccountStore} */
    static get instance() {
        /** @type {AccountStore} */
        this._instance = this._instance || new AccountStore();
        return this._instance;
    }

    /**
     * @param {string} dbName
     * @constructor
     */
    constructor(dbName = AccountStore.ACCOUNT_DATABASE) {
        this._dbName = dbName;
        this._dropped = false;
        /** @type {Promise<IDBDatabase>|null} */
        this._dbPromise = null;
    }

    /**
     * @returns {Promise.<IDBDatabase>}
     * @private
     */
    async connect() {
        if (this._dbPromise) return this._dbPromise;

        this._dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this._dbName, AccountStore.VERSION);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => reject(request.error);
            request.onupgradeneeded = () => {
                // account database doesn't exist
                this._dropped = true;
                request.transaction.abort();
                resolve(null);
            };
        });

        return this._dbPromise;
    }

    /**
     * @returns {Promise<AccountInfo[]>}
     */
    async list() {
        const db = await this.connect();
        if (!db) return [];
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
                    /** @type {AccountInfo} */
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
     * @returns {Promise<AccountRecord[]>}
     * @deprecated Only for database migration
     *
     * @description Returns the encrypted keypairs!
     */
    async dangerousListPlain() {
        const db = await this.connect();
        if (!db) return [];
        return new Promise((resolve, reject) => {
            const results = /** @type {AccountRecord[]} */ ([]);
            const openCursorRequest = db.transaction([AccountStore.ACCOUNT_DATABASE], 'readonly')
                .objectStore(AccountStore.ACCOUNT_DATABASE)
                .openCursor();
            openCursorRequest.onsuccess = () => {
                const cursor = openCursorRequest.result;
                if (cursor) {
                    const key = /** @type {AccountRecord} */ (cursor.value);
                    results.push(key);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            openCursorRequest.onerror = () => reject(openCursorRequest.error);
        });
    }

    async close() {
        if (!this._dbPromise) return;
        // If failed to open database (i.e. _dbPromise rejects) we don't need to close the db
        const db = await this._dbPromise.catch(() => null);
        this._dbPromise = null;
        if (db) db.close();
    }

    /**
     * @returns {Promise<void>}
     */
    async drop() {
        if (this._dropped) return Promise.resolve();
        await this.close();

        return new Promise((resolve, reject) => {
            const request = window.indexedDB.deleteDatabase(this._dbName);

            request.onsuccess = () => {
                this._dropped = true;
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }
}

AccountStore.VERSION = 2;
AccountStore.ACCOUNT_DATABASE = 'accounts';
/* global Nimiq */
/* global Key */
/* global KeyInfo */
/* global AccountStore */
/* global BrowserDetection */

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
        /** @type {KeyStore} */
        KeyStore._instance = KeyStore._instance || new KeyStore();
        return KeyStore._instance;
    }

    constructor() {
        /** @type {?Promise<IDBDatabase>} */
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
            };
        });

        return this._dbPromise;
    }

    /**
     * @param {string} id
     * @param {Uint8Array} [passphrase]
     * @returns {Promise<?Key>}
     */
    async get(id, passphrase) {
        /** @type {?KeyRecord} */
        const keyRecord = await this._get(id);
        if (!keyRecord) {
            return null;
        }

        if (!keyRecord.encrypted) {
            return new Key(keyRecord.secret, keyRecord.type);
        }

        if (!passphrase) {
            throw new Error('Passphrase required');
        }

        const plainSecret = await Nimiq.CryptoUtils.decryptOtpKdf(new Nimiq.SerialBuffer(keyRecord.secret), passphrase);
        return new Key(plainSecret, keyRecord.type);
    }

    /**
     * @param {string} id
     * @returns {Promise<?KeyInfo>}
     */
    async getInfo(id) {
        /** @type {?KeyRecord} */
        const keyRecord = await this._get(id);
        return keyRecord ? new KeyInfo(keyRecord.id, keyRecord.type, keyRecord.encrypted) : null;
    }

    /**
     * @param {string} id
     * @returns {Promise<?KeyRecord>}
     * @private
     */
    async _get(id) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME])
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .get(id);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @param {Key} key
     * @param {Uint8Array} [passphrase]
     * @returns {Promise<void>}
     */
    async put(key, passphrase) {
        const secret = !passphrase
            ? key.secret
            : await Nimiq.CryptoUtils.encryptOtpKdf(new Nimiq.SerialBuffer(key.secret), passphrase);

        const keyRecord = /** @type {KeyRecord} */ {
            id: key.id,
            type: key.type,
            encrypted: !!passphrase && passphrase.length > 0,
            secret,
        };

        return this._put(keyRecord);
    }

    /**
     * @param {KeyRecord} keyRecord
     * @returns {Promise<void>}
     */
    async _put(keyRecord) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .put(keyRecord);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async remove(id) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .delete(id);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @returns {Promise<KeyInfo[]>}
     */
    async list() {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readonly')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .openCursor();

        const results = /** KeyRecord[] */ await KeyStore._readAllFromCursor(request);
        return results.map(keyRecord => new KeyInfo(keyRecord.id, keyRecord.type, keyRecord.encrypted));
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
        const keys = await AccountStore.instance.dangerousListPlain();
        keys.forEach(async key => {
            const address = Nimiq.Address.fromUserFriendlyAddress(key.userFriendlyAddress);
            const legacyKeyId = Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(address.serialize()).subarray(0, 6));

            const keyRecord = /** @type {KeyRecord} */ {
                id: legacyKeyId,
                type: Key.Type.LEGACY,
                encrypted: true,
                secret: key.encryptedKeyPair,
            };

            await this._put(keyRecord);
        });

        // FIXME Uncomment after/for testing (and also adapt KeyStoreIndexeddb.spec.js)
        // await AccountStore.instance.drop();

        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Delete migrate cookie
            document.cookie = 'migrate=0; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

            // Delete accounts cookie
            document.cookie = 'accounts=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
    }

    /**
     * @param {IDBRequest} request
     * @returns {Promise<*>}
     * @private
     */
    static _requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
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
/** @type {?KeyStore} */
KeyStore._instance = null;

KeyStore.DB_VERSION = 1;
KeyStore.DB_NAME = 'nimiq-keyguard';
KeyStore.DB_KEY_STORE_NAME = 'keys';
/* global Nimiq */

class Key {
    /**
     * @param {Uint8Array} secret
     * @param {Key.Type} [type]
     */
    constructor(secret, type = Key.Type.BIP39) {
        this._secret = secret;
        this._type = type;
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PublicKey}
     */
    derivePublicKey(path) {
        return Nimiq.PublicKey.derive(this._derivePrivateKey(path));
    }

    /**
     * @param {string} path
     * @returns {Nimiq.Address}
     */
    deriveAddress(path) {
        return this.derivePublicKey(path).toAddress();
    }

    /**
     * @param {string} path
     * @param {Uint8Array} data
     * @returns {Nimiq.Signature}
     */
    sign(path, data) {
        const privateKey = this._derivePrivateKey(path);
        const publicKey = Nimiq.PublicKey.derive(privateKey);
        return Nimiq.Signature.create(privateKey, publicKey, data);
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PrivateKey}
     * @private
     */
    _derivePrivateKey(path) {
        return this._type === Key.Type.LEGACY
            ? new Nimiq.PrivateKey(this._secret)
            : new Nimiq.Entropy(this._secret).toExtendedPrivateKey().derivePath(path).privateKey;
    }

    /**
     * @type {Uint8Array}
     */
    get secret() {
        return this._secret;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {string}
     */
    get id() {
        const input = this._type === Key.Type.LEGACY
            ? Nimiq.PublicKey.derive(new Nimiq.PrivateKey(this._secret)).toAddress().serialize()
            : this._secret;
        return Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(input).subarray(0, 6));
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this.id);
    }

    /**
     * @param {string} id
     * @returns {string}
     */
    static idToUserFriendlyId(id) {
        // Stub
        return `UserFriendly ${id}`;
    }
}
Key.Type = {
    LEGACY: /** @type {Key.Type} */ 0,
    BIP39: /** @type {Key.Type} */ 1,
};
/* global Key */

// eslint-disable-next-line no-unused-vars
class KeyInfo {
    /**
     * @param {string} id
     * @param {Key.Type} type
     * @param {boolean} encrypted
     */
    constructor(id, type, encrypted) {
        /** @private */
        this._id = id;
        /** @private */
        this._type = type;
        /** @private */
        this._encrypted = encrypted;
    }

    /**
     * @type {string}
     */
    get id() {
        return this._id;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {boolean}
     */
    get encrypted() {
        return this._encrypted;
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this._id);
    }

    /**
     * @returns {KeyInfoObject}
     */
    toObject() {
        return {
            id: this.id,
            type: this.type,
            encrypted: this.encrypted,
            // userFriendlyId: this.userFriendlyId,
        };
    }

    /**
     * @param {KeyInfoObject} obj
     * @returns {KeyInfo}
     */
    static fromObject(obj) {
        return new KeyInfo(obj.id, obj.type, obj.encrypted);
    }
}
/* global KeyInfo */

class CookieJar { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyInfo[]} keys
     */
    static fill(keys) {
        const maxAge = 60 * 60 * 24 * 365;
        const encodedKeys = this._encodeCookie(keys);
        document.cookie = `k=${encodedKeys};max-age=${maxAge.toString()}`;
    }

    /**
     * @param {boolean} [listDeprecatedAccounts] - @deprecated Only for database migration
     * @returns {KeyInfo[] | AccountInfo[]}
     */
    static eat(listDeprecatedAccounts) {
        // Legacy cookie
        if (listDeprecatedAccounts) {
            const match = document.cookie.match(new RegExp('accounts=([^;]+)'));
            if (match && match[1]) {
                const decoded = decodeURIComponent(match[1]);
                return JSON.parse(decoded);
            }
            return [];
        }

        const match = document.cookie.match(new RegExp('k=([^;]+)'));
        if (match && match[1]) {
            return this._decodeCookie(match[1]);
        }

        return [];
    }

    /**
     * @param {KeyInfo[]} keys
     * @returns {string}
     */
    static _encodeCookie(keys) {
        return keys.map(keyInfo => `${keyInfo.type}${keyInfo.encrypted ? 1 : 0}${keyInfo.id}`).join('');
    }

    /**
     * @param {string} str
     * @returns {KeyInfo[]}
     */
    static _decodeCookie(str) {
        if (!str) return [];

        if (str.length % 14 !== 0) throw new Error('Malformed cookie');

        const keys = str.match(/.{14}/g);
        if (!keys) return []; // Make TS happy (match() can potentially return NULL)

        return keys.map(key => {
            const type = /** @type {Key.Type} */ (parseInt(key[0], 10));
            const encrypted = key[1] === '1';
            const id = key.substr(2);
            return new KeyInfo(id, type, encrypted);
        });
    }
}
/* global Nimiq */
/* global RpcServer */

/**
 * @returns {string}
 */
function allowedOrigin() {
    switch (window.location.origin) {
    case 'https://keyguard-next.nimiq.com': return 'https://accounts.nimiq.com';
    case 'https://keyguard-next.nimiq-testnet.com': return 'https://accounts.nimiq-testnet.com';
    default: return '*';
    }
}

/**
 * @param {Newable} RequestApiClass - Class object of the API which is to be exposed via postMessage RPC
 * @param {object} [options]
 */
async function runKeyguard(RequestApiClass, options) { // eslint-disable-line no-unused-vars
    const defaultOptions = {
        loadNimiq: true,
        whitelist: ['request'],
    };

    options = Object.assign(defaultOptions, options);

    if (options.loadNimiq) {
        // Load web assembly encryption library into browser (if supported)
        await Nimiq.WasmHelper.doImportBrowser();
        // Configure to use test net for now
        Nimiq.GenesisConfig.test();
    }

    // If user navigates back to loading screen, skip it
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '') {
            window.history.back();
        }
    });

    // Back arrow functionality
    document.body.addEventListener('click', event => {
        // @ts-ignore
        if (!event.target || !event.target.matches('a.page-header-back-button')) return;
        window.history.back();
    });

    // Instantiate handler.
    /** @type {TopLevelApi} */
    const api = new RequestApiClass();

    window.rpcServer = new RpcServer(allowedOrigin());

    // TODO: Use options.whitelist when adding onRequest handlers (iframe uses different methods)
    window.rpcServer.onRequest('request', (state, request) => api.request(request));

    window.rpcServer.init();
}
/* global BrowserDetection */
/* global CookieJar */
/* global AccountStore */
/* global KeyStore */

class IFrameApi { // eslint-disable-line no-unused-vars
    /**
     * @param {boolean} [listFromLegacyStore] - Deprecated, only for database migration
     * @returns {Promise<KeyInfoObject[] | AccountInfo[]>}
     */
    async list(listFromLegacyStore) {
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            return CookieJar.eat(listFromLegacyStore);
        }

        if (listFromLegacyStore) {
            return AccountStore.instance.list();
        }

        const keyInfos = await KeyStore.instance.list();
        return keyInfos.map(ki => ki.toObject());
    }

    /**
     * @returns {Promise<void>}
     * @deprecated Only for database migration
     */
    async migrateAccountsToKeys() {
        /**
         * IndexedDB is not accessible in iframes on iOS browsers and Safari.
         * Thus when the Keyguard client requests the iframe to migrate the
         * database, the iframe needs to signal to the popup that it should run
         * the migration the next time it is opened. Thus this signalling cookie.
         * The cookie is then detected in the TopLevelApi.request() method.
         */
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Set migrate flag cookie
            document.cookie = 'migrate=1;max-age=31536000';
            return;
        }

        // FIXME: Requires Nimiq lib to be loaded, which it currently isn't in the iframe
        await KeyStore.instance.migrateAccountsToKeys();
    }
}
/* global runKeyguard */
/* global IFrameApi */

runKeyguard(IFrameApi, {
    loadNimiq: false,
    whitelist: [
        'list',
        'migrateAccountsToKeys',
    ],
});
// @ts-nocheck
/* eslint-disable */

/**
 * This file was generated from the @nimiq/rpc package source, with `RpcServer` being the only target.
 *
 * HOWTO:
 * - Remove `export * from './RpcClient';` from @nimiq/rpc/src/main.ts
 * - Run `yarn build` in the @nimiq/rpc directory
 * - @nimiq/rpc/dist/rpc.es.js is the wanted module file
 * - The following changes where made to this file afterwards:
 *   https://github.com/nimiq/keyguard-next/pull/93/commits/0a9797cbe195f7eda8b66a75927cc11786ea9625
 */

var ResponseStatus;
(function (ResponseStatus) {
    ResponseStatus["OK"] = "ok";
    ResponseStatus["ERROR"] = "error";
})(ResponseStatus || (ResponseStatus = {}));

/* tslint:disable:no-bitwise */
class Base64 {
    static decode(b64) {
        Base64._initRevLookup();
        const [validLength, placeHoldersLength] = Base64._getLengths(b64);
        const arr = new Uint8Array(Base64._byteLength(validLength, placeHoldersLength));
        let curByte = 0;
        // if there are placeholders, only get up to the last complete 4 chars
        const len = placeHoldersLength > 0 ? validLength - 4 : validLength;
        let i = 0;
        for (; i < len; i += 4) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 18) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] << 12) |
                (Base64._revLookup[b64.charCodeAt(i + 2)] << 6) |
                Base64._revLookup[b64.charCodeAt(i + 3)];
            arr[curByte++] = (tmp >> 16) & 0xFF;
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 2) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 2) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] >> 4);
            arr[curByte++] = tmp & 0xFF;
        }
        if (placeHoldersLength === 1) {
            const tmp = (Base64._revLookup[b64.charCodeAt(i)] << 10) |
                (Base64._revLookup[b64.charCodeAt(i + 1)] << 4) |
                (Base64._revLookup[b64.charCodeAt(i + 2)] >> 2);
            arr[curByte++] = (tmp >> 8) & 0xFF;
            arr[curByte /*++ not needed*/] = tmp & 0xFF;
        }
        return arr;
    }
    static encode(uint8) {
        const length = uint8.length;
        const extraBytes = length % 3; // if we have 1 byte left, pad 2 bytes
        const parts = [];
        const maxChunkLength = 16383; // must be multiple of 3
        // go through the array every three bytes, we'll deal with trailing stuff later
        for (let i = 0, len2 = length - extraBytes; i < len2; i += maxChunkLength) {
            parts.push(Base64._encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
        }
        // pad the end with zeros, but make sure to not forget the extra bytes
        if (extraBytes === 1) {
            const tmp = uint8[length - 1];
            parts.push(Base64._lookup[tmp >> 2] +
                Base64._lookup[(tmp << 4) & 0x3F] +
                '==');
        }
        else if (extraBytes === 2) {
            const tmp = (uint8[length - 2] << 8) + uint8[length - 1];
            parts.push(Base64._lookup[tmp >> 10] +
                Base64._lookup[(tmp >> 4) & 0x3F] +
                Base64._lookup[(tmp << 2) & 0x3F] +
                '=');
        }
        return parts.join('');
    }
    static _initRevLookup() {
        if (Base64._revLookup.length !== 0)
            return;
        Base64._revLookup = [];
        for (let i = 0, len = Base64._lookup.length; i < len; i++) {
            Base64._revLookup[Base64._lookup.charCodeAt(i)] = i;
        }
        // Support decoding URL-safe base64 strings, as Node.js does.
        // See: https://en.wikipedia.org/wiki/Base64#URL_applications
        Base64._revLookup['-'.charCodeAt(0)] = 62;
        Base64._revLookup['_'.charCodeAt(0)] = 63;
    }
    static _getLengths(b64) {
        const length = b64.length;
        if (length % 4 > 0) {
            throw new Error('Invalid string. Length must be a multiple of 4');
        }
        // Trim off extra bytes after placeholder bytes are found
        // See: https://github.com/beatgammit/base64-js/issues/42
        let validLength = b64.indexOf('=');
        if (validLength === -1)
            validLength = length;
        const placeHoldersLength = validLength === length ? 0 : 4 - (validLength % 4);
        return [validLength, placeHoldersLength];
    }
    static _byteLength(validLength, placeHoldersLength) {
        return ((validLength + placeHoldersLength) * 3 / 4) - placeHoldersLength;
    }
    static _tripletToBase64(num) {
        return Base64._lookup[num >> 18 & 0x3F] +
            Base64._lookup[num >> 12 & 0x3F] +
            Base64._lookup[num >> 6 & 0x3F] +
            Base64._lookup[num & 0x3F];
    }
    static _encodeChunk(uint8, start, end) {
        const output = [];
        for (let i = start; i < end; i += 3) {
            const tmp = ((uint8[i] << 16) & 0xFF0000) +
                ((uint8[i + 1] << 8) & 0xFF00) +
                (uint8[i + 2] & 0xFF);
            output.push(Base64._tripletToBase64(tmp));
        }
        return output.join('');
    }
}
Base64._lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
Base64._revLookup = [];

var ExtraJSONTypes;
(function (ExtraJSONTypes) {
    ExtraJSONTypes[ExtraJSONTypes["UINT8_ARRAY"] = 0] = "UINT8_ARRAY";
})(ExtraJSONTypes || (ExtraJSONTypes = {}));
class JSONUtils {
    static stringify(value) {
        return JSON.stringify(value, JSONUtils._jsonifyType);
    }
    static parse(value) {
        return JSON.parse(value, JSONUtils._parseType);
    }
    static _parseType(key, value) {
        if (value && value.hasOwnProperty &&
            value.hasOwnProperty(JSONUtils.TYPE_SYMBOL) && value.hasOwnProperty(JSONUtils.VALUE_SYMBOL)) {
            switch (value[JSONUtils.TYPE_SYMBOL]) {
                case ExtraJSONTypes.UINT8_ARRAY:
                    return Base64.decode(value[JSONUtils.VALUE_SYMBOL]);
            }
        }
        return value;
    }
    static _jsonifyType(key, value) {
        if (value instanceof Uint8Array) {
            return JSONUtils._typedObject(ExtraJSONTypes.UINT8_ARRAY, Base64.encode(value));
        }
        return value;
    }
    static _typedObject(type, value) {
        const obj = {};
        obj[JSONUtils.TYPE_SYMBOL] = type;
        obj[JSONUtils.VALUE_SYMBOL] = value;
        return obj;
    }
}
JSONUtils.TYPE_SYMBOL = '__';
JSONUtils.VALUE_SYMBOL = 'v';

class UrlRpcEncoder {
    static receiveRedirectCommand(url) {
        // Need referrer for origin check
        if (!document.referrer)
            return null;
        // Parse query
        const params = new URLSearchParams(url.search);
        const referrer = new URL(document.referrer);
        // Ignore messages without a command
        if (!params.has('command'))
            return null;
        // Ignore messages without an ID
        if (!params.has('id'))
            return null;
        // Ignore messages without a valid return path
        if (!params.has('returnURL'))
            return null;
        // Only allow returning to same origin
        const returnURL = new URL(params.get('returnURL'));
        if (returnURL.origin !== referrer.origin)
            return null;
        // Parse args
        let args = [];
        if (params.has('args')) {
            try {
                args = JSONUtils.parse(params.get('args'));
            }
            catch (e) {
                // Do nothing
            }
        }
        args = Array.isArray(args) ? args : [];
        return {
            origin: referrer.origin,
            data: {
                id: parseInt(params.get('id'), 10),
                command: params.get('command'),
                args,
            },
            returnURL: params.get('returnURL'),
        };
    }
    static prepareRedirectReply(state, status, result) {
        const params = new URLSearchParams();
        params.set('status', status);
        params.set('result', JSONUtils.stringify(result));
        params.set('id', state.id.toString());
        // TODO: what if it already includes a query string
        return `${state.returnURL}?${params.toString()}`;
    }
}

class State {
    get id() {
        return this._id;
    }
    get origin() {
        return this._origin;
    }
    get data() {
        return this._data;
    }
    get returnURL() {
        return this._returnURL;
    }
    static fromJSON(json) {
        const obj = JSON.parse(json);
        return new State(obj);
    }
    constructor(message) {
        if (!message.data.id)
            throw Error('Missing id');
        this._origin = message.origin;
        this._id = message.data.id;
        this._returnURL = 'returnURL' in message ? message.returnURL : null;
        this._data = message.data;
    }
    toJSON() {
        const obj = {
            origin: this._origin,
            data: this._data,
        };
        obj.returnURL = this._returnURL;
        return JSON.stringify(obj);
    }
    reply(status, result) {
        console.debug('RpcServer REPLY', result);
        if (status === ResponseStatus.ERROR) {
            // serialize error objects
            result = typeof result === 'object'
                ? { message: result.message, stack: result.stack }
                : { message: result };
        }

        // Send via top-level navigation
        window.location.href = UrlRpcEncoder.prepareRedirectReply(this, status, result);
    }
}

class RpcServer {
    static _ok(state, result) {
        state.reply(ResponseStatus.OK, result);
    }
    static _error(state, error) {
        state.reply(ResponseStatus.ERROR, error);
    }
    constructor(allowedOrigin) {
        this._allowedOrigin = allowedOrigin;
        this._responseHandlers = new Map();
        this._responseHandlers.set('ping', () => 'pong');
        this._receiveListener = this._receive.bind(this);
    }
    onRequest(command, fn) {
        this._responseHandlers.set(command, fn);
    }
    init() {
        window.addEventListener('message', this._receiveListener);
        this._receiveRedirect();
    }
    close() {
        window.removeEventListener('message', this._receiveListener);
    }
    _receiveRedirect() {
        const message = UrlRpcEncoder.receiveRedirectCommand(window.location);
        if (message) {
            this._receive(message);
        }
    }
    _receive(message) {
        let state = null;
        try {
            state = new State(message);
            // Cannot reply to a message that has no return URL
            if (!('returnURL' in message))
                return;
            // Ignore messages without a command
            if (!('command' in state.data)) {
                return;
            }
            if (this._allowedOrigin !== '*' && message.origin !== this._allowedOrigin) {
                throw new Error('Unauthorized');
            }
            const args = message.data.args && Array.isArray(message.data.args) ? message.data.args : [];
            // Test if request calls a valid handler with the correct number of arguments
            if (!this._responseHandlers.has(state.data.command)) {
                throw new Error(`Unknown command: ${state.data.command}`);
            }
            const requestedMethod = this._responseHandlers.get(state.data.command);
            // Do not include state argument
            if (Math.max(requestedMethod.length - 1, 0) < args.length) {
                throw new Error(`Too many arguments passed: ${message}`);
            }
            console.debug('RpcServer ACCEPT', state.data);
            // Call method
            const result = requestedMethod(state, ...args);
            // If a value is returned, we take care of the reply,
            // otherwise we assume the handler to do the reply when appropriate.
            if (result instanceof Promise) {
                result
                    .then((finalResult) => {
                    if (finalResult !== undefined) {
                        RpcServer._ok(state, finalResult);
                    }
                })
                    .catch((error) => RpcServer._error(state, error));
            }
            else if (result !== undefined) {
                RpcServer._ok(state, result);
            }
        }
        catch (error) {
            if (state) {
                RpcServer._error(state, error);
            }
        }
    }
}
class BrowserDetection { // eslint-disable-line no-unused-vars
    /**
     * @returns {boolean}
     */
    static isDesktopSafari() {
        // see https://stackoverflow.com/a/23522755
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !/mobile/i.test(navigator.userAgent);
    }

    /**
     * @returns {boolean}
     */
    static isSafari() {
        return !!navigator.userAgent.match(/Version\/[\d.]+.*Safari/);
    }

    /**
     * @returns {boolean}
     */
    static isIos() {
        // @ts-ignore (MSStream is not on window)
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    /**
     * @returns {number[]}
     */
    static iosVersion() {
        if (BrowserDetection.isIos()) {
            const v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
            if (v) {
                return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || '0', 10)];
            }
        }

        throw new Error('No iOS version detected');
    }

    /**
     * @returns {boolean}
     */
    static isBadIos() {
        const version = this.iosVersion();
        return version[0] < 11 || (version[0] === 11 && version[1] === 2); // Only 11.2 has the WASM bug
    }
}
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
    /** @type {AccountStore} */
    static get instance() {
        /** @type {AccountStore} */
        this._instance = this._instance || new AccountStore();
        return this._instance;
    }

    /**
     * @param {string} dbName
     * @constructor
     */
    constructor(dbName = AccountStore.ACCOUNT_DATABASE) {
        this._dbName = dbName;
        this._dropped = false;
        /** @type {Promise<IDBDatabase>|null} */
        this._dbPromise = null;
    }

    /**
     * @returns {Promise.<IDBDatabase>}
     * @private
     */
    async connect() {
        if (this._dbPromise) return this._dbPromise;

        this._dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this._dbName, AccountStore.VERSION);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => reject(request.error);
            request.onupgradeneeded = () => {
                // account database doesn't exist
                this._dropped = true;
                request.transaction.abort();
                resolve(null);
            };
        });

        return this._dbPromise;
    }

    /**
     * @returns {Promise<AccountInfo[]>}
     */
    async list() {
        const db = await this.connect();
        if (!db) return [];
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
                    /** @type {AccountInfo} */
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
     * @returns {Promise<AccountRecord[]>}
     * @deprecated Only for database migration
     *
     * @description Returns the encrypted keypairs!
     */
    async dangerousListPlain() {
        const db = await this.connect();
        if (!db) return [];
        return new Promise((resolve, reject) => {
            const results = /** @type {AccountRecord[]} */ ([]);
            const openCursorRequest = db.transaction([AccountStore.ACCOUNT_DATABASE], 'readonly')
                .objectStore(AccountStore.ACCOUNT_DATABASE)
                .openCursor();
            openCursorRequest.onsuccess = () => {
                const cursor = openCursorRequest.result;
                if (cursor) {
                    const key = /** @type {AccountRecord} */ (cursor.value);
                    results.push(key);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            openCursorRequest.onerror = () => reject(openCursorRequest.error);
        });
    }

    async close() {
        if (!this._dbPromise) return;
        // If failed to open database (i.e. _dbPromise rejects) we don't need to close the db
        const db = await this._dbPromise.catch(() => null);
        this._dbPromise = null;
        if (db) db.close();
    }

    /**
     * @returns {Promise<void>}
     */
    async drop() {
        if (this._dropped) return Promise.resolve();
        await this.close();

        return new Promise((resolve, reject) => {
            const request = window.indexedDB.deleteDatabase(this._dbName);

            request.onsuccess = () => {
                this._dropped = true;
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }
}

AccountStore.VERSION = 2;
AccountStore.ACCOUNT_DATABASE = 'accounts';
/* global Nimiq */
/* global Key */
/* global KeyInfo */
/* global AccountStore */
/* global BrowserDetection */

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
        /** @type {KeyStore} */
        KeyStore._instance = KeyStore._instance || new KeyStore();
        return KeyStore._instance;
    }

    constructor() {
        /** @type {?Promise<IDBDatabase>} */
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
            };
        });

        return this._dbPromise;
    }

    /**
     * @param {string} id
     * @param {Uint8Array} [passphrase]
     * @returns {Promise<?Key>}
     */
    async get(id, passphrase) {
        /** @type {?KeyRecord} */
        const keyRecord = await this._get(id);
        if (!keyRecord) {
            return null;
        }

        if (!keyRecord.encrypted) {
            return new Key(keyRecord.secret, keyRecord.type);
        }

        if (!passphrase) {
            throw new Error('Passphrase required');
        }

        const plainSecret = await Nimiq.CryptoUtils.decryptOtpKdf(new Nimiq.SerialBuffer(keyRecord.secret), passphrase);
        return new Key(plainSecret, keyRecord.type);
    }

    /**
     * @param {string} id
     * @returns {Promise<?KeyInfo>}
     */
    async getInfo(id) {
        /** @type {?KeyRecord} */
        const keyRecord = await this._get(id);
        return keyRecord ? new KeyInfo(keyRecord.id, keyRecord.type, keyRecord.encrypted) : null;
    }

    /**
     * @param {string} id
     * @returns {Promise<?KeyRecord>}
     * @private
     */
    async _get(id) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME])
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .get(id);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @param {Key} key
     * @param {Uint8Array} [passphrase]
     * @returns {Promise<void>}
     */
    async put(key, passphrase) {
        const secret = !passphrase
            ? key.secret
            : await Nimiq.CryptoUtils.encryptOtpKdf(new Nimiq.SerialBuffer(key.secret), passphrase);

        const keyRecord = /** @type {KeyRecord} */ {
            id: key.id,
            type: key.type,
            encrypted: !!passphrase && passphrase.length > 0,
            secret,
        };

        return this._put(keyRecord);
    }

    /**
     * @param {KeyRecord} keyRecord
     * @returns {Promise<void>}
     */
    async _put(keyRecord) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .put(keyRecord);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async remove(id) {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readwrite')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .delete(id);
        return KeyStore._requestToPromise(request);
    }

    /**
     * @returns {Promise<KeyInfo[]>}
     */
    async list() {
        const db = await this.connect();
        const request = db.transaction([KeyStore.DB_KEY_STORE_NAME], 'readonly')
            .objectStore(KeyStore.DB_KEY_STORE_NAME)
            .openCursor();

        const results = /** KeyRecord[] */ await KeyStore._readAllFromCursor(request);
        return results.map(keyRecord => new KeyInfo(keyRecord.id, keyRecord.type, keyRecord.encrypted));
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
        const keys = await AccountStore.instance.dangerousListPlain();
        keys.forEach(async key => {
            const address = Nimiq.Address.fromUserFriendlyAddress(key.userFriendlyAddress);
            const legacyKeyId = Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(address.serialize()).subarray(0, 6));

            const keyRecord = /** @type {KeyRecord} */ {
                id: legacyKeyId,
                type: Key.Type.LEGACY,
                encrypted: true,
                secret: key.encryptedKeyPair,
            };

            await this._put(keyRecord);
        });

        // FIXME Uncomment after/for testing (and also adapt KeyStoreIndexeddb.spec.js)
        // await AccountStore.instance.drop();

        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Delete migrate cookie
            document.cookie = 'migrate=0; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

            // Delete accounts cookie
            document.cookie = 'accounts=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
    }

    /**
     * @param {IDBRequest} request
     * @returns {Promise<*>}
     * @private
     */
    static _requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
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
/** @type {?KeyStore} */
KeyStore._instance = null;

KeyStore.DB_VERSION = 1;
KeyStore.DB_NAME = 'nimiq-keyguard';
KeyStore.DB_KEY_STORE_NAME = 'keys';
/* global Nimiq */

class Key {
    /**
     * @param {Uint8Array} secret
     * @param {Key.Type} [type]
     */
    constructor(secret, type = Key.Type.BIP39) {
        this._secret = secret;
        this._type = type;
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PublicKey}
     */
    derivePublicKey(path) {
        return Nimiq.PublicKey.derive(this._derivePrivateKey(path));
    }

    /**
     * @param {string} path
     * @returns {Nimiq.Address}
     */
    deriveAddress(path) {
        return this.derivePublicKey(path).toAddress();
    }

    /**
     * @param {string} path
     * @param {Uint8Array} data
     * @returns {Nimiq.Signature}
     */
    sign(path, data) {
        const privateKey = this._derivePrivateKey(path);
        const publicKey = Nimiq.PublicKey.derive(privateKey);
        return Nimiq.Signature.create(privateKey, publicKey, data);
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PrivateKey}
     * @private
     */
    _derivePrivateKey(path) {
        return this._type === Key.Type.LEGACY
            ? new Nimiq.PrivateKey(this._secret)
            : new Nimiq.Entropy(this._secret).toExtendedPrivateKey().derivePath(path).privateKey;
    }

    /**
     * @type {Uint8Array}
     */
    get secret() {
        return this._secret;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {string}
     */
    get id() {
        const input = this._type === Key.Type.LEGACY
            ? Nimiq.PublicKey.derive(new Nimiq.PrivateKey(this._secret)).toAddress().serialize()
            : this._secret;
        return Nimiq.BufferUtils.toHex(Nimiq.Hash.blake2b(input).subarray(0, 6));
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this.id);
    }

    /**
     * @param {string} id
     * @returns {string}
     */
    static idToUserFriendlyId(id) {
        // Stub
        return `UserFriendly ${id}`;
    }
}
Key.Type = {
    LEGACY: /** @type {Key.Type} */ 0,
    BIP39: /** @type {Key.Type} */ 1,
};
/* global Key */

// eslint-disable-next-line no-unused-vars
class KeyInfo {
    /**
     * @param {string} id
     * @param {Key.Type} type
     * @param {boolean} encrypted
     */
    constructor(id, type, encrypted) {
        /** @private */
        this._id = id;
        /** @private */
        this._type = type;
        /** @private */
        this._encrypted = encrypted;
    }

    /**
     * @type {string}
     */
    get id() {
        return this._id;
    }

    /**
     * @type {Key.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {boolean}
     */
    get encrypted() {
        return this._encrypted;
    }

    /**
     * @type {string}
     */
    get userFriendlyId() {
        return Key.idToUserFriendlyId(this._id);
    }

    /**
     * @returns {KeyInfoObject}
     */
    toObject() {
        return {
            id: this.id,
            type: this.type,
            encrypted: this.encrypted,
            // userFriendlyId: this.userFriendlyId,
        };
    }

    /**
     * @param {KeyInfoObject} obj
     * @returns {KeyInfo}
     */
    static fromObject(obj) {
        return new KeyInfo(obj.id, obj.type, obj.encrypted);
    }
}
/* global KeyInfo */

class CookieJar { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyInfo[]} keys
     */
    static fill(keys) {
        const maxAge = 60 * 60 * 24 * 365;
        const encodedKeys = this._encodeCookie(keys);
        document.cookie = `k=${encodedKeys};max-age=${maxAge.toString()}`;
    }

    /**
     * @param {boolean} [listDeprecatedAccounts] - @deprecated Only for database migration
     * @returns {KeyInfo[] | AccountInfo[]}
     */
    static eat(listDeprecatedAccounts) {
        // Legacy cookie
        if (listDeprecatedAccounts) {
            const match = document.cookie.match(new RegExp('accounts=([^;]+)'));
            if (match && match[1]) {
                const decoded = decodeURIComponent(match[1]);
                return JSON.parse(decoded);
            }
            return [];
        }

        const match = document.cookie.match(new RegExp('k=([^;]+)'));
        if (match && match[1]) {
            return this._decodeCookie(match[1]);
        }

        return [];
    }

    /**
     * @param {KeyInfo[]} keys
     * @returns {string}
     */
    static _encodeCookie(keys) {
        return keys.map(keyInfo => `${keyInfo.type}${keyInfo.encrypted ? 1 : 0}${keyInfo.id}`).join('');
    }

    /**
     * @param {string} str
     * @returns {KeyInfo[]}
     */
    static _decodeCookie(str) {
        if (!str) return [];

        if (str.length % 14 !== 0) throw new Error('Malformed cookie');

        const keys = str.match(/.{14}/g);
        if (!keys) return []; // Make TS happy (match() can potentially return NULL)

        return keys.map(key => {
            const type = /** @type {Key.Type} */ (parseInt(key[0], 10));
            const encrypted = key[1] === '1';
            const id = key.substr(2);
            return new KeyInfo(id, type, encrypted);
        });
    }
}
/* global Nimiq */
/* global RpcServer */

/**
 * @returns {string}
 */
function allowedOrigin() {
    switch (window.location.origin) {
    case 'https://keyguard-next.nimiq.com': return 'https://accounts.nimiq.com';
    case 'https://keyguard-next.nimiq-testnet.com': return 'https://accounts.nimiq-testnet.com';
    default: return '*';
    }
}

/**
 * @param {Newable} RequestApiClass - Class object of the API which is to be exposed via postMessage RPC
 * @param {object} [options]
 */
async function runKeyguard(RequestApiClass, options) { // eslint-disable-line no-unused-vars
    const defaultOptions = {
        loadNimiq: true,
        whitelist: ['request'],
    };

    options = Object.assign(defaultOptions, options);

    if (options.loadNimiq) {
        // Load web assembly encryption library into browser (if supported)
        await Nimiq.WasmHelper.doImportBrowser();
        // Configure to use test net for now
        Nimiq.GenesisConfig.test();
    }

    // If user navigates back to loading screen, skip it
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '') {
            window.history.back();
        }
    });

    // Back arrow functionality
    document.body.addEventListener('click', event => {
        // @ts-ignore
        if (!event.target || !event.target.matches('a.page-header-back-button')) return;
        window.history.back();
    });

    // Instantiate handler.
    /** @type {TopLevelApi} */
    const api = new RequestApiClass();

    window.rpcServer = new RpcServer(allowedOrigin());

    // TODO: Use options.whitelist when adding onRequest handlers (iframe uses different methods)
    window.rpcServer.onRequest('request', (state, request) => api.request(request));

    window.rpcServer.init();
}
/* global BrowserDetection */
/* global CookieJar */
/* global AccountStore */
/* global KeyStore */

class IFrameApi { // eslint-disable-line no-unused-vars
    /**
     * @param {boolean} [listFromLegacyStore] - Deprecated, only for database migration
     * @returns {Promise<KeyInfoObject[] | AccountInfo[]>}
     */
    async list(listFromLegacyStore) {
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            return CookieJar.eat(listFromLegacyStore);
        }

        if (listFromLegacyStore) {
            return AccountStore.instance.list();
        }

        const keyInfos = await KeyStore.instance.list();
        return keyInfos.map(ki => ki.toObject());
    }

    /**
     * @returns {Promise<void>}
     * @deprecated Only for database migration
     */
    async migrateAccountsToKeys() {
        /**
         * IndexedDB is not accessible in iframes on iOS browsers and Safari.
         * Thus when the Keyguard client requests the iframe to migrate the
         * database, the iframe needs to signal to the popup that it should run
         * the migration the next time it is opened. Thus this signalling cookie.
         * The cookie is then detected in the TopLevelApi.request() method.
         */
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            // Set migrate flag cookie
            document.cookie = 'migrate=1;max-age=31536000';
            return;
        }

        // FIXME: Requires Nimiq lib to be loaded, which it currently isn't in the iframe
        await KeyStore.instance.migrateAccountsToKeys();
    }
}
/* global runKeyguard */
/* global IFrameApi */

runKeyguard(IFrameApi, {
    loadNimiq: false,
    whitelist: [
        'list',
        'migrateAccountsToKeys',
    ],
});
