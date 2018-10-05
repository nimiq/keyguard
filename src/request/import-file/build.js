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
class AnimationUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {string} className
     * @param {HTMLElement} el
     * @param {Function} [afterStartCallback]
     * @param {Function} [beforeEndCallback]
     */
    static async animate(className, el, afterStartCallback, beforeEndCallback) {
        return new Promise(resolve => {
            // 'animiationend' is a native DOM event that fires upon CSS animation completion
            /** @param {Event} e */
            const listener = e => {
                if (e.target !== el) return;
                if (beforeEndCallback instanceof Function) beforeEndCallback();
                this.stopAnimate(className, el);
                el.removeEventListener('animationend', listener);
                resolve();
            };
            el.addEventListener('animationend', listener);
            el.classList.add(className);
            if (afterStartCallback instanceof Function) afterStartCallback();
        });
    }

    /**
     * @param {string} className
     * @param {HTMLElement} el
     */
    static stopAnimate(className, el) {
        el.classList.remove(className);
    }
}
/* eslint-disable prefer-promise-reject-errors, no-throw-literal */

// eslint-disable-next-line max-len
/** @typedef {HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | File} imageOrFileOrUrl */

class QrScanner {
    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {HTMLVideoElement} video
     * @param {((value: string) => string | PromiseLike<string>)} [onDecode]
     * @param {number} [canvasSize] - Edge length of the quadratic canvas
     */
    constructor(video, onDecode, canvasSize = QrScanner.DEFAULT_CANVAS_SIZE) {
        this.$video = video;
        this.$canvas = document.createElement('canvas');
        this._onDecode = onDecode;
        this._active = false;

        this.$canvas.width = canvasSize;
        this.$canvas.height = canvasSize;
        this._sourceRect = {
            x: 0,
            y: 0,
            width: canvasSize,
            height: canvasSize,
        };

        this.$video.addEventListener('canplay', () => this._updateSourceRect());
        this.$video.addEventListener('play', () => {
            this._updateSourceRect();
            this._scanFrame();
        }, false);
        this._qrWorker = new Worker(QrScanner.WORKER_PATH);
    }

    _updateSourceRect() {
        const smallestDimension = Math.min(this.$video.videoWidth, this.$video.videoHeight);
        const sourceRectSize = Math.round(2 / 3 * smallestDimension);
        this._sourceRect.width = sourceRectSize;
        this._sourceRect.height = sourceRectSize;
        this._sourceRect.x = (this.$video.videoWidth - sourceRectSize) / 2;
        this._sourceRect.y = (this.$video.videoHeight - sourceRectSize) / 2;
    }

    /**
     * Triggers this._onDecode for each frame, calls itself recursively until the video is paused or ends
     *
     * @returns {boolean}
     */
    _scanFrame() {
        if (this.$video.paused || this.$video.ended) return false;
        requestAnimationFrame(() => {
            QrScanner.scanImage(this.$video, this._sourceRect, this._qrWorker, this.$canvas, true)
                .then(this._onDecode, /** @param {string} error */ error => {
                    if (error !== 'QR code not found.') {
                        console.error(error);
                    }
                })
                .then(() => this._scanFrame());
        });

        return true;
    }

    /**
     * @param {string | object} [facingMode]
     * @param {boolean} [exact]
     * @returns {Promise<MediaStream>}
     */
    _getCameraStream(facingMode, exact = false) {
        const constraintsToTry = [{
            width: { min: 1024 },
        }, {
            width: { min: 768 },
        }, {}];

        if (facingMode) {
            if (exact) {
                facingMode = { exact: facingMode };
            }
            constraintsToTry.forEach(constraint => { constraint.facingMode = facingMode; });
        }
        return this._getMatchingCameraStream(constraintsToTry);
    }

    /**
     * @param {Array} constraintsToTry
     * @returns {Promise<MediaStream>}
     */
    async _getMatchingCameraStream(constraintsToTry) {
        if (constraintsToTry.length === 0) {
            return Promise.reject('Camera not found.');
        }
        return navigator.mediaDevices.getUserMedia({
            video: constraintsToTry.shift(),
        }).catch(() => this._getMatchingCameraStream(constraintsToTry));
    }

    start() {
        if (this._active) {
            return Promise.resolve();
        }
        this._active = true;
        clearTimeout(/** @type {number | undefined} */ (this._offTimeout));
        let facingMode = 'environment';
        return this._getCameraStream('environment', true)
            .catch(() => {
                // we (probably) don't have an environment camera
                facingMode = 'user';
                return this._getCameraStream(); // throws if we can't access the camera
            })
            .then(stream => {
                this.$video.srcObject = stream;
                this._setVideoMirror(facingMode);
            })
            .catch(e => {
                this._active = false;
                throw e;
            });
    }

    stop() {
        if (!this._active) {
            return;
        }
        this._active = false;
        this.$video.pause();
        this._offTimeout = (setTimeout(() => {
            // @ts-ignore
            this.$video.srcObject.getTracks()[0].stop();
            this.$video.srcObject = null;
        }, 3000));
    }

    /**
     * @param {string} facingMode
     */
    _setVideoMirror(facingMode) {
        // in user facing mode mirror the video to make it easier for the user to position the QR code
        const scaleFactor = facingMode === 'user' ? -1 : 1;
        this.$video.style.transform = `scaleX(${scaleFactor})`;
    }

    /**
     * @param {number} red
     * @param {number} green
     * @param {number} blue
     */
    setGrayscaleWeights(red, green, blue) {
        this._qrWorker.postMessage({
            type: 'grayscaleWeights',
            data: { red, green, blue },
        });
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @param {object?} sourceRect
     * @param {Worker?} worker
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @param {boolean} [alsoTryWithoutSourceRect]
     * @returns {Promise<string>}
     */
    static async scanImage(imageOrFileOrUrl, sourceRect = null, worker = null, canvas = null, fixedCanvasSize = false,
        alsoTryWithoutSourceRect = false) {
        const promise = new Promise((resolve, reject) => {
            worker = worker || new Worker(QrScanner.WORKER_PATH);
            /** @type {number | undefined} */
            let timeout;
            /** @type {EventListener} */
            let onError;
            /**
             * @param {Event} event
             */
            const onMessage = event => {
                // @ts-ignore
                if (event.data.type !== 'qrResult') {
                    return;
                }
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                // @ts-ignore
                if (event.data.data !== null) {
                    // @ts-ignore
                    resolve(event.data.data);
                } else {
                    reject('QR code not found.');
                }
            };
            onError = () => {
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                reject('Worker error.');
            };
            worker.addEventListener('message', onMessage);
            worker.addEventListener('error', onError);
            timeout = setTimeout(onError, 3000);
            QrScanner._loadImage(imageOrFileOrUrl).then(image => {
                const imageData = QrScanner._getImageData(image, sourceRect, canvas, fixedCanvasSize);
                /** @type {Worker} */ (worker).postMessage({
                    type: 'decode',
                    data: imageData,
                }, [imageData.data.buffer]);
            }).catch(reject);
        });

        if (sourceRect && alsoTryWithoutSourceRect) {
            return promise.catch(() => QrScanner.scanImage(imageOrFileOrUrl, null, worker, canvas, fixedCanvasSize));
        }
        return promise;
    }


    /**
     * @param {HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap} image
     * @param {object?} sourceRect
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @returns {ImageData}
     */
    static _getImageData(image, sourceRect = null, canvas = null, fixedCanvasSize = false) {
        canvas = canvas || document.createElement('canvas');
        const sourceRectX = sourceRect && sourceRect.x ? sourceRect.x : 0;
        const sourceRectY = sourceRect && sourceRect.y ? sourceRect.y : 0;
        // @ts-ignore
        const sourceRectWidth = sourceRect && sourceRect.width ? sourceRect.width : image.width || image.videoWidth;
        const sourceRectHeight = sourceRect && sourceRect.height
            ? sourceRect.height
            : image.height
            // @ts-ignore
            || image.videoHeight;
        if (!fixedCanvasSize && (canvas.width !== sourceRectWidth || canvas.height !== sourceRectHeight)) {
            canvas.width = sourceRectWidth;
            canvas.height = sourceRectHeight;
        }
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw ('Cannot get canvas 2D context');
        context.imageSmoothingEnabled = false; // gives less blurry images
        context.drawImage(
            image,
            sourceRectX,
            sourceRectY,
            sourceRectWidth,
            sourceRectHeight,
            0,
            0,
            canvas.width,
            canvas.height,
        );
        return context.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @returns {Promise<HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap>}
     */
    static async _loadImage(imageOrFileOrUrl) {
        if (imageOrFileOrUrl instanceof HTMLCanvasElement
            || imageOrFileOrUrl instanceof HTMLVideoElement
            // @ts-ignore
            || (window.ImageBitmap && imageOrFileOrUrl instanceof window.ImageBitmap)
        ) {
            // @ts-ignore
            return Promise.resolve(imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof Image) {
            return QrScanner._awaitImageLoad(imageOrFileOrUrl).then(() => imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof File || imageOrFileOrUrl instanceof URL
            || typeof (imageOrFileOrUrl) === 'string') {
            const image = new Image();
            if (imageOrFileOrUrl instanceof File) {
                image.src = URL.createObjectURL(imageOrFileOrUrl);
            } else {
                // @ts-ignore
                image.src = imageOrFileOrUrl;
            }
            return QrScanner._awaitImageLoad(image).then(() => {
                if (imageOrFileOrUrl instanceof File) {
                    URL.revokeObjectURL(image.src);
                }
                return image;
            });
        }
        return Promise.reject('Unsupported image type.');
    }

    /**
     * @param {HTMLImageElement} image
     */
    static async _awaitImageLoad(image) {
        return new Promise((resolve, reject) => {
            if (image.complete && image.naturalWidth !== 0) {
                // already loaded
                resolve();
            } else {
                /** @type {EventListener} */
                let onError;
                const onLoad = () => { // eslint-disable-line require-jsdoc-except/require-jsdoc
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    resolve();
                };
                onError = () => {
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    reject('Image load error');
                };
                image.addEventListener('load', onLoad);
                image.addEventListener('error', onError);
            }
        });
    }
}
QrScanner.DEFAULT_CANVAS_SIZE = 400;
QrScanner.WORKER_PATH = '../../lib/QrScannerWorker.min.js';
/* global TRANSLATIONS */ // eslint-disable-line no-unused-vars
/* global Nimiq */

/**
 * @typedef {{[language: string]: {[id: string]: string}}} dict
 */

class I18n { // eslint-disable-line no-unused-vars
    /**
     * @param {dict} dictionary - Dictionary of all languages and phrases
     * @param {string} fallbackLanguage - Language to be used if no translation for the current language can be found
     */
    static initialize(dictionary, fallbackLanguage) {
        this._dict = dictionary;

        if (!(fallbackLanguage in this._dict)) {
            throw new Error(`Fallback language "${fallbackLanguage}" not defined`);
        }
        /** @type {string} */
        this._fallbackLanguage = fallbackLanguage;

        this.language = navigator.language;
    }

    /**
     * @param {HTMLElement} [dom] - The DOM element to be translated, or body by default
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     */
    static translateDom(dom = document.body, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;

        /* eslint-disable-next-line valid-jsdoc */ // Multi-line descriptions are not valid JSDoc, apparently
        /**
         * @param {string} tag
         * @param {(element: HTMLElement, translation: string) => void} callback - callback(element, translation) for
         * each matching element
         */
        const translateElements = (tag, callback) => {
            const attribute = `data-${tag}`;
            /** @type {NodeListOf<HTMLElement>} */
            const elements = dom.querySelectorAll(`[${attribute}]`);
            elements.forEach(element => {
                const id = element.getAttribute(attribute);
                if (!id) return;
                callback(element, this._translate(id, language));
            });
        };

        /**
         * @param {string} tag
         */
        const translateAttribute = tag => {
            translateElements(`i18n-${tag}`, (element, translation) => element.setAttribute(tag, translation));
        };

        translateElements('i18n', (element, translation) => {
            const sanitized = translation.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const withMarkup = sanitized.replace(/\[strong]/g, '<strong>').replace(/\[\/strong]/g, '</strong>');
            element.innerHTML = withMarkup;
        });
        translateAttribute('value');
        translateAttribute('placeholder');
    }

    /**
     * @param {string} id - translation dict ID
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     * @returns {string}
     */
    static translatePhrase(id, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;
        return this._translate(id, language);
    }

    /**
     * @param {string} id
     * @param {string} language
     * @returns {string}
     */
    static _translate(id, language) {
        if (!this.dictionary[language] || !this.dictionary[language][id]) {
            throw new Error(`I18n: ${language}/${id} is undefined!`);
        }
        return this.dictionary[language][id];
    }

    /**
     * @returns {string[]} ISO codes of all available languages.
     */
    static availableLanguages() {
        return Object.keys(this.dictionary);
    }

    /**
     * @param {string} language
     */
    static switchLanguage(language) {
        this.language = language;
    }

    /**
     * Selects a supported language closed to the desired language. Examples it might return:
     * en-us => en-us, en-us => en, en => en-us, fr => en.
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     * @returns {string}
     */
    static getClosestSupportedLanguage(language) {
        // If this language is supported, return it directly
        if (language in this.dictionary) return language;

        // Return the base language, if it exists in the dictionary
        const baseLanguage = language.split('-')[0];
        if (baseLanguage !== language && baseLanguage in this.dictionary) return baseLanguage;

        // Check if other versions (siblings) of the base language exist
        const languagePrefix = `${baseLanguage}-`;
        const siblingLanguage = this.availableLanguages()
            .find(supportedLanguage => supportedLanguage.startsWith(languagePrefix));

        return siblingLanguage || this.fallbackLanguage;
    }

    /**
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     */
    static set language(language) {
        const languageToUse = this.getClosestSupportedLanguage(language);

        if (languageToUse !== language) {
            // eslint-disable-next-line no-console
            console.warn(`Language ${language} not supported, using ${languageToUse} instead.`);
        }

        if (this._language !== languageToUse) {
            /** @type {string} */
            this._language = languageToUse;

            if (({ interactive: 1, complete: 1 })[document.readyState]) {
                this.translateDom();
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    this.translateDom();
                });
            }
            I18n.observer.fire(I18n.Events.LANGUAGE_CHANGED, this._language);
        }
    }

    /** @type {string} */
    static get language() {
        return this._language || this.fallbackLanguage;
    }

    /** @type {dict} */
    static get dictionary() {
        if (!this._dict) throw new Error('I18n not initialized');
        return this._dict;
    }

    /** @type {string} */
    static get fallbackLanguage() {
        if (!this._fallbackLanguage) throw new Error('I18n not initialized');
        return this._fallbackLanguage;
    }

    /** @returns {DOMParser} */
    static get parser() {
        /** @type {DOMParser} */
        this._parser = this._parser || new DOMParser();

        return this._parser;
    }
}

I18n.observer = new Nimiq.Observable();
I18n.Events = {
    LANGUAGE_CHANGED: 'language-changed',
};
const TRANSLATIONS = {
    en: {
        _language: 'English',
        loading: 'Loading...',
        continue: 'Continue',

        'passphrase-strength': 'Strength',
        'passphrase-placeholder': 'Enter passphrase',
        'passphrase-repeat-placeholder': 'Repeat passphrase',

        'privacy-warning-heading': 'Are you being watched?',
        'privacy-warning-text': 'Now is the perfect time to assess your surroundings. '
                              + 'Nearby windows? Hidden cameras? Shoulder spies? '
                              + 'Anyone with your backup phrase can access and spend your NIM.',
        'privacy-agent-continue': 'Continue',

        'recovery-words-title': 'Recovery Words',
        'recovery-words-input-label': 'Recovery Words',
        'recovery-words-input-field-placeholder': 'word #',
        'recovery-words-explanation': 'There really is no password recovery. The following words are a backup '
                                    + 'of your Key File and will grant you access to your wallet even if your '
                                    + 'Key File is lost.',
        'recovery-words-storing': 'Write those words on a piece of paper and store it at a safe, offline place.',

        'create-heading-choose-identicon': 'Choose your account avatar',
        'create-text-select-avatar': 'Select an avatar for your wallet\'s default account from the selection below.',
        'create-hint-more-accounts': 'You can add more accounts later.',
        'create-heading-keyfile': 'This is your Key File',
        'create-text-keyfile-info': 'Your Key File gives you full access to your wallet. '
                                  + 'You\'ll need it everytime you log in.',
        'create-hint-keyfile-password': 'To protect your wallet, first protect it with a password.',
        'create-heading-backup-account': 'Create a backup',
        'create-heading-validate-backup': 'Validate your backup',

        'import-heading-log-in': 'Log in',
        'import-link-no-wallet': 'Don\'t have a wallet yet?',
        'import-heading-protect': 'Protect your wallet',
        'import-text-set-password': 'You can now set a password to encrypt your wallet on this device.',

        'import-file-lost-file': 'Lost your Key File? You can recover your account with your 24 Recovery Words.',
        'import-file-button-words': 'Enter Recovery Words',
        'import-file-heading-unlock': 'Unlock your Key File',
        'import-file-text-unprotected-keyfile': 'Your Key File is unprotected.',

        'file-import-prompt': 'Drop your Key File here',
        'file-import-click-hint': 'Or click to select a file.',

        'enter-recovery-words-heading': 'Import from recovery words',
        'enter-recovery-words-subheading': 'Please enter your 24 recovery words.',

        'choose-key-type-heading': 'Choose key type',
        'choose-key-type-subheading': 'We couldn\'t determine the type of your key. Please select it below.',
        'choose-key-type-or': 'or',
        'choose-key-type-legacy-address-heading': 'Single address',
        'choose-key-type-legacy-address-info': 'Created before xx/xx/2018',
        'choose-key-type-bip39-address-heading': 'Multiple addresses',
        'choose-key-type-bip39-address-info': 'Created after xx/xx/2018',

        'sign-tx-heading': 'New Transaction',
        'sign-tx-includes': 'includes',
        'sign-tx-fee': 'fee',
        'sign-tx-youre-sending': 'You\'re sending',
        'sign-tx-to': 'to',
        'sign-tx-pay-with': 'Pay with',

        'passphrasebox-enter-passphrase': 'Enter your passphrase',
        'passphrasebox-protect-keyfile': 'Protect your keyfile with a password',
        'passphrasebox-repeat-password': 'Repeat your password',
        'passphrasebox-continue': 'Continue',
        'passphrasebox-log-in': 'Log in to your wallet',
        'passphrasebox-log-out': 'Confirm logout',
        'passphrasebox-download': 'Download key file',
        'passphrasebox-confirm-tx': 'Confirm transaction',
        'passphrasebox-password-strength-8': 'Great, that\'s a good password!',
        'passphrasebox-password-strength-10': 'Super, that\'s a strong password!',
        'passphrasebox-password-strength-12': 'Excellent, that\'s a very strong password!',
        'passphrasebox-password-hint': 'Your password should have at least 8 characters.',
        'passphrasebox-password-skip': 'Skip password protection for now',

        'identicon-selector-loading': 'Mixing colors',
        'identicon-selector-button-select': 'Select',
        'identicon-selector-link-back': 'Back',

        'downloadkeyfile-heading-protected': 'Your Key File is protected!',
        'downloadkeyfile-heading-unprotected': 'Your Key File is not protected!',
        'downloadkeyfile-safe-place': 'Store it in a safe place. If you lose it, it cannot be recovered!',
        'downloadkeyfile-download': 'Download Key File',
        'downloadkeyfile-download-anyway': 'Download anyway',

        'validate-words-text': 'Please select the correct word from your list of recovery words.',
        'validate-words-back': 'Back to words',
        'validate-words-skip': 'Skip validation for now',
    },
    de: {
        _language: 'Deutsch',
        loading: 'Wird geladen...',
        continue: 'Weiter',

        'passphrase-strength': 'Stärke',
        'passphrase-placeholder': 'Passphrase eingeben',
        'passphrase-repeat-placeholder': 'Passphrase wiederholen',

        'privacy-warning-heading': 'Wirst du beobachtet?',
        'privacy-warning-text': 'Jetzt ist eine gute Zeit um sich umzuschauen. Gibt es Fenster in der Nähe? '
                              + 'Versteckte Kameras? Jemand der über deine Schulter schaut? '
                              + 'Jeder der deine Wiederherstellungswörter hat, kann auf deine NIM zugreifen '
                              + 'und sie ausgeben.',
        'privacy-agent-continue': 'Weiter',

        'recovery-words-title': 'Wiederherstellungswörter',
        'recovery-words-input-label': 'Wiederherstellungswörter',
        'recovery-words-input-field-placeholder': 'Wort ',
        'recovery-words-explanation': 'Es gibt wirklich keine Password-Wiederherstellung. Die folgenden Wörter '
                                    + 'sind ein Backup von deiner Schlüsseldatei und werden dir Zugang zu deiner '
                                    + 'Wallet gewähren, auch wenn deine Schlüsseldatei verloren ist.',
        'recovery-words-storing': 'Schreibe diese Wörter auf ein Stück Papier und verwahre es an einem sicheren, '
                                + 'analogen Ort.',

        'create-heading-choose-identicon': 'Wähle deinen Konto Avatar',
        'create-text-select-avatar': 'Wähle einen Avatar für den Standard-Account deiner Wallet aus der Auswahl unten.',
        'create-hint-more-accounts': 'Neue Konten kannst du später hinzufügen.',
        'create-heading-keyfile': 'Das ist deine Wallet Datei',
        'create-text-keyfile-info': 'Deine Wallet Datei gibt dir vollen Zugang zu deiner Wallet. '
                                  + 'Du brauchst sie jedesmal wenn du dich einloggst.',
        'create-hint-keyfile-password': 'Um deine Wallet zu schützen, schütze es mit einem Passwort.',
        'create-heading-backup-account': 'Erstelle ein Backup',
        'create-heading-validate-backup': 'Überprüfe dein Backup',

        'import-heading-log-in': 'Einloggen',
        'import-link-no-wallet': 'Du hast noch keine Wallet?',
        'import-heading-protect': 'Wallet verschlüsseln',
        'import-text-set-password': 'Du kannst jetzt ein Passwort eingeben, um deine Wallet auf diesem '
                                  + 'Gerät zu verschlüsseln.',

        'import-file-lost-file': 'Schlüsseldatei verloren? Du kannst deinen Account mit deinen 24 '
                               + 'Wiederherstellungswörtern wiederherstellen',
        'import-file-button-words': 'Wiederherstellungswörter eingeben',
        'import-file-heading-unlock': 'Entsperre deine Schlüsseldatei',
        'import-file-text-unprotected-keyfile': 'Deine Schlüsseldatei ist ungeschützt.',

        'file-import-prompt': 'Ziehe deine Schlüsseldatei auf dieses Feld',
        'file-import-click-hint': 'Oder klicke um eine Datei auszuwählen.',

        'enter-recovery-words-heading': 'Mit Wiederherstellungswörtern importieren',
        'enter-recovery-words-subheading': 'Bitte gib deine 24 Wiederherstellungswörter ein.',

        'choose-key-type-heading': 'Schlüsseltyp wählen',
        'choose-key-type-subheading': 'Wir konnten den Typ deines Schlüssels nicht automatisch ermitteln. '
                                    + 'Bitte wähle ihn unten aus.',
        'choose-key-type-or': 'oder',
        'choose-key-type-legacy-address-heading': 'Einzelne Adresse',
        'choose-key-type-legacy-address-info': 'Erstellt vor xx.xx.2018',
        'choose-key-type-bip39-address-heading': 'Mehrere Adressen',
        'choose-key-type-bip39-address-info': 'Erstellt nach xx.xx.2018',

        'sign-tx-heading': 'Neue Überweisung',
        'sign-tx-includes': 'inklusive',
        'sign-tx-fee': 'Gebühr',
        'sign-tx-youre-sending': 'Du sendest',
        'sign-tx-to': 'an',
        'sign-tx-pay-with': 'Zahle mit',

        'passphrasebox-enter-passphrase': 'Gib deine Passphrase ein',
        'passphrasebox-protect-keyfile': 'Sichere dein KeyFile mit einem Passwort',
        'passphrasebox-repeat-password': 'Wiederhole dein Passwort',
        'passphrasebox-continue': 'Weiter',
        'passphrasebox-log-in': 'In deine Wallet einloggen',
        'passphrasebox-log-out': 'Abmeldung bestätigen',
        'passphrasebox-download': 'KeyFile herunterladen',
        'passphrasebox-confirm-tx': 'Überweisung bestätigen',
        'passphrasebox-password-strength-8': 'Schön, das ist ein gutes Passwort!',
        'passphrasebox-password-strength-10': 'Super, das ist ein starkes Passwort!',
        'passphrasebox-password-strength-12': 'Exzellent, das ist ein sehr starkes Passwort!',
        'passphrasebox-password-hint': 'Dein Passwort muss mindestens 8 Zeichen haben.',
        'passphrasebox-password-skip': 'Passwortschutz erstmal überspringen',

        'identicon-selector-loading': 'Mische Farben',
        'identicon-selector-button-select': 'Auswählen',
        'identicon-selector-link-back': 'Zurück',

        'downloadkeyfile-heading-protected': 'Dein Schlüsseldatei ist geschützt!',
        'downloadkeyfile-heading-unprotected': 'Dein Schlüsseldatei ist nicht geschützt!',
        'downloadkeyfile-safe-place': 'Lagere sie in einem sicheren Ort. Wenn du sie verlierst, '
                                    + 'kann sie nicht wiederhergestellt werden!',
        'downloadkeyfile-download': 'Schlüsseldatei herunterladen',
        'downloadkeyfile-download-anyway': 'Trotzdem herunterladen',

        'validate-words-text': 'Bitte wähle das richtige Wort aus deiner Liste von Wiederherstellungswörtern aus.',
        'validate-words-back': 'Zurück zu den Wörtern',
        'validate-words-skip': 'Überprüfung erstmal überspringen',
    },
};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
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
/* global Nimiq */
/* global AnimationUtils */
/* global QrScanner */
/* global I18n */

class FileImport extends Nimiq.Observable {
    /**
     * @param {HTMLDivElement} [$el]
     */
    constructor($el) {
        super();
        this.$el = FileImport._createElement($el);

        /** @type {HTMLElement} */
        this.$errorMessage = (this.$el.querySelector('.error-message'));
        /** @type {HTMLInputElement} */
        this.$fileInput = (this.$el.querySelector('input'));

        // TODO Re-add the drop target interaction and event listeners?

        this.$el.addEventListener('click', this._openFileInput.bind(this));
        this.$fileInput.addEventListener('change', this._onFileSelected.bind(this));
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('file-import');

        $el.innerHTML = `
            <h3 data-i18n="file-import-prompt">Drop your Key File here</h3>
            <span class="click-hint" data-i18n="file-import-click-hint">Or click to select a file.</span>
            <span class="error-message"></span>
            <input type="file" accept="image/*">
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @returns {HTMLElement}
     */
    getElement() {
        return this.$el;
    }

    _openFileInput() {
        this.$fileInput.click();
    }

    /**
     * @param {DOMEvent} event
     */
    _onFileSelected(event) {
        this.$errorMessage.textContent = '';
        // @ts-ignore
        const files = event.target.files;
        this._readFile(files[0]);
        this.$fileInput.value = '';
    }

    _onQrError() {
        AnimationUtils.animate('shake', this.$el);
        this.$errorMessage.textContent = 'Could not read Key File.';
    }

    /**
     * @param {File} file
     */
    async _readFile(file) {
        // TODO Add WalletBackup to keyguard-next code base
        // const qrPosition = WalletBackup.calculateQrPosition();
        const qrPosition = {
            x: 156,
            y: 548.6886,
            width: 173.4,
            height: 173.4,
            size: 185.4,
            padding: 12,
        };

        try {
            const decoded = await QrScanner.scanImage(file, qrPosition, null, null, false, true);
            this.fire(FileImport.Events.IMPORT, decoded);
        } catch (e) {
            this._onQrError();
        }
    }
}

FileImport.Events = {
    IMPORT: 'import',
};
/* global Nimiq */
/* global AnimationUtils */
/* global I18n */

class PassphraseInput extends Nimiq.Observable {
    /**
     * @param {?HTMLElement} $el
     * @param {string} placeholder
     * @param {boolean} [showStrengthIndicator]
     */
    constructor($el, placeholder = '••••••••', showStrengthIndicator = false) {
        super();
        this._minLength = PassphraseInput.DEFAULT_MIN_LENGTH;
        this._showStrengthIndicator = showStrengthIndicator;
        this.$el = PassphraseInput._createElement($el);
        this.$inputContainer = /** @type {HTMLElement} */ (this.$el.querySelector('.input-container'));
        this.$input = /** @type {HTMLInputElement} */ (this.$el.querySelector('input.password'));
        this.$eyeButton = /** @type {HTMLElement} */ (this.$el.querySelector('.eye-button'));

        /** @type {HTMLElement} */
        this.$strengthIndicator = (this.$el.querySelector('.strength-indicator'));
        /** @type {HTMLElement} */
        this.$strengthIndicatorContainer = (this.$el.querySelector('.strength-indicator-container'));
        if (!showStrengthIndicator) {
            this.$strengthIndicatorContainer.style.display = 'none';
        }

        this.$input.placeholder = placeholder;

        this.$eyeButton.addEventListener('click', () => this._changeVisibility());

        this._onInputChanged();
        this.$input.addEventListener('input', () => this._onInputChanged());
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-input');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <div class="input-container">
                <input class="password" type="password" placeholder="Enter Passphrase">
                <span class="eye-button icon-eye"/>
            </div>
            <div class="strength-indicator-container">
                <div class="label"><span data-i18n="passphrase-strength">Strength</span>:</div>
                <meter max="130" low="10" optimum="100" class="strength-indicator"></meter>
            </div>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    /** @type {HTMLInputElement} */
    get input() {
        return this.$input;
    }

    focus() {
        this.$input.focus();
    }

    reset() {
        this.$input.value = '';
        this._changeVisibility(false);
        this._onInputChanged();
    }

    async onPassphraseIncorrect() {
        await AnimationUtils.animate('shake', this.$inputContainer);
        this.reset();
    }

    /** @param {boolean} [becomeVisible] */
    _changeVisibility(becomeVisible) {
        becomeVisible = typeof becomeVisible !== 'undefined'
            ? becomeVisible
            : this.$input.getAttribute('type') === 'password';
        this.$input.setAttribute('type', becomeVisible ? 'text' : 'password');
        this.$eyeButton.classList.toggle('icon-eye-off', becomeVisible);
        this.$eyeButton.classList.toggle('icon-eye', !becomeVisible);
        this.$input.focus();
    }

    _onInputChanged() {
        const passphraseLength = this.$input.value.length;
        this._updateStrengthIndicator();
        this.valid = passphraseLength >= this._minLength;

        this.fire(PassphraseInput.Events.VALID, this.valid);
    }

    _updateStrengthIndicator() {
        const passphraseLength = this.$input.value.length;
        let strengthIndicatorValue;
        if (passphraseLength === 0) {
            strengthIndicatorValue = 0;
        } else if (passphraseLength < 7) {
            strengthIndicatorValue = 10;
        } else if (passphraseLength < 10) {
            strengthIndicatorValue = 70;
        } else if (passphraseLength < 14) {
            strengthIndicatorValue = 100;
        } else {
            strengthIndicatorValue = 130;
        }
        this.$strengthIndicator.setAttribute('value', String(strengthIndicatorValue));
    }

    /**
     * @returns {string}
     */
    get text() {
        return this.$input.value;
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._minLength = minLength || PassphraseInput.DEFAULT_MIN_LENGTH;
    }
}

PassphraseInput.Events = {
    VALID: 'passphraseinput-valid',
};

PassphraseInput.DEFAULT_MIN_LENGTH = 8;
/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
            hideInput: false, // TODO: When a key is not encrypted, no passphrase is required
            buttonI18nTag: 'passphrasebox-confirm-tx',
        };

        super();

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.cancel')).addEventListener('click', () => this._onCancel());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'center', options.bgColor);

        // To enable i18n validation with the dynamic nature of the passphrase box's contents,
        // all possible i18n tags and texts have to be specified here in the below format to
        // enable the validator to find them with its regular expression.
        /* eslint-disable max-len */
        const buttonVersions = {
            'passphrasebox-continue': '<button class="submit" data-i18n="passphrasebox-continue">Continue</button>',
            'passphrasebox-log-in': '<button class="submit" data-i18n="passphrasebox-log-in">Log in to your wallet</button>',
            'passphrasebox-log-out': '<button class="submit" data-i18n="passphrasebox-log-out">Confirm logout</button>',
            'passphrasebox-confirm-tx': '<button class="submit" data-i18n="passphrasebox-confirm-tx">Confirm transaction</button>',
        };
        /* eslint-enable max-len */

        if (!buttonVersions[options.buttonI18nTag]) throw new Error('PassphraseBox button i18n tag not defined');

        $el.innerHTML = `
            <a class="cancel icon-cancel"></a>
            <h2 class="prompt" data-i18n="passphrasebox-enter-passphrase">Enter your passphrase</h2>
            <div passphrase-input></div>
            ${buttonVersions[options.buttonI18nTag]}
        `;

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this._passphraseInput.focus();
    }

    reset() {
        this._passphraseInput.reset();
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._passphraseInput.setMinLength(minLength);
    }

    /**
     * @returns {Promise<void>}
     */
    async onPassphraseIncorrect() {
        return this._passphraseInput.onPassphraseIncorrect();
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();
        this.fire(PassphraseBox.Events.SUBMIT, this._passphraseInput.text);
    }

    _onCancel() {
        this.fire(PassphraseBox.Events.CANCEL);
    }
}

PassphraseBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    CANCEL: 'passphrasebox-cancel',
};
/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseSetterBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
        };

        super();

        this._password = '';

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseSetterBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.password-skip')).addEventListener('click', () => this._onSkip());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'setter', 'center', options.bgColor);

        /* eslint-disable max-len */
        $el.innerHTML = `
            <h2 class="prompt protect" data-i18n="passphrasebox-protect-keyfile">Protect your keyfile with a password</h2>
            <h2 class="prompt repeat" data-i18n="passphrasebox-repeat-password">Repeat your password</h2>

            <div passphrase-input></div>

            <div class="password-strength strength-8"  data-i18n="passphrasebox-password-strength-8" >Great, that's a good password!</div>
            <div class="password-strength strength-10" data-i18n="passphrasebox-password-strength-10">Super, that's a strong password!</div>
            <div class="password-strength strength-12" data-i18n="passphrasebox-password-strength-12">Excellent, that's a very strong password!</div>

            <div class="password-hint" data-i18n="passphrasebox-password-hint">Your password should have at least 8 characters.</div>
            <a tabindex="0" class="password-skip" data-i18n="passphrasebox-password-skip">Skip password protection for now</a>

            <button class="submit" data-i18n="passphrasebox-continue">Continue</button>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this._passphraseInput.focus();
    }

    /**
     * @param {boolean} [isWrongPassphrase]
     */
    async reset(isWrongPassphrase) {
        this._password = '';

        if (isWrongPassphrase) await this._passphraseInput.onPassphraseIncorrect();
        else this._passphraseInput.reset();

        this.$el.classList.remove('repeat');
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);

        const length = this._passphraseInput.text.length;
        this.$el.classList.toggle('strength-8', length < 10);
        this.$el.classList.toggle('strength-10', length >= 10 && length < 12);
        this.$el.classList.toggle('strength-12', length >= 12);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();

        if (!this._password) {
            this._password = this._passphraseInput.text;
            this._passphraseInput.reset();
            this.$el.classList.add('repeat');
        } else if (this._password !== this._passphraseInput.text) {
            this.reset(true);
        } else {
            this.fire(PassphraseSetterBox.Events.SUBMIT, this._password);
            this.reset();
        }
    }

    _onSkip() {
        this.fire(PassphraseSetterBox.Events.SKIP);
    }
}

PassphraseSetterBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    SKIP: 'passphrasebox-skip',
};
/* global BrowserDetection */
/* global KeyStore */
/* global CookieJar */
/* global I18n */

/**
 * A common parent class for pop-up requests.
 *
 * Usage:
 * Inherit this class in your popup request API class:
 * ```
 *  class SignTransactionApi extends TopLevelApi {
 *
 *      // Define the onRequest method to receive the client's request object:
 *      onRequest(request) {
 *          // do something...
 *
 *          // When done, call this.resolve() with the result object
 *          this.resolve(result);
 *
 *          // Or this.reject() with an error
 *          this.reject(error);
 *      }
 *  }
 *
 *  // Finally, start your API:
 *  runKeyguard(SignTransactionApi);
 * ```
 */
class TopLevelApi { // eslint-disable-line no-unused-vars
    constructor() {
        if (window.self !== window.top) {
            // PopupAPI may not run in a frame
            throw new Error('Illegal use');
        }

        /** @type {Function} */
        this._resolve = () => { throw new Error('Method not defined'); };

        /** @type {Function} */
        this._reject = () => { throw new Error('Method not defined'); };

        I18n.initialize(window.TRANSLATIONS, 'en');
        I18n.translateDom();

        window.addEventListener('beforeunload', () => {
            this.reject(new Error('Keyguard popup closed'));
        });
    }

    /**
     * Method to be called by the Keyguard client via RPC
     *
     * @param {KeyguardRequest} request
     */
    async request(request) {
        /**
         * Detect migrate signalling set by the iframe
         *
         * @deprecated Only for database migration
         */
        if ((BrowserDetection.isIos() || BrowserDetection.isSafari()) && this._hasMigrateFlag()) {
            await KeyStore.instance.migrateAccountsToKeys();
        }

        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;

            this.onRequest(request).catch(reject);
        });
    }

    /**
     * Overwritten by each request's API class
     *
     * @param {KeyguardRequest} request
     * @abstract
     */
    async onRequest(request) { // eslint-disable-line no-unused-vars
        throw new Error('Not implemented');
    }

    /**
     * Called by a page's API class on success
     *
     * @param {*} result
     * @returns {Promise<void>}
     */
    async resolve(result) {
        // Keys might have changed, so update cookie for iOS and Safari users
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            const keys = await KeyStore.instance.list();
            CookieJar.fill(keys);
        }

        this._resolve(result);
    }

    /**
     * Called by a page's API class on error
     *
     * @param {Error} error
     */
    reject(error) {
        this._reject(error);
    }

    /**
     * @deprecated Only for database migration
     * @returns {boolean}
     */
    _hasMigrateFlag() {
        const match = document.cookie.match(new RegExp('migrate=([^;]+)'));
        return !!match && match[1] === '1';
    }
}
/* global TopLevelApi */
/* global FileImport */
/* global PassphraseBox */
/* global PassphraseSetterBox */
/* global Nimiq */
/* global Key */
/* global KeyStore */

class ImportFileApi extends TopLevelApi {
    constructor() {
        super();

        this._encryptedKey = new Nimiq.SerialBuffer(0);
        this._keyType = Key.Type.BIP39;

        // Start UI
        const dom = this._makeView();
        this._passphraseBox = dom.passphraseBox;
        this._passphraseSetterBox = dom.passphraseSetterBox;

        this.$loading = /** @type {HTMLDivElement} */ (document.querySelector('#loading'));
    }

    /**
     * @param {ImportRequest} request
     */
    async onRequest(request) {
        this._request = request;

        // Global cancel link
        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());

        this.run();
    }

    /**
     * @returns {{passphraseBox: PassphraseBox, passphraseSetterBox: PassphraseSetterBox}}
     */
    _makeView() {
        // Containers
        /** @type {HTMLDivElement} */
        const $fileImport = (document.querySelector('.file-import'));
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('.passphrase-box'));
        /** @type {HTMLFormElement} */
        const $passphraseSetterBox = (document.querySelector('.passphrase-setter-box'));

        // Components
        const fileImport = new FileImport($fileImport);
        const passphraseBox = new PassphraseBox($passphraseBox, { buttonI18nTag: 'passphrasebox-log-in' });
        const passphraseSetterBox = new PassphraseSetterBox($passphraseSetterBox);

        // Events
        fileImport.on(FileImport.Events.IMPORT, this._onFileImported.bind(this));
        passphraseBox.on(PassphraseBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());
        passphraseSetterBox.on(PassphraseSetterBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseSetterBox.on(PassphraseSetterBox.Events.SKIP, () => this._onPassphraseEntered(null));

        return {
            passphraseBox,
            passphraseSetterBox,
        };
    }

    /**
     * Determine key type and forward user to Passphrase input
     *
     * @param {string} encryptedKeyBase64 - Encrypted KeyPair in base64 format
     */
    _onFileImported(encryptedKeyBase64) {
        if (encryptedKeyBase64.substr(0, 2) === '#3') {
            // BIP39 Key File
            this._keyType = Key.Type.BIP39;

            this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
            this._passphraseBox.setMinLength();

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) this._goToEnterPassphrase();
            else this._goToSetPassphrase();
        } else {
            // Legacy Account Access File
            this._keyType = Key.Type.LEGACY;

            if (encryptedKeyBase64.substr(0, 2) === '#2') {
                // PIN-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
                this._passphraseBox.setMinLength(6);
            } else {
                // Passphrase-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64);
                this._passphraseBox.setMinLength(8);
            }

            this._goToEnterPassphrase();
        }
    }

    run() {
        window.location.hash = ImportFileApi.Pages.FILE_IMPORT;

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {string?} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        const key = await this._decryptAndStoreKey(passphrase);
        if (!key) {
            this._passphraseBox.onPassphraseIncorrect();
            return;
        }

        /** @type {{keyPath: string, address: Uint8Array}[]} */
        const addresses = [];

        if (key.type === Key.Type.LEGACY) {
            const address = key.deriveAddress('');
            addresses.push({
                keyPath: 'm/0\'',
                address: address.serialize(),
            });
        } else if (key.type === Key.Type.BIP39) {
            /** @type {ImportRequest} */
            (this._request).requestedKeyPaths.forEach(keyPath => {
                addresses.push({
                    keyPath,
                    address: key.deriveAddress(keyPath).serialize(),
                });
            });
        } else {
            throw new Error(`Unkown key type ${key.type}`);
        }

        /** @type {ImportResult} */
        const result = {
            keyId: key.id,
            keyType: key.type,
            addresses,
        };

        this.resolve(result);
    }

    /**
     * @param {string?} passphrase
     * @returns {Promise<?Key>}
     */
    async _decryptAndStoreKey(passphrase) {
        this.$loading.style.display = 'flex';
        try {
            // Separating the processing of the encryptionKey (password) and the secret (key) is necessary
            // to cover these scenarios:
            //     1. Encrypted key file with password or PIN
            //     2. Unencrypted key file and no new password set
            //     3. Unencrypted key file and new password set

            let secret = new Uint8Array(0);
            let encryptionKey = null;

            if (passphrase !== null) {
                // TODO Support for UTF-8 passwords
                encryptionKey = Nimiq.BufferUtils.fromAscii(passphrase);
            }

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) {
                secret = await Nimiq.CryptoUtils.decryptOtpKdf(
                    this._encryptedKey,
                    /** @type {Uint8Array} */ (encryptionKey),
                );
            } else {
                // Key File was not encrypted and the imported Uint8Array is the plain secret
                secret = this._encryptedKey;
            }

            const key = new Key(secret, this._keyType);
            await KeyStore.instance.put(key, encryptionKey || undefined);

            return key;
        } catch (e) {
            this.$loading.style.display = 'none';
            return null;
        }
    }

    _goToEnterPassphrase() {
        window.location.hash = ImportFileApi.Pages.ENTER_PASSPHRASE;
        this._passphraseBox.reset();
        this._passphraseBox.focus();
    }

    _goToSetPassphrase() {
        window.location.hash = ImportFileApi.Pages.SET_PASSPHRASE;
        this._passphraseSetterBox.reset();
        this._passphraseSetterBox.focus();
    }
}

ImportFileApi.Pages = {
    FILE_IMPORT: 'file-import',
    ENTER_PASSPHRASE: 'enter-passphrase',
    SET_PASSPHRASE: 'set-passphrase',
};
/* global runKeyguard */
/* global ImportFileApi */

runKeyguard(ImportFileApi);
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
class AnimationUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {string} className
     * @param {HTMLElement} el
     * @param {Function} [afterStartCallback]
     * @param {Function} [beforeEndCallback]
     */
    static async animate(className, el, afterStartCallback, beforeEndCallback) {
        return new Promise(resolve => {
            // 'animiationend' is a native DOM event that fires upon CSS animation completion
            /** @param {Event} e */
            const listener = e => {
                if (e.target !== el) return;
                if (beforeEndCallback instanceof Function) beforeEndCallback();
                this.stopAnimate(className, el);
                el.removeEventListener('animationend', listener);
                resolve();
            };
            el.addEventListener('animationend', listener);
            el.classList.add(className);
            if (afterStartCallback instanceof Function) afterStartCallback();
        });
    }

    /**
     * @param {string} className
     * @param {HTMLElement} el
     */
    static stopAnimate(className, el) {
        el.classList.remove(className);
    }
}
/* eslint-disable prefer-promise-reject-errors, no-throw-literal */

// eslint-disable-next-line max-len
/** @typedef {HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | File} imageOrFileOrUrl */

class QrScanner {
    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {HTMLVideoElement} video
     * @param {((value: string) => string | PromiseLike<string>)} [onDecode]
     * @param {number} [canvasSize] - Edge length of the quadratic canvas
     */
    constructor(video, onDecode, canvasSize = QrScanner.DEFAULT_CANVAS_SIZE) {
        this.$video = video;
        this.$canvas = document.createElement('canvas');
        this._onDecode = onDecode;
        this._active = false;

        this.$canvas.width = canvasSize;
        this.$canvas.height = canvasSize;
        this._sourceRect = {
            x: 0,
            y: 0,
            width: canvasSize,
            height: canvasSize,
        };

        this.$video.addEventListener('canplay', () => this._updateSourceRect());
        this.$video.addEventListener('play', () => {
            this._updateSourceRect();
            this._scanFrame();
        }, false);
        this._qrWorker = new Worker(QrScanner.WORKER_PATH);
    }

    _updateSourceRect() {
        const smallestDimension = Math.min(this.$video.videoWidth, this.$video.videoHeight);
        const sourceRectSize = Math.round(2 / 3 * smallestDimension);
        this._sourceRect.width = sourceRectSize;
        this._sourceRect.height = sourceRectSize;
        this._sourceRect.x = (this.$video.videoWidth - sourceRectSize) / 2;
        this._sourceRect.y = (this.$video.videoHeight - sourceRectSize) / 2;
    }

    /**
     * Triggers this._onDecode for each frame, calls itself recursively until the video is paused or ends
     *
     * @returns {boolean}
     */
    _scanFrame() {
        if (this.$video.paused || this.$video.ended) return false;
        requestAnimationFrame(() => {
            QrScanner.scanImage(this.$video, this._sourceRect, this._qrWorker, this.$canvas, true)
                .then(this._onDecode, /** @param {string} error */ error => {
                    if (error !== 'QR code not found.') {
                        console.error(error);
                    }
                })
                .then(() => this._scanFrame());
        });

        return true;
    }

    /**
     * @param {string | object} [facingMode]
     * @param {boolean} [exact]
     * @returns {Promise<MediaStream>}
     */
    _getCameraStream(facingMode, exact = false) {
        const constraintsToTry = [{
            width: { min: 1024 },
        }, {
            width: { min: 768 },
        }, {}];

        if (facingMode) {
            if (exact) {
                facingMode = { exact: facingMode };
            }
            constraintsToTry.forEach(constraint => { constraint.facingMode = facingMode; });
        }
        return this._getMatchingCameraStream(constraintsToTry);
    }

    /**
     * @param {Array} constraintsToTry
     * @returns {Promise<MediaStream>}
     */
    async _getMatchingCameraStream(constraintsToTry) {
        if (constraintsToTry.length === 0) {
            return Promise.reject('Camera not found.');
        }
        return navigator.mediaDevices.getUserMedia({
            video: constraintsToTry.shift(),
        }).catch(() => this._getMatchingCameraStream(constraintsToTry));
    }

    start() {
        if (this._active) {
            return Promise.resolve();
        }
        this._active = true;
        clearTimeout(/** @type {number | undefined} */ (this._offTimeout));
        let facingMode = 'environment';
        return this._getCameraStream('environment', true)
            .catch(() => {
                // we (probably) don't have an environment camera
                facingMode = 'user';
                return this._getCameraStream(); // throws if we can't access the camera
            })
            .then(stream => {
                this.$video.srcObject = stream;
                this._setVideoMirror(facingMode);
            })
            .catch(e => {
                this._active = false;
                throw e;
            });
    }

    stop() {
        if (!this._active) {
            return;
        }
        this._active = false;
        this.$video.pause();
        this._offTimeout = (setTimeout(() => {
            // @ts-ignore
            this.$video.srcObject.getTracks()[0].stop();
            this.$video.srcObject = null;
        }, 3000));
    }

    /**
     * @param {string} facingMode
     */
    _setVideoMirror(facingMode) {
        // in user facing mode mirror the video to make it easier for the user to position the QR code
        const scaleFactor = facingMode === 'user' ? -1 : 1;
        this.$video.style.transform = `scaleX(${scaleFactor})`;
    }

    /**
     * @param {number} red
     * @param {number} green
     * @param {number} blue
     */
    setGrayscaleWeights(red, green, blue) {
        this._qrWorker.postMessage({
            type: 'grayscaleWeights',
            data: { red, green, blue },
        });
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @param {object?} sourceRect
     * @param {Worker?} worker
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @param {boolean} [alsoTryWithoutSourceRect]
     * @returns {Promise<string>}
     */
    static async scanImage(imageOrFileOrUrl, sourceRect = null, worker = null, canvas = null, fixedCanvasSize = false,
        alsoTryWithoutSourceRect = false) {
        const promise = new Promise((resolve, reject) => {
            worker = worker || new Worker(QrScanner.WORKER_PATH);
            /** @type {number | undefined} */
            let timeout;
            /** @type {EventListener} */
            let onError;
            /**
             * @param {Event} event
             */
            const onMessage = event => {
                // @ts-ignore
                if (event.data.type !== 'qrResult') {
                    return;
                }
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                // @ts-ignore
                if (event.data.data !== null) {
                    // @ts-ignore
                    resolve(event.data.data);
                } else {
                    reject('QR code not found.');
                }
            };
            onError = () => {
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                reject('Worker error.');
            };
            worker.addEventListener('message', onMessage);
            worker.addEventListener('error', onError);
            timeout = setTimeout(onError, 3000);
            QrScanner._loadImage(imageOrFileOrUrl).then(image => {
                const imageData = QrScanner._getImageData(image, sourceRect, canvas, fixedCanvasSize);
                /** @type {Worker} */ (worker).postMessage({
                    type: 'decode',
                    data: imageData,
                }, [imageData.data.buffer]);
            }).catch(reject);
        });

        if (sourceRect && alsoTryWithoutSourceRect) {
            return promise.catch(() => QrScanner.scanImage(imageOrFileOrUrl, null, worker, canvas, fixedCanvasSize));
        }
        return promise;
    }


    /**
     * @param {HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap} image
     * @param {object?} sourceRect
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @returns {ImageData}
     */
    static _getImageData(image, sourceRect = null, canvas = null, fixedCanvasSize = false) {
        canvas = canvas || document.createElement('canvas');
        const sourceRectX = sourceRect && sourceRect.x ? sourceRect.x : 0;
        const sourceRectY = sourceRect && sourceRect.y ? sourceRect.y : 0;
        // @ts-ignore
        const sourceRectWidth = sourceRect && sourceRect.width ? sourceRect.width : image.width || image.videoWidth;
        const sourceRectHeight = sourceRect && sourceRect.height
            ? sourceRect.height
            : image.height
            // @ts-ignore
            || image.videoHeight;
        if (!fixedCanvasSize && (canvas.width !== sourceRectWidth || canvas.height !== sourceRectHeight)) {
            canvas.width = sourceRectWidth;
            canvas.height = sourceRectHeight;
        }
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw ('Cannot get canvas 2D context');
        context.imageSmoothingEnabled = false; // gives less blurry images
        context.drawImage(
            image,
            sourceRectX,
            sourceRectY,
            sourceRectWidth,
            sourceRectHeight,
            0,
            0,
            canvas.width,
            canvas.height,
        );
        return context.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @returns {Promise<HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap>}
     */
    static async _loadImage(imageOrFileOrUrl) {
        if (imageOrFileOrUrl instanceof HTMLCanvasElement
            || imageOrFileOrUrl instanceof HTMLVideoElement
            // @ts-ignore
            || (window.ImageBitmap && imageOrFileOrUrl instanceof window.ImageBitmap)
        ) {
            // @ts-ignore
            return Promise.resolve(imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof Image) {
            return QrScanner._awaitImageLoad(imageOrFileOrUrl).then(() => imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof File || imageOrFileOrUrl instanceof URL
            || typeof (imageOrFileOrUrl) === 'string') {
            const image = new Image();
            if (imageOrFileOrUrl instanceof File) {
                image.src = URL.createObjectURL(imageOrFileOrUrl);
            } else {
                // @ts-ignore
                image.src = imageOrFileOrUrl;
            }
            return QrScanner._awaitImageLoad(image).then(() => {
                if (imageOrFileOrUrl instanceof File) {
                    URL.revokeObjectURL(image.src);
                }
                return image;
            });
        }
        return Promise.reject('Unsupported image type.');
    }

    /**
     * @param {HTMLImageElement} image
     */
    static async _awaitImageLoad(image) {
        return new Promise((resolve, reject) => {
            if (image.complete && image.naturalWidth !== 0) {
                // already loaded
                resolve();
            } else {
                /** @type {EventListener} */
                let onError;
                const onLoad = () => { // eslint-disable-line require-jsdoc-except/require-jsdoc
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    resolve();
                };
                onError = () => {
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    reject('Image load error');
                };
                image.addEventListener('load', onLoad);
                image.addEventListener('error', onError);
            }
        });
    }
}
QrScanner.DEFAULT_CANVAS_SIZE = 400;
QrScanner.WORKER_PATH = '../../lib/QrScannerWorker.min.js';
/* global TRANSLATIONS */ // eslint-disable-line no-unused-vars
/* global Nimiq */

/**
 * @typedef {{[language: string]: {[id: string]: string}}} dict
 */

class I18n { // eslint-disable-line no-unused-vars
    /**
     * @param {dict} dictionary - Dictionary of all languages and phrases
     * @param {string} fallbackLanguage - Language to be used if no translation for the current language can be found
     */
    static initialize(dictionary, fallbackLanguage) {
        this._dict = dictionary;

        if (!(fallbackLanguage in this._dict)) {
            throw new Error(`Fallback language "${fallbackLanguage}" not defined`);
        }
        /** @type {string} */
        this._fallbackLanguage = fallbackLanguage;

        this.language = navigator.language;
    }

    /**
     * @param {HTMLElement} [dom] - The DOM element to be translated, or body by default
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     */
    static translateDom(dom = document.body, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;

        /* eslint-disable-next-line valid-jsdoc */ // Multi-line descriptions are not valid JSDoc, apparently
        /**
         * @param {string} tag
         * @param {(element: HTMLElement, translation: string) => void} callback - callback(element, translation) for
         * each matching element
         */
        const translateElements = (tag, callback) => {
            const attribute = `data-${tag}`;
            /** @type {NodeListOf<HTMLElement>} */
            const elements = dom.querySelectorAll(`[${attribute}]`);
            elements.forEach(element => {
                const id = element.getAttribute(attribute);
                if (!id) return;
                callback(element, this._translate(id, language));
            });
        };

        /**
         * @param {string} tag
         */
        const translateAttribute = tag => {
            translateElements(`i18n-${tag}`, (element, translation) => element.setAttribute(tag, translation));
        };

        translateElements('i18n', (element, translation) => {
            const sanitized = translation.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const withMarkup = sanitized.replace(/\[strong]/g, '<strong>').replace(/\[\/strong]/g, '</strong>');
            element.innerHTML = withMarkup;
        });
        translateAttribute('value');
        translateAttribute('placeholder');
    }

    /**
     * @param {string} id - translation dict ID
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     * @returns {string}
     */
    static translatePhrase(id, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;
        return this._translate(id, language);
    }

    /**
     * @param {string} id
     * @param {string} language
     * @returns {string}
     */
    static _translate(id, language) {
        if (!this.dictionary[language] || !this.dictionary[language][id]) {
            throw new Error(`I18n: ${language}/${id} is undefined!`);
        }
        return this.dictionary[language][id];
    }

    /**
     * @returns {string[]} ISO codes of all available languages.
     */
    static availableLanguages() {
        return Object.keys(this.dictionary);
    }

    /**
     * @param {string} language
     */
    static switchLanguage(language) {
        this.language = language;
    }

    /**
     * Selects a supported language closed to the desired language. Examples it might return:
     * en-us => en-us, en-us => en, en => en-us, fr => en.
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     * @returns {string}
     */
    static getClosestSupportedLanguage(language) {
        // If this language is supported, return it directly
        if (language in this.dictionary) return language;

        // Return the base language, if it exists in the dictionary
        const baseLanguage = language.split('-')[0];
        if (baseLanguage !== language && baseLanguage in this.dictionary) return baseLanguage;

        // Check if other versions (siblings) of the base language exist
        const languagePrefix = `${baseLanguage}-`;
        const siblingLanguage = this.availableLanguages()
            .find(supportedLanguage => supportedLanguage.startsWith(languagePrefix));

        return siblingLanguage || this.fallbackLanguage;
    }

    /**
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     */
    static set language(language) {
        const languageToUse = this.getClosestSupportedLanguage(language);

        if (languageToUse !== language) {
            // eslint-disable-next-line no-console
            console.warn(`Language ${language} not supported, using ${languageToUse} instead.`);
        }

        if (this._language !== languageToUse) {
            /** @type {string} */
            this._language = languageToUse;

            if (({ interactive: 1, complete: 1 })[document.readyState]) {
                this.translateDom();
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    this.translateDom();
                });
            }
            I18n.observer.fire(I18n.Events.LANGUAGE_CHANGED, this._language);
        }
    }

    /** @type {string} */
    static get language() {
        return this._language || this.fallbackLanguage;
    }

    /** @type {dict} */
    static get dictionary() {
        if (!this._dict) throw new Error('I18n not initialized');
        return this._dict;
    }

    /** @type {string} */
    static get fallbackLanguage() {
        if (!this._fallbackLanguage) throw new Error('I18n not initialized');
        return this._fallbackLanguage;
    }

    /** @returns {DOMParser} */
    static get parser() {
        /** @type {DOMParser} */
        this._parser = this._parser || new DOMParser();

        return this._parser;
    }
}

I18n.observer = new Nimiq.Observable();
I18n.Events = {
    LANGUAGE_CHANGED: 'language-changed',
};
const TRANSLATIONS = {
    en: {
        _language: 'English',
        loading: 'Loading...',
        continue: 'Continue',

        'passphrase-strength': 'Strength',
        'passphrase-placeholder': 'Enter passphrase',
        'passphrase-repeat-placeholder': 'Repeat passphrase',

        'privacy-warning-heading': 'Are you being watched?',
        'privacy-warning-text': 'Now is the perfect time to assess your surroundings. '
                              + 'Nearby windows? Hidden cameras? Shoulder spies? '
                              + 'Anyone with your backup phrase can access and spend your NIM.',
        'privacy-agent-continue': 'Continue',

        'recovery-words-title': 'Recovery Words',
        'recovery-words-input-label': 'Recovery Words',
        'recovery-words-input-field-placeholder': 'word #',
        'recovery-words-explanation': 'There really is no password recovery. The following words are a backup '
                                    + 'of your Key File and will grant you access to your wallet even if your '
                                    + 'Key File is lost.',
        'recovery-words-storing': 'Write those words on a piece of paper and store it at a safe, offline place.',

        'create-heading-choose-identicon': 'Choose your account avatar',
        'create-text-select-avatar': 'Select an avatar for your wallet\'s default account from the selection below.',
        'create-hint-more-accounts': 'You can add more accounts later.',
        'create-heading-keyfile': 'This is your Key File',
        'create-text-keyfile-info': 'Your Key File gives you full access to your wallet. '
                                  + 'You\'ll need it everytime you log in.',
        'create-hint-keyfile-password': 'To protect your wallet, first protect it with a password.',
        'create-heading-backup-account': 'Create a backup',
        'create-heading-validate-backup': 'Validate your backup',

        'import-heading-log-in': 'Log in',
        'import-link-no-wallet': 'Don\'t have a wallet yet?',
        'import-heading-protect': 'Protect your wallet',
        'import-text-set-password': 'You can now set a password to encrypt your wallet on this device.',

        'import-file-lost-file': 'Lost your Key File? You can recover your account with your 24 Recovery Words.',
        'import-file-button-words': 'Enter Recovery Words',
        'import-file-heading-unlock': 'Unlock your Key File',
        'import-file-text-unprotected-keyfile': 'Your Key File is unprotected.',

        'file-import-prompt': 'Drop your Key File here',
        'file-import-click-hint': 'Or click to select a file.',

        'enter-recovery-words-heading': 'Import from recovery words',
        'enter-recovery-words-subheading': 'Please enter your 24 recovery words.',

        'choose-key-type-heading': 'Choose key type',
        'choose-key-type-subheading': 'We couldn\'t determine the type of your key. Please select it below.',
        'choose-key-type-or': 'or',
        'choose-key-type-legacy-address-heading': 'Single address',
        'choose-key-type-legacy-address-info': 'Created before xx/xx/2018',
        'choose-key-type-bip39-address-heading': 'Multiple addresses',
        'choose-key-type-bip39-address-info': 'Created after xx/xx/2018',

        'sign-tx-heading': 'New Transaction',
        'sign-tx-includes': 'includes',
        'sign-tx-fee': 'fee',
        'sign-tx-youre-sending': 'You\'re sending',
        'sign-tx-to': 'to',
        'sign-tx-pay-with': 'Pay with',

        'passphrasebox-enter-passphrase': 'Enter your passphrase',
        'passphrasebox-protect-keyfile': 'Protect your keyfile with a password',
        'passphrasebox-repeat-password': 'Repeat your password',
        'passphrasebox-continue': 'Continue',
        'passphrasebox-log-in': 'Log in to your wallet',
        'passphrasebox-log-out': 'Confirm logout',
        'passphrasebox-download': 'Download key file',
        'passphrasebox-confirm-tx': 'Confirm transaction',
        'passphrasebox-password-strength-8': 'Great, that\'s a good password!',
        'passphrasebox-password-strength-10': 'Super, that\'s a strong password!',
        'passphrasebox-password-strength-12': 'Excellent, that\'s a very strong password!',
        'passphrasebox-password-hint': 'Your password should have at least 8 characters.',
        'passphrasebox-password-skip': 'Skip password protection for now',

        'identicon-selector-loading': 'Mixing colors',
        'identicon-selector-button-select': 'Select',
        'identicon-selector-link-back': 'Back',

        'downloadkeyfile-heading-protected': 'Your Key File is protected!',
        'downloadkeyfile-heading-unprotected': 'Your Key File is not protected!',
        'downloadkeyfile-safe-place': 'Store it in a safe place. If you lose it, it cannot be recovered!',
        'downloadkeyfile-download': 'Download Key File',
        'downloadkeyfile-download-anyway': 'Download anyway',

        'validate-words-text': 'Please select the correct word from your list of recovery words.',
        'validate-words-back': 'Back to words',
        'validate-words-skip': 'Skip validation for now',
    },
    de: {
        _language: 'Deutsch',
        loading: 'Wird geladen...',
        continue: 'Weiter',

        'passphrase-strength': 'Stärke',
        'passphrase-placeholder': 'Passphrase eingeben',
        'passphrase-repeat-placeholder': 'Passphrase wiederholen',

        'privacy-warning-heading': 'Wirst du beobachtet?',
        'privacy-warning-text': 'Jetzt ist eine gute Zeit um sich umzuschauen. Gibt es Fenster in der Nähe? '
                              + 'Versteckte Kameras? Jemand der über deine Schulter schaut? '
                              + 'Jeder der deine Wiederherstellungswörter hat, kann auf deine NIM zugreifen '
                              + 'und sie ausgeben.',
        'privacy-agent-continue': 'Weiter',

        'recovery-words-title': 'Wiederherstellungswörter',
        'recovery-words-input-label': 'Wiederherstellungswörter',
        'recovery-words-input-field-placeholder': 'Wort ',
        'recovery-words-explanation': 'Es gibt wirklich keine Password-Wiederherstellung. Die folgenden Wörter '
                                    + 'sind ein Backup von deiner Schlüsseldatei und werden dir Zugang zu deiner '
                                    + 'Wallet gewähren, auch wenn deine Schlüsseldatei verloren ist.',
        'recovery-words-storing': 'Schreibe diese Wörter auf ein Stück Papier und verwahre es an einem sicheren, '
                                + 'analogen Ort.',

        'create-heading-choose-identicon': 'Wähle deinen Konto Avatar',
        'create-text-select-avatar': 'Wähle einen Avatar für den Standard-Account deiner Wallet aus der Auswahl unten.',
        'create-hint-more-accounts': 'Neue Konten kannst du später hinzufügen.',
        'create-heading-keyfile': 'Das ist deine Wallet Datei',
        'create-text-keyfile-info': 'Deine Wallet Datei gibt dir vollen Zugang zu deiner Wallet. '
                                  + 'Du brauchst sie jedesmal wenn du dich einloggst.',
        'create-hint-keyfile-password': 'Um deine Wallet zu schützen, schütze es mit einem Passwort.',
        'create-heading-backup-account': 'Erstelle ein Backup',
        'create-heading-validate-backup': 'Überprüfe dein Backup',

        'import-heading-log-in': 'Einloggen',
        'import-link-no-wallet': 'Du hast noch keine Wallet?',
        'import-heading-protect': 'Wallet verschlüsseln',
        'import-text-set-password': 'Du kannst jetzt ein Passwort eingeben, um deine Wallet auf diesem '
                                  + 'Gerät zu verschlüsseln.',

        'import-file-lost-file': 'Schlüsseldatei verloren? Du kannst deinen Account mit deinen 24 '
                               + 'Wiederherstellungswörtern wiederherstellen',
        'import-file-button-words': 'Wiederherstellungswörter eingeben',
        'import-file-heading-unlock': 'Entsperre deine Schlüsseldatei',
        'import-file-text-unprotected-keyfile': 'Deine Schlüsseldatei ist ungeschützt.',

        'file-import-prompt': 'Ziehe deine Schlüsseldatei auf dieses Feld',
        'file-import-click-hint': 'Oder klicke um eine Datei auszuwählen.',

        'enter-recovery-words-heading': 'Mit Wiederherstellungswörtern importieren',
        'enter-recovery-words-subheading': 'Bitte gib deine 24 Wiederherstellungswörter ein.',

        'choose-key-type-heading': 'Schlüsseltyp wählen',
        'choose-key-type-subheading': 'Wir konnten den Typ deines Schlüssels nicht automatisch ermitteln. '
                                    + 'Bitte wähle ihn unten aus.',
        'choose-key-type-or': 'oder',
        'choose-key-type-legacy-address-heading': 'Einzelne Adresse',
        'choose-key-type-legacy-address-info': 'Erstellt vor xx.xx.2018',
        'choose-key-type-bip39-address-heading': 'Mehrere Adressen',
        'choose-key-type-bip39-address-info': 'Erstellt nach xx.xx.2018',

        'sign-tx-heading': 'Neue Überweisung',
        'sign-tx-includes': 'inklusive',
        'sign-tx-fee': 'Gebühr',
        'sign-tx-youre-sending': 'Du sendest',
        'sign-tx-to': 'an',
        'sign-tx-pay-with': 'Zahle mit',

        'passphrasebox-enter-passphrase': 'Gib deine Passphrase ein',
        'passphrasebox-protect-keyfile': 'Sichere dein KeyFile mit einem Passwort',
        'passphrasebox-repeat-password': 'Wiederhole dein Passwort',
        'passphrasebox-continue': 'Weiter',
        'passphrasebox-log-in': 'In deine Wallet einloggen',
        'passphrasebox-log-out': 'Abmeldung bestätigen',
        'passphrasebox-download': 'KeyFile herunterladen',
        'passphrasebox-confirm-tx': 'Überweisung bestätigen',
        'passphrasebox-password-strength-8': 'Schön, das ist ein gutes Passwort!',
        'passphrasebox-password-strength-10': 'Super, das ist ein starkes Passwort!',
        'passphrasebox-password-strength-12': 'Exzellent, das ist ein sehr starkes Passwort!',
        'passphrasebox-password-hint': 'Dein Passwort muss mindestens 8 Zeichen haben.',
        'passphrasebox-password-skip': 'Passwortschutz erstmal überspringen',

        'identicon-selector-loading': 'Mische Farben',
        'identicon-selector-button-select': 'Auswählen',
        'identicon-selector-link-back': 'Zurück',

        'downloadkeyfile-heading-protected': 'Dein Schlüsseldatei ist geschützt!',
        'downloadkeyfile-heading-unprotected': 'Dein Schlüsseldatei ist nicht geschützt!',
        'downloadkeyfile-safe-place': 'Lagere sie in einem sicheren Ort. Wenn du sie verlierst, '
                                    + 'kann sie nicht wiederhergestellt werden!',
        'downloadkeyfile-download': 'Schlüsseldatei herunterladen',
        'downloadkeyfile-download-anyway': 'Trotzdem herunterladen',

        'validate-words-text': 'Bitte wähle das richtige Wort aus deiner Liste von Wiederherstellungswörtern aus.',
        'validate-words-back': 'Zurück zu den Wörtern',
        'validate-words-skip': 'Überprüfung erstmal überspringen',
    },
};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
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
/* global Nimiq */
/* global AnimationUtils */
/* global QrScanner */
/* global I18n */

class FileImport extends Nimiq.Observable {
    /**
     * @param {HTMLDivElement} [$el]
     */
    constructor($el) {
        super();
        this.$el = FileImport._createElement($el);

        /** @type {HTMLElement} */
        this.$errorMessage = (this.$el.querySelector('.error-message'));
        /** @type {HTMLInputElement} */
        this.$fileInput = (this.$el.querySelector('input'));

        // TODO Re-add the drop target interaction and event listeners?

        this.$el.addEventListener('click', this._openFileInput.bind(this));
        this.$fileInput.addEventListener('change', this._onFileSelected.bind(this));
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('file-import');

        $el.innerHTML = `
            <h3 data-i18n="file-import-prompt">Drop your Key File here</h3>
            <span class="click-hint" data-i18n="file-import-click-hint">Or click to select a file.</span>
            <span class="error-message"></span>
            <input type="file" accept="image/*">
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @returns {HTMLElement}
     */
    getElement() {
        return this.$el;
    }

    _openFileInput() {
        this.$fileInput.click();
    }

    /**
     * @param {DOMEvent} event
     */
    _onFileSelected(event) {
        this.$errorMessage.textContent = '';
        // @ts-ignore
        const files = event.target.files;
        this._readFile(files[0]);
        this.$fileInput.value = '';
    }

    _onQrError() {
        AnimationUtils.animate('shake', this.$el);
        this.$errorMessage.textContent = 'Could not read Key File.';
    }

    /**
     * @param {File} file
     */
    async _readFile(file) {
        // TODO Add WalletBackup to keyguard-next code base
        // const qrPosition = WalletBackup.calculateQrPosition();
        const qrPosition = {
            x: 156,
            y: 548.6886,
            width: 173.4,
            height: 173.4,
            size: 185.4,
            padding: 12,
        };

        try {
            const decoded = await QrScanner.scanImage(file, qrPosition, null, null, false, true);
            this.fire(FileImport.Events.IMPORT, decoded);
        } catch (e) {
            this._onQrError();
        }
    }
}

FileImport.Events = {
    IMPORT: 'import',
};
/* global Nimiq */
/* global AnimationUtils */
/* global I18n */

class PassphraseInput extends Nimiq.Observable {
    /**
     * @param {?HTMLElement} $el
     * @param {string} placeholder
     * @param {boolean} [showStrengthIndicator]
     */
    constructor($el, placeholder = '••••••••', showStrengthIndicator = false) {
        super();
        this._minLength = PassphraseInput.DEFAULT_MIN_LENGTH;
        this._showStrengthIndicator = showStrengthIndicator;
        this.$el = PassphraseInput._createElement($el);
        this.$inputContainer = /** @type {HTMLElement} */ (this.$el.querySelector('.input-container'));
        this.$input = /** @type {HTMLInputElement} */ (this.$el.querySelector('input.password'));
        this.$eyeButton = /** @type {HTMLElement} */ (this.$el.querySelector('.eye-button'));

        /** @type {HTMLElement} */
        this.$strengthIndicator = (this.$el.querySelector('.strength-indicator'));
        /** @type {HTMLElement} */
        this.$strengthIndicatorContainer = (this.$el.querySelector('.strength-indicator-container'));
        if (!showStrengthIndicator) {
            this.$strengthIndicatorContainer.style.display = 'none';
        }

        this.$input.placeholder = placeholder;

        this.$eyeButton.addEventListener('click', () => this._changeVisibility());

        this._onInputChanged();
        this.$input.addEventListener('input', () => this._onInputChanged());
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-input');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <div class="input-container">
                <input class="password" type="password" placeholder="Enter Passphrase">
                <span class="eye-button icon-eye"/>
            </div>
            <div class="strength-indicator-container">
                <div class="label"><span data-i18n="passphrase-strength">Strength</span>:</div>
                <meter max="130" low="10" optimum="100" class="strength-indicator"></meter>
            </div>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    /** @type {HTMLInputElement} */
    get input() {
        return this.$input;
    }

    focus() {
        this.$input.focus();
    }

    reset() {
        this.$input.value = '';
        this._changeVisibility(false);
        this._onInputChanged();
    }

    async onPassphraseIncorrect() {
        await AnimationUtils.animate('shake', this.$inputContainer);
        this.reset();
    }

    /** @param {boolean} [becomeVisible] */
    _changeVisibility(becomeVisible) {
        becomeVisible = typeof becomeVisible !== 'undefined'
            ? becomeVisible
            : this.$input.getAttribute('type') === 'password';
        this.$input.setAttribute('type', becomeVisible ? 'text' : 'password');
        this.$eyeButton.classList.toggle('icon-eye-off', becomeVisible);
        this.$eyeButton.classList.toggle('icon-eye', !becomeVisible);
        this.$input.focus();
    }

    _onInputChanged() {
        const passphraseLength = this.$input.value.length;
        this._updateStrengthIndicator();
        this.valid = passphraseLength >= this._minLength;

        this.fire(PassphraseInput.Events.VALID, this.valid);
    }

    _updateStrengthIndicator() {
        const passphraseLength = this.$input.value.length;
        let strengthIndicatorValue;
        if (passphraseLength === 0) {
            strengthIndicatorValue = 0;
        } else if (passphraseLength < 7) {
            strengthIndicatorValue = 10;
        } else if (passphraseLength < 10) {
            strengthIndicatorValue = 70;
        } else if (passphraseLength < 14) {
            strengthIndicatorValue = 100;
        } else {
            strengthIndicatorValue = 130;
        }
        this.$strengthIndicator.setAttribute('value', String(strengthIndicatorValue));
    }

    /**
     * @returns {string}
     */
    get text() {
        return this.$input.value;
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._minLength = minLength || PassphraseInput.DEFAULT_MIN_LENGTH;
    }
}

PassphraseInput.Events = {
    VALID: 'passphraseinput-valid',
};

PassphraseInput.DEFAULT_MIN_LENGTH = 8;
/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
            hideInput: false, // TODO: When a key is not encrypted, no passphrase is required
            buttonI18nTag: 'passphrasebox-confirm-tx',
        };

        super();

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.cancel')).addEventListener('click', () => this._onCancel());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'center', options.bgColor);

        // To enable i18n validation with the dynamic nature of the passphrase box's contents,
        // all possible i18n tags and texts have to be specified here in the below format to
        // enable the validator to find them with its regular expression.
        /* eslint-disable max-len */
        const buttonVersions = {
            'passphrasebox-continue': '<button class="submit" data-i18n="passphrasebox-continue">Continue</button>',
            'passphrasebox-log-in': '<button class="submit" data-i18n="passphrasebox-log-in">Log in to your wallet</button>',
            'passphrasebox-log-out': '<button class="submit" data-i18n="passphrasebox-log-out">Confirm logout</button>',
            'passphrasebox-confirm-tx': '<button class="submit" data-i18n="passphrasebox-confirm-tx">Confirm transaction</button>',
        };
        /* eslint-enable max-len */

        if (!buttonVersions[options.buttonI18nTag]) throw new Error('PassphraseBox button i18n tag not defined');

        $el.innerHTML = `
            <a class="cancel icon-cancel"></a>
            <h2 class="prompt" data-i18n="passphrasebox-enter-passphrase">Enter your passphrase</h2>
            <div passphrase-input></div>
            ${buttonVersions[options.buttonI18nTag]}
        `;

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this._passphraseInput.focus();
    }

    reset() {
        this._passphraseInput.reset();
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._passphraseInput.setMinLength(minLength);
    }

    /**
     * @returns {Promise<void>}
     */
    async onPassphraseIncorrect() {
        return this._passphraseInput.onPassphraseIncorrect();
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();
        this.fire(PassphraseBox.Events.SUBMIT, this._passphraseInput.text);
    }

    _onCancel() {
        this.fire(PassphraseBox.Events.CANCEL);
    }
}

PassphraseBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    CANCEL: 'passphrasebox-cancel',
};
/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseSetterBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
        };

        super();

        this._password = '';

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseSetterBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.password-skip')).addEventListener('click', () => this._onSkip());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'setter', 'center', options.bgColor);

        /* eslint-disable max-len */
        $el.innerHTML = `
            <h2 class="prompt protect" data-i18n="passphrasebox-protect-keyfile">Protect your keyfile with a password</h2>
            <h2 class="prompt repeat" data-i18n="passphrasebox-repeat-password">Repeat your password</h2>

            <div passphrase-input></div>

            <div class="password-strength strength-8"  data-i18n="passphrasebox-password-strength-8" >Great, that's a good password!</div>
            <div class="password-strength strength-10" data-i18n="passphrasebox-password-strength-10">Super, that's a strong password!</div>
            <div class="password-strength strength-12" data-i18n="passphrasebox-password-strength-12">Excellent, that's a very strong password!</div>

            <div class="password-hint" data-i18n="passphrasebox-password-hint">Your password should have at least 8 characters.</div>
            <a tabindex="0" class="password-skip" data-i18n="passphrasebox-password-skip">Skip password protection for now</a>

            <button class="submit" data-i18n="passphrasebox-continue">Continue</button>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this._passphraseInput.focus();
    }

    /**
     * @param {boolean} [isWrongPassphrase]
     */
    async reset(isWrongPassphrase) {
        this._password = '';

        if (isWrongPassphrase) await this._passphraseInput.onPassphraseIncorrect();
        else this._passphraseInput.reset();

        this.$el.classList.remove('repeat');
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);

        const length = this._passphraseInput.text.length;
        this.$el.classList.toggle('strength-8', length < 10);
        this.$el.classList.toggle('strength-10', length >= 10 && length < 12);
        this.$el.classList.toggle('strength-12', length >= 12);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();

        if (!this._password) {
            this._password = this._passphraseInput.text;
            this._passphraseInput.reset();
            this.$el.classList.add('repeat');
        } else if (this._password !== this._passphraseInput.text) {
            this.reset(true);
        } else {
            this.fire(PassphraseSetterBox.Events.SUBMIT, this._password);
            this.reset();
        }
    }

    _onSkip() {
        this.fire(PassphraseSetterBox.Events.SKIP);
    }
}

PassphraseSetterBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    SKIP: 'passphrasebox-skip',
};
/* global BrowserDetection */
/* global KeyStore */
/* global CookieJar */
/* global I18n */

/**
 * A common parent class for pop-up requests.
 *
 * Usage:
 * Inherit this class in your popup request API class:
 * ```
 *  class SignTransactionApi extends TopLevelApi {
 *
 *      // Define the onRequest method to receive the client's request object:
 *      onRequest(request) {
 *          // do something...
 *
 *          // When done, call this.resolve() with the result object
 *          this.resolve(result);
 *
 *          // Or this.reject() with an error
 *          this.reject(error);
 *      }
 *  }
 *
 *  // Finally, start your API:
 *  runKeyguard(SignTransactionApi);
 * ```
 */
class TopLevelApi { // eslint-disable-line no-unused-vars
    constructor() {
        if (window.self !== window.top) {
            // PopupAPI may not run in a frame
            throw new Error('Illegal use');
        }

        /** @type {Function} */
        this._resolve = () => { throw new Error('Method not defined'); };

        /** @type {Function} */
        this._reject = () => { throw new Error('Method not defined'); };

        I18n.initialize(window.TRANSLATIONS, 'en');
        I18n.translateDom();

        window.addEventListener('beforeunload', () => {
            this.reject(new Error('Keyguard popup closed'));
        });
    }

    /**
     * Method to be called by the Keyguard client via RPC
     *
     * @param {KeyguardRequest} request
     */
    async request(request) {
        /**
         * Detect migrate signalling set by the iframe
         *
         * @deprecated Only for database migration
         */
        if ((BrowserDetection.isIos() || BrowserDetection.isSafari()) && this._hasMigrateFlag()) {
            await KeyStore.instance.migrateAccountsToKeys();
        }

        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;

            this.onRequest(request).catch(reject);
        });
    }

    /**
     * Overwritten by each request's API class
     *
     * @param {KeyguardRequest} request
     * @abstract
     */
    async onRequest(request) { // eslint-disable-line no-unused-vars
        throw new Error('Not implemented');
    }

    /**
     * Called by a page's API class on success
     *
     * @param {*} result
     * @returns {Promise<void>}
     */
    async resolve(result) {
        // Keys might have changed, so update cookie for iOS and Safari users
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            const keys = await KeyStore.instance.list();
            CookieJar.fill(keys);
        }

        this._resolve(result);
    }

    /**
     * Called by a page's API class on error
     *
     * @param {Error} error
     */
    reject(error) {
        this._reject(error);
    }

    /**
     * @deprecated Only for database migration
     * @returns {boolean}
     */
    _hasMigrateFlag() {
        const match = document.cookie.match(new RegExp('migrate=([^;]+)'));
        return !!match && match[1] === '1';
    }
}
/* global TopLevelApi */
/* global FileImport */
/* global PassphraseBox */
/* global PassphraseSetterBox */
/* global Nimiq */
/* global Key */
/* global KeyStore */

class ImportFileApi extends TopLevelApi {
    constructor() {
        super();

        this._encryptedKey = new Nimiq.SerialBuffer(0);
        this._keyType = Key.Type.BIP39;

        // Start UI
        const dom = this._makeView();
        this._passphraseBox = dom.passphraseBox;
        this._passphraseSetterBox = dom.passphraseSetterBox;

        this.$loading = /** @type {HTMLDivElement} */ (document.querySelector('#loading'));
    }

    /**
     * @param {ImportRequest} request
     */
    async onRequest(request) {
        this._request = request;

        // Global cancel link
        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());

        this.run();
    }

    /**
     * @returns {{passphraseBox: PassphraseBox, passphraseSetterBox: PassphraseSetterBox}}
     */
    _makeView() {
        // Containers
        /** @type {HTMLDivElement} */
        const $fileImport = (document.querySelector('.file-import'));
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('.passphrase-box'));
        /** @type {HTMLFormElement} */
        const $passphraseSetterBox = (document.querySelector('.passphrase-setter-box'));

        // Components
        const fileImport = new FileImport($fileImport);
        const passphraseBox = new PassphraseBox($passphraseBox, { buttonI18nTag: 'passphrasebox-log-in' });
        const passphraseSetterBox = new PassphraseSetterBox($passphraseSetterBox);

        // Events
        fileImport.on(FileImport.Events.IMPORT, this._onFileImported.bind(this));
        passphraseBox.on(PassphraseBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());
        passphraseSetterBox.on(PassphraseSetterBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseSetterBox.on(PassphraseSetterBox.Events.SKIP, () => this._onPassphraseEntered(null));

        return {
            passphraseBox,
            passphraseSetterBox,
        };
    }

    /**
     * Determine key type and forward user to Passphrase input
     *
     * @param {string} encryptedKeyBase64 - Encrypted KeyPair in base64 format
     */
    _onFileImported(encryptedKeyBase64) {
        if (encryptedKeyBase64.substr(0, 2) === '#3') {
            // BIP39 Key File
            this._keyType = Key.Type.BIP39;

            this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
            this._passphraseBox.setMinLength();

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) this._goToEnterPassphrase();
            else this._goToSetPassphrase();
        } else {
            // Legacy Account Access File
            this._keyType = Key.Type.LEGACY;

            if (encryptedKeyBase64.substr(0, 2) === '#2') {
                // PIN-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
                this._passphraseBox.setMinLength(6);
            } else {
                // Passphrase-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64);
                this._passphraseBox.setMinLength(8);
            }

            this._goToEnterPassphrase();
        }
    }

    run() {
        window.location.hash = ImportFileApi.Pages.FILE_IMPORT;

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {string?} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        const key = await this._decryptAndStoreKey(passphrase);
        if (!key) {
            this._passphraseBox.onPassphraseIncorrect();
            return;
        }

        /** @type {{keyPath: string, address: Uint8Array}[]} */
        const addresses = [];

        if (key.type === Key.Type.LEGACY) {
            const address = key.deriveAddress('');
            addresses.push({
                keyPath: 'm/0\'',
                address: address.serialize(),
            });
        } else if (key.type === Key.Type.BIP39) {
            /** @type {ImportRequest} */
            (this._request).requestedKeyPaths.forEach(keyPath => {
                addresses.push({
                    keyPath,
                    address: key.deriveAddress(keyPath).serialize(),
                });
            });
        } else {
            throw new Error(`Unkown key type ${key.type}`);
        }

        /** @type {ImportResult} */
        const result = {
            keyId: key.id,
            keyType: key.type,
            addresses,
        };

        this.resolve(result);
    }

    /**
     * @param {string?} passphrase
     * @returns {Promise<?Key>}
     */
    async _decryptAndStoreKey(passphrase) {
        this.$loading.style.display = 'flex';
        try {
            // Separating the processing of the encryptionKey (password) and the secret (key) is necessary
            // to cover these scenarios:
            //     1. Encrypted key file with password or PIN
            //     2. Unencrypted key file and no new password set
            //     3. Unencrypted key file and new password set

            let secret = new Uint8Array(0);
            let encryptionKey = null;

            if (passphrase !== null) {
                // TODO Support for UTF-8 passwords
                encryptionKey = Nimiq.BufferUtils.fromAscii(passphrase);
            }

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) {
                secret = await Nimiq.CryptoUtils.decryptOtpKdf(
                    this._encryptedKey,
                    /** @type {Uint8Array} */ (encryptionKey),
                );
            } else {
                // Key File was not encrypted and the imported Uint8Array is the plain secret
                secret = this._encryptedKey;
            }

            const key = new Key(secret, this._keyType);
            await KeyStore.instance.put(key, encryptionKey || undefined);

            return key;
        } catch (e) {
            this.$loading.style.display = 'none';
            return null;
        }
    }

    _goToEnterPassphrase() {
        window.location.hash = ImportFileApi.Pages.ENTER_PASSPHRASE;
        this._passphraseBox.reset();
        this._passphraseBox.focus();
    }

    _goToSetPassphrase() {
        window.location.hash = ImportFileApi.Pages.SET_PASSPHRASE;
        this._passphraseSetterBox.reset();
        this._passphraseSetterBox.focus();
    }
}

ImportFileApi.Pages = {
    FILE_IMPORT: 'file-import',
    ENTER_PASSPHRASE: 'enter-passphrase',
    SET_PASSPHRASE: 'set-passphrase',
};
/* global runKeyguard */
/* global ImportFileApi */

runKeyguard(ImportFileApi);
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
class AnimationUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {string} className
     * @param {HTMLElement} el
     * @param {Function} [afterStartCallback]
     * @param {Function} [beforeEndCallback]
     */
    static async animate(className, el, afterStartCallback, beforeEndCallback) {
        return new Promise(resolve => {
            // 'animiationend' is a native DOM event that fires upon CSS animation completion
            /** @param {Event} e */
            const listener = e => {
                if (e.target !== el) return;
                if (beforeEndCallback instanceof Function) beforeEndCallback();
                this.stopAnimate(className, el);
                el.removeEventListener('animationend', listener);
                resolve();
            };
            el.addEventListener('animationend', listener);
            el.classList.add(className);
            if (afterStartCallback instanceof Function) afterStartCallback();
        });
    }

    /**
     * @param {string} className
     * @param {HTMLElement} el
     */
    static stopAnimate(className, el) {
        el.classList.remove(className);
    }
}
/* eslint-disable prefer-promise-reject-errors, no-throw-literal */

// eslint-disable-next-line max-len
/** @typedef {HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | File} imageOrFileOrUrl */

class QrScanner {
    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {HTMLVideoElement} video
     * @param {((value: string) => string | PromiseLike<string>)} [onDecode]
     * @param {number} [canvasSize] - Edge length of the quadratic canvas
     */
    constructor(video, onDecode, canvasSize = QrScanner.DEFAULT_CANVAS_SIZE) {
        this.$video = video;
        this.$canvas = document.createElement('canvas');
        this._onDecode = onDecode;
        this._active = false;

        this.$canvas.width = canvasSize;
        this.$canvas.height = canvasSize;
        this._sourceRect = {
            x: 0,
            y: 0,
            width: canvasSize,
            height: canvasSize,
        };

        this.$video.addEventListener('canplay', () => this._updateSourceRect());
        this.$video.addEventListener('play', () => {
            this._updateSourceRect();
            this._scanFrame();
        }, false);
        this._qrWorker = new Worker(QrScanner.WORKER_PATH);
    }

    _updateSourceRect() {
        const smallestDimension = Math.min(this.$video.videoWidth, this.$video.videoHeight);
        const sourceRectSize = Math.round(2 / 3 * smallestDimension);
        this._sourceRect.width = sourceRectSize;
        this._sourceRect.height = sourceRectSize;
        this._sourceRect.x = (this.$video.videoWidth - sourceRectSize) / 2;
        this._sourceRect.y = (this.$video.videoHeight - sourceRectSize) / 2;
    }

    /**
     * Triggers this._onDecode for each frame, calls itself recursively until the video is paused or ends
     *
     * @returns {boolean}
     */
    _scanFrame() {
        if (this.$video.paused || this.$video.ended) return false;
        requestAnimationFrame(() => {
            QrScanner.scanImage(this.$video, this._sourceRect, this._qrWorker, this.$canvas, true)
                .then(this._onDecode, /** @param {string} error */ error => {
                    if (error !== 'QR code not found.') {
                        console.error(error);
                    }
                })
                .then(() => this._scanFrame());
        });

        return true;
    }

    /**
     * @param {string | object} [facingMode]
     * @param {boolean} [exact]
     * @returns {Promise<MediaStream>}
     */
    _getCameraStream(facingMode, exact = false) {
        const constraintsToTry = [{
            width: { min: 1024 },
        }, {
            width: { min: 768 },
        }, {}];

        if (facingMode) {
            if (exact) {
                facingMode = { exact: facingMode };
            }
            constraintsToTry.forEach(constraint => { constraint.facingMode = facingMode; });
        }
        return this._getMatchingCameraStream(constraintsToTry);
    }

    /**
     * @param {Array} constraintsToTry
     * @returns {Promise<MediaStream>}
     */
    async _getMatchingCameraStream(constraintsToTry) {
        if (constraintsToTry.length === 0) {
            return Promise.reject('Camera not found.');
        }
        return navigator.mediaDevices.getUserMedia({
            video: constraintsToTry.shift(),
        }).catch(() => this._getMatchingCameraStream(constraintsToTry));
    }

    start() {
        if (this._active) {
            return Promise.resolve();
        }
        this._active = true;
        clearTimeout(/** @type {number | undefined} */ (this._offTimeout));
        let facingMode = 'environment';
        return this._getCameraStream('environment', true)
            .catch(() => {
                // we (probably) don't have an environment camera
                facingMode = 'user';
                return this._getCameraStream(); // throws if we can't access the camera
            })
            .then(stream => {
                this.$video.srcObject = stream;
                this._setVideoMirror(facingMode);
            })
            .catch(e => {
                this._active = false;
                throw e;
            });
    }

    stop() {
        if (!this._active) {
            return;
        }
        this._active = false;
        this.$video.pause();
        this._offTimeout = (setTimeout(() => {
            // @ts-ignore
            this.$video.srcObject.getTracks()[0].stop();
            this.$video.srcObject = null;
        }, 3000));
    }

    /**
     * @param {string} facingMode
     */
    _setVideoMirror(facingMode) {
        // in user facing mode mirror the video to make it easier for the user to position the QR code
        const scaleFactor = facingMode === 'user' ? -1 : 1;
        this.$video.style.transform = `scaleX(${scaleFactor})`;
    }

    /**
     * @param {number} red
     * @param {number} green
     * @param {number} blue
     */
    setGrayscaleWeights(red, green, blue) {
        this._qrWorker.postMessage({
            type: 'grayscaleWeights',
            data: { red, green, blue },
        });
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @param {object?} sourceRect
     * @param {Worker?} worker
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @param {boolean} [alsoTryWithoutSourceRect]
     * @returns {Promise<string>}
     */
    static async scanImage(imageOrFileOrUrl, sourceRect = null, worker = null, canvas = null, fixedCanvasSize = false,
        alsoTryWithoutSourceRect = false) {
        const promise = new Promise((resolve, reject) => {
            worker = worker || new Worker(QrScanner.WORKER_PATH);
            /** @type {number | undefined} */
            let timeout;
            /** @type {EventListener} */
            let onError;
            /**
             * @param {Event} event
             */
            const onMessage = event => {
                // @ts-ignore
                if (event.data.type !== 'qrResult') {
                    return;
                }
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                // @ts-ignore
                if (event.data.data !== null) {
                    // @ts-ignore
                    resolve(event.data.data);
                } else {
                    reject('QR code not found.');
                }
            };
            onError = () => {
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                reject('Worker error.');
            };
            worker.addEventListener('message', onMessage);
            worker.addEventListener('error', onError);
            timeout = setTimeout(onError, 3000);
            QrScanner._loadImage(imageOrFileOrUrl).then(image => {
                const imageData = QrScanner._getImageData(image, sourceRect, canvas, fixedCanvasSize);
                /** @type {Worker} */ (worker).postMessage({
                    type: 'decode',
                    data: imageData,
                }, [imageData.data.buffer]);
            }).catch(reject);
        });

        if (sourceRect && alsoTryWithoutSourceRect) {
            return promise.catch(() => QrScanner.scanImage(imageOrFileOrUrl, null, worker, canvas, fixedCanvasSize));
        }
        return promise;
    }


    /**
     * @param {HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap} image
     * @param {object?} sourceRect
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @returns {ImageData}
     */
    static _getImageData(image, sourceRect = null, canvas = null, fixedCanvasSize = false) {
        canvas = canvas || document.createElement('canvas');
        const sourceRectX = sourceRect && sourceRect.x ? sourceRect.x : 0;
        const sourceRectY = sourceRect && sourceRect.y ? sourceRect.y : 0;
        // @ts-ignore
        const sourceRectWidth = sourceRect && sourceRect.width ? sourceRect.width : image.width || image.videoWidth;
        const sourceRectHeight = sourceRect && sourceRect.height
            ? sourceRect.height
            : image.height
            // @ts-ignore
            || image.videoHeight;
        if (!fixedCanvasSize && (canvas.width !== sourceRectWidth || canvas.height !== sourceRectHeight)) {
            canvas.width = sourceRectWidth;
            canvas.height = sourceRectHeight;
        }
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw ('Cannot get canvas 2D context');
        context.imageSmoothingEnabled = false; // gives less blurry images
        context.drawImage(
            image,
            sourceRectX,
            sourceRectY,
            sourceRectWidth,
            sourceRectHeight,
            0,
            0,
            canvas.width,
            canvas.height,
        );
        return context.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @returns {Promise<HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap>}
     */
    static async _loadImage(imageOrFileOrUrl) {
        if (imageOrFileOrUrl instanceof HTMLCanvasElement
            || imageOrFileOrUrl instanceof HTMLVideoElement
            // @ts-ignore
            || (window.ImageBitmap && imageOrFileOrUrl instanceof window.ImageBitmap)
        ) {
            // @ts-ignore
            return Promise.resolve(imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof Image) {
            return QrScanner._awaitImageLoad(imageOrFileOrUrl).then(() => imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof File || imageOrFileOrUrl instanceof URL
            || typeof (imageOrFileOrUrl) === 'string') {
            const image = new Image();
            if (imageOrFileOrUrl instanceof File) {
                image.src = URL.createObjectURL(imageOrFileOrUrl);
            } else {
                // @ts-ignore
                image.src = imageOrFileOrUrl;
            }
            return QrScanner._awaitImageLoad(image).then(() => {
                if (imageOrFileOrUrl instanceof File) {
                    URL.revokeObjectURL(image.src);
                }
                return image;
            });
        }
        return Promise.reject('Unsupported image type.');
    }

    /**
     * @param {HTMLImageElement} image
     */
    static async _awaitImageLoad(image) {
        return new Promise((resolve, reject) => {
            if (image.complete && image.naturalWidth !== 0) {
                // already loaded
                resolve();
            } else {
                /** @type {EventListener} */
                let onError;
                const onLoad = () => { // eslint-disable-line require-jsdoc-except/require-jsdoc
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    resolve();
                };
                onError = () => {
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    reject('Image load error');
                };
                image.addEventListener('load', onLoad);
                image.addEventListener('error', onError);
            }
        });
    }
}
QrScanner.DEFAULT_CANVAS_SIZE = 400;
QrScanner.WORKER_PATH = '../../lib/QrScannerWorker.min.js';
/* global TRANSLATIONS */ // eslint-disable-line no-unused-vars
/* global Nimiq */

/**
 * @typedef {{[language: string]: {[id: string]: string}}} dict
 */

class I18n { // eslint-disable-line no-unused-vars
    /**
     * @param {dict} dictionary - Dictionary of all languages and phrases
     * @param {string} fallbackLanguage - Language to be used if no translation for the current language can be found
     */
    static initialize(dictionary, fallbackLanguage) {
        this._dict = dictionary;

        if (!(fallbackLanguage in this._dict)) {
            throw new Error(`Fallback language "${fallbackLanguage}" not defined`);
        }
        /** @type {string} */
        this._fallbackLanguage = fallbackLanguage;

        this.language = navigator.language;
    }

    /**
     * @param {HTMLElement} [dom] - The DOM element to be translated, or body by default
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     */
    static translateDom(dom = document.body, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;

        /* eslint-disable-next-line valid-jsdoc */ // Multi-line descriptions are not valid JSDoc, apparently
        /**
         * @param {string} tag
         * @param {(element: HTMLElement, translation: string) => void} callback - callback(element, translation) for
         * each matching element
         */
        const translateElements = (tag, callback) => {
            const attribute = `data-${tag}`;
            /** @type {NodeListOf<HTMLElement>} */
            const elements = dom.querySelectorAll(`[${attribute}]`);
            elements.forEach(element => {
                const id = element.getAttribute(attribute);
                if (!id) return;
                callback(element, this._translate(id, language));
            });
        };

        /**
         * @param {string} tag
         */
        const translateAttribute = tag => {
            translateElements(`i18n-${tag}`, (element, translation) => element.setAttribute(tag, translation));
        };

        translateElements('i18n', (element, translation) => {
            const sanitized = translation.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const withMarkup = sanitized.replace(/\[strong]/g, '<strong>').replace(/\[\/strong]/g, '</strong>');
            element.innerHTML = withMarkup;
        });
        translateAttribute('value');
        translateAttribute('placeholder');
    }

    /**
     * @param {string} id - translation dict ID
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     * @returns {string}
     */
    static translatePhrase(id, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;
        return this._translate(id, language);
    }

    /**
     * @param {string} id
     * @param {string} language
     * @returns {string}
     */
    static _translate(id, language) {
        if (!this.dictionary[language] || !this.dictionary[language][id]) {
            throw new Error(`I18n: ${language}/${id} is undefined!`);
        }
        return this.dictionary[language][id];
    }

    /**
     * @returns {string[]} ISO codes of all available languages.
     */
    static availableLanguages() {
        return Object.keys(this.dictionary);
    }

    /**
     * @param {string} language
     */
    static switchLanguage(language) {
        this.language = language;
    }

    /**
     * Selects a supported language closed to the desired language. Examples it might return:
     * en-us => en-us, en-us => en, en => en-us, fr => en.
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     * @returns {string}
     */
    static getClosestSupportedLanguage(language) {
        // If this language is supported, return it directly
        if (language in this.dictionary) return language;

        // Return the base language, if it exists in the dictionary
        const baseLanguage = language.split('-')[0];
        if (baseLanguage !== language && baseLanguage in this.dictionary) return baseLanguage;

        // Check if other versions (siblings) of the base language exist
        const languagePrefix = `${baseLanguage}-`;
        const siblingLanguage = this.availableLanguages()
            .find(supportedLanguage => supportedLanguage.startsWith(languagePrefix));

        return siblingLanguage || this.fallbackLanguage;
    }

    /**
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     */
    static set language(language) {
        const languageToUse = this.getClosestSupportedLanguage(language);

        if (languageToUse !== language) {
            // eslint-disable-next-line no-console
            console.warn(`Language ${language} not supported, using ${languageToUse} instead.`);
        }

        if (this._language !== languageToUse) {
            /** @type {string} */
            this._language = languageToUse;

            if (({ interactive: 1, complete: 1 })[document.readyState]) {
                this.translateDom();
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    this.translateDom();
                });
            }
            I18n.observer.fire(I18n.Events.LANGUAGE_CHANGED, this._language);
        }
    }

    /** @type {string} */
    static get language() {
        return this._language || this.fallbackLanguage;
    }

    /** @type {dict} */
    static get dictionary() {
        if (!this._dict) throw new Error('I18n not initialized');
        return this._dict;
    }

    /** @type {string} */
    static get fallbackLanguage() {
        if (!this._fallbackLanguage) throw new Error('I18n not initialized');
        return this._fallbackLanguage;
    }

    /** @returns {DOMParser} */
    static get parser() {
        /** @type {DOMParser} */
        this._parser = this._parser || new DOMParser();

        return this._parser;
    }
}

I18n.observer = new Nimiq.Observable();
I18n.Events = {
    LANGUAGE_CHANGED: 'language-changed',
};
const TRANSLATIONS = {
    en: {
        _language: 'English',
        loading: 'Loading...',
        continue: 'Continue',

        'passphrase-strength': 'Strength',
        'passphrase-placeholder': 'Enter passphrase',
        'passphrase-repeat-placeholder': 'Repeat passphrase',

        'privacy-warning-heading': 'Are you being watched?',
        'privacy-warning-text': 'Now is the perfect time to assess your surroundings. '
                              + 'Nearby windows? Hidden cameras? Shoulder spies? '
                              + 'Anyone with your backup phrase can access and spend your NIM.',
        'privacy-agent-continue': 'Continue',

        'recovery-words-title': 'Recovery Words',
        'recovery-words-input-label': 'Recovery Words',
        'recovery-words-input-field-placeholder': 'word #',
        'recovery-words-explanation': 'There really is no password recovery. The following words are a backup '
                                    + 'of your Key File and will grant you access to your wallet even if your '
                                    + 'Key File is lost.',
        'recovery-words-storing': 'Write those words on a piece of paper and store it at a safe, offline place.',

        'create-heading-choose-identicon': 'Choose your account avatar',
        'create-text-select-avatar': 'Select an avatar for your wallet\'s default account from the selection below.',
        'create-hint-more-accounts': 'You can add more accounts later.',
        'create-heading-keyfile': 'This is your Key File',
        'create-text-keyfile-info': 'Your Key File gives you full access to your wallet. '
                                  + 'You\'ll need it everytime you log in.',
        'create-hint-keyfile-password': 'To protect your wallet, first protect it with a password.',
        'create-heading-backup-account': 'Create a backup',
        'create-heading-validate-backup': 'Validate your backup',

        'import-heading-log-in': 'Log in',
        'import-link-no-wallet': 'Don\'t have a wallet yet?',
        'import-heading-protect': 'Protect your wallet',
        'import-text-set-password': 'You can now set a password to encrypt your wallet on this device.',

        'import-file-lost-file': 'Lost your Key File? You can recover your account with your 24 Recovery Words.',
        'import-file-button-words': 'Enter Recovery Words',
        'import-file-heading-unlock': 'Unlock your Key File',
        'import-file-text-unprotected-keyfile': 'Your Key File is unprotected.',

        'file-import-prompt': 'Drop your Key File here',
        'file-import-click-hint': 'Or click to select a file.',

        'enter-recovery-words-heading': 'Import from recovery words',
        'enter-recovery-words-subheading': 'Please enter your 24 recovery words.',

        'choose-key-type-heading': 'Choose key type',
        'choose-key-type-subheading': 'We couldn\'t determine the type of your key. Please select it below.',
        'choose-key-type-or': 'or',
        'choose-key-type-legacy-address-heading': 'Single address',
        'choose-key-type-legacy-address-info': 'Created before xx/xx/2018',
        'choose-key-type-bip39-address-heading': 'Multiple addresses',
        'choose-key-type-bip39-address-info': 'Created after xx/xx/2018',

        'sign-tx-heading': 'New Transaction',
        'sign-tx-includes': 'includes',
        'sign-tx-fee': 'fee',
        'sign-tx-youre-sending': 'You\'re sending',
        'sign-tx-to': 'to',
        'sign-tx-pay-with': 'Pay with',

        'passphrasebox-enter-passphrase': 'Enter your passphrase',
        'passphrasebox-protect-keyfile': 'Protect your keyfile with a password',
        'passphrasebox-repeat-password': 'Repeat your password',
        'passphrasebox-continue': 'Continue',
        'passphrasebox-log-in': 'Log in to your wallet',
        'passphrasebox-log-out': 'Confirm logout',
        'passphrasebox-download': 'Download key file',
        'passphrasebox-confirm-tx': 'Confirm transaction',
        'passphrasebox-password-strength-8': 'Great, that\'s a good password!',
        'passphrasebox-password-strength-10': 'Super, that\'s a strong password!',
        'passphrasebox-password-strength-12': 'Excellent, that\'s a very strong password!',
        'passphrasebox-password-hint': 'Your password should have at least 8 characters.',
        'passphrasebox-password-skip': 'Skip password protection for now',

        'identicon-selector-loading': 'Mixing colors',
        'identicon-selector-button-select': 'Select',
        'identicon-selector-link-back': 'Back',

        'downloadkeyfile-heading-protected': 'Your Key File is protected!',
        'downloadkeyfile-heading-unprotected': 'Your Key File is not protected!',
        'downloadkeyfile-safe-place': 'Store it in a safe place. If you lose it, it cannot be recovered!',
        'downloadkeyfile-download': 'Download Key File',
        'downloadkeyfile-download-anyway': 'Download anyway',

        'validate-words-text': 'Please select the correct word from your list of recovery words.',
        'validate-words-back': 'Back to words',
        'validate-words-skip': 'Skip validation for now',
    },
    de: {
        _language: 'Deutsch',
        loading: 'Wird geladen...',
        continue: 'Weiter',

        'passphrase-strength': 'Stärke',
        'passphrase-placeholder': 'Passphrase eingeben',
        'passphrase-repeat-placeholder': 'Passphrase wiederholen',

        'privacy-warning-heading': 'Wirst du beobachtet?',
        'privacy-warning-text': 'Jetzt ist eine gute Zeit um sich umzuschauen. Gibt es Fenster in der Nähe? '
                              + 'Versteckte Kameras? Jemand der über deine Schulter schaut? '
                              + 'Jeder der deine Wiederherstellungswörter hat, kann auf deine NIM zugreifen '
                              + 'und sie ausgeben.',
        'privacy-agent-continue': 'Weiter',

        'recovery-words-title': 'Wiederherstellungswörter',
        'recovery-words-input-label': 'Wiederherstellungswörter',
        'recovery-words-input-field-placeholder': 'Wort ',
        'recovery-words-explanation': 'Es gibt wirklich keine Password-Wiederherstellung. Die folgenden Wörter '
                                    + 'sind ein Backup von deiner Schlüsseldatei und werden dir Zugang zu deiner '
                                    + 'Wallet gewähren, auch wenn deine Schlüsseldatei verloren ist.',
        'recovery-words-storing': 'Schreibe diese Wörter auf ein Stück Papier und verwahre es an einem sicheren, '
                                + 'analogen Ort.',

        'create-heading-choose-identicon': 'Wähle deinen Konto Avatar',
        'create-text-select-avatar': 'Wähle einen Avatar für den Standard-Account deiner Wallet aus der Auswahl unten.',
        'create-hint-more-accounts': 'Neue Konten kannst du später hinzufügen.',
        'create-heading-keyfile': 'Das ist deine Wallet Datei',
        'create-text-keyfile-info': 'Deine Wallet Datei gibt dir vollen Zugang zu deiner Wallet. '
                                  + 'Du brauchst sie jedesmal wenn du dich einloggst.',
        'create-hint-keyfile-password': 'Um deine Wallet zu schützen, schütze es mit einem Passwort.',
        'create-heading-backup-account': 'Erstelle ein Backup',
        'create-heading-validate-backup': 'Überprüfe dein Backup',

        'import-heading-log-in': 'Einloggen',
        'import-link-no-wallet': 'Du hast noch keine Wallet?',
        'import-heading-protect': 'Wallet verschlüsseln',
        'import-text-set-password': 'Du kannst jetzt ein Passwort eingeben, um deine Wallet auf diesem '
                                  + 'Gerät zu verschlüsseln.',

        'import-file-lost-file': 'Schlüsseldatei verloren? Du kannst deinen Account mit deinen 24 '
                               + 'Wiederherstellungswörtern wiederherstellen',
        'import-file-button-words': 'Wiederherstellungswörter eingeben',
        'import-file-heading-unlock': 'Entsperre deine Schlüsseldatei',
        'import-file-text-unprotected-keyfile': 'Deine Schlüsseldatei ist ungeschützt.',

        'file-import-prompt': 'Ziehe deine Schlüsseldatei auf dieses Feld',
        'file-import-click-hint': 'Oder klicke um eine Datei auszuwählen.',

        'enter-recovery-words-heading': 'Mit Wiederherstellungswörtern importieren',
        'enter-recovery-words-subheading': 'Bitte gib deine 24 Wiederherstellungswörter ein.',

        'choose-key-type-heading': 'Schlüsseltyp wählen',
        'choose-key-type-subheading': 'Wir konnten den Typ deines Schlüssels nicht automatisch ermitteln. '
                                    + 'Bitte wähle ihn unten aus.',
        'choose-key-type-or': 'oder',
        'choose-key-type-legacy-address-heading': 'Einzelne Adresse',
        'choose-key-type-legacy-address-info': 'Erstellt vor xx.xx.2018',
        'choose-key-type-bip39-address-heading': 'Mehrere Adressen',
        'choose-key-type-bip39-address-info': 'Erstellt nach xx.xx.2018',

        'sign-tx-heading': 'Neue Überweisung',
        'sign-tx-includes': 'inklusive',
        'sign-tx-fee': 'Gebühr',
        'sign-tx-youre-sending': 'Du sendest',
        'sign-tx-to': 'an',
        'sign-tx-pay-with': 'Zahle mit',

        'passphrasebox-enter-passphrase': 'Gib deine Passphrase ein',
        'passphrasebox-protect-keyfile': 'Sichere dein KeyFile mit einem Passwort',
        'passphrasebox-repeat-password': 'Wiederhole dein Passwort',
        'passphrasebox-continue': 'Weiter',
        'passphrasebox-log-in': 'In deine Wallet einloggen',
        'passphrasebox-log-out': 'Abmeldung bestätigen',
        'passphrasebox-download': 'KeyFile herunterladen',
        'passphrasebox-confirm-tx': 'Überweisung bestätigen',
        'passphrasebox-password-strength-8': 'Schön, das ist ein gutes Passwort!',
        'passphrasebox-password-strength-10': 'Super, das ist ein starkes Passwort!',
        'passphrasebox-password-strength-12': 'Exzellent, das ist ein sehr starkes Passwort!',
        'passphrasebox-password-hint': 'Dein Passwort muss mindestens 8 Zeichen haben.',
        'passphrasebox-password-skip': 'Passwortschutz erstmal überspringen',

        'identicon-selector-loading': 'Mische Farben',
        'identicon-selector-button-select': 'Auswählen',
        'identicon-selector-link-back': 'Zurück',

        'downloadkeyfile-heading-protected': 'Dein Schlüsseldatei ist geschützt!',
        'downloadkeyfile-heading-unprotected': 'Dein Schlüsseldatei ist nicht geschützt!',
        'downloadkeyfile-safe-place': 'Lagere sie in einem sicheren Ort. Wenn du sie verlierst, '
                                    + 'kann sie nicht wiederhergestellt werden!',
        'downloadkeyfile-download': 'Schlüsseldatei herunterladen',
        'downloadkeyfile-download-anyway': 'Trotzdem herunterladen',

        'validate-words-text': 'Bitte wähle das richtige Wort aus deiner Liste von Wiederherstellungswörtern aus.',
        'validate-words-back': 'Zurück zu den Wörtern',
        'validate-words-skip': 'Überprüfung erstmal überspringen',
    },
};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
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
/* global Nimiq */
/* global AnimationUtils */
/* global QrScanner */
/* global I18n */

class FileImport extends Nimiq.Observable {
    /**
     * @param {HTMLDivElement} [$el]
     */
    constructor($el) {
        super();
        this.$el = FileImport._createElement($el);

        /** @type {HTMLElement} */
        this.$errorMessage = (this.$el.querySelector('.error-message'));
        /** @type {HTMLInputElement} */
        this.$fileInput = (this.$el.querySelector('input'));

        // TODO Re-add the drop target interaction and event listeners?

        this.$el.addEventListener('click', this._openFileInput.bind(this));
        this.$fileInput.addEventListener('change', this._onFileSelected.bind(this));
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('file-import');

        $el.innerHTML = `
            <h3 data-i18n="file-import-prompt">Drop your Key File here</h3>
            <span class="click-hint" data-i18n="file-import-click-hint">Or click to select a file.</span>
            <span class="error-message"></span>
            <input type="file" accept="image/*">
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @returns {HTMLElement}
     */
    getElement() {
        return this.$el;
    }

    _openFileInput() {
        this.$fileInput.click();
    }

    /**
     * @param {DOMEvent} event
     */
    _onFileSelected(event) {
        this.$errorMessage.textContent = '';
        // @ts-ignore
        const files = event.target.files;
        this._readFile(files[0]);
        this.$fileInput.value = '';
    }

    _onQrError() {
        AnimationUtils.animate('shake', this.$el);
        this.$errorMessage.textContent = 'Could not read Key File.';
    }

    /**
     * @param {File} file
     */
    async _readFile(file) {
        // TODO Add WalletBackup to keyguard-next code base
        // const qrPosition = WalletBackup.calculateQrPosition();
        const qrPosition = {
            x: 156,
            y: 548.6886,
            width: 173.4,
            height: 173.4,
            size: 185.4,
            padding: 12,
        };

        try {
            const decoded = await QrScanner.scanImage(file, qrPosition, null, null, false, true);
            this.fire(FileImport.Events.IMPORT, decoded);
        } catch (e) {
            this._onQrError();
        }
    }
}

FileImport.Events = {
    IMPORT: 'import',
};
/* global Nimiq */
/* global AnimationUtils */
/* global I18n */

class PassphraseInput extends Nimiq.Observable {
    /**
     * @param {?HTMLElement} $el
     * @param {string} placeholder
     * @param {boolean} [showStrengthIndicator]
     */
    constructor($el, placeholder = '••••••••', showStrengthIndicator = false) {
        super();
        this._minLength = PassphraseInput.DEFAULT_MIN_LENGTH;
        this._showStrengthIndicator = showStrengthIndicator;
        this.$el = PassphraseInput._createElement($el);
        this.$inputContainer = /** @type {HTMLElement} */ (this.$el.querySelector('.input-container'));
        this.$input = /** @type {HTMLInputElement} */ (this.$el.querySelector('input.password'));
        this.$eyeButton = /** @type {HTMLElement} */ (this.$el.querySelector('.eye-button'));

        /** @type {HTMLElement} */
        this.$strengthIndicator = (this.$el.querySelector('.strength-indicator'));
        /** @type {HTMLElement} */
        this.$strengthIndicatorContainer = (this.$el.querySelector('.strength-indicator-container'));
        if (!showStrengthIndicator) {
            this.$strengthIndicatorContainer.style.display = 'none';
        }

        this.$input.placeholder = placeholder;

        this.$eyeButton.addEventListener('click', () => this._changeVisibility());

        this._onInputChanged();
        this.$input.addEventListener('input', () => this._onInputChanged());
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-input');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <div class="input-container">
                <input class="password" type="password" placeholder="Enter Passphrase">
                <span class="eye-button icon-eye"/>
            </div>
            <div class="strength-indicator-container">
                <div class="label"><span data-i18n="passphrase-strength">Strength</span>:</div>
                <meter max="130" low="10" optimum="100" class="strength-indicator"></meter>
            </div>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    /** @type {HTMLInputElement} */
    get input() {
        return this.$input;
    }

    focus() {
        this.$input.focus();
    }

    reset() {
        this.$input.value = '';
        this._changeVisibility(false);
        this._onInputChanged();
    }

    async onPassphraseIncorrect() {
        await AnimationUtils.animate('shake', this.$inputContainer);
        this.reset();
    }

    /** @param {boolean} [becomeVisible] */
    _changeVisibility(becomeVisible) {
        becomeVisible = typeof becomeVisible !== 'undefined'
            ? becomeVisible
            : this.$input.getAttribute('type') === 'password';
        this.$input.setAttribute('type', becomeVisible ? 'text' : 'password');
        this.$eyeButton.classList.toggle('icon-eye-off', becomeVisible);
        this.$eyeButton.classList.toggle('icon-eye', !becomeVisible);
        this.$input.focus();
    }

    _onInputChanged() {
        const passphraseLength = this.$input.value.length;
        this._updateStrengthIndicator();
        this.valid = passphraseLength >= this._minLength;

        this.fire(PassphraseInput.Events.VALID, this.valid);
    }

    _updateStrengthIndicator() {
        const passphraseLength = this.$input.value.length;
        let strengthIndicatorValue;
        if (passphraseLength === 0) {
            strengthIndicatorValue = 0;
        } else if (passphraseLength < 7) {
            strengthIndicatorValue = 10;
        } else if (passphraseLength < 10) {
            strengthIndicatorValue = 70;
        } else if (passphraseLength < 14) {
            strengthIndicatorValue = 100;
        } else {
            strengthIndicatorValue = 130;
        }
        this.$strengthIndicator.setAttribute('value', String(strengthIndicatorValue));
    }

    /**
     * @returns {string}
     */
    get text() {
        return this.$input.value;
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._minLength = minLength || PassphraseInput.DEFAULT_MIN_LENGTH;
    }
}

PassphraseInput.Events = {
    VALID: 'passphraseinput-valid',
};

PassphraseInput.DEFAULT_MIN_LENGTH = 8;
/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
            hideInput: false, // TODO: When a key is not encrypted, no passphrase is required
            buttonI18nTag: 'passphrasebox-confirm-tx',
        };

        super();

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.cancel')).addEventListener('click', () => this._onCancel());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'center', options.bgColor);

        // To enable i18n validation with the dynamic nature of the passphrase box's contents,
        // all possible i18n tags and texts have to be specified here in the below format to
        // enable the validator to find them with its regular expression.
        /* eslint-disable max-len */
        const buttonVersions = {
            'passphrasebox-continue': '<button class="submit" data-i18n="passphrasebox-continue">Continue</button>',
            'passphrasebox-log-in': '<button class="submit" data-i18n="passphrasebox-log-in">Log in to your wallet</button>',
            'passphrasebox-log-out': '<button class="submit" data-i18n="passphrasebox-log-out">Confirm logout</button>',
            'passphrasebox-confirm-tx': '<button class="submit" data-i18n="passphrasebox-confirm-tx">Confirm transaction</button>',
        };
        /* eslint-enable max-len */

        if (!buttonVersions[options.buttonI18nTag]) throw new Error('PassphraseBox button i18n tag not defined');

        $el.innerHTML = `
            <a class="cancel icon-cancel"></a>
            <h2 class="prompt" data-i18n="passphrasebox-enter-passphrase">Enter your passphrase</h2>
            <div passphrase-input></div>
            ${buttonVersions[options.buttonI18nTag]}
        `;

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this._passphraseInput.focus();
    }

    reset() {
        this._passphraseInput.reset();
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._passphraseInput.setMinLength(minLength);
    }

    /**
     * @returns {Promise<void>}
     */
    async onPassphraseIncorrect() {
        return this._passphraseInput.onPassphraseIncorrect();
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();
        this.fire(PassphraseBox.Events.SUBMIT, this._passphraseInput.text);
    }

    _onCancel() {
        this.fire(PassphraseBox.Events.CANCEL);
    }
}

PassphraseBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    CANCEL: 'passphrasebox-cancel',
};
/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseSetterBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
        };

        super();

        this._password = '';

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseSetterBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.password-skip')).addEventListener('click', () => this._onSkip());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'setter', 'center', options.bgColor);

        /* eslint-disable max-len */
        $el.innerHTML = `
            <h2 class="prompt protect" data-i18n="passphrasebox-protect-keyfile">Protect your keyfile with a password</h2>
            <h2 class="prompt repeat" data-i18n="passphrasebox-repeat-password">Repeat your password</h2>

            <div passphrase-input></div>

            <div class="password-strength strength-8"  data-i18n="passphrasebox-password-strength-8" >Great, that's a good password!</div>
            <div class="password-strength strength-10" data-i18n="passphrasebox-password-strength-10">Super, that's a strong password!</div>
            <div class="password-strength strength-12" data-i18n="passphrasebox-password-strength-12">Excellent, that's a very strong password!</div>

            <div class="password-hint" data-i18n="passphrasebox-password-hint">Your password should have at least 8 characters.</div>
            <a tabindex="0" class="password-skip" data-i18n="passphrasebox-password-skip">Skip password protection for now</a>

            <button class="submit" data-i18n="passphrasebox-continue">Continue</button>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this._passphraseInput.focus();
    }

    /**
     * @param {boolean} [isWrongPassphrase]
     */
    async reset(isWrongPassphrase) {
        this._password = '';

        if (isWrongPassphrase) await this._passphraseInput.onPassphraseIncorrect();
        else this._passphraseInput.reset();

        this.$el.classList.remove('repeat');
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);

        const length = this._passphraseInput.text.length;
        this.$el.classList.toggle('strength-8', length < 10);
        this.$el.classList.toggle('strength-10', length >= 10 && length < 12);
        this.$el.classList.toggle('strength-12', length >= 12);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();

        if (!this._password) {
            this._password = this._passphraseInput.text;
            this._passphraseInput.reset();
            this.$el.classList.add('repeat');
        } else if (this._password !== this._passphraseInput.text) {
            this.reset(true);
        } else {
            this.fire(PassphraseSetterBox.Events.SUBMIT, this._password);
            this.reset();
        }
    }

    _onSkip() {
        this.fire(PassphraseSetterBox.Events.SKIP);
    }
}

PassphraseSetterBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    SKIP: 'passphrasebox-skip',
};
/* global BrowserDetection */
/* global KeyStore */
/* global CookieJar */
/* global I18n */

/**
 * A common parent class for pop-up requests.
 *
 * Usage:
 * Inherit this class in your popup request API class:
 * ```
 *  class SignTransactionApi extends TopLevelApi {
 *
 *      // Define the onRequest method to receive the client's request object:
 *      onRequest(request) {
 *          // do something...
 *
 *          // When done, call this.resolve() with the result object
 *          this.resolve(result);
 *
 *          // Or this.reject() with an error
 *          this.reject(error);
 *      }
 *  }
 *
 *  // Finally, start your API:
 *  runKeyguard(SignTransactionApi);
 * ```
 */
class TopLevelApi { // eslint-disable-line no-unused-vars
    constructor() {
        if (window.self !== window.top) {
            // PopupAPI may not run in a frame
            throw new Error('Illegal use');
        }

        /** @type {Function} */
        this._resolve = () => { throw new Error('Method not defined'); };

        /** @type {Function} */
        this._reject = () => { throw new Error('Method not defined'); };

        I18n.initialize(window.TRANSLATIONS, 'en');
        I18n.translateDom();

        window.addEventListener('beforeunload', () => {
            this.reject(new Error('Keyguard popup closed'));
        });
    }

    /**
     * Method to be called by the Keyguard client via RPC
     *
     * @param {KeyguardRequest} request
     */
    async request(request) {
        /**
         * Detect migrate signalling set by the iframe
         *
         * @deprecated Only for database migration
         */
        if ((BrowserDetection.isIos() || BrowserDetection.isSafari()) && this._hasMigrateFlag()) {
            await KeyStore.instance.migrateAccountsToKeys();
        }

        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;

            this.onRequest(request).catch(reject);
        });
    }

    /**
     * Overwritten by each request's API class
     *
     * @param {KeyguardRequest} request
     * @abstract
     */
    async onRequest(request) { // eslint-disable-line no-unused-vars
        throw new Error('Not implemented');
    }

    /**
     * Called by a page's API class on success
     *
     * @param {*} result
     * @returns {Promise<void>}
     */
    async resolve(result) {
        // Keys might have changed, so update cookie for iOS and Safari users
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            const keys = await KeyStore.instance.list();
            CookieJar.fill(keys);
        }

        this._resolve(result);
    }

    /**
     * Called by a page's API class on error
     *
     * @param {Error} error
     */
    reject(error) {
        this._reject(error);
    }

    /**
     * @deprecated Only for database migration
     * @returns {boolean}
     */
    _hasMigrateFlag() {
        const match = document.cookie.match(new RegExp('migrate=([^;]+)'));
        return !!match && match[1] === '1';
    }
}
/* global TopLevelApi */
/* global FileImport */
/* global PassphraseBox */
/* global PassphraseSetterBox */
/* global Nimiq */
/* global Key */
/* global KeyStore */

class ImportFileApi extends TopLevelApi {
    constructor() {
        super();

        this._encryptedKey = new Nimiq.SerialBuffer(0);
        this._keyType = Key.Type.BIP39;

        // Start UI
        const dom = this._makeView();
        this._passphraseBox = dom.passphraseBox;
        this._passphraseSetterBox = dom.passphraseSetterBox;

        this.$loading = /** @type {HTMLDivElement} */ (document.querySelector('#loading'));
    }

    /**
     * @param {ImportRequest} request
     */
    async onRequest(request) {
        this._request = request;

        // Global cancel link
        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());

        this.run();
    }

    /**
     * @returns {{passphraseBox: PassphraseBox, passphraseSetterBox: PassphraseSetterBox}}
     */
    _makeView() {
        // Containers
        /** @type {HTMLDivElement} */
        const $fileImport = (document.querySelector('.file-import'));
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('.passphrase-box'));
        /** @type {HTMLFormElement} */
        const $passphraseSetterBox = (document.querySelector('.passphrase-setter-box'));

        // Components
        const fileImport = new FileImport($fileImport);
        const passphraseBox = new PassphraseBox($passphraseBox, { buttonI18nTag: 'passphrasebox-log-in' });
        const passphraseSetterBox = new PassphraseSetterBox($passphraseSetterBox);

        // Events
        fileImport.on(FileImport.Events.IMPORT, this._onFileImported.bind(this));
        passphraseBox.on(PassphraseBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());
        passphraseSetterBox.on(PassphraseSetterBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseSetterBox.on(PassphraseSetterBox.Events.SKIP, () => this._onPassphraseEntered(null));

        return {
            passphraseBox,
            passphraseSetterBox,
        };
    }

    /**
     * Determine key type and forward user to Passphrase input
     *
     * @param {string} encryptedKeyBase64 - Encrypted KeyPair in base64 format
     */
    _onFileImported(encryptedKeyBase64) {
        if (encryptedKeyBase64.substr(0, 2) === '#3') {
            // BIP39 Key File
            this._keyType = Key.Type.BIP39;

            this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
            this._passphraseBox.setMinLength();

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) this._goToEnterPassphrase();
            else this._goToSetPassphrase();
        } else {
            // Legacy Account Access File
            this._keyType = Key.Type.LEGACY;

            if (encryptedKeyBase64.substr(0, 2) === '#2') {
                // PIN-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
                this._passphraseBox.setMinLength(6);
            } else {
                // Passphrase-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64);
                this._passphraseBox.setMinLength(8);
            }

            this._goToEnterPassphrase();
        }
    }

    run() {
        window.location.hash = ImportFileApi.Pages.FILE_IMPORT;

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {string?} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        const key = await this._decryptAndStoreKey(passphrase);
        if (!key) {
            this._passphraseBox.onPassphraseIncorrect();
            return;
        }

        /** @type {{keyPath: string, address: Uint8Array}[]} */
        const addresses = [];

        if (key.type === Key.Type.LEGACY) {
            const address = key.deriveAddress('');
            addresses.push({
                keyPath: 'm/0\'',
                address: address.serialize(),
            });
        } else if (key.type === Key.Type.BIP39) {
            /** @type {ImportRequest} */
            (this._request).requestedKeyPaths.forEach(keyPath => {
                addresses.push({
                    keyPath,
                    address: key.deriveAddress(keyPath).serialize(),
                });
            });
        } else {
            throw new Error(`Unkown key type ${key.type}`);
        }

        /** @type {ImportResult} */
        const result = {
            keyId: key.id,
            keyType: key.type,
            addresses,
        };

        this.resolve(result);
    }

    /**
     * @param {string?} passphrase
     * @returns {Promise<?Key>}
     */
    async _decryptAndStoreKey(passphrase) {
        this.$loading.style.display = 'flex';
        try {
            // Separating the processing of the encryptionKey (password) and the secret (key) is necessary
            // to cover these scenarios:
            //     1. Encrypted key file with password or PIN
            //     2. Unencrypted key file and no new password set
            //     3. Unencrypted key file and new password set

            let secret = new Uint8Array(0);
            let encryptionKey = null;

            if (passphrase !== null) {
                // TODO Support for UTF-8 passwords
                encryptionKey = Nimiq.BufferUtils.fromAscii(passphrase);
            }

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) {
                secret = await Nimiq.CryptoUtils.decryptOtpKdf(
                    this._encryptedKey,
                    /** @type {Uint8Array} */ (encryptionKey),
                );
            } else {
                // Key File was not encrypted and the imported Uint8Array is the plain secret
                secret = this._encryptedKey;
            }

            const key = new Key(secret, this._keyType);
            await KeyStore.instance.put(key, encryptionKey || undefined);

            return key;
        } catch (e) {
            this.$loading.style.display = 'none';
            return null;
        }
    }

    _goToEnterPassphrase() {
        window.location.hash = ImportFileApi.Pages.ENTER_PASSPHRASE;
        this._passphraseBox.reset();
        this._passphraseBox.focus();
    }

    _goToSetPassphrase() {
        window.location.hash = ImportFileApi.Pages.SET_PASSPHRASE;
        this._passphraseSetterBox.reset();
        this._passphraseSetterBox.focus();
    }
}

ImportFileApi.Pages = {
    FILE_IMPORT: 'file-import',
    ENTER_PASSPHRASE: 'enter-passphrase',
    SET_PASSPHRASE: 'set-passphrase',
};
/* global runKeyguard */
/* global ImportFileApi */

runKeyguard(ImportFileApi);
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
class AnimationUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {string} className
     * @param {HTMLElement} el
     * @param {Function} [afterStartCallback]
     * @param {Function} [beforeEndCallback]
     */
    static async animate(className, el, afterStartCallback, beforeEndCallback) {
        return new Promise(resolve => {
            // 'animiationend' is a native DOM event that fires upon CSS animation completion
            /** @param {Event} e */
            const listener = e => {
                if (e.target !== el) return;
                if (beforeEndCallback instanceof Function) beforeEndCallback();
                this.stopAnimate(className, el);
                el.removeEventListener('animationend', listener);
                resolve();
            };
            el.addEventListener('animationend', listener);
            el.classList.add(className);
            if (afterStartCallback instanceof Function) afterStartCallback();
        });
    }

    /**
     * @param {string} className
     * @param {HTMLElement} el
     */
    static stopAnimate(className, el) {
        el.classList.remove(className);
    }
}
/* eslint-disable prefer-promise-reject-errors, no-throw-literal */

// eslint-disable-next-line max-len
/** @typedef {HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | File} imageOrFileOrUrl */

class QrScanner {
    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {HTMLVideoElement} video
     * @param {((value: string) => string | PromiseLike<string>)} [onDecode]
     * @param {number} [canvasSize] - Edge length of the quadratic canvas
     */
    constructor(video, onDecode, canvasSize = QrScanner.DEFAULT_CANVAS_SIZE) {
        this.$video = video;
        this.$canvas = document.createElement('canvas');
        this._onDecode = onDecode;
        this._active = false;

        this.$canvas.width = canvasSize;
        this.$canvas.height = canvasSize;
        this._sourceRect = {
            x: 0,
            y: 0,
            width: canvasSize,
            height: canvasSize,
        };

        this.$video.addEventListener('canplay', () => this._updateSourceRect());
        this.$video.addEventListener('play', () => {
            this._updateSourceRect();
            this._scanFrame();
        }, false);
        this._qrWorker = new Worker(QrScanner.WORKER_PATH);
    }

    _updateSourceRect() {
        const smallestDimension = Math.min(this.$video.videoWidth, this.$video.videoHeight);
        const sourceRectSize = Math.round(2 / 3 * smallestDimension);
        this._sourceRect.width = sourceRectSize;
        this._sourceRect.height = sourceRectSize;
        this._sourceRect.x = (this.$video.videoWidth - sourceRectSize) / 2;
        this._sourceRect.y = (this.$video.videoHeight - sourceRectSize) / 2;
    }

    /**
     * Triggers this._onDecode for each frame, calls itself recursively until the video is paused or ends
     *
     * @returns {boolean}
     */
    _scanFrame() {
        if (this.$video.paused || this.$video.ended) return false;
        requestAnimationFrame(() => {
            QrScanner.scanImage(this.$video, this._sourceRect, this._qrWorker, this.$canvas, true)
                .then(this._onDecode, /** @param {string} error */ error => {
                    if (error !== 'QR code not found.') {
                        console.error(error);
                    }
                })
                .then(() => this._scanFrame());
        });

        return true;
    }

    /**
     * @param {string | object} [facingMode]
     * @param {boolean} [exact]
     * @returns {Promise<MediaStream>}
     */
    _getCameraStream(facingMode, exact = false) {
        const constraintsToTry = [{
            width: { min: 1024 },
        }, {
            width: { min: 768 },
        }, {}];

        if (facingMode) {
            if (exact) {
                facingMode = { exact: facingMode };
            }
            constraintsToTry.forEach(constraint => { constraint.facingMode = facingMode; });
        }
        return this._getMatchingCameraStream(constraintsToTry);
    }

    /**
     * @param {Array} constraintsToTry
     * @returns {Promise<MediaStream>}
     */
    async _getMatchingCameraStream(constraintsToTry) {
        if (constraintsToTry.length === 0) {
            return Promise.reject('Camera not found.');
        }
        return navigator.mediaDevices.getUserMedia({
            video: constraintsToTry.shift(),
        }).catch(() => this._getMatchingCameraStream(constraintsToTry));
    }

    start() {
        if (this._active) {
            return Promise.resolve();
        }
        this._active = true;
        clearTimeout(/** @type {number | undefined} */ (this._offTimeout));
        let facingMode = 'environment';
        return this._getCameraStream('environment', true)
            .catch(() => {
                // we (probably) don't have an environment camera
                facingMode = 'user';
                return this._getCameraStream(); // throws if we can't access the camera
            })
            .then(stream => {
                this.$video.srcObject = stream;
                this._setVideoMirror(facingMode);
            })
            .catch(e => {
                this._active = false;
                throw e;
            });
    }

    stop() {
        if (!this._active) {
            return;
        }
        this._active = false;
        this.$video.pause();
        this._offTimeout = (setTimeout(() => {
            // @ts-ignore
            this.$video.srcObject.getTracks()[0].stop();
            this.$video.srcObject = null;
        }, 3000));
    }

    /**
     * @param {string} facingMode
     */
    _setVideoMirror(facingMode) {
        // in user facing mode mirror the video to make it easier for the user to position the QR code
        const scaleFactor = facingMode === 'user' ? -1 : 1;
        this.$video.style.transform = `scaleX(${scaleFactor})`;
    }

    /**
     * @param {number} red
     * @param {number} green
     * @param {number} blue
     */
    setGrayscaleWeights(red, green, blue) {
        this._qrWorker.postMessage({
            type: 'grayscaleWeights',
            data: { red, green, blue },
        });
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @param {object?} sourceRect
     * @param {Worker?} worker
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @param {boolean} [alsoTryWithoutSourceRect]
     * @returns {Promise<string>}
     */
    static async scanImage(imageOrFileOrUrl, sourceRect = null, worker = null, canvas = null, fixedCanvasSize = false,
        alsoTryWithoutSourceRect = false) {
        const promise = new Promise((resolve, reject) => {
            worker = worker || new Worker(QrScanner.WORKER_PATH);
            /** @type {number | undefined} */
            let timeout;
            /** @type {EventListener} */
            let onError;
            /**
             * @param {Event} event
             */
            const onMessage = event => {
                // @ts-ignore
                if (event.data.type !== 'qrResult') {
                    return;
                }
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                // @ts-ignore
                if (event.data.data !== null) {
                    // @ts-ignore
                    resolve(event.data.data);
                } else {
                    reject('QR code not found.');
                }
            };
            onError = () => {
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                reject('Worker error.');
            };
            worker.addEventListener('message', onMessage);
            worker.addEventListener('error', onError);
            timeout = setTimeout(onError, 3000);
            QrScanner._loadImage(imageOrFileOrUrl).then(image => {
                const imageData = QrScanner._getImageData(image, sourceRect, canvas, fixedCanvasSize);
                /** @type {Worker} */ (worker).postMessage({
                    type: 'decode',
                    data: imageData,
                }, [imageData.data.buffer]);
            }).catch(reject);
        });

        if (sourceRect && alsoTryWithoutSourceRect) {
            return promise.catch(() => QrScanner.scanImage(imageOrFileOrUrl, null, worker, canvas, fixedCanvasSize));
        }
        return promise;
    }


    /**
     * @param {HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap} image
     * @param {object?} sourceRect
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @returns {ImageData}
     */
    static _getImageData(image, sourceRect = null, canvas = null, fixedCanvasSize = false) {
        canvas = canvas || document.createElement('canvas');
        const sourceRectX = sourceRect && sourceRect.x ? sourceRect.x : 0;
        const sourceRectY = sourceRect && sourceRect.y ? sourceRect.y : 0;
        // @ts-ignore
        const sourceRectWidth = sourceRect && sourceRect.width ? sourceRect.width : image.width || image.videoWidth;
        const sourceRectHeight = sourceRect && sourceRect.height
            ? sourceRect.height
            : image.height
            // @ts-ignore
            || image.videoHeight;
        if (!fixedCanvasSize && (canvas.width !== sourceRectWidth || canvas.height !== sourceRectHeight)) {
            canvas.width = sourceRectWidth;
            canvas.height = sourceRectHeight;
        }
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw ('Cannot get canvas 2D context');
        context.imageSmoothingEnabled = false; // gives less blurry images
        context.drawImage(
            image,
            sourceRectX,
            sourceRectY,
            sourceRectWidth,
            sourceRectHeight,
            0,
            0,
            canvas.width,
            canvas.height,
        );
        return context.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @returns {Promise<HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap>}
     */
    static async _loadImage(imageOrFileOrUrl) {
        if (imageOrFileOrUrl instanceof HTMLCanvasElement
            || imageOrFileOrUrl instanceof HTMLVideoElement
            // @ts-ignore
            || (window.ImageBitmap && imageOrFileOrUrl instanceof window.ImageBitmap)
        ) {
            // @ts-ignore
            return Promise.resolve(imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof Image) {
            return QrScanner._awaitImageLoad(imageOrFileOrUrl).then(() => imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof File || imageOrFileOrUrl instanceof URL
            || typeof (imageOrFileOrUrl) === 'string') {
            const image = new Image();
            if (imageOrFileOrUrl instanceof File) {
                image.src = URL.createObjectURL(imageOrFileOrUrl);
            } else {
                // @ts-ignore
                image.src = imageOrFileOrUrl;
            }
            return QrScanner._awaitImageLoad(image).then(() => {
                if (imageOrFileOrUrl instanceof File) {
                    URL.revokeObjectURL(image.src);
                }
                return image;
            });
        }
        return Promise.reject('Unsupported image type.');
    }

    /**
     * @param {HTMLImageElement} image
     */
    static async _awaitImageLoad(image) {
        return new Promise((resolve, reject) => {
            if (image.complete && image.naturalWidth !== 0) {
                // already loaded
                resolve();
            } else {
                /** @type {EventListener} */
                let onError;
                const onLoad = () => { // eslint-disable-line require-jsdoc-except/require-jsdoc
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    resolve();
                };
                onError = () => {
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    reject('Image load error');
                };
                image.addEventListener('load', onLoad);
                image.addEventListener('error', onError);
            }
        });
    }
}
QrScanner.DEFAULT_CANVAS_SIZE = 400;
QrScanner.WORKER_PATH = '../../lib/QrScannerWorker.min.js';
/* global TRANSLATIONS */ // eslint-disable-line no-unused-vars
/* global Nimiq */

/**
 * @typedef {{[language: string]: {[id: string]: string}}} dict
 */

class I18n { // eslint-disable-line no-unused-vars
    /**
     * @param {dict} dictionary - Dictionary of all languages and phrases
     * @param {string} fallbackLanguage - Language to be used if no translation for the current language can be found
     */
    static initialize(dictionary, fallbackLanguage) {
        this._dict = dictionary;

        if (!(fallbackLanguage in this._dict)) {
            throw new Error(`Fallback language "${fallbackLanguage}" not defined`);
        }
        /** @type {string} */
        this._fallbackLanguage = fallbackLanguage;

        this.language = navigator.language;
    }

    /**
     * @param {HTMLElement} [dom] - The DOM element to be translated, or body by default
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     */
    static translateDom(dom = document.body, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;

        /* eslint-disable-next-line valid-jsdoc */ // Multi-line descriptions are not valid JSDoc, apparently
        /**
         * @param {string} tag
         * @param {(element: HTMLElement, translation: string) => void} callback - callback(element, translation) for
         * each matching element
         */
        const translateElements = (tag, callback) => {
            const attribute = `data-${tag}`;
            /** @type {NodeListOf<HTMLElement>} */
            const elements = dom.querySelectorAll(`[${attribute}]`);
            elements.forEach(element => {
                const id = element.getAttribute(attribute);
                if (!id) return;
                callback(element, this._translate(id, language));
            });
        };

        /**
         * @param {string} tag
         */
        const translateAttribute = tag => {
            translateElements(`i18n-${tag}`, (element, translation) => element.setAttribute(tag, translation));
        };

        translateElements('i18n', (element, translation) => {
            const sanitized = translation.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const withMarkup = sanitized.replace(/\[strong]/g, '<strong>').replace(/\[\/strong]/g, '</strong>');
            element.innerHTML = withMarkup;
        });
        translateAttribute('value');
        translateAttribute('placeholder');
    }

    /**
     * @param {string} id - translation dict ID
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     * @returns {string}
     */
    static translatePhrase(id, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;
        return this._translate(id, language);
    }

    /**
     * @param {string} id
     * @param {string} language
     * @returns {string}
     */
    static _translate(id, language) {
        if (!this.dictionary[language] || !this.dictionary[language][id]) {
            throw new Error(`I18n: ${language}/${id} is undefined!`);
        }
        return this.dictionary[language][id];
    }

    /**
     * @returns {string[]} ISO codes of all available languages.
     */
    static availableLanguages() {
        return Object.keys(this.dictionary);
    }

    /**
     * @param {string} language
     */
    static switchLanguage(language) {
        this.language = language;
    }

    /**
     * Selects a supported language closed to the desired language. Examples it might return:
     * en-us => en-us, en-us => en, en => en-us, fr => en.
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     * @returns {string}
     */
    static getClosestSupportedLanguage(language) {
        // If this language is supported, return it directly
        if (language in this.dictionary) return language;

        // Return the base language, if it exists in the dictionary
        const baseLanguage = language.split('-')[0];
        if (baseLanguage !== language && baseLanguage in this.dictionary) return baseLanguage;

        // Check if other versions (siblings) of the base language exist
        const languagePrefix = `${baseLanguage}-`;
        const siblingLanguage = this.availableLanguages()
            .find(supportedLanguage => supportedLanguage.startsWith(languagePrefix));

        return siblingLanguage || this.fallbackLanguage;
    }

    /**
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     */
    static set language(language) {
        const languageToUse = this.getClosestSupportedLanguage(language);

        if (languageToUse !== language) {
            // eslint-disable-next-line no-console
            console.warn(`Language ${language} not supported, using ${languageToUse} instead.`);
        }

        if (this._language !== languageToUse) {
            /** @type {string} */
            this._language = languageToUse;

            if (({ interactive: 1, complete: 1 })[document.readyState]) {
                this.translateDom();
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    this.translateDom();
                });
            }
            I18n.observer.fire(I18n.Events.LANGUAGE_CHANGED, this._language);
        }
    }

    /** @type {string} */
    static get language() {
        return this._language || this.fallbackLanguage;
    }

    /** @type {dict} */
    static get dictionary() {
        if (!this._dict) throw new Error('I18n not initialized');
        return this._dict;
    }

    /** @type {string} */
    static get fallbackLanguage() {
        if (!this._fallbackLanguage) throw new Error('I18n not initialized');
        return this._fallbackLanguage;
    }

    /** @returns {DOMParser} */
    static get parser() {
        /** @type {DOMParser} */
        this._parser = this._parser || new DOMParser();

        return this._parser;
    }
}

I18n.observer = new Nimiq.Observable();
I18n.Events = {
    LANGUAGE_CHANGED: 'language-changed',
};
const TRANSLATIONS = {
    en: {
        _language: 'English',
        loading: 'Loading...',
        continue: 'Continue',

        'passphrase-strength': 'Strength',
        'passphrase-placeholder': 'Enter passphrase',
        'passphrase-repeat-placeholder': 'Repeat passphrase',

        'privacy-warning-heading': 'Are you being watched?',
        'privacy-warning-text': 'Now is the perfect time to assess your surroundings. '
                              + 'Nearby windows? Hidden cameras? Shoulder spies? '
                              + 'Anyone with your backup phrase can access and spend your NIM.',
        'privacy-agent-continue': 'Continue',

        'recovery-words-title': 'Recovery Words',
        'recovery-words-input-label': 'Recovery Words',
        'recovery-words-input-field-placeholder': 'word #',
        'recovery-words-explanation': 'There really is no password recovery. The following words are a backup '
                                    + 'of your Key File and will grant you access to your wallet even if your '
                                    + 'Key File is lost.',
        'recovery-words-storing': 'Write those words on a piece of paper and store it at a safe, offline place.',

        'create-heading-choose-identicon': 'Choose your account avatar',
        'create-text-select-avatar': 'Select an avatar for your wallet\'s default account from the selection below.',
        'create-hint-more-accounts': 'You can add more accounts later.',
        'create-heading-keyfile': 'This is your Key File',
        'create-text-keyfile-info': 'Your Key File gives you full access to your wallet. '
                                  + 'You\'ll need it everytime you log in.',
        'create-hint-keyfile-password': 'To protect your wallet, first protect it with a password.',
        'create-heading-backup-account': 'Create a backup',
        'create-heading-validate-backup': 'Validate your backup',

        'import-heading-log-in': 'Log in',
        'import-link-no-wallet': 'Don\'t have a wallet yet?',
        'import-heading-protect': 'Protect your wallet',
        'import-text-set-password': 'You can now set a password to encrypt your wallet on this device.',

        'import-file-lost-file': 'Lost your Key File? You can recover your account with your 24 Recovery Words.',
        'import-file-button-words': 'Enter Recovery Words',
        'import-file-heading-unlock': 'Unlock your Key File',
        'import-file-text-unprotected-keyfile': 'Your Key File is unprotected.',

        'file-import-prompt': 'Drop your Key File here',
        'file-import-click-hint': 'Or click to select a file.',

        'enter-recovery-words-heading': 'Import from recovery words',
        'enter-recovery-words-subheading': 'Please enter your 24 recovery words.',

        'choose-key-type-heading': 'Choose key type',
        'choose-key-type-subheading': 'We couldn\'t determine the type of your key. Please select it below.',
        'choose-key-type-or': 'or',
        'choose-key-type-legacy-address-heading': 'Single address',
        'choose-key-type-legacy-address-info': 'Created before xx/xx/2018',
        'choose-key-type-bip39-address-heading': 'Multiple addresses',
        'choose-key-type-bip39-address-info': 'Created after xx/xx/2018',

        'sign-tx-heading': 'New Transaction',
        'sign-tx-includes': 'includes',
        'sign-tx-fee': 'fee',
        'sign-tx-youre-sending': 'You\'re sending',
        'sign-tx-to': 'to',
        'sign-tx-pay-with': 'Pay with',

        'passphrasebox-enter-passphrase': 'Enter your passphrase',
        'passphrasebox-protect-keyfile': 'Protect your keyfile with a password',
        'passphrasebox-repeat-password': 'Repeat your password',
        'passphrasebox-continue': 'Continue',
        'passphrasebox-log-in': 'Log in to your wallet',
        'passphrasebox-log-out': 'Confirm logout',
        'passphrasebox-download': 'Download key file',
        'passphrasebox-confirm-tx': 'Confirm transaction',
        'passphrasebox-password-strength-8': 'Great, that\'s a good password!',
        'passphrasebox-password-strength-10': 'Super, that\'s a strong password!',
        'passphrasebox-password-strength-12': 'Excellent, that\'s a very strong password!',
        'passphrasebox-password-hint': 'Your password should have at least 8 characters.',
        'passphrasebox-password-skip': 'Skip password protection for now',

        'identicon-selector-loading': 'Mixing colors',
        'identicon-selector-button-select': 'Select',
        'identicon-selector-link-back': 'Back',

        'downloadkeyfile-heading-protected': 'Your Key File is protected!',
        'downloadkeyfile-heading-unprotected': 'Your Key File is not protected!',
        'downloadkeyfile-safe-place': 'Store it in a safe place. If you lose it, it cannot be recovered!',
        'downloadkeyfile-download': 'Download Key File',
        'downloadkeyfile-download-anyway': 'Download anyway',

        'validate-words-text': 'Please select the correct word from your list of recovery words.',
        'validate-words-back': 'Back to words',
        'validate-words-skip': 'Skip validation for now',
    },
    de: {
        _language: 'Deutsch',
        loading: 'Wird geladen...',
        continue: 'Weiter',

        'passphrase-strength': 'Stärke',
        'passphrase-placeholder': 'Passphrase eingeben',
        'passphrase-repeat-placeholder': 'Passphrase wiederholen',

        'privacy-warning-heading': 'Wirst du beobachtet?',
        'privacy-warning-text': 'Jetzt ist eine gute Zeit um sich umzuschauen. Gibt es Fenster in der Nähe? '
                              + 'Versteckte Kameras? Jemand der über deine Schulter schaut? '
                              + 'Jeder der deine Wiederherstellungswörter hat, kann auf deine NIM zugreifen '
                              + 'und sie ausgeben.',
        'privacy-agent-continue': 'Weiter',

        'recovery-words-title': 'Wiederherstellungswörter',
        'recovery-words-input-label': 'Wiederherstellungswörter',
        'recovery-words-input-field-placeholder': 'Wort ',
        'recovery-words-explanation': 'Es gibt wirklich keine Password-Wiederherstellung. Die folgenden Wörter '
                                    + 'sind ein Backup von deiner Schlüsseldatei und werden dir Zugang zu deiner '
                                    + 'Wallet gewähren, auch wenn deine Schlüsseldatei verloren ist.',
        'recovery-words-storing': 'Schreibe diese Wörter auf ein Stück Papier und verwahre es an einem sicheren, '
                                + 'analogen Ort.',

        'create-heading-choose-identicon': 'Wähle deinen Konto Avatar',
        'create-text-select-avatar': 'Wähle einen Avatar für den Standard-Account deiner Wallet aus der Auswahl unten.',
        'create-hint-more-accounts': 'Neue Konten kannst du später hinzufügen.',
        'create-heading-keyfile': 'Das ist deine Wallet Datei',
        'create-text-keyfile-info': 'Deine Wallet Datei gibt dir vollen Zugang zu deiner Wallet. '
                                  + 'Du brauchst sie jedesmal wenn du dich einloggst.',
        'create-hint-keyfile-password': 'Um deine Wallet zu schützen, schütze es mit einem Passwort.',
        'create-heading-backup-account': 'Erstelle ein Backup',
        'create-heading-validate-backup': 'Überprüfe dein Backup',

        'import-heading-log-in': 'Einloggen',
        'import-link-no-wallet': 'Du hast noch keine Wallet?',
        'import-heading-protect': 'Wallet verschlüsseln',
        'import-text-set-password': 'Du kannst jetzt ein Passwort eingeben, um deine Wallet auf diesem '
                                  + 'Gerät zu verschlüsseln.',

        'import-file-lost-file': 'Schlüsseldatei verloren? Du kannst deinen Account mit deinen 24 '
                               + 'Wiederherstellungswörtern wiederherstellen',
        'import-file-button-words': 'Wiederherstellungswörter eingeben',
        'import-file-heading-unlock': 'Entsperre deine Schlüsseldatei',
        'import-file-text-unprotected-keyfile': 'Deine Schlüsseldatei ist ungeschützt.',

        'file-import-prompt': 'Ziehe deine Schlüsseldatei auf dieses Feld',
        'file-import-click-hint': 'Oder klicke um eine Datei auszuwählen.',

        'enter-recovery-words-heading': 'Mit Wiederherstellungswörtern importieren',
        'enter-recovery-words-subheading': 'Bitte gib deine 24 Wiederherstellungswörter ein.',

        'choose-key-type-heading': 'Schlüsseltyp wählen',
        'choose-key-type-subheading': 'Wir konnten den Typ deines Schlüssels nicht automatisch ermitteln. '
                                    + 'Bitte wähle ihn unten aus.',
        'choose-key-type-or': 'oder',
        'choose-key-type-legacy-address-heading': 'Einzelne Adresse',
        'choose-key-type-legacy-address-info': 'Erstellt vor xx.xx.2018',
        'choose-key-type-bip39-address-heading': 'Mehrere Adressen',
        'choose-key-type-bip39-address-info': 'Erstellt nach xx.xx.2018',

        'sign-tx-heading': 'Neue Überweisung',
        'sign-tx-includes': 'inklusive',
        'sign-tx-fee': 'Gebühr',
        'sign-tx-youre-sending': 'Du sendest',
        'sign-tx-to': 'an',
        'sign-tx-pay-with': 'Zahle mit',

        'passphrasebox-enter-passphrase': 'Gib deine Passphrase ein',
        'passphrasebox-protect-keyfile': 'Sichere dein KeyFile mit einem Passwort',
        'passphrasebox-repeat-password': 'Wiederhole dein Passwort',
        'passphrasebox-continue': 'Weiter',
        'passphrasebox-log-in': 'In deine Wallet einloggen',
        'passphrasebox-log-out': 'Abmeldung bestätigen',
        'passphrasebox-download': 'KeyFile herunterladen',
        'passphrasebox-confirm-tx': 'Überweisung bestätigen',
        'passphrasebox-password-strength-8': 'Schön, das ist ein gutes Passwort!',
        'passphrasebox-password-strength-10': 'Super, das ist ein starkes Passwort!',
        'passphrasebox-password-strength-12': 'Exzellent, das ist ein sehr starkes Passwort!',
        'passphrasebox-password-hint': 'Dein Passwort muss mindestens 8 Zeichen haben.',
        'passphrasebox-password-skip': 'Passwortschutz erstmal überspringen',

        'identicon-selector-loading': 'Mische Farben',
        'identicon-selector-button-select': 'Auswählen',
        'identicon-selector-link-back': 'Zurück',

        'downloadkeyfile-heading-protected': 'Dein Schlüsseldatei ist geschützt!',
        'downloadkeyfile-heading-unprotected': 'Dein Schlüsseldatei ist nicht geschützt!',
        'downloadkeyfile-safe-place': 'Lagere sie in einem sicheren Ort. Wenn du sie verlierst, '
                                    + 'kann sie nicht wiederhergestellt werden!',
        'downloadkeyfile-download': 'Schlüsseldatei herunterladen',
        'downloadkeyfile-download-anyway': 'Trotzdem herunterladen',

        'validate-words-text': 'Bitte wähle das richtige Wort aus deiner Liste von Wiederherstellungswörtern aus.',
        'validate-words-back': 'Zurück zu den Wörtern',
        'validate-words-skip': 'Überprüfung erstmal überspringen',
    },
};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
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
/* global Nimiq */
/* global AnimationUtils */
/* global QrScanner */
/* global I18n */

class FileImport extends Nimiq.Observable {
    /**
     * @param {HTMLDivElement} [$el]
     */
    constructor($el) {
        super();
        this.$el = FileImport._createElement($el);

        /** @type {HTMLElement} */
        this.$errorMessage = (this.$el.querySelector('.error-message'));
        /** @type {HTMLInputElement} */
        this.$fileInput = (this.$el.querySelector('input'));

        // TODO Re-add the drop target interaction and event listeners?

        this.$el.addEventListener('click', this._openFileInput.bind(this));
        this.$fileInput.addEventListener('change', this._onFileSelected.bind(this));
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('file-import');

        $el.innerHTML = `
            <h3 data-i18n="file-import-prompt">Drop your Key File here</h3>
            <span class="click-hint" data-i18n="file-import-click-hint">Or click to select a file.</span>
            <span class="error-message"></span>
            <input type="file" accept="image/*">
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @returns {HTMLElement}
     */
    getElement() {
        return this.$el;
    }

    _openFileInput() {
        this.$fileInput.click();
    }

    /**
     * @param {DOMEvent} event
     */
    _onFileSelected(event) {
        this.$errorMessage.textContent = '';
        // @ts-ignore
        const files = event.target.files;
        this._readFile(files[0]);
        this.$fileInput.value = '';
    }

    _onQrError() {
        AnimationUtils.animate('shake', this.$el);
        this.$errorMessage.textContent = 'Could not read Key File.';
    }

    /**
     * @param {File} file
     */
    async _readFile(file) {
        // TODO Add WalletBackup to keyguard-next code base
        // const qrPosition = WalletBackup.calculateQrPosition();
        const qrPosition = {
            x: 156,
            y: 548.6886,
            width: 173.4,
            height: 173.4,
            size: 185.4,
            padding: 12,
        };

        try {
            const decoded = await QrScanner.scanImage(file, qrPosition, null, null, false, true);
            this.fire(FileImport.Events.IMPORT, decoded);
        } catch (e) {
            this._onQrError();
        }
    }
}

FileImport.Events = {
    IMPORT: 'import',
};
/* global Nimiq */
/* global AnimationUtils */
/* global I18n */

class PassphraseInput extends Nimiq.Observable {
    /**
     * @param {?HTMLElement} $el
     * @param {string} placeholder
     * @param {boolean} [showStrengthIndicator]
     */
    constructor($el, placeholder = '••••••••', showStrengthIndicator = false) {
        super();
        this._minLength = PassphraseInput.DEFAULT_MIN_LENGTH;
        this._showStrengthIndicator = showStrengthIndicator;
        this.$el = PassphraseInput._createElement($el);
        this.$inputContainer = /** @type {HTMLElement} */ (this.$el.querySelector('.input-container'));
        this.$input = /** @type {HTMLInputElement} */ (this.$el.querySelector('input.password'));
        this.$eyeButton = /** @type {HTMLElement} */ (this.$el.querySelector('.eye-button'));

        /** @type {HTMLElement} */
        this.$strengthIndicator = (this.$el.querySelector('.strength-indicator'));
        /** @type {HTMLElement} */
        this.$strengthIndicatorContainer = (this.$el.querySelector('.strength-indicator-container'));
        if (!showStrengthIndicator) {
            this.$strengthIndicatorContainer.style.display = 'none';
        }

        this.$input.placeholder = placeholder;

        this.$eyeButton.addEventListener('click', () => this._changeVisibility());

        this._onInputChanged();
        this.$input.addEventListener('input', () => this._onInputChanged());
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-input');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <div class="input-container">
                <input class="password" type="password" placeholder="Enter Passphrase">
                <span class="eye-button icon-eye"/>
            </div>
            <div class="strength-indicator-container">
                <div class="label"><span data-i18n="passphrase-strength">Strength</span>:</div>
                <meter max="130" low="10" optimum="100" class="strength-indicator"></meter>
            </div>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    /** @type {HTMLInputElement} */
    get input() {
        return this.$input;
    }

    focus() {
        this.$input.focus();
    }

    reset() {
        this.$input.value = '';
        this._changeVisibility(false);
        this._onInputChanged();
    }

    async onPassphraseIncorrect() {
        await AnimationUtils.animate('shake', this.$inputContainer);
        this.reset();
    }

    /** @param {boolean} [becomeVisible] */
    _changeVisibility(becomeVisible) {
        becomeVisible = typeof becomeVisible !== 'undefined'
            ? becomeVisible
            : this.$input.getAttribute('type') === 'password';
        this.$input.setAttribute('type', becomeVisible ? 'text' : 'password');
        this.$eyeButton.classList.toggle('icon-eye-off', becomeVisible);
        this.$eyeButton.classList.toggle('icon-eye', !becomeVisible);
        this.$input.focus();
    }

    _onInputChanged() {
        const passphraseLength = this.$input.value.length;
        this._updateStrengthIndicator();
        this.valid = passphraseLength >= this._minLength;

        this.fire(PassphraseInput.Events.VALID, this.valid);
    }

    _updateStrengthIndicator() {
        const passphraseLength = this.$input.value.length;
        let strengthIndicatorValue;
        if (passphraseLength === 0) {
            strengthIndicatorValue = 0;
        } else if (passphraseLength < 7) {
            strengthIndicatorValue = 10;
        } else if (passphraseLength < 10) {
            strengthIndicatorValue = 70;
        } else if (passphraseLength < 14) {
            strengthIndicatorValue = 100;
        } else {
            strengthIndicatorValue = 130;
        }
        this.$strengthIndicator.setAttribute('value', String(strengthIndicatorValue));
    }

    /**
     * @returns {string}
     */
    get text() {
        return this.$input.value;
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._minLength = minLength || PassphraseInput.DEFAULT_MIN_LENGTH;
    }
}

PassphraseInput.Events = {
    VALID: 'passphraseinput-valid',
};

PassphraseInput.DEFAULT_MIN_LENGTH = 8;
/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
            hideInput: false, // TODO: When a key is not encrypted, no passphrase is required
            buttonI18nTag: 'passphrasebox-confirm-tx',
        };

        super();

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.cancel')).addEventListener('click', () => this._onCancel());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'center', options.bgColor);

        // To enable i18n validation with the dynamic nature of the passphrase box's contents,
        // all possible i18n tags and texts have to be specified here in the below format to
        // enable the validator to find them with its regular expression.
        /* eslint-disable max-len */
        const buttonVersions = {
            'passphrasebox-continue': '<button class="submit" data-i18n="passphrasebox-continue">Continue</button>',
            'passphrasebox-log-in': '<button class="submit" data-i18n="passphrasebox-log-in">Log in to your wallet</button>',
            'passphrasebox-log-out': '<button class="submit" data-i18n="passphrasebox-log-out">Confirm logout</button>',
            'passphrasebox-confirm-tx': '<button class="submit" data-i18n="passphrasebox-confirm-tx">Confirm transaction</button>',
        };
        /* eslint-enable max-len */

        if (!buttonVersions[options.buttonI18nTag]) throw new Error('PassphraseBox button i18n tag not defined');

        $el.innerHTML = `
            <a class="cancel icon-cancel"></a>
            <h2 class="prompt" data-i18n="passphrasebox-enter-passphrase">Enter your passphrase</h2>
            <div passphrase-input></div>
            ${buttonVersions[options.buttonI18nTag]}
        `;

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this._passphraseInput.focus();
    }

    reset() {
        this._passphraseInput.reset();
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._passphraseInput.setMinLength(minLength);
    }

    /**
     * @returns {Promise<void>}
     */
    async onPassphraseIncorrect() {
        return this._passphraseInput.onPassphraseIncorrect();
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();
        this.fire(PassphraseBox.Events.SUBMIT, this._passphraseInput.text);
    }

    _onCancel() {
        this.fire(PassphraseBox.Events.CANCEL);
    }
}

PassphraseBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    CANCEL: 'passphrasebox-cancel',
};
/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseSetterBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
        };

        super();

        this._password = '';

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseSetterBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.password-skip')).addEventListener('click', () => this._onSkip());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'setter', 'center', options.bgColor);

        /* eslint-disable max-len */
        $el.innerHTML = `
            <h2 class="prompt protect" data-i18n="passphrasebox-protect-keyfile">Protect your keyfile with a password</h2>
            <h2 class="prompt repeat" data-i18n="passphrasebox-repeat-password">Repeat your password</h2>

            <div passphrase-input></div>

            <div class="password-strength strength-8"  data-i18n="passphrasebox-password-strength-8" >Great, that's a good password!</div>
            <div class="password-strength strength-10" data-i18n="passphrasebox-password-strength-10">Super, that's a strong password!</div>
            <div class="password-strength strength-12" data-i18n="passphrasebox-password-strength-12">Excellent, that's a very strong password!</div>

            <div class="password-hint" data-i18n="passphrasebox-password-hint">Your password should have at least 8 characters.</div>
            <a tabindex="0" class="password-skip" data-i18n="passphrasebox-password-skip">Skip password protection for now</a>

            <button class="submit" data-i18n="passphrasebox-continue">Continue</button>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this._passphraseInput.focus();
    }

    /**
     * @param {boolean} [isWrongPassphrase]
     */
    async reset(isWrongPassphrase) {
        this._password = '';

        if (isWrongPassphrase) await this._passphraseInput.onPassphraseIncorrect();
        else this._passphraseInput.reset();

        this.$el.classList.remove('repeat');
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);

        const length = this._passphraseInput.text.length;
        this.$el.classList.toggle('strength-8', length < 10);
        this.$el.classList.toggle('strength-10', length >= 10 && length < 12);
        this.$el.classList.toggle('strength-12', length >= 12);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();

        if (!this._password) {
            this._password = this._passphraseInput.text;
            this._passphraseInput.reset();
            this.$el.classList.add('repeat');
        } else if (this._password !== this._passphraseInput.text) {
            this.reset(true);
        } else {
            this.fire(PassphraseSetterBox.Events.SUBMIT, this._password);
            this.reset();
        }
    }

    _onSkip() {
        this.fire(PassphraseSetterBox.Events.SKIP);
    }
}

PassphraseSetterBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    SKIP: 'passphrasebox-skip',
};
/* global BrowserDetection */
/* global KeyStore */
/* global CookieJar */
/* global I18n */

/**
 * A common parent class for pop-up requests.
 *
 * Usage:
 * Inherit this class in your popup request API class:
 * ```
 *  class SignTransactionApi extends TopLevelApi {
 *
 *      // Define the onRequest method to receive the client's request object:
 *      onRequest(request) {
 *          // do something...
 *
 *          // When done, call this.resolve() with the result object
 *          this.resolve(result);
 *
 *          // Or this.reject() with an error
 *          this.reject(error);
 *      }
 *  }
 *
 *  // Finally, start your API:
 *  runKeyguard(SignTransactionApi);
 * ```
 */
class TopLevelApi { // eslint-disable-line no-unused-vars
    constructor() {
        if (window.self !== window.top) {
            // PopupAPI may not run in a frame
            throw new Error('Illegal use');
        }

        /** @type {Function} */
        this._resolve = () => { throw new Error('Method not defined'); };

        /** @type {Function} */
        this._reject = () => { throw new Error('Method not defined'); };

        I18n.initialize(window.TRANSLATIONS, 'en');
        I18n.translateDom();

        window.addEventListener('beforeunload', () => {
            this.reject(new Error('Keyguard popup closed'));
        });
    }

    /**
     * Method to be called by the Keyguard client via RPC
     *
     * @param {KeyguardRequest} request
     */
    async request(request) {
        /**
         * Detect migrate signalling set by the iframe
         *
         * @deprecated Only for database migration
         */
        if ((BrowserDetection.isIos() || BrowserDetection.isSafari()) && this._hasMigrateFlag()) {
            await KeyStore.instance.migrateAccountsToKeys();
        }

        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;

            this.onRequest(request).catch(reject);
        });
    }

    /**
     * Overwritten by each request's API class
     *
     * @param {KeyguardRequest} request
     * @abstract
     */
    async onRequest(request) { // eslint-disable-line no-unused-vars
        throw new Error('Not implemented');
    }

    /**
     * Called by a page's API class on success
     *
     * @param {*} result
     * @returns {Promise<void>}
     */
    async resolve(result) {
        // Keys might have changed, so update cookie for iOS and Safari users
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            const keys = await KeyStore.instance.list();
            CookieJar.fill(keys);
        }

        this._resolve(result);
    }

    /**
     * Called by a page's API class on error
     *
     * @param {Error} error
     */
    reject(error) {
        this._reject(error);
    }

    /**
     * @deprecated Only for database migration
     * @returns {boolean}
     */
    _hasMigrateFlag() {
        const match = document.cookie.match(new RegExp('migrate=([^;]+)'));
        return !!match && match[1] === '1';
    }
}
/* global TopLevelApi */
/* global FileImport */
/* global PassphraseBox */
/* global PassphraseSetterBox */
/* global Nimiq */
/* global Key */
/* global KeyStore */

class ImportFileApi extends TopLevelApi {
    constructor() {
        super();

        this._encryptedKey = new Nimiq.SerialBuffer(0);
        this._keyType = Key.Type.BIP39;

        // Start UI
        const dom = this._makeView();
        this._passphraseBox = dom.passphraseBox;
        this._passphraseSetterBox = dom.passphraseSetterBox;

        this.$loading = /** @type {HTMLDivElement} */ (document.querySelector('#loading'));
    }

    /**
     * @param {ImportRequest} request
     */
    async onRequest(request) {
        this._request = request;

        // Global cancel link
        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());

        this.run();
    }

    /**
     * @returns {{passphraseBox: PassphraseBox, passphraseSetterBox: PassphraseSetterBox}}
     */
    _makeView() {
        // Containers
        /** @type {HTMLDivElement} */
        const $fileImport = (document.querySelector('.file-import'));
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('.passphrase-box'));
        /** @type {HTMLFormElement} */
        const $passphraseSetterBox = (document.querySelector('.passphrase-setter-box'));

        // Components
        const fileImport = new FileImport($fileImport);
        const passphraseBox = new PassphraseBox($passphraseBox, { buttonI18nTag: 'passphrasebox-log-in' });
        const passphraseSetterBox = new PassphraseSetterBox($passphraseSetterBox);

        // Events
        fileImport.on(FileImport.Events.IMPORT, this._onFileImported.bind(this));
        passphraseBox.on(PassphraseBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());
        passphraseSetterBox.on(PassphraseSetterBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseSetterBox.on(PassphraseSetterBox.Events.SKIP, () => this._onPassphraseEntered(null));

        return {
            passphraseBox,
            passphraseSetterBox,
        };
    }

    /**
     * Determine key type and forward user to Passphrase input
     *
     * @param {string} encryptedKeyBase64 - Encrypted KeyPair in base64 format
     */
    _onFileImported(encryptedKeyBase64) {
        if (encryptedKeyBase64.substr(0, 2) === '#3') {
            // BIP39 Key File
            this._keyType = Key.Type.BIP39;

            this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
            this._passphraseBox.setMinLength();

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) this._goToEnterPassphrase();
            else this._goToSetPassphrase();
        } else {
            // Legacy Account Access File
            this._keyType = Key.Type.LEGACY;

            if (encryptedKeyBase64.substr(0, 2) === '#2') {
                // PIN-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
                this._passphraseBox.setMinLength(6);
            } else {
                // Passphrase-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64);
                this._passphraseBox.setMinLength(8);
            }

            this._goToEnterPassphrase();
        }
    }

    run() {
        window.location.hash = ImportFileApi.Pages.FILE_IMPORT;

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {string?} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        const key = await this._decryptAndStoreKey(passphrase);
        if (!key) {
            this._passphraseBox.onPassphraseIncorrect();
            return;
        }

        /** @type {{keyPath: string, address: Uint8Array}[]} */
        const addresses = [];

        if (key.type === Key.Type.LEGACY) {
            const address = key.deriveAddress('');
            addresses.push({
                keyPath: 'm/0\'',
                address: address.serialize(),
            });
        } else if (key.type === Key.Type.BIP39) {
            /** @type {ImportRequest} */
            (this._request).requestedKeyPaths.forEach(keyPath => {
                addresses.push({
                    keyPath,
                    address: key.deriveAddress(keyPath).serialize(),
                });
            });
        } else {
            throw new Error(`Unkown key type ${key.type}`);
        }

        /** @type {ImportResult} */
        const result = {
            keyId: key.id,
            keyType: key.type,
            addresses,
        };

        this.resolve(result);
    }

    /**
     * @param {string?} passphrase
     * @returns {Promise<?Key>}
     */
    async _decryptAndStoreKey(passphrase) {
        this.$loading.style.display = 'flex';
        try {
            // Separating the processing of the encryptionKey (password) and the secret (key) is necessary
            // to cover these scenarios:
            //     1. Encrypted key file with password or PIN
            //     2. Unencrypted key file and no new password set
            //     3. Unencrypted key file and new password set

            let secret = new Uint8Array(0);
            let encryptionKey = null;

            if (passphrase !== null) {
                // TODO Support for UTF-8 passwords
                encryptionKey = Nimiq.BufferUtils.fromAscii(passphrase);
            }

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) {
                secret = await Nimiq.CryptoUtils.decryptOtpKdf(
                    this._encryptedKey,
                    /** @type {Uint8Array} */ (encryptionKey),
                );
            } else {
                // Key File was not encrypted and the imported Uint8Array is the plain secret
                secret = this._encryptedKey;
            }

            const key = new Key(secret, this._keyType);
            await KeyStore.instance.put(key, encryptionKey || undefined);

            return key;
        } catch (e) {
            this.$loading.style.display = 'none';
            return null;
        }
    }

    _goToEnterPassphrase() {
        window.location.hash = ImportFileApi.Pages.ENTER_PASSPHRASE;
        this._passphraseBox.reset();
        this._passphraseBox.focus();
    }

    _goToSetPassphrase() {
        window.location.hash = ImportFileApi.Pages.SET_PASSPHRASE;
        this._passphraseSetterBox.reset();
        this._passphraseSetterBox.focus();
    }
}

ImportFileApi.Pages = {
    FILE_IMPORT: 'file-import',
    ENTER_PASSPHRASE: 'enter-passphrase',
    SET_PASSPHRASE: 'set-passphrase',
};
/* global runKeyguard */
/* global ImportFileApi */

runKeyguard(ImportFileApi);
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
class AnimationUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {string} className
     * @param {HTMLElement} el
     * @param {Function} [afterStartCallback]
     * @param {Function} [beforeEndCallback]
     */
    static async animate(className, el, afterStartCallback, beforeEndCallback) {
        return new Promise(resolve => {
            // 'animiationend' is a native DOM event that fires upon CSS animation completion
            /** @param {Event} e */
            const listener = e => {
                if (e.target !== el) return;
                if (beforeEndCallback instanceof Function) beforeEndCallback();
                this.stopAnimate(className, el);
                el.removeEventListener('animationend', listener);
                resolve();
            };
            el.addEventListener('animationend', listener);
            el.classList.add(className);
            if (afterStartCallback instanceof Function) afterStartCallback();
        });
    }

    /**
     * @param {string} className
     * @param {HTMLElement} el
     */
    static stopAnimate(className, el) {
        el.classList.remove(className);
    }
}
/* eslint-disable prefer-promise-reject-errors, no-throw-literal */

// eslint-disable-next-line max-len
/** @typedef {HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | File} imageOrFileOrUrl */

class QrScanner {
    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {HTMLVideoElement} video
     * @param {((value: string) => string | PromiseLike<string>)} [onDecode]
     * @param {number} [canvasSize] - Edge length of the quadratic canvas
     */
    constructor(video, onDecode, canvasSize = QrScanner.DEFAULT_CANVAS_SIZE) {
        this.$video = video;
        this.$canvas = document.createElement('canvas');
        this._onDecode = onDecode;
        this._active = false;

        this.$canvas.width = canvasSize;
        this.$canvas.height = canvasSize;
        this._sourceRect = {
            x: 0,
            y: 0,
            width: canvasSize,
            height: canvasSize,
        };

        this.$video.addEventListener('canplay', () => this._updateSourceRect());
        this.$video.addEventListener('play', () => {
            this._updateSourceRect();
            this._scanFrame();
        }, false);
        this._qrWorker = new Worker(QrScanner.WORKER_PATH);
    }

    _updateSourceRect() {
        const smallestDimension = Math.min(this.$video.videoWidth, this.$video.videoHeight);
        const sourceRectSize = Math.round(2 / 3 * smallestDimension);
        this._sourceRect.width = sourceRectSize;
        this._sourceRect.height = sourceRectSize;
        this._sourceRect.x = (this.$video.videoWidth - sourceRectSize) / 2;
        this._sourceRect.y = (this.$video.videoHeight - sourceRectSize) / 2;
    }

    /**
     * Triggers this._onDecode for each frame, calls itself recursively until the video is paused or ends
     *
     * @returns {boolean}
     */
    _scanFrame() {
        if (this.$video.paused || this.$video.ended) return false;
        requestAnimationFrame(() => {
            QrScanner.scanImage(this.$video, this._sourceRect, this._qrWorker, this.$canvas, true)
                .then(this._onDecode, /** @param {string} error */ error => {
                    if (error !== 'QR code not found.') {
                        console.error(error);
                    }
                })
                .then(() => this._scanFrame());
        });

        return true;
    }

    /**
     * @param {string | object} [facingMode]
     * @param {boolean} [exact]
     * @returns {Promise<MediaStream>}
     */
    _getCameraStream(facingMode, exact = false) {
        const constraintsToTry = [{
            width: { min: 1024 },
        }, {
            width: { min: 768 },
        }, {}];

        if (facingMode) {
            if (exact) {
                facingMode = { exact: facingMode };
            }
            constraintsToTry.forEach(constraint => { constraint.facingMode = facingMode; });
        }
        return this._getMatchingCameraStream(constraintsToTry);
    }

    /**
     * @param {Array} constraintsToTry
     * @returns {Promise<MediaStream>}
     */
    async _getMatchingCameraStream(constraintsToTry) {
        if (constraintsToTry.length === 0) {
            return Promise.reject('Camera not found.');
        }
        return navigator.mediaDevices.getUserMedia({
            video: constraintsToTry.shift(),
        }).catch(() => this._getMatchingCameraStream(constraintsToTry));
    }

    start() {
        if (this._active) {
            return Promise.resolve();
        }
        this._active = true;
        clearTimeout(/** @type {number | undefined} */ (this._offTimeout));
        let facingMode = 'environment';
        return this._getCameraStream('environment', true)
            .catch(() => {
                // we (probably) don't have an environment camera
                facingMode = 'user';
                return this._getCameraStream(); // throws if we can't access the camera
            })
            .then(stream => {
                this.$video.srcObject = stream;
                this._setVideoMirror(facingMode);
            })
            .catch(e => {
                this._active = false;
                throw e;
            });
    }

    stop() {
        if (!this._active) {
            return;
        }
        this._active = false;
        this.$video.pause();
        this._offTimeout = (setTimeout(() => {
            // @ts-ignore
            this.$video.srcObject.getTracks()[0].stop();
            this.$video.srcObject = null;
        }, 3000));
    }

    /**
     * @param {string} facingMode
     */
    _setVideoMirror(facingMode) {
        // in user facing mode mirror the video to make it easier for the user to position the QR code
        const scaleFactor = facingMode === 'user' ? -1 : 1;
        this.$video.style.transform = `scaleX(${scaleFactor})`;
    }

    /**
     * @param {number} red
     * @param {number} green
     * @param {number} blue
     */
    setGrayscaleWeights(red, green, blue) {
        this._qrWorker.postMessage({
            type: 'grayscaleWeights',
            data: { red, green, blue },
        });
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @param {object?} sourceRect
     * @param {Worker?} worker
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @param {boolean} [alsoTryWithoutSourceRect]
     * @returns {Promise<string>}
     */
    static async scanImage(imageOrFileOrUrl, sourceRect = null, worker = null, canvas = null, fixedCanvasSize = false,
        alsoTryWithoutSourceRect = false) {
        const promise = new Promise((resolve, reject) => {
            worker = worker || new Worker(QrScanner.WORKER_PATH);
            /** @type {number | undefined} */
            let timeout;
            /** @type {EventListener} */
            let onError;
            /**
             * @param {Event} event
             */
            const onMessage = event => {
                // @ts-ignore
                if (event.data.type !== 'qrResult') {
                    return;
                }
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                // @ts-ignore
                if (event.data.data !== null) {
                    // @ts-ignore
                    resolve(event.data.data);
                } else {
                    reject('QR code not found.');
                }
            };
            onError = () => {
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                reject('Worker error.');
            };
            worker.addEventListener('message', onMessage);
            worker.addEventListener('error', onError);
            timeout = setTimeout(onError, 3000);
            QrScanner._loadImage(imageOrFileOrUrl).then(image => {
                const imageData = QrScanner._getImageData(image, sourceRect, canvas, fixedCanvasSize);
                /** @type {Worker} */ (worker).postMessage({
                    type: 'decode',
                    data: imageData,
                }, [imageData.data.buffer]);
            }).catch(reject);
        });

        if (sourceRect && alsoTryWithoutSourceRect) {
            return promise.catch(() => QrScanner.scanImage(imageOrFileOrUrl, null, worker, canvas, fixedCanvasSize));
        }
        return promise;
    }


    /**
     * @param {HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap} image
     * @param {object?} sourceRect
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @returns {ImageData}
     */
    static _getImageData(image, sourceRect = null, canvas = null, fixedCanvasSize = false) {
        canvas = canvas || document.createElement('canvas');
        const sourceRectX = sourceRect && sourceRect.x ? sourceRect.x : 0;
        const sourceRectY = sourceRect && sourceRect.y ? sourceRect.y : 0;
        // @ts-ignore
        const sourceRectWidth = sourceRect && sourceRect.width ? sourceRect.width : image.width || image.videoWidth;
        const sourceRectHeight = sourceRect && sourceRect.height
            ? sourceRect.height
            : image.height
            // @ts-ignore
            || image.videoHeight;
        if (!fixedCanvasSize && (canvas.width !== sourceRectWidth || canvas.height !== sourceRectHeight)) {
            canvas.width = sourceRectWidth;
            canvas.height = sourceRectHeight;
        }
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw ('Cannot get canvas 2D context');
        context.imageSmoothingEnabled = false; // gives less blurry images
        context.drawImage(
            image,
            sourceRectX,
            sourceRectY,
            sourceRectWidth,
            sourceRectHeight,
            0,
            0,
            canvas.width,
            canvas.height,
        );
        return context.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @returns {Promise<HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap>}
     */
    static async _loadImage(imageOrFileOrUrl) {
        if (imageOrFileOrUrl instanceof HTMLCanvasElement
            || imageOrFileOrUrl instanceof HTMLVideoElement
            // @ts-ignore
            || (window.ImageBitmap && imageOrFileOrUrl instanceof window.ImageBitmap)
        ) {
            // @ts-ignore
            return Promise.resolve(imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof Image) {
            return QrScanner._awaitImageLoad(imageOrFileOrUrl).then(() => imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof File || imageOrFileOrUrl instanceof URL
            || typeof (imageOrFileOrUrl) === 'string') {
            const image = new Image();
            if (imageOrFileOrUrl instanceof File) {
                image.src = URL.createObjectURL(imageOrFileOrUrl);
            } else {
                // @ts-ignore
                image.src = imageOrFileOrUrl;
            }
            return QrScanner._awaitImageLoad(image).then(() => {
                if (imageOrFileOrUrl instanceof File) {
                    URL.revokeObjectURL(image.src);
                }
                return image;
            });
        }
        return Promise.reject('Unsupported image type.');
    }

    /**
     * @param {HTMLImageElement} image
     */
    static async _awaitImageLoad(image) {
        return new Promise((resolve, reject) => {
            if (image.complete && image.naturalWidth !== 0) {
                // already loaded
                resolve();
            } else {
                /** @type {EventListener} */
                let onError;
                const onLoad = () => { // eslint-disable-line require-jsdoc-except/require-jsdoc
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    resolve();
                };
                onError = () => {
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    reject('Image load error');
                };
                image.addEventListener('load', onLoad);
                image.addEventListener('error', onError);
            }
        });
    }
}
QrScanner.DEFAULT_CANVAS_SIZE = 400;
QrScanner.WORKER_PATH = '../../lib/QrScannerWorker.min.js';
/* global TRANSLATIONS */ // eslint-disable-line no-unused-vars
/* global Nimiq */

/**
 * @typedef {{[language: string]: {[id: string]: string}}} dict
 */

class I18n { // eslint-disable-line no-unused-vars
    /**
     * @param {dict} dictionary - Dictionary of all languages and phrases
     * @param {string} fallbackLanguage - Language to be used if no translation for the current language can be found
     */
    static initialize(dictionary, fallbackLanguage) {
        this._dict = dictionary;

        if (!(fallbackLanguage in this._dict)) {
            throw new Error(`Fallback language "${fallbackLanguage}" not defined`);
        }
        /** @type {string} */
        this._fallbackLanguage = fallbackLanguage;

        this.language = navigator.language;
    }

    /**
     * @param {HTMLElement} [dom] - The DOM element to be translated, or body by default
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     */
    static translateDom(dom = document.body, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;

        /* eslint-disable-next-line valid-jsdoc */ // Multi-line descriptions are not valid JSDoc, apparently
        /**
         * @param {string} tag
         * @param {(element: HTMLElement, translation: string) => void} callback - callback(element, translation) for
         * each matching element
         */
        const translateElements = (tag, callback) => {
            const attribute = `data-${tag}`;
            /** @type {NodeListOf<HTMLElement>} */
            const elements = dom.querySelectorAll(`[${attribute}]`);
            elements.forEach(element => {
                const id = element.getAttribute(attribute);
                if (!id) return;
                callback(element, this._translate(id, language));
            });
        };

        /**
         * @param {string} tag
         */
        const translateAttribute = tag => {
            translateElements(`i18n-${tag}`, (element, translation) => element.setAttribute(tag, translation));
        };

        translateElements('i18n', (element, translation) => {
            const sanitized = translation.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const withMarkup = sanitized.replace(/\[strong]/g, '<strong>').replace(/\[\/strong]/g, '</strong>');
            element.innerHTML = withMarkup;
        });
        translateAttribute('value');
        translateAttribute('placeholder');
    }

    /**
     * @param {string} id - translation dict ID
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     * @returns {string}
     */
    static translatePhrase(id, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;
        return this._translate(id, language);
    }

    /**
     * @param {string} id
     * @param {string} language
     * @returns {string}
     */
    static _translate(id, language) {
        if (!this.dictionary[language] || !this.dictionary[language][id]) {
            throw new Error(`I18n: ${language}/${id} is undefined!`);
        }
        return this.dictionary[language][id];
    }

    /**
     * @returns {string[]} ISO codes of all available languages.
     */
    static availableLanguages() {
        return Object.keys(this.dictionary);
    }

    /**
     * @param {string} language
     */
    static switchLanguage(language) {
        this.language = language;
    }

    /**
     * Selects a supported language closed to the desired language. Examples it might return:
     * en-us => en-us, en-us => en, en => en-us, fr => en.
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     * @returns {string}
     */
    static getClosestSupportedLanguage(language) {
        // If this language is supported, return it directly
        if (language in this.dictionary) return language;

        // Return the base language, if it exists in the dictionary
        const baseLanguage = language.split('-')[0];
        if (baseLanguage !== language && baseLanguage in this.dictionary) return baseLanguage;

        // Check if other versions (siblings) of the base language exist
        const languagePrefix = `${baseLanguage}-`;
        const siblingLanguage = this.availableLanguages()
            .find(supportedLanguage => supportedLanguage.startsWith(languagePrefix));

        return siblingLanguage || this.fallbackLanguage;
    }

    /**
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     */
    static set language(language) {
        const languageToUse = this.getClosestSupportedLanguage(language);

        if (languageToUse !== language) {
            // eslint-disable-next-line no-console
            console.warn(`Language ${language} not supported, using ${languageToUse} instead.`);
        }

        if (this._language !== languageToUse) {
            /** @type {string} */
            this._language = languageToUse;

            if (({ interactive: 1, complete: 1 })[document.readyState]) {
                this.translateDom();
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    this.translateDom();
                });
            }
            I18n.observer.fire(I18n.Events.LANGUAGE_CHANGED, this._language);
        }
    }

    /** @type {string} */
    static get language() {
        return this._language || this.fallbackLanguage;
    }

    /** @type {dict} */
    static get dictionary() {
        if (!this._dict) throw new Error('I18n not initialized');
        return this._dict;
    }

    /** @type {string} */
    static get fallbackLanguage() {
        if (!this._fallbackLanguage) throw new Error('I18n not initialized');
        return this._fallbackLanguage;
    }

    /** @returns {DOMParser} */
    static get parser() {
        /** @type {DOMParser} */
        this._parser = this._parser || new DOMParser();

        return this._parser;
    }
}

I18n.observer = new Nimiq.Observable();
I18n.Events = {
    LANGUAGE_CHANGED: 'language-changed',
};
const TRANSLATIONS = {
    en: {
        _language: 'English',
        loading: 'Loading...',
        continue: 'Continue',

        'passphrase-strength': 'Strength',
        'passphrase-placeholder': 'Enter passphrase',
        'passphrase-repeat-placeholder': 'Repeat passphrase',

        'privacy-warning-heading': 'Are you being watched?',
        'privacy-warning-text': 'Now is the perfect time to assess your surroundings. '
                              + 'Nearby windows? Hidden cameras? Shoulder spies? '
                              + 'Anyone with your backup phrase can access and spend your NIM.',
        'privacy-agent-continue': 'Continue',

        'recovery-words-title': 'Recovery Words',
        'recovery-words-input-label': 'Recovery Words',
        'recovery-words-input-field-placeholder': 'word #',
        'recovery-words-explanation': 'There really is no password recovery. The following words are a backup '
                                    + 'of your Key File and will grant you access to your wallet even if your '
                                    + 'Key File is lost.',
        'recovery-words-storing': 'Write those words on a piece of paper and store it at a safe, offline place.',

        'create-heading-choose-identicon': 'Choose your account avatar',
        'create-text-select-avatar': 'Select an avatar for your wallet\'s default account from the selection below.',
        'create-hint-more-accounts': 'You can add more accounts later.',
        'create-heading-keyfile': 'This is your Key File',
        'create-text-keyfile-info': 'Your Key File gives you full access to your wallet. '
                                  + 'You\'ll need it everytime you log in.',
        'create-hint-keyfile-password': 'To protect your wallet, first protect it with a password.',
        'create-heading-backup-account': 'Create a backup',
        'create-heading-validate-backup': 'Validate your backup',

        'import-heading-log-in': 'Log in',
        'import-link-no-wallet': 'Don\'t have a wallet yet?',
        'import-heading-protect': 'Protect your wallet',
        'import-text-set-password': 'You can now set a password to encrypt your wallet on this device.',

        'import-file-lost-file': 'Lost your Key File? You can recover your account with your 24 Recovery Words.',
        'import-file-button-words': 'Enter Recovery Words',
        'import-file-heading-unlock': 'Unlock your Key File',
        'import-file-text-unprotected-keyfile': 'Your Key File is unprotected.',

        'file-import-prompt': 'Drop your Key File here',
        'file-import-click-hint': 'Or click to select a file.',

        'enter-recovery-words-heading': 'Import from recovery words',
        'enter-recovery-words-subheading': 'Please enter your 24 recovery words.',

        'choose-key-type-heading': 'Choose key type',
        'choose-key-type-subheading': 'We couldn\'t determine the type of your key. Please select it below.',
        'choose-key-type-or': 'or',
        'choose-key-type-legacy-address-heading': 'Single address',
        'choose-key-type-legacy-address-info': 'Created before xx/xx/2018',
        'choose-key-type-bip39-address-heading': 'Multiple addresses',
        'choose-key-type-bip39-address-info': 'Created after xx/xx/2018',

        'sign-tx-heading': 'New Transaction',
        'sign-tx-includes': 'includes',
        'sign-tx-fee': 'fee',
        'sign-tx-youre-sending': 'You\'re sending',
        'sign-tx-to': 'to',
        'sign-tx-pay-with': 'Pay with',

        'passphrasebox-enter-passphrase': 'Enter your passphrase',
        'passphrasebox-protect-keyfile': 'Protect your keyfile with a password',
        'passphrasebox-repeat-password': 'Repeat your password',
        'passphrasebox-continue': 'Continue',
        'passphrasebox-log-in': 'Log in to your wallet',
        'passphrasebox-log-out': 'Confirm logout',
        'passphrasebox-download': 'Download key file',
        'passphrasebox-confirm-tx': 'Confirm transaction',
        'passphrasebox-password-strength-8': 'Great, that\'s a good password!',
        'passphrasebox-password-strength-10': 'Super, that\'s a strong password!',
        'passphrasebox-password-strength-12': 'Excellent, that\'s a very strong password!',
        'passphrasebox-password-hint': 'Your password should have at least 8 characters.',
        'passphrasebox-password-skip': 'Skip password protection for now',

        'identicon-selector-loading': 'Mixing colors',
        'identicon-selector-button-select': 'Select',
        'identicon-selector-link-back': 'Back',

        'downloadkeyfile-heading-protected': 'Your Key File is protected!',
        'downloadkeyfile-heading-unprotected': 'Your Key File is not protected!',
        'downloadkeyfile-safe-place': 'Store it in a safe place. If you lose it, it cannot be recovered!',
        'downloadkeyfile-download': 'Download Key File',
        'downloadkeyfile-download-anyway': 'Download anyway',

        'validate-words-text': 'Please select the correct word from your list of recovery words.',
        'validate-words-back': 'Back to words',
        'validate-words-skip': 'Skip validation for now',
    },
    de: {
        _language: 'Deutsch',
        loading: 'Wird geladen...',
        continue: 'Weiter',

        'passphrase-strength': 'Stärke',
        'passphrase-placeholder': 'Passphrase eingeben',
        'passphrase-repeat-placeholder': 'Passphrase wiederholen',

        'privacy-warning-heading': 'Wirst du beobachtet?',
        'privacy-warning-text': 'Jetzt ist eine gute Zeit um sich umzuschauen. Gibt es Fenster in der Nähe? '
                              + 'Versteckte Kameras? Jemand der über deine Schulter schaut? '
                              + 'Jeder der deine Wiederherstellungswörter hat, kann auf deine NIM zugreifen '
                              + 'und sie ausgeben.',
        'privacy-agent-continue': 'Weiter',

        'recovery-words-title': 'Wiederherstellungswörter',
        'recovery-words-input-label': 'Wiederherstellungswörter',
        'recovery-words-input-field-placeholder': 'Wort ',
        'recovery-words-explanation': 'Es gibt wirklich keine Password-Wiederherstellung. Die folgenden Wörter '
                                    + 'sind ein Backup von deiner Schlüsseldatei und werden dir Zugang zu deiner '
                                    + 'Wallet gewähren, auch wenn deine Schlüsseldatei verloren ist.',
        'recovery-words-storing': 'Schreibe diese Wörter auf ein Stück Papier und verwahre es an einem sicheren, '
                                + 'analogen Ort.',

        'create-heading-choose-identicon': 'Wähle deinen Konto Avatar',
        'create-text-select-avatar': 'Wähle einen Avatar für den Standard-Account deiner Wallet aus der Auswahl unten.',
        'create-hint-more-accounts': 'Neue Konten kannst du später hinzufügen.',
        'create-heading-keyfile': 'Das ist deine Wallet Datei',
        'create-text-keyfile-info': 'Deine Wallet Datei gibt dir vollen Zugang zu deiner Wallet. '
                                  + 'Du brauchst sie jedesmal wenn du dich einloggst.',
        'create-hint-keyfile-password': 'Um deine Wallet zu schützen, schütze es mit einem Passwort.',
        'create-heading-backup-account': 'Erstelle ein Backup',
        'create-heading-validate-backup': 'Überprüfe dein Backup',

        'import-heading-log-in': 'Einloggen',
        'import-link-no-wallet': 'Du hast noch keine Wallet?',
        'import-heading-protect': 'Wallet verschlüsseln',
        'import-text-set-password': 'Du kannst jetzt ein Passwort eingeben, um deine Wallet auf diesem '
                                  + 'Gerät zu verschlüsseln.',

        'import-file-lost-file': 'Schlüsseldatei verloren? Du kannst deinen Account mit deinen 24 '
                               + 'Wiederherstellungswörtern wiederherstellen',
        'import-file-button-words': 'Wiederherstellungswörter eingeben',
        'import-file-heading-unlock': 'Entsperre deine Schlüsseldatei',
        'import-file-text-unprotected-keyfile': 'Deine Schlüsseldatei ist ungeschützt.',

        'file-import-prompt': 'Ziehe deine Schlüsseldatei auf dieses Feld',
        'file-import-click-hint': 'Oder klicke um eine Datei auszuwählen.',

        'enter-recovery-words-heading': 'Mit Wiederherstellungswörtern importieren',
        'enter-recovery-words-subheading': 'Bitte gib deine 24 Wiederherstellungswörter ein.',

        'choose-key-type-heading': 'Schlüsseltyp wählen',
        'choose-key-type-subheading': 'Wir konnten den Typ deines Schlüssels nicht automatisch ermitteln. '
                                    + 'Bitte wähle ihn unten aus.',
        'choose-key-type-or': 'oder',
        'choose-key-type-legacy-address-heading': 'Einzelne Adresse',
        'choose-key-type-legacy-address-info': 'Erstellt vor xx.xx.2018',
        'choose-key-type-bip39-address-heading': 'Mehrere Adressen',
        'choose-key-type-bip39-address-info': 'Erstellt nach xx.xx.2018',

        'sign-tx-heading': 'Neue Überweisung',
        'sign-tx-includes': 'inklusive',
        'sign-tx-fee': 'Gebühr',
        'sign-tx-youre-sending': 'Du sendest',
        'sign-tx-to': 'an',
        'sign-tx-pay-with': 'Zahle mit',

        'passphrasebox-enter-passphrase': 'Gib deine Passphrase ein',
        'passphrasebox-protect-keyfile': 'Sichere dein KeyFile mit einem Passwort',
        'passphrasebox-repeat-password': 'Wiederhole dein Passwort',
        'passphrasebox-continue': 'Weiter',
        'passphrasebox-log-in': 'In deine Wallet einloggen',
        'passphrasebox-log-out': 'Abmeldung bestätigen',
        'passphrasebox-download': 'KeyFile herunterladen',
        'passphrasebox-confirm-tx': 'Überweisung bestätigen',
        'passphrasebox-password-strength-8': 'Schön, das ist ein gutes Passwort!',
        'passphrasebox-password-strength-10': 'Super, das ist ein starkes Passwort!',
        'passphrasebox-password-strength-12': 'Exzellent, das ist ein sehr starkes Passwort!',
        'passphrasebox-password-hint': 'Dein Passwort muss mindestens 8 Zeichen haben.',
        'passphrasebox-password-skip': 'Passwortschutz erstmal überspringen',

        'identicon-selector-loading': 'Mische Farben',
        'identicon-selector-button-select': 'Auswählen',
        'identicon-selector-link-back': 'Zurück',

        'downloadkeyfile-heading-protected': 'Dein Schlüsseldatei ist geschützt!',
        'downloadkeyfile-heading-unprotected': 'Dein Schlüsseldatei ist nicht geschützt!',
        'downloadkeyfile-safe-place': 'Lagere sie in einem sicheren Ort. Wenn du sie verlierst, '
                                    + 'kann sie nicht wiederhergestellt werden!',
        'downloadkeyfile-download': 'Schlüsseldatei herunterladen',
        'downloadkeyfile-download-anyway': 'Trotzdem herunterladen',

        'validate-words-text': 'Bitte wähle das richtige Wort aus deiner Liste von Wiederherstellungswörtern aus.',
        'validate-words-back': 'Zurück zu den Wörtern',
        'validate-words-skip': 'Überprüfung erstmal überspringen',
    },
};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
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
/* global Nimiq */
/* global AnimationUtils */
/* global QrScanner */
/* global I18n */

class FileImport extends Nimiq.Observable {
    /**
     * @param {HTMLDivElement} [$el]
     */
    constructor($el) {
        super();
        this.$el = FileImport._createElement($el);

        /** @type {HTMLElement} */
        this.$errorMessage = (this.$el.querySelector('.error-message'));
        /** @type {HTMLInputElement} */
        this.$fileInput = (this.$el.querySelector('input'));

        // TODO Re-add the drop target interaction and event listeners?

        this.$el.addEventListener('click', this._openFileInput.bind(this));
        this.$fileInput.addEventListener('change', this._onFileSelected.bind(this));
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('file-import');

        $el.innerHTML = `
            <h3 data-i18n="file-import-prompt">Drop your Key File here</h3>
            <span class="click-hint" data-i18n="file-import-click-hint">Or click to select a file.</span>
            <span class="error-message"></span>
            <input type="file" accept="image/*">
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @returns {HTMLElement}
     */
    getElement() {
        return this.$el;
    }

    _openFileInput() {
        this.$fileInput.click();
    }

    /**
     * @param {DOMEvent} event
     */
    _onFileSelected(event) {
        this.$errorMessage.textContent = '';
        // @ts-ignore
        const files = event.target.files;
        this._readFile(files[0]);
        this.$fileInput.value = '';
    }

    _onQrError() {
        AnimationUtils.animate('shake', this.$el);
        this.$errorMessage.textContent = 'Could not read Key File.';
    }

    /**
     * @param {File} file
     */
    async _readFile(file) {
        // TODO Add WalletBackup to keyguard-next code base
        // const qrPosition = WalletBackup.calculateQrPosition();
        const qrPosition = {
            x: 156,
            y: 548.6886,
            width: 173.4,
            height: 173.4,
            size: 185.4,
            padding: 12,
        };

        try {
            const decoded = await QrScanner.scanImage(file, qrPosition, null, null, false, true);
            this.fire(FileImport.Events.IMPORT, decoded);
        } catch (e) {
            this._onQrError();
        }
    }
}

FileImport.Events = {
    IMPORT: 'import',
};
/* global Nimiq */
/* global AnimationUtils */
/* global I18n */

class PassphraseInput extends Nimiq.Observable {
    /**
     * @param {?HTMLElement} $el
     * @param {string} placeholder
     * @param {boolean} [showStrengthIndicator]
     */
    constructor($el, placeholder = '••••••••', showStrengthIndicator = false) {
        super();
        this._minLength = PassphraseInput.DEFAULT_MIN_LENGTH;
        this._showStrengthIndicator = showStrengthIndicator;
        this.$el = PassphraseInput._createElement($el);
        this.$inputContainer = /** @type {HTMLElement} */ (this.$el.querySelector('.input-container'));
        this.$input = /** @type {HTMLInputElement} */ (this.$el.querySelector('input.password'));
        this.$eyeButton = /** @type {HTMLElement} */ (this.$el.querySelector('.eye-button'));

        /** @type {HTMLElement} */
        this.$strengthIndicator = (this.$el.querySelector('.strength-indicator'));
        /** @type {HTMLElement} */
        this.$strengthIndicatorContainer = (this.$el.querySelector('.strength-indicator-container'));
        if (!showStrengthIndicator) {
            this.$strengthIndicatorContainer.style.display = 'none';
        }

        this.$input.placeholder = placeholder;

        this.$eyeButton.addEventListener('click', () => this._changeVisibility());

        this._onInputChanged();
        this.$input.addEventListener('input', () => this._onInputChanged());
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-input');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <div class="input-container">
                <input class="password" type="password" placeholder="Enter Passphrase">
                <span class="eye-button icon-eye"/>
            </div>
            <div class="strength-indicator-container">
                <div class="label"><span data-i18n="passphrase-strength">Strength</span>:</div>
                <meter max="130" low="10" optimum="100" class="strength-indicator"></meter>
            </div>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    /** @type {HTMLInputElement} */
    get input() {
        return this.$input;
    }

    focus() {
        this.$input.focus();
    }

    reset() {
        this.$input.value = '';
        this._changeVisibility(false);
        this._onInputChanged();
    }

    async onPassphraseIncorrect() {
        await AnimationUtils.animate('shake', this.$inputContainer);
        this.reset();
    }

    /** @param {boolean} [becomeVisible] */
    _changeVisibility(becomeVisible) {
        becomeVisible = typeof becomeVisible !== 'undefined'
            ? becomeVisible
            : this.$input.getAttribute('type') === 'password';
        this.$input.setAttribute('type', becomeVisible ? 'text' : 'password');
        this.$eyeButton.classList.toggle('icon-eye-off', becomeVisible);
        this.$eyeButton.classList.toggle('icon-eye', !becomeVisible);
        this.$input.focus();
    }

    _onInputChanged() {
        const passphraseLength = this.$input.value.length;
        this._updateStrengthIndicator();
        this.valid = passphraseLength >= this._minLength;

        this.fire(PassphraseInput.Events.VALID, this.valid);
    }

    _updateStrengthIndicator() {
        const passphraseLength = this.$input.value.length;
        let strengthIndicatorValue;
        if (passphraseLength === 0) {
            strengthIndicatorValue = 0;
        } else if (passphraseLength < 7) {
            strengthIndicatorValue = 10;
        } else if (passphraseLength < 10) {
            strengthIndicatorValue = 70;
        } else if (passphraseLength < 14) {
            strengthIndicatorValue = 100;
        } else {
            strengthIndicatorValue = 130;
        }
        this.$strengthIndicator.setAttribute('value', String(strengthIndicatorValue));
    }

    /**
     * @returns {string}
     */
    get text() {
        return this.$input.value;
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._minLength = minLength || PassphraseInput.DEFAULT_MIN_LENGTH;
    }
}

PassphraseInput.Events = {
    VALID: 'passphraseinput-valid',
};

PassphraseInput.DEFAULT_MIN_LENGTH = 8;
/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
            hideInput: false, // TODO: When a key is not encrypted, no passphrase is required
            buttonI18nTag: 'passphrasebox-confirm-tx',
        };

        super();

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.cancel')).addEventListener('click', () => this._onCancel());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'center', options.bgColor);

        // To enable i18n validation with the dynamic nature of the passphrase box's contents,
        // all possible i18n tags and texts have to be specified here in the below format to
        // enable the validator to find them with its regular expression.
        /* eslint-disable max-len */
        const buttonVersions = {
            'passphrasebox-continue': '<button class="submit" data-i18n="passphrasebox-continue">Continue</button>',
            'passphrasebox-log-in': '<button class="submit" data-i18n="passphrasebox-log-in">Log in to your wallet</button>',
            'passphrasebox-log-out': '<button class="submit" data-i18n="passphrasebox-log-out">Confirm logout</button>',
            'passphrasebox-confirm-tx': '<button class="submit" data-i18n="passphrasebox-confirm-tx">Confirm transaction</button>',
        };
        /* eslint-enable max-len */

        if (!buttonVersions[options.buttonI18nTag]) throw new Error('PassphraseBox button i18n tag not defined');

        $el.innerHTML = `
            <a class="cancel icon-cancel"></a>
            <h2 class="prompt" data-i18n="passphrasebox-enter-passphrase">Enter your passphrase</h2>
            <div passphrase-input></div>
            ${buttonVersions[options.buttonI18nTag]}
        `;

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this._passphraseInput.focus();
    }

    reset() {
        this._passphraseInput.reset();
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._passphraseInput.setMinLength(minLength);
    }

    /**
     * @returns {Promise<void>}
     */
    async onPassphraseIncorrect() {
        return this._passphraseInput.onPassphraseIncorrect();
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();
        this.fire(PassphraseBox.Events.SUBMIT, this._passphraseInput.text);
    }

    _onCancel() {
        this.fire(PassphraseBox.Events.CANCEL);
    }
}

PassphraseBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    CANCEL: 'passphrasebox-cancel',
};
/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseSetterBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
        };

        super();

        this._password = '';

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseSetterBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.password-skip')).addEventListener('click', () => this._onSkip());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'setter', 'center', options.bgColor);

        /* eslint-disable max-len */
        $el.innerHTML = `
            <h2 class="prompt protect" data-i18n="passphrasebox-protect-keyfile">Protect your keyfile with a password</h2>
            <h2 class="prompt repeat" data-i18n="passphrasebox-repeat-password">Repeat your password</h2>

            <div passphrase-input></div>

            <div class="password-strength strength-8"  data-i18n="passphrasebox-password-strength-8" >Great, that's a good password!</div>
            <div class="password-strength strength-10" data-i18n="passphrasebox-password-strength-10">Super, that's a strong password!</div>
            <div class="password-strength strength-12" data-i18n="passphrasebox-password-strength-12">Excellent, that's a very strong password!</div>

            <div class="password-hint" data-i18n="passphrasebox-password-hint">Your password should have at least 8 characters.</div>
            <a tabindex="0" class="password-skip" data-i18n="passphrasebox-password-skip">Skip password protection for now</a>

            <button class="submit" data-i18n="passphrasebox-continue">Continue</button>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this._passphraseInput.focus();
    }

    /**
     * @param {boolean} [isWrongPassphrase]
     */
    async reset(isWrongPassphrase) {
        this._password = '';

        if (isWrongPassphrase) await this._passphraseInput.onPassphraseIncorrect();
        else this._passphraseInput.reset();

        this.$el.classList.remove('repeat');
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);

        const length = this._passphraseInput.text.length;
        this.$el.classList.toggle('strength-8', length < 10);
        this.$el.classList.toggle('strength-10', length >= 10 && length < 12);
        this.$el.classList.toggle('strength-12', length >= 12);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();

        if (!this._password) {
            this._password = this._passphraseInput.text;
            this._passphraseInput.reset();
            this.$el.classList.add('repeat');
        } else if (this._password !== this._passphraseInput.text) {
            this.reset(true);
        } else {
            this.fire(PassphraseSetterBox.Events.SUBMIT, this._password);
            this.reset();
        }
    }

    _onSkip() {
        this.fire(PassphraseSetterBox.Events.SKIP);
    }
}

PassphraseSetterBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    SKIP: 'passphrasebox-skip',
};
/* global BrowserDetection */
/* global KeyStore */
/* global CookieJar */
/* global I18n */

/**
 * A common parent class for pop-up requests.
 *
 * Usage:
 * Inherit this class in your popup request API class:
 * ```
 *  class SignTransactionApi extends TopLevelApi {
 *
 *      // Define the onRequest method to receive the client's request object:
 *      onRequest(request) {
 *          // do something...
 *
 *          // When done, call this.resolve() with the result object
 *          this.resolve(result);
 *
 *          // Or this.reject() with an error
 *          this.reject(error);
 *      }
 *  }
 *
 *  // Finally, start your API:
 *  runKeyguard(SignTransactionApi);
 * ```
 */
class TopLevelApi { // eslint-disable-line no-unused-vars
    constructor() {
        if (window.self !== window.top) {
            // PopupAPI may not run in a frame
            throw new Error('Illegal use');
        }

        /** @type {Function} */
        this._resolve = () => { throw new Error('Method not defined'); };

        /** @type {Function} */
        this._reject = () => { throw new Error('Method not defined'); };

        I18n.initialize(window.TRANSLATIONS, 'en');
        I18n.translateDom();

        window.addEventListener('beforeunload', () => {
            this.reject(new Error('Keyguard popup closed'));
        });
    }

    /**
     * Method to be called by the Keyguard client via RPC
     *
     * @param {KeyguardRequest} request
     */
    async request(request) {
        /**
         * Detect migrate signalling set by the iframe
         *
         * @deprecated Only for database migration
         */
        if ((BrowserDetection.isIos() || BrowserDetection.isSafari()) && this._hasMigrateFlag()) {
            await KeyStore.instance.migrateAccountsToKeys();
        }

        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;

            this.onRequest(request).catch(reject);
        });
    }

    /**
     * Overwritten by each request's API class
     *
     * @param {KeyguardRequest} request
     * @abstract
     */
    async onRequest(request) { // eslint-disable-line no-unused-vars
        throw new Error('Not implemented');
    }

    /**
     * Called by a page's API class on success
     *
     * @param {*} result
     * @returns {Promise<void>}
     */
    async resolve(result) {
        // Keys might have changed, so update cookie for iOS and Safari users
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            const keys = await KeyStore.instance.list();
            CookieJar.fill(keys);
        }

        this._resolve(result);
    }

    /**
     * Called by a page's API class on error
     *
     * @param {Error} error
     */
    reject(error) {
        this._reject(error);
    }

    /**
     * @deprecated Only for database migration
     * @returns {boolean}
     */
    _hasMigrateFlag() {
        const match = document.cookie.match(new RegExp('migrate=([^;]+)'));
        return !!match && match[1] === '1';
    }
}
/* global TopLevelApi */
/* global FileImport */
/* global PassphraseBox */
/* global PassphraseSetterBox */
/* global Nimiq */
/* global Key */
/* global KeyStore */

class ImportFileApi extends TopLevelApi {
    constructor() {
        super();

        this._encryptedKey = new Nimiq.SerialBuffer(0);
        this._keyType = Key.Type.BIP39;

        // Start UI
        const dom = this._makeView();
        this._passphraseBox = dom.passphraseBox;
        this._passphraseSetterBox = dom.passphraseSetterBox;

        this.$loading = /** @type {HTMLDivElement} */ (document.querySelector('#loading'));
    }

    /**
     * @param {ImportRequest} request
     */
    async onRequest(request) {
        this._request = request;

        // Global cancel link
        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());

        this.run();
    }

    /**
     * @returns {{passphraseBox: PassphraseBox, passphraseSetterBox: PassphraseSetterBox}}
     */
    _makeView() {
        // Containers
        /** @type {HTMLDivElement} */
        const $fileImport = (document.querySelector('.file-import'));
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('.passphrase-box'));
        /** @type {HTMLFormElement} */
        const $passphraseSetterBox = (document.querySelector('.passphrase-setter-box'));

        // Components
        const fileImport = new FileImport($fileImport);
        const passphraseBox = new PassphraseBox($passphraseBox, { buttonI18nTag: 'passphrasebox-log-in' });
        const passphraseSetterBox = new PassphraseSetterBox($passphraseSetterBox);

        // Events
        fileImport.on(FileImport.Events.IMPORT, this._onFileImported.bind(this));
        passphraseBox.on(PassphraseBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());
        passphraseSetterBox.on(PassphraseSetterBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseSetterBox.on(PassphraseSetterBox.Events.SKIP, () => this._onPassphraseEntered(null));

        return {
            passphraseBox,
            passphraseSetterBox,
        };
    }

    /**
     * Determine key type and forward user to Passphrase input
     *
     * @param {string} encryptedKeyBase64 - Encrypted KeyPair in base64 format
     */
    _onFileImported(encryptedKeyBase64) {
        if (encryptedKeyBase64.substr(0, 2) === '#3') {
            // BIP39 Key File
            this._keyType = Key.Type.BIP39;

            this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
            this._passphraseBox.setMinLength();

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) this._goToEnterPassphrase();
            else this._goToSetPassphrase();
        } else {
            // Legacy Account Access File
            this._keyType = Key.Type.LEGACY;

            if (encryptedKeyBase64.substr(0, 2) === '#2') {
                // PIN-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
                this._passphraseBox.setMinLength(6);
            } else {
                // Passphrase-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64);
                this._passphraseBox.setMinLength(8);
            }

            this._goToEnterPassphrase();
        }
    }

    run() {
        window.location.hash = ImportFileApi.Pages.FILE_IMPORT;

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {string?} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        const key = await this._decryptAndStoreKey(passphrase);
        if (!key) {
            this._passphraseBox.onPassphraseIncorrect();
            return;
        }

        /** @type {{keyPath: string, address: Uint8Array}[]} */
        const addresses = [];

        if (key.type === Key.Type.LEGACY) {
            const address = key.deriveAddress('');
            addresses.push({
                keyPath: 'm/0\'',
                address: address.serialize(),
            });
        } else if (key.type === Key.Type.BIP39) {
            /** @type {ImportRequest} */
            (this._request).requestedKeyPaths.forEach(keyPath => {
                addresses.push({
                    keyPath,
                    address: key.deriveAddress(keyPath).serialize(),
                });
            });
        } else {
            throw new Error(`Unkown key type ${key.type}`);
        }

        /** @type {ImportResult} */
        const result = {
            keyId: key.id,
            keyType: key.type,
            addresses,
        };

        this.resolve(result);
    }

    /**
     * @param {string?} passphrase
     * @returns {Promise<?Key>}
     */
    async _decryptAndStoreKey(passphrase) {
        this.$loading.style.display = 'flex';
        try {
            // Separating the processing of the encryptionKey (password) and the secret (key) is necessary
            // to cover these scenarios:
            //     1. Encrypted key file with password or PIN
            //     2. Unencrypted key file and no new password set
            //     3. Unencrypted key file and new password set

            let secret = new Uint8Array(0);
            let encryptionKey = null;

            if (passphrase !== null) {
                // TODO Support for UTF-8 passwords
                encryptionKey = Nimiq.BufferUtils.fromAscii(passphrase);
            }

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) {
                secret = await Nimiq.CryptoUtils.decryptOtpKdf(
                    this._encryptedKey,
                    /** @type {Uint8Array} */ (encryptionKey),
                );
            } else {
                // Key File was not encrypted and the imported Uint8Array is the plain secret
                secret = this._encryptedKey;
            }

            const key = new Key(secret, this._keyType);
            await KeyStore.instance.put(key, encryptionKey || undefined);

            return key;
        } catch (e) {
            this.$loading.style.display = 'none';
            return null;
        }
    }

    _goToEnterPassphrase() {
        window.location.hash = ImportFileApi.Pages.ENTER_PASSPHRASE;
        this._passphraseBox.reset();
        this._passphraseBox.focus();
    }

    _goToSetPassphrase() {
        window.location.hash = ImportFileApi.Pages.SET_PASSPHRASE;
        this._passphraseSetterBox.reset();
        this._passphraseSetterBox.focus();
    }
}

ImportFileApi.Pages = {
    FILE_IMPORT: 'file-import',
    ENTER_PASSPHRASE: 'enter-passphrase',
    SET_PASSPHRASE: 'set-passphrase',
};
/* global runKeyguard */
/* global ImportFileApi */

runKeyguard(ImportFileApi);
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
class AnimationUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {string} className
     * @param {HTMLElement} el
     * @param {Function} [afterStartCallback]
     * @param {Function} [beforeEndCallback]
     */
    static async animate(className, el, afterStartCallback, beforeEndCallback) {
        return new Promise(resolve => {
            // 'animiationend' is a native DOM event that fires upon CSS animation completion
            /** @param {Event} e */
            const listener = e => {
                if (e.target !== el) return;
                if (beforeEndCallback instanceof Function) beforeEndCallback();
                this.stopAnimate(className, el);
                el.removeEventListener('animationend', listener);
                resolve();
            };
            el.addEventListener('animationend', listener);
            el.classList.add(className);
            if (afterStartCallback instanceof Function) afterStartCallback();
        });
    }

    /**
     * @param {string} className
     * @param {HTMLElement} el
     */
    static stopAnimate(className, el) {
        el.classList.remove(className);
    }
}
/* eslint-disable prefer-promise-reject-errors, no-throw-literal */

// eslint-disable-next-line max-len
/** @typedef {HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | File} imageOrFileOrUrl */

class QrScanner {
    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {HTMLVideoElement} video
     * @param {((value: string) => string | PromiseLike<string>)} [onDecode]
     * @param {number} [canvasSize] - Edge length of the quadratic canvas
     */
    constructor(video, onDecode, canvasSize = QrScanner.DEFAULT_CANVAS_SIZE) {
        this.$video = video;
        this.$canvas = document.createElement('canvas');
        this._onDecode = onDecode;
        this._active = false;

        this.$canvas.width = canvasSize;
        this.$canvas.height = canvasSize;
        this._sourceRect = {
            x: 0,
            y: 0,
            width: canvasSize,
            height: canvasSize,
        };

        this.$video.addEventListener('canplay', () => this._updateSourceRect());
        this.$video.addEventListener('play', () => {
            this._updateSourceRect();
            this._scanFrame();
        }, false);
        this._qrWorker = new Worker(QrScanner.WORKER_PATH);
    }

    _updateSourceRect() {
        const smallestDimension = Math.min(this.$video.videoWidth, this.$video.videoHeight);
        const sourceRectSize = Math.round(2 / 3 * smallestDimension);
        this._sourceRect.width = sourceRectSize;
        this._sourceRect.height = sourceRectSize;
        this._sourceRect.x = (this.$video.videoWidth - sourceRectSize) / 2;
        this._sourceRect.y = (this.$video.videoHeight - sourceRectSize) / 2;
    }

    /**
     * Triggers this._onDecode for each frame, calls itself recursively until the video is paused or ends
     *
     * @returns {boolean}
     */
    _scanFrame() {
        if (this.$video.paused || this.$video.ended) return false;
        requestAnimationFrame(() => {
            QrScanner.scanImage(this.$video, this._sourceRect, this._qrWorker, this.$canvas, true)
                .then(this._onDecode, /** @param {string} error */ error => {
                    if (error !== 'QR code not found.') {
                        console.error(error);
                    }
                })
                .then(() => this._scanFrame());
        });

        return true;
    }

    /**
     * @param {string | object} [facingMode]
     * @param {boolean} [exact]
     * @returns {Promise<MediaStream>}
     */
    _getCameraStream(facingMode, exact = false) {
        const constraintsToTry = [{
            width: { min: 1024 },
        }, {
            width: { min: 768 },
        }, {}];

        if (facingMode) {
            if (exact) {
                facingMode = { exact: facingMode };
            }
            constraintsToTry.forEach(constraint => { constraint.facingMode = facingMode; });
        }
        return this._getMatchingCameraStream(constraintsToTry);
    }

    /**
     * @param {Array} constraintsToTry
     * @returns {Promise<MediaStream>}
     */
    async _getMatchingCameraStream(constraintsToTry) {
        if (constraintsToTry.length === 0) {
            return Promise.reject('Camera not found.');
        }
        return navigator.mediaDevices.getUserMedia({
            video: constraintsToTry.shift(),
        }).catch(() => this._getMatchingCameraStream(constraintsToTry));
    }

    start() {
        if (this._active) {
            return Promise.resolve();
        }
        this._active = true;
        clearTimeout(/** @type {number | undefined} */ (this._offTimeout));
        let facingMode = 'environment';
        return this._getCameraStream('environment', true)
            .catch(() => {
                // we (probably) don't have an environment camera
                facingMode = 'user';
                return this._getCameraStream(); // throws if we can't access the camera
            })
            .then(stream => {
                this.$video.srcObject = stream;
                this._setVideoMirror(facingMode);
            })
            .catch(e => {
                this._active = false;
                throw e;
            });
    }

    stop() {
        if (!this._active) {
            return;
        }
        this._active = false;
        this.$video.pause();
        this._offTimeout = (setTimeout(() => {
            // @ts-ignore
            this.$video.srcObject.getTracks()[0].stop();
            this.$video.srcObject = null;
        }, 3000));
    }

    /**
     * @param {string} facingMode
     */
    _setVideoMirror(facingMode) {
        // in user facing mode mirror the video to make it easier for the user to position the QR code
        const scaleFactor = facingMode === 'user' ? -1 : 1;
        this.$video.style.transform = `scaleX(${scaleFactor})`;
    }

    /**
     * @param {number} red
     * @param {number} green
     * @param {number} blue
     */
    setGrayscaleWeights(red, green, blue) {
        this._qrWorker.postMessage({
            type: 'grayscaleWeights',
            data: { red, green, blue },
        });
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @param {object?} sourceRect
     * @param {Worker?} worker
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @param {boolean} [alsoTryWithoutSourceRect]
     * @returns {Promise<string>}
     */
    static async scanImage(imageOrFileOrUrl, sourceRect = null, worker = null, canvas = null, fixedCanvasSize = false,
        alsoTryWithoutSourceRect = false) {
        const promise = new Promise((resolve, reject) => {
            worker = worker || new Worker(QrScanner.WORKER_PATH);
            /** @type {number | undefined} */
            let timeout;
            /** @type {EventListener} */
            let onError;
            /**
             * @param {Event} event
             */
            const onMessage = event => {
                // @ts-ignore
                if (event.data.type !== 'qrResult') {
                    return;
                }
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                // @ts-ignore
                if (event.data.data !== null) {
                    // @ts-ignore
                    resolve(event.data.data);
                } else {
                    reject('QR code not found.');
                }
            };
            onError = () => {
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                reject('Worker error.');
            };
            worker.addEventListener('message', onMessage);
            worker.addEventListener('error', onError);
            timeout = setTimeout(onError, 3000);
            QrScanner._loadImage(imageOrFileOrUrl).then(image => {
                const imageData = QrScanner._getImageData(image, sourceRect, canvas, fixedCanvasSize);
                /** @type {Worker} */ (worker).postMessage({
                    type: 'decode',
                    data: imageData,
                }, [imageData.data.buffer]);
            }).catch(reject);
        });

        if (sourceRect && alsoTryWithoutSourceRect) {
            return promise.catch(() => QrScanner.scanImage(imageOrFileOrUrl, null, worker, canvas, fixedCanvasSize));
        }
        return promise;
    }


    /**
     * @param {HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap} image
     * @param {object?} sourceRect
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @returns {ImageData}
     */
    static _getImageData(image, sourceRect = null, canvas = null, fixedCanvasSize = false) {
        canvas = canvas || document.createElement('canvas');
        const sourceRectX = sourceRect && sourceRect.x ? sourceRect.x : 0;
        const sourceRectY = sourceRect && sourceRect.y ? sourceRect.y : 0;
        // @ts-ignore
        const sourceRectWidth = sourceRect && sourceRect.width ? sourceRect.width : image.width || image.videoWidth;
        const sourceRectHeight = sourceRect && sourceRect.height
            ? sourceRect.height
            : image.height
            // @ts-ignore
            || image.videoHeight;
        if (!fixedCanvasSize && (canvas.width !== sourceRectWidth || canvas.height !== sourceRectHeight)) {
            canvas.width = sourceRectWidth;
            canvas.height = sourceRectHeight;
        }
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw ('Cannot get canvas 2D context');
        context.imageSmoothingEnabled = false; // gives less blurry images
        context.drawImage(
            image,
            sourceRectX,
            sourceRectY,
            sourceRectWidth,
            sourceRectHeight,
            0,
            0,
            canvas.width,
            canvas.height,
        );
        return context.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @returns {Promise<HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap>}
     */
    static async _loadImage(imageOrFileOrUrl) {
        if (imageOrFileOrUrl instanceof HTMLCanvasElement
            || imageOrFileOrUrl instanceof HTMLVideoElement
            // @ts-ignore
            || (window.ImageBitmap && imageOrFileOrUrl instanceof window.ImageBitmap)
        ) {
            // @ts-ignore
            return Promise.resolve(imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof Image) {
            return QrScanner._awaitImageLoad(imageOrFileOrUrl).then(() => imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof File || imageOrFileOrUrl instanceof URL
            || typeof (imageOrFileOrUrl) === 'string') {
            const image = new Image();
            if (imageOrFileOrUrl instanceof File) {
                image.src = URL.createObjectURL(imageOrFileOrUrl);
            } else {
                // @ts-ignore
                image.src = imageOrFileOrUrl;
            }
            return QrScanner._awaitImageLoad(image).then(() => {
                if (imageOrFileOrUrl instanceof File) {
                    URL.revokeObjectURL(image.src);
                }
                return image;
            });
        }
        return Promise.reject('Unsupported image type.');
    }

    /**
     * @param {HTMLImageElement} image
     */
    static async _awaitImageLoad(image) {
        return new Promise((resolve, reject) => {
            if (image.complete && image.naturalWidth !== 0) {
                // already loaded
                resolve();
            } else {
                /** @type {EventListener} */
                let onError;
                const onLoad = () => { // eslint-disable-line require-jsdoc-except/require-jsdoc
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    resolve();
                };
                onError = () => {
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    reject('Image load error');
                };
                image.addEventListener('load', onLoad);
                image.addEventListener('error', onError);
            }
        });
    }
}
QrScanner.DEFAULT_CANVAS_SIZE = 400;
QrScanner.WORKER_PATH = '../../lib/QrScannerWorker.min.js';
/* global TRANSLATIONS */ // eslint-disable-line no-unused-vars
/* global Nimiq */

/**
 * @typedef {{[language: string]: {[id: string]: string}}} dict
 */

class I18n { // eslint-disable-line no-unused-vars
    /**
     * @param {dict} dictionary - Dictionary of all languages and phrases
     * @param {string} fallbackLanguage - Language to be used if no translation for the current language can be found
     */
    static initialize(dictionary, fallbackLanguage) {
        this._dict = dictionary;

        if (!(fallbackLanguage in this._dict)) {
            throw new Error(`Fallback language "${fallbackLanguage}" not defined`);
        }
        /** @type {string} */
        this._fallbackLanguage = fallbackLanguage;

        this.language = navigator.language;
    }

    /**
     * @param {HTMLElement} [dom] - The DOM element to be translated, or body by default
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     */
    static translateDom(dom = document.body, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;

        /* eslint-disable-next-line valid-jsdoc */ // Multi-line descriptions are not valid JSDoc, apparently
        /**
         * @param {string} tag
         * @param {(element: HTMLElement, translation: string) => void} callback - callback(element, translation) for
         * each matching element
         */
        const translateElements = (tag, callback) => {
            const attribute = `data-${tag}`;
            /** @type {NodeListOf<HTMLElement>} */
            const elements = dom.querySelectorAll(`[${attribute}]`);
            elements.forEach(element => {
                const id = element.getAttribute(attribute);
                if (!id) return;
                callback(element, this._translate(id, language));
            });
        };

        /**
         * @param {string} tag
         */
        const translateAttribute = tag => {
            translateElements(`i18n-${tag}`, (element, translation) => element.setAttribute(tag, translation));
        };

        translateElements('i18n', (element, translation) => {
            const sanitized = translation.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const withMarkup = sanitized.replace(/\[strong]/g, '<strong>').replace(/\[\/strong]/g, '</strong>');
            element.innerHTML = withMarkup;
        });
        translateAttribute('value');
        translateAttribute('placeholder');
    }

    /**
     * @param {string} id - translation dict ID
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     * @returns {string}
     */
    static translatePhrase(id, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;
        return this._translate(id, language);
    }

    /**
     * @param {string} id
     * @param {string} language
     * @returns {string}
     */
    static _translate(id, language) {
        if (!this.dictionary[language] || !this.dictionary[language][id]) {
            throw new Error(`I18n: ${language}/${id} is undefined!`);
        }
        return this.dictionary[language][id];
    }

    /**
     * @returns {string[]} ISO codes of all available languages.
     */
    static availableLanguages() {
        return Object.keys(this.dictionary);
    }

    /**
     * @param {string} language
     */
    static switchLanguage(language) {
        this.language = language;
    }

    /**
     * Selects a supported language closed to the desired language. Examples it might return:
     * en-us => en-us, en-us => en, en => en-us, fr => en.
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     * @returns {string}
     */
    static getClosestSupportedLanguage(language) {
        // If this language is supported, return it directly
        if (language in this.dictionary) return language;

        // Return the base language, if it exists in the dictionary
        const baseLanguage = language.split('-')[0];
        if (baseLanguage !== language && baseLanguage in this.dictionary) return baseLanguage;

        // Check if other versions (siblings) of the base language exist
        const languagePrefix = `${baseLanguage}-`;
        const siblingLanguage = this.availableLanguages()
            .find(supportedLanguage => supportedLanguage.startsWith(languagePrefix));

        return siblingLanguage || this.fallbackLanguage;
    }

    /**
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     */
    static set language(language) {
        const languageToUse = this.getClosestSupportedLanguage(language);

        if (languageToUse !== language) {
            // eslint-disable-next-line no-console
            console.warn(`Language ${language} not supported, using ${languageToUse} instead.`);
        }

        if (this._language !== languageToUse) {
            /** @type {string} */
            this._language = languageToUse;

            if (({ interactive: 1, complete: 1 })[document.readyState]) {
                this.translateDom();
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    this.translateDom();
                });
            }
            I18n.observer.fire(I18n.Events.LANGUAGE_CHANGED, this._language);
        }
    }

    /** @type {string} */
    static get language() {
        return this._language || this.fallbackLanguage;
    }

    /** @type {dict} */
    static get dictionary() {
        if (!this._dict) throw new Error('I18n not initialized');
        return this._dict;
    }

    /** @type {string} */
    static get fallbackLanguage() {
        if (!this._fallbackLanguage) throw new Error('I18n not initialized');
        return this._fallbackLanguage;
    }

    /** @returns {DOMParser} */
    static get parser() {
        /** @type {DOMParser} */
        this._parser = this._parser || new DOMParser();

        return this._parser;
    }
}

I18n.observer = new Nimiq.Observable();
I18n.Events = {
    LANGUAGE_CHANGED: 'language-changed',
};
const TRANSLATIONS = {
    en: {
        _language: 'English',
        loading: 'Loading...',
        continue: 'Continue',

        'passphrase-strength': 'Strength',
        'passphrase-placeholder': 'Enter passphrase',
        'passphrase-repeat-placeholder': 'Repeat passphrase',

        'privacy-warning-heading': 'Are you being watched?',
        'privacy-warning-text': 'Now is the perfect time to assess your surroundings. '
                              + 'Nearby windows? Hidden cameras? Shoulder spies? '
                              + 'Anyone with your backup phrase can access and spend your NIM.',
        'privacy-agent-continue': 'Continue',

        'recovery-words-title': 'Recovery Words',
        'recovery-words-input-label': 'Recovery Words',
        'recovery-words-input-field-placeholder': 'word #',
        'recovery-words-explanation': 'There really is no password recovery. The following words are a backup '
                                    + 'of your Key File and will grant you access to your wallet even if your '
                                    + 'Key File is lost.',
        'recovery-words-storing': 'Write those words on a piece of paper and store it at a safe, offline place.',

        'create-heading-choose-identicon': 'Choose your account avatar',
        'create-text-select-avatar': 'Select an avatar for your wallet\'s default account from the selection below.',
        'create-hint-more-accounts': 'You can add more accounts later.',
        'create-heading-keyfile': 'This is your Key File',
        'create-text-keyfile-info': 'Your Key File gives you full access to your wallet. '
                                  + 'You\'ll need it everytime you log in.',
        'create-hint-keyfile-password': 'To protect your wallet, first protect it with a password.',
        'create-heading-backup-account': 'Create a backup',
        'create-heading-validate-backup': 'Validate your backup',

        'import-heading-log-in': 'Log in',
        'import-link-no-wallet': 'Don\'t have a wallet yet?',
        'import-heading-protect': 'Protect your wallet',
        'import-text-set-password': 'You can now set a password to encrypt your wallet on this device.',

        'import-file-lost-file': 'Lost your Key File? You can recover your account with your 24 Recovery Words.',
        'import-file-button-words': 'Enter Recovery Words',
        'import-file-heading-unlock': 'Unlock your Key File',
        'import-file-text-unprotected-keyfile': 'Your Key File is unprotected.',

        'file-import-prompt': 'Drop your Key File here',
        'file-import-click-hint': 'Or click to select a file.',

        'enter-recovery-words-heading': 'Import from recovery words',
        'enter-recovery-words-subheading': 'Please enter your 24 recovery words.',

        'choose-key-type-heading': 'Choose key type',
        'choose-key-type-subheading': 'We couldn\'t determine the type of your key. Please select it below.',
        'choose-key-type-or': 'or',
        'choose-key-type-legacy-address-heading': 'Single address',
        'choose-key-type-legacy-address-info': 'Created before xx/xx/2018',
        'choose-key-type-bip39-address-heading': 'Multiple addresses',
        'choose-key-type-bip39-address-info': 'Created after xx/xx/2018',

        'sign-tx-heading': 'New Transaction',
        'sign-tx-includes': 'includes',
        'sign-tx-fee': 'fee',
        'sign-tx-youre-sending': 'You\'re sending',
        'sign-tx-to': 'to',
        'sign-tx-pay-with': 'Pay with',

        'passphrasebox-enter-passphrase': 'Enter your passphrase',
        'passphrasebox-protect-keyfile': 'Protect your keyfile with a password',
        'passphrasebox-repeat-password': 'Repeat your password',
        'passphrasebox-continue': 'Continue',
        'passphrasebox-log-in': 'Log in to your wallet',
        'passphrasebox-log-out': 'Confirm logout',
        'passphrasebox-download': 'Download key file',
        'passphrasebox-confirm-tx': 'Confirm transaction',
        'passphrasebox-password-strength-8': 'Great, that\'s a good password!',
        'passphrasebox-password-strength-10': 'Super, that\'s a strong password!',
        'passphrasebox-password-strength-12': 'Excellent, that\'s a very strong password!',
        'passphrasebox-password-hint': 'Your password should have at least 8 characters.',
        'passphrasebox-password-skip': 'Skip password protection for now',

        'identicon-selector-loading': 'Mixing colors',
        'identicon-selector-button-select': 'Select',
        'identicon-selector-link-back': 'Back',

        'downloadkeyfile-heading-protected': 'Your Key File is protected!',
        'downloadkeyfile-heading-unprotected': 'Your Key File is not protected!',
        'downloadkeyfile-safe-place': 'Store it in a safe place. If you lose it, it cannot be recovered!',
        'downloadkeyfile-download': 'Download Key File',
        'downloadkeyfile-download-anyway': 'Download anyway',

        'validate-words-text': 'Please select the correct word from your list of recovery words.',
        'validate-words-back': 'Back to words',
        'validate-words-skip': 'Skip validation for now',
    },
    de: {
        _language: 'Deutsch',
        loading: 'Wird geladen...',
        continue: 'Weiter',

        'passphrase-strength': 'Stärke',
        'passphrase-placeholder': 'Passphrase eingeben',
        'passphrase-repeat-placeholder': 'Passphrase wiederholen',

        'privacy-warning-heading': 'Wirst du beobachtet?',
        'privacy-warning-text': 'Jetzt ist eine gute Zeit um sich umzuschauen. Gibt es Fenster in der Nähe? '
                              + 'Versteckte Kameras? Jemand der über deine Schulter schaut? '
                              + 'Jeder der deine Wiederherstellungswörter hat, kann auf deine NIM zugreifen '
                              + 'und sie ausgeben.',
        'privacy-agent-continue': 'Weiter',

        'recovery-words-title': 'Wiederherstellungswörter',
        'recovery-words-input-label': 'Wiederherstellungswörter',
        'recovery-words-input-field-placeholder': 'Wort ',
        'recovery-words-explanation': 'Es gibt wirklich keine Password-Wiederherstellung. Die folgenden Wörter '
                                    + 'sind ein Backup von deiner Schlüsseldatei und werden dir Zugang zu deiner '
                                    + 'Wallet gewähren, auch wenn deine Schlüsseldatei verloren ist.',
        'recovery-words-storing': 'Schreibe diese Wörter auf ein Stück Papier und verwahre es an einem sicheren, '
                                + 'analogen Ort.',

        'create-heading-choose-identicon': 'Wähle deinen Konto Avatar',
        'create-text-select-avatar': 'Wähle einen Avatar für den Standard-Account deiner Wallet aus der Auswahl unten.',
        'create-hint-more-accounts': 'Neue Konten kannst du später hinzufügen.',
        'create-heading-keyfile': 'Das ist deine Wallet Datei',
        'create-text-keyfile-info': 'Deine Wallet Datei gibt dir vollen Zugang zu deiner Wallet. '
                                  + 'Du brauchst sie jedesmal wenn du dich einloggst.',
        'create-hint-keyfile-password': 'Um deine Wallet zu schützen, schütze es mit einem Passwort.',
        'create-heading-backup-account': 'Erstelle ein Backup',
        'create-heading-validate-backup': 'Überprüfe dein Backup',

        'import-heading-log-in': 'Einloggen',
        'import-link-no-wallet': 'Du hast noch keine Wallet?',
        'import-heading-protect': 'Wallet verschlüsseln',
        'import-text-set-password': 'Du kannst jetzt ein Passwort eingeben, um deine Wallet auf diesem '
                                  + 'Gerät zu verschlüsseln.',

        'import-file-lost-file': 'Schlüsseldatei verloren? Du kannst deinen Account mit deinen 24 '
                               + 'Wiederherstellungswörtern wiederherstellen',
        'import-file-button-words': 'Wiederherstellungswörter eingeben',
        'import-file-heading-unlock': 'Entsperre deine Schlüsseldatei',
        'import-file-text-unprotected-keyfile': 'Deine Schlüsseldatei ist ungeschützt.',

        'file-import-prompt': 'Ziehe deine Schlüsseldatei auf dieses Feld',
        'file-import-click-hint': 'Oder klicke um eine Datei auszuwählen.',

        'enter-recovery-words-heading': 'Mit Wiederherstellungswörtern importieren',
        'enter-recovery-words-subheading': 'Bitte gib deine 24 Wiederherstellungswörter ein.',

        'choose-key-type-heading': 'Schlüsseltyp wählen',
        'choose-key-type-subheading': 'Wir konnten den Typ deines Schlüssels nicht automatisch ermitteln. '
                                    + 'Bitte wähle ihn unten aus.',
        'choose-key-type-or': 'oder',
        'choose-key-type-legacy-address-heading': 'Einzelne Adresse',
        'choose-key-type-legacy-address-info': 'Erstellt vor xx.xx.2018',
        'choose-key-type-bip39-address-heading': 'Mehrere Adressen',
        'choose-key-type-bip39-address-info': 'Erstellt nach xx.xx.2018',

        'sign-tx-heading': 'Neue Überweisung',
        'sign-tx-includes': 'inklusive',
        'sign-tx-fee': 'Gebühr',
        'sign-tx-youre-sending': 'Du sendest',
        'sign-tx-to': 'an',
        'sign-tx-pay-with': 'Zahle mit',

        'passphrasebox-enter-passphrase': 'Gib deine Passphrase ein',
        'passphrasebox-protect-keyfile': 'Sichere dein KeyFile mit einem Passwort',
        'passphrasebox-repeat-password': 'Wiederhole dein Passwort',
        'passphrasebox-continue': 'Weiter',
        'passphrasebox-log-in': 'In deine Wallet einloggen',
        'passphrasebox-log-out': 'Abmeldung bestätigen',
        'passphrasebox-download': 'KeyFile herunterladen',
        'passphrasebox-confirm-tx': 'Überweisung bestätigen',
        'passphrasebox-password-strength-8': 'Schön, das ist ein gutes Passwort!',
        'passphrasebox-password-strength-10': 'Super, das ist ein starkes Passwort!',
        'passphrasebox-password-strength-12': 'Exzellent, das ist ein sehr starkes Passwort!',
        'passphrasebox-password-hint': 'Dein Passwort muss mindestens 8 Zeichen haben.',
        'passphrasebox-password-skip': 'Passwortschutz erstmal überspringen',

        'identicon-selector-loading': 'Mische Farben',
        'identicon-selector-button-select': 'Auswählen',
        'identicon-selector-link-back': 'Zurück',

        'downloadkeyfile-heading-protected': 'Dein Schlüsseldatei ist geschützt!',
        'downloadkeyfile-heading-unprotected': 'Dein Schlüsseldatei ist nicht geschützt!',
        'downloadkeyfile-safe-place': 'Lagere sie in einem sicheren Ort. Wenn du sie verlierst, '
                                    + 'kann sie nicht wiederhergestellt werden!',
        'downloadkeyfile-download': 'Schlüsseldatei herunterladen',
        'downloadkeyfile-download-anyway': 'Trotzdem herunterladen',

        'validate-words-text': 'Bitte wähle das richtige Wort aus deiner Liste von Wiederherstellungswörtern aus.',
        'validate-words-back': 'Zurück zu den Wörtern',
        'validate-words-skip': 'Überprüfung erstmal überspringen',
    },
};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
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
/* global Nimiq */
/* global AnimationUtils */
/* global QrScanner */
/* global I18n */

class FileImport extends Nimiq.Observable {
    /**
     * @param {HTMLDivElement} [$el]
     */
    constructor($el) {
        super();
        this.$el = FileImport._createElement($el);

        /** @type {HTMLElement} */
        this.$errorMessage = (this.$el.querySelector('.error-message'));
        /** @type {HTMLInputElement} */
        this.$fileInput = (this.$el.querySelector('input'));

        // TODO Re-add the drop target interaction and event listeners?

        this.$el.addEventListener('click', this._openFileInput.bind(this));
        this.$fileInput.addEventListener('change', this._onFileSelected.bind(this));
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('file-import');

        $el.innerHTML = `
            <h3 data-i18n="file-import-prompt">Drop your Key File here</h3>
            <span class="click-hint" data-i18n="file-import-click-hint">Or click to select a file.</span>
            <span class="error-message"></span>
            <input type="file" accept="image/*">
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @returns {HTMLElement}
     */
    getElement() {
        return this.$el;
    }

    _openFileInput() {
        this.$fileInput.click();
    }

    /**
     * @param {DOMEvent} event
     */
    _onFileSelected(event) {
        this.$errorMessage.textContent = '';
        // @ts-ignore
        const files = event.target.files;
        this._readFile(files[0]);
        this.$fileInput.value = '';
    }

    _onQrError() {
        AnimationUtils.animate('shake', this.$el);
        this.$errorMessage.textContent = 'Could not read Key File.';
    }

    /**
     * @param {File} file
     */
    async _readFile(file) {
        // TODO Add WalletBackup to keyguard-next code base
        // const qrPosition = WalletBackup.calculateQrPosition();
        const qrPosition = {
            x: 156,
            y: 548.6886,
            width: 173.4,
            height: 173.4,
            size: 185.4,
            padding: 12,
        };

        try {
            const decoded = await QrScanner.scanImage(file, qrPosition, null, null, false, true);
            this.fire(FileImport.Events.IMPORT, decoded);
        } catch (e) {
            this._onQrError();
        }
    }
}

FileImport.Events = {
    IMPORT: 'import',
};
/* global Nimiq */
/* global AnimationUtils */
/* global I18n */

class PassphraseInput extends Nimiq.Observable {
    /**
     * @param {?HTMLElement} $el
     * @param {string} placeholder
     * @param {boolean} [showStrengthIndicator]
     */
    constructor($el, placeholder = '••••••••', showStrengthIndicator = false) {
        super();
        this._minLength = PassphraseInput.DEFAULT_MIN_LENGTH;
        this._showStrengthIndicator = showStrengthIndicator;
        this.$el = PassphraseInput._createElement($el);
        this.$inputContainer = /** @type {HTMLElement} */ (this.$el.querySelector('.input-container'));
        this.$input = /** @type {HTMLInputElement} */ (this.$el.querySelector('input.password'));
        this.$eyeButton = /** @type {HTMLElement} */ (this.$el.querySelector('.eye-button'));

        /** @type {HTMLElement} */
        this.$strengthIndicator = (this.$el.querySelector('.strength-indicator'));
        /** @type {HTMLElement} */
        this.$strengthIndicatorContainer = (this.$el.querySelector('.strength-indicator-container'));
        if (!showStrengthIndicator) {
            this.$strengthIndicatorContainer.style.display = 'none';
        }

        this.$input.placeholder = placeholder;

        this.$eyeButton.addEventListener('click', () => this._changeVisibility());

        this._onInputChanged();
        this.$input.addEventListener('input', () => this._onInputChanged());
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-input');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <div class="input-container">
                <input class="password" type="password" placeholder="Enter Passphrase">
                <span class="eye-button icon-eye"/>
            </div>
            <div class="strength-indicator-container">
                <div class="label"><span data-i18n="passphrase-strength">Strength</span>:</div>
                <meter max="130" low="10" optimum="100" class="strength-indicator"></meter>
            </div>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    /** @type {HTMLInputElement} */
    get input() {
        return this.$input;
    }

    focus() {
        this.$input.focus();
    }

    reset() {
        this.$input.value = '';
        this._changeVisibility(false);
        this._onInputChanged();
    }

    async onPassphraseIncorrect() {
        await AnimationUtils.animate('shake', this.$inputContainer);
        this.reset();
    }

    /** @param {boolean} [becomeVisible] */
    _changeVisibility(becomeVisible) {
        becomeVisible = typeof becomeVisible !== 'undefined'
            ? becomeVisible
            : this.$input.getAttribute('type') === 'password';
        this.$input.setAttribute('type', becomeVisible ? 'text' : 'password');
        this.$eyeButton.classList.toggle('icon-eye-off', becomeVisible);
        this.$eyeButton.classList.toggle('icon-eye', !becomeVisible);
        this.$input.focus();
    }

    _onInputChanged() {
        const passphraseLength = this.$input.value.length;
        this._updateStrengthIndicator();
        this.valid = passphraseLength >= this._minLength;

        this.fire(PassphraseInput.Events.VALID, this.valid);
    }

    _updateStrengthIndicator() {
        const passphraseLength = this.$input.value.length;
        let strengthIndicatorValue;
        if (passphraseLength === 0) {
            strengthIndicatorValue = 0;
        } else if (passphraseLength < 7) {
            strengthIndicatorValue = 10;
        } else if (passphraseLength < 10) {
            strengthIndicatorValue = 70;
        } else if (passphraseLength < 14) {
            strengthIndicatorValue = 100;
        } else {
            strengthIndicatorValue = 130;
        }
        this.$strengthIndicator.setAttribute('value', String(strengthIndicatorValue));
    }

    /**
     * @returns {string}
     */
    get text() {
        return this.$input.value;
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._minLength = minLength || PassphraseInput.DEFAULT_MIN_LENGTH;
    }
}

PassphraseInput.Events = {
    VALID: 'passphraseinput-valid',
};

PassphraseInput.DEFAULT_MIN_LENGTH = 8;
/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
            hideInput: false, // TODO: When a key is not encrypted, no passphrase is required
            buttonI18nTag: 'passphrasebox-confirm-tx',
        };

        super();

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.cancel')).addEventListener('click', () => this._onCancel());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'center', options.bgColor);

        // To enable i18n validation with the dynamic nature of the passphrase box's contents,
        // all possible i18n tags and texts have to be specified here in the below format to
        // enable the validator to find them with its regular expression.
        /* eslint-disable max-len */
        const buttonVersions = {
            'passphrasebox-continue': '<button class="submit" data-i18n="passphrasebox-continue">Continue</button>',
            'passphrasebox-log-in': '<button class="submit" data-i18n="passphrasebox-log-in">Log in to your wallet</button>',
            'passphrasebox-log-out': '<button class="submit" data-i18n="passphrasebox-log-out">Confirm logout</button>',
            'passphrasebox-confirm-tx': '<button class="submit" data-i18n="passphrasebox-confirm-tx">Confirm transaction</button>',
        };
        /* eslint-enable max-len */

        if (!buttonVersions[options.buttonI18nTag]) throw new Error('PassphraseBox button i18n tag not defined');

        $el.innerHTML = `
            <a class="cancel icon-cancel"></a>
            <h2 class="prompt" data-i18n="passphrasebox-enter-passphrase">Enter your passphrase</h2>
            <div passphrase-input></div>
            ${buttonVersions[options.buttonI18nTag]}
        `;

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this._passphraseInput.focus();
    }

    reset() {
        this._passphraseInput.reset();
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._passphraseInput.setMinLength(minLength);
    }

    /**
     * @returns {Promise<void>}
     */
    async onPassphraseIncorrect() {
        return this._passphraseInput.onPassphraseIncorrect();
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();
        this.fire(PassphraseBox.Events.SUBMIT, this._passphraseInput.text);
    }

    _onCancel() {
        this.fire(PassphraseBox.Events.CANCEL);
    }
}

PassphraseBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    CANCEL: 'passphrasebox-cancel',
};
/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseSetterBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
        };

        super();

        this._password = '';

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseSetterBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.password-skip')).addEventListener('click', () => this._onSkip());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'setter', 'center', options.bgColor);

        /* eslint-disable max-len */
        $el.innerHTML = `
            <h2 class="prompt protect" data-i18n="passphrasebox-protect-keyfile">Protect your keyfile with a password</h2>
            <h2 class="prompt repeat" data-i18n="passphrasebox-repeat-password">Repeat your password</h2>

            <div passphrase-input></div>

            <div class="password-strength strength-8"  data-i18n="passphrasebox-password-strength-8" >Great, that's a good password!</div>
            <div class="password-strength strength-10" data-i18n="passphrasebox-password-strength-10">Super, that's a strong password!</div>
            <div class="password-strength strength-12" data-i18n="passphrasebox-password-strength-12">Excellent, that's a very strong password!</div>

            <div class="password-hint" data-i18n="passphrasebox-password-hint">Your password should have at least 8 characters.</div>
            <a tabindex="0" class="password-skip" data-i18n="passphrasebox-password-skip">Skip password protection for now</a>

            <button class="submit" data-i18n="passphrasebox-continue">Continue</button>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this._passphraseInput.focus();
    }

    /**
     * @param {boolean} [isWrongPassphrase]
     */
    async reset(isWrongPassphrase) {
        this._password = '';

        if (isWrongPassphrase) await this._passphraseInput.onPassphraseIncorrect();
        else this._passphraseInput.reset();

        this.$el.classList.remove('repeat');
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);

        const length = this._passphraseInput.text.length;
        this.$el.classList.toggle('strength-8', length < 10);
        this.$el.classList.toggle('strength-10', length >= 10 && length < 12);
        this.$el.classList.toggle('strength-12', length >= 12);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();

        if (!this._password) {
            this._password = this._passphraseInput.text;
            this._passphraseInput.reset();
            this.$el.classList.add('repeat');
        } else if (this._password !== this._passphraseInput.text) {
            this.reset(true);
        } else {
            this.fire(PassphraseSetterBox.Events.SUBMIT, this._password);
            this.reset();
        }
    }

    _onSkip() {
        this.fire(PassphraseSetterBox.Events.SKIP);
    }
}

PassphraseSetterBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    SKIP: 'passphrasebox-skip',
};
/* global BrowserDetection */
/* global KeyStore */
/* global CookieJar */
/* global I18n */

/**
 * A common parent class for pop-up requests.
 *
 * Usage:
 * Inherit this class in your popup request API class:
 * ```
 *  class SignTransactionApi extends TopLevelApi {
 *
 *      // Define the onRequest method to receive the client's request object:
 *      onRequest(request) {
 *          // do something...
 *
 *          // When done, call this.resolve() with the result object
 *          this.resolve(result);
 *
 *          // Or this.reject() with an error
 *          this.reject(error);
 *      }
 *  }
 *
 *  // Finally, start your API:
 *  runKeyguard(SignTransactionApi);
 * ```
 */
class TopLevelApi { // eslint-disable-line no-unused-vars
    constructor() {
        if (window.self !== window.top) {
            // PopupAPI may not run in a frame
            throw new Error('Illegal use');
        }

        /** @type {Function} */
        this._resolve = () => { throw new Error('Method not defined'); };

        /** @type {Function} */
        this._reject = () => { throw new Error('Method not defined'); };

        I18n.initialize(window.TRANSLATIONS, 'en');
        I18n.translateDom();

        window.addEventListener('beforeunload', () => {
            this.reject(new Error('Keyguard popup closed'));
        });
    }

    /**
     * Method to be called by the Keyguard client via RPC
     *
     * @param {KeyguardRequest} request
     */
    async request(request) {
        /**
         * Detect migrate signalling set by the iframe
         *
         * @deprecated Only for database migration
         */
        if ((BrowserDetection.isIos() || BrowserDetection.isSafari()) && this._hasMigrateFlag()) {
            await KeyStore.instance.migrateAccountsToKeys();
        }

        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;

            this.onRequest(request).catch(reject);
        });
    }

    /**
     * Overwritten by each request's API class
     *
     * @param {KeyguardRequest} request
     * @abstract
     */
    async onRequest(request) { // eslint-disable-line no-unused-vars
        throw new Error('Not implemented');
    }

    /**
     * Called by a page's API class on success
     *
     * @param {*} result
     * @returns {Promise<void>}
     */
    async resolve(result) {
        // Keys might have changed, so update cookie for iOS and Safari users
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            const keys = await KeyStore.instance.list();
            CookieJar.fill(keys);
        }

        this._resolve(result);
    }

    /**
     * Called by a page's API class on error
     *
     * @param {Error} error
     */
    reject(error) {
        this._reject(error);
    }

    /**
     * @deprecated Only for database migration
     * @returns {boolean}
     */
    _hasMigrateFlag() {
        const match = document.cookie.match(new RegExp('migrate=([^;]+)'));
        return !!match && match[1] === '1';
    }
}
/* global TopLevelApi */
/* global FileImport */
/* global PassphraseBox */
/* global PassphraseSetterBox */
/* global Nimiq */
/* global Key */
/* global KeyStore */

class ImportFileApi extends TopLevelApi {
    constructor() {
        super();

        this._encryptedKey = new Nimiq.SerialBuffer(0);
        this._keyType = Key.Type.BIP39;

        // Start UI
        const dom = this._makeView();
        this._passphraseBox = dom.passphraseBox;
        this._passphraseSetterBox = dom.passphraseSetterBox;

        this.$loading = /** @type {HTMLDivElement} */ (document.querySelector('#loading'));
    }

    /**
     * @param {ImportRequest} request
     */
    async onRequest(request) {
        this._request = request;

        // Global cancel link
        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());

        this.run();
    }

    /**
     * @returns {{passphraseBox: PassphraseBox, passphraseSetterBox: PassphraseSetterBox}}
     */
    _makeView() {
        // Containers
        /** @type {HTMLDivElement} */
        const $fileImport = (document.querySelector('.file-import'));
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('.passphrase-box'));
        /** @type {HTMLFormElement} */
        const $passphraseSetterBox = (document.querySelector('.passphrase-setter-box'));

        // Components
        const fileImport = new FileImport($fileImport);
        const passphraseBox = new PassphraseBox($passphraseBox, { buttonI18nTag: 'passphrasebox-log-in' });
        const passphraseSetterBox = new PassphraseSetterBox($passphraseSetterBox);

        // Events
        fileImport.on(FileImport.Events.IMPORT, this._onFileImported.bind(this));
        passphraseBox.on(PassphraseBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());
        passphraseSetterBox.on(PassphraseSetterBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseSetterBox.on(PassphraseSetterBox.Events.SKIP, () => this._onPassphraseEntered(null));

        return {
            passphraseBox,
            passphraseSetterBox,
        };
    }

    /**
     * Determine key type and forward user to Passphrase input
     *
     * @param {string} encryptedKeyBase64 - Encrypted KeyPair in base64 format
     */
    _onFileImported(encryptedKeyBase64) {
        if (encryptedKeyBase64.substr(0, 2) === '#3') {
            // BIP39 Key File
            this._keyType = Key.Type.BIP39;

            this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
            this._passphraseBox.setMinLength();

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) this._goToEnterPassphrase();
            else this._goToSetPassphrase();
        } else {
            // Legacy Account Access File
            this._keyType = Key.Type.LEGACY;

            if (encryptedKeyBase64.substr(0, 2) === '#2') {
                // PIN-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
                this._passphraseBox.setMinLength(6);
            } else {
                // Passphrase-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64);
                this._passphraseBox.setMinLength(8);
            }

            this._goToEnterPassphrase();
        }
    }

    run() {
        window.location.hash = ImportFileApi.Pages.FILE_IMPORT;

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {string?} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        const key = await this._decryptAndStoreKey(passphrase);
        if (!key) {
            this._passphraseBox.onPassphraseIncorrect();
            return;
        }

        /** @type {{keyPath: string, address: Uint8Array}[]} */
        const addresses = [];

        if (key.type === Key.Type.LEGACY) {
            const address = key.deriveAddress('');
            addresses.push({
                keyPath: 'm/0\'',
                address: address.serialize(),
            });
        } else if (key.type === Key.Type.BIP39) {
            /** @type {ImportRequest} */
            (this._request).requestedKeyPaths.forEach(keyPath => {
                addresses.push({
                    keyPath,
                    address: key.deriveAddress(keyPath).serialize(),
                });
            });
        } else {
            throw new Error(`Unkown key type ${key.type}`);
        }

        /** @type {ImportResult} */
        const result = {
            keyId: key.id,
            keyType: key.type,
            addresses,
        };

        this.resolve(result);
    }

    /**
     * @param {string?} passphrase
     * @returns {Promise<?Key>}
     */
    async _decryptAndStoreKey(passphrase) {
        this.$loading.style.display = 'flex';
        try {
            // Separating the processing of the encryptionKey (password) and the secret (key) is necessary
            // to cover these scenarios:
            //     1. Encrypted key file with password or PIN
            //     2. Unencrypted key file and no new password set
            //     3. Unencrypted key file and new password set

            let secret = new Uint8Array(0);
            let encryptionKey = null;

            if (passphrase !== null) {
                // TODO Support for UTF-8 passwords
                encryptionKey = Nimiq.BufferUtils.fromAscii(passphrase);
            }

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) {
                secret = await Nimiq.CryptoUtils.decryptOtpKdf(
                    this._encryptedKey,
                    /** @type {Uint8Array} */ (encryptionKey),
                );
            } else {
                // Key File was not encrypted and the imported Uint8Array is the plain secret
                secret = this._encryptedKey;
            }

            const key = new Key(secret, this._keyType);
            await KeyStore.instance.put(key, encryptionKey || undefined);

            return key;
        } catch (e) {
            this.$loading.style.display = 'none';
            return null;
        }
    }

    _goToEnterPassphrase() {
        window.location.hash = ImportFileApi.Pages.ENTER_PASSPHRASE;
        this._passphraseBox.reset();
        this._passphraseBox.focus();
    }

    _goToSetPassphrase() {
        window.location.hash = ImportFileApi.Pages.SET_PASSPHRASE;
        this._passphraseSetterBox.reset();
        this._passphraseSetterBox.focus();
    }
}

ImportFileApi.Pages = {
    FILE_IMPORT: 'file-import',
    ENTER_PASSPHRASE: 'enter-passphrase',
    SET_PASSPHRASE: 'set-passphrase',
};
/* global runKeyguard */
/* global ImportFileApi */

runKeyguard(ImportFileApi);
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
class AnimationUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {string} className
     * @param {HTMLElement} el
     * @param {Function} [afterStartCallback]
     * @param {Function} [beforeEndCallback]
     */
    static async animate(className, el, afterStartCallback, beforeEndCallback) {
        return new Promise(resolve => {
            // 'animiationend' is a native DOM event that fires upon CSS animation completion
            /** @param {Event} e */
            const listener = e => {
                if (e.target !== el) return;
                if (beforeEndCallback instanceof Function) beforeEndCallback();
                this.stopAnimate(className, el);
                el.removeEventListener('animationend', listener);
                resolve();
            };
            el.addEventListener('animationend', listener);
            el.classList.add(className);
            if (afterStartCallback instanceof Function) afterStartCallback();
        });
    }

    /**
     * @param {string} className
     * @param {HTMLElement} el
     */
    static stopAnimate(className, el) {
        el.classList.remove(className);
    }
}
/* eslint-disable prefer-promise-reject-errors, no-throw-literal */

// eslint-disable-next-line max-len
/** @typedef {HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | File} imageOrFileOrUrl */

class QrScanner {
    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {HTMLVideoElement} video
     * @param {((value: string) => string | PromiseLike<string>)} [onDecode]
     * @param {number} [canvasSize] - Edge length of the quadratic canvas
     */
    constructor(video, onDecode, canvasSize = QrScanner.DEFAULT_CANVAS_SIZE) {
        this.$video = video;
        this.$canvas = document.createElement('canvas');
        this._onDecode = onDecode;
        this._active = false;

        this.$canvas.width = canvasSize;
        this.$canvas.height = canvasSize;
        this._sourceRect = {
            x: 0,
            y: 0,
            width: canvasSize,
            height: canvasSize,
        };

        this.$video.addEventListener('canplay', () => this._updateSourceRect());
        this.$video.addEventListener('play', () => {
            this._updateSourceRect();
            this._scanFrame();
        }, false);
        this._qrWorker = new Worker(QrScanner.WORKER_PATH);
    }

    _updateSourceRect() {
        const smallestDimension = Math.min(this.$video.videoWidth, this.$video.videoHeight);
        const sourceRectSize = Math.round(2 / 3 * smallestDimension);
        this._sourceRect.width = sourceRectSize;
        this._sourceRect.height = sourceRectSize;
        this._sourceRect.x = (this.$video.videoWidth - sourceRectSize) / 2;
        this._sourceRect.y = (this.$video.videoHeight - sourceRectSize) / 2;
    }

    /**
     * Triggers this._onDecode for each frame, calls itself recursively until the video is paused or ends
     *
     * @returns {boolean}
     */
    _scanFrame() {
        if (this.$video.paused || this.$video.ended) return false;
        requestAnimationFrame(() => {
            QrScanner.scanImage(this.$video, this._sourceRect, this._qrWorker, this.$canvas, true)
                .then(this._onDecode, /** @param {string} error */ error => {
                    if (error !== 'QR code not found.') {
                        console.error(error);
                    }
                })
                .then(() => this._scanFrame());
        });

        return true;
    }

    /**
     * @param {string | object} [facingMode]
     * @param {boolean} [exact]
     * @returns {Promise<MediaStream>}
     */
    _getCameraStream(facingMode, exact = false) {
        const constraintsToTry = [{
            width: { min: 1024 },
        }, {
            width: { min: 768 },
        }, {}];

        if (facingMode) {
            if (exact) {
                facingMode = { exact: facingMode };
            }
            constraintsToTry.forEach(constraint => { constraint.facingMode = facingMode; });
        }
        return this._getMatchingCameraStream(constraintsToTry);
    }

    /**
     * @param {Array} constraintsToTry
     * @returns {Promise<MediaStream>}
     */
    async _getMatchingCameraStream(constraintsToTry) {
        if (constraintsToTry.length === 0) {
            return Promise.reject('Camera not found.');
        }
        return navigator.mediaDevices.getUserMedia({
            video: constraintsToTry.shift(),
        }).catch(() => this._getMatchingCameraStream(constraintsToTry));
    }

    start() {
        if (this._active) {
            return Promise.resolve();
        }
        this._active = true;
        clearTimeout(/** @type {number | undefined} */ (this._offTimeout));
        let facingMode = 'environment';
        return this._getCameraStream('environment', true)
            .catch(() => {
                // we (probably) don't have an environment camera
                facingMode = 'user';
                return this._getCameraStream(); // throws if we can't access the camera
            })
            .then(stream => {
                this.$video.srcObject = stream;
                this._setVideoMirror(facingMode);
            })
            .catch(e => {
                this._active = false;
                throw e;
            });
    }

    stop() {
        if (!this._active) {
            return;
        }
        this._active = false;
        this.$video.pause();
        this._offTimeout = (setTimeout(() => {
            // @ts-ignore
            this.$video.srcObject.getTracks()[0].stop();
            this.$video.srcObject = null;
        }, 3000));
    }

    /**
     * @param {string} facingMode
     */
    _setVideoMirror(facingMode) {
        // in user facing mode mirror the video to make it easier for the user to position the QR code
        const scaleFactor = facingMode === 'user' ? -1 : 1;
        this.$video.style.transform = `scaleX(${scaleFactor})`;
    }

    /**
     * @param {number} red
     * @param {number} green
     * @param {number} blue
     */
    setGrayscaleWeights(red, green, blue) {
        this._qrWorker.postMessage({
            type: 'grayscaleWeights',
            data: { red, green, blue },
        });
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @param {object?} sourceRect
     * @param {Worker?} worker
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @param {boolean} [alsoTryWithoutSourceRect]
     * @returns {Promise<string>}
     */
    static async scanImage(imageOrFileOrUrl, sourceRect = null, worker = null, canvas = null, fixedCanvasSize = false,
        alsoTryWithoutSourceRect = false) {
        const promise = new Promise((resolve, reject) => {
            worker = worker || new Worker(QrScanner.WORKER_PATH);
            /** @type {number | undefined} */
            let timeout;
            /** @type {EventListener} */
            let onError;
            /**
             * @param {Event} event
             */
            const onMessage = event => {
                // @ts-ignore
                if (event.data.type !== 'qrResult') {
                    return;
                }
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                // @ts-ignore
                if (event.data.data !== null) {
                    // @ts-ignore
                    resolve(event.data.data);
                } else {
                    reject('QR code not found.');
                }
            };
            onError = () => {
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                reject('Worker error.');
            };
            worker.addEventListener('message', onMessage);
            worker.addEventListener('error', onError);
            timeout = setTimeout(onError, 3000);
            QrScanner._loadImage(imageOrFileOrUrl).then(image => {
                const imageData = QrScanner._getImageData(image, sourceRect, canvas, fixedCanvasSize);
                /** @type {Worker} */ (worker).postMessage({
                    type: 'decode',
                    data: imageData,
                }, [imageData.data.buffer]);
            }).catch(reject);
        });

        if (sourceRect && alsoTryWithoutSourceRect) {
            return promise.catch(() => QrScanner.scanImage(imageOrFileOrUrl, null, worker, canvas, fixedCanvasSize));
        }
        return promise;
    }


    /**
     * @param {HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap} image
     * @param {object?} sourceRect
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @returns {ImageData}
     */
    static _getImageData(image, sourceRect = null, canvas = null, fixedCanvasSize = false) {
        canvas = canvas || document.createElement('canvas');
        const sourceRectX = sourceRect && sourceRect.x ? sourceRect.x : 0;
        const sourceRectY = sourceRect && sourceRect.y ? sourceRect.y : 0;
        // @ts-ignore
        const sourceRectWidth = sourceRect && sourceRect.width ? sourceRect.width : image.width || image.videoWidth;
        const sourceRectHeight = sourceRect && sourceRect.height
            ? sourceRect.height
            : image.height
            // @ts-ignore
            || image.videoHeight;
        if (!fixedCanvasSize && (canvas.width !== sourceRectWidth || canvas.height !== sourceRectHeight)) {
            canvas.width = sourceRectWidth;
            canvas.height = sourceRectHeight;
        }
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw ('Cannot get canvas 2D context');
        context.imageSmoothingEnabled = false; // gives less blurry images
        context.drawImage(
            image,
            sourceRectX,
            sourceRectY,
            sourceRectWidth,
            sourceRectHeight,
            0,
            0,
            canvas.width,
            canvas.height,
        );
        return context.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @returns {Promise<HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap>}
     */
    static async _loadImage(imageOrFileOrUrl) {
        if (imageOrFileOrUrl instanceof HTMLCanvasElement
            || imageOrFileOrUrl instanceof HTMLVideoElement
            // @ts-ignore
            || (window.ImageBitmap && imageOrFileOrUrl instanceof window.ImageBitmap)
        ) {
            // @ts-ignore
            return Promise.resolve(imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof Image) {
            return QrScanner._awaitImageLoad(imageOrFileOrUrl).then(() => imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof File || imageOrFileOrUrl instanceof URL
            || typeof (imageOrFileOrUrl) === 'string') {
            const image = new Image();
            if (imageOrFileOrUrl instanceof File) {
                image.src = URL.createObjectURL(imageOrFileOrUrl);
            } else {
                // @ts-ignore
                image.src = imageOrFileOrUrl;
            }
            return QrScanner._awaitImageLoad(image).then(() => {
                if (imageOrFileOrUrl instanceof File) {
                    URL.revokeObjectURL(image.src);
                }
                return image;
            });
        }
        return Promise.reject('Unsupported image type.');
    }

    /**
     * @param {HTMLImageElement} image
     */
    static async _awaitImageLoad(image) {
        return new Promise((resolve, reject) => {
            if (image.complete && image.naturalWidth !== 0) {
                // already loaded
                resolve();
            } else {
                /** @type {EventListener} */
                let onError;
                const onLoad = () => { // eslint-disable-line require-jsdoc-except/require-jsdoc
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    resolve();
                };
                onError = () => {
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    reject('Image load error');
                };
                image.addEventListener('load', onLoad);
                image.addEventListener('error', onError);
            }
        });
    }
}
QrScanner.DEFAULT_CANVAS_SIZE = 400;
QrScanner.WORKER_PATH = '../../lib/QrScannerWorker.min.js';
/* global TRANSLATIONS */ // eslint-disable-line no-unused-vars
/* global Nimiq */

/**
 * @typedef {{[language: string]: {[id: string]: string}}} dict
 */

class I18n { // eslint-disable-line no-unused-vars
    /**
     * @param {dict} dictionary - Dictionary of all languages and phrases
     * @param {string} fallbackLanguage - Language to be used if no translation for the current language can be found
     */
    static initialize(dictionary, fallbackLanguage) {
        this._dict = dictionary;

        if (!(fallbackLanguage in this._dict)) {
            throw new Error(`Fallback language "${fallbackLanguage}" not defined`);
        }
        /** @type {string} */
        this._fallbackLanguage = fallbackLanguage;

        this.language = navigator.language;
    }

    /**
     * @param {HTMLElement} [dom] - The DOM element to be translated, or body by default
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     */
    static translateDom(dom = document.body, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;

        /* eslint-disable-next-line valid-jsdoc */ // Multi-line descriptions are not valid JSDoc, apparently
        /**
         * @param {string} tag
         * @param {(element: HTMLElement, translation: string) => void} callback - callback(element, translation) for
         * each matching element
         */
        const translateElements = (tag, callback) => {
            const attribute = `data-${tag}`;
            /** @type {NodeListOf<HTMLElement>} */
            const elements = dom.querySelectorAll(`[${attribute}]`);
            elements.forEach(element => {
                const id = element.getAttribute(attribute);
                if (!id) return;
                callback(element, this._translate(id, language));
            });
        };

        /**
         * @param {string} tag
         */
        const translateAttribute = tag => {
            translateElements(`i18n-${tag}`, (element, translation) => element.setAttribute(tag, translation));
        };

        translateElements('i18n', (element, translation) => {
            const sanitized = translation.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const withMarkup = sanitized.replace(/\[strong]/g, '<strong>').replace(/\[\/strong]/g, '</strong>');
            element.innerHTML = withMarkup;
        });
        translateAttribute('value');
        translateAttribute('placeholder');
    }

    /**
     * @param {string} id - translation dict ID
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     * @returns {string}
     */
    static translatePhrase(id, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;
        return this._translate(id, language);
    }

    /**
     * @param {string} id
     * @param {string} language
     * @returns {string}
     */
    static _translate(id, language) {
        if (!this.dictionary[language] || !this.dictionary[language][id]) {
            throw new Error(`I18n: ${language}/${id} is undefined!`);
        }
        return this.dictionary[language][id];
    }

    /**
     * @returns {string[]} ISO codes of all available languages.
     */
    static availableLanguages() {
        return Object.keys(this.dictionary);
    }

    /**
     * @param {string} language
     */
    static switchLanguage(language) {
        this.language = language;
    }

    /**
     * Selects a supported language closed to the desired language. Examples it might return:
     * en-us => en-us, en-us => en, en => en-us, fr => en.
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     * @returns {string}
     */
    static getClosestSupportedLanguage(language) {
        // If this language is supported, return it directly
        if (language in this.dictionary) return language;

        // Return the base language, if it exists in the dictionary
        const baseLanguage = language.split('-')[0];
        if (baseLanguage !== language && baseLanguage in this.dictionary) return baseLanguage;

        // Check if other versions (siblings) of the base language exist
        const languagePrefix = `${baseLanguage}-`;
        const siblingLanguage = this.availableLanguages()
            .find(supportedLanguage => supportedLanguage.startsWith(languagePrefix));

        return siblingLanguage || this.fallbackLanguage;
    }

    /**
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     */
    static set language(language) {
        const languageToUse = this.getClosestSupportedLanguage(language);

        if (languageToUse !== language) {
            // eslint-disable-next-line no-console
            console.warn(`Language ${language} not supported, using ${languageToUse} instead.`);
        }

        if (this._language !== languageToUse) {
            /** @type {string} */
            this._language = languageToUse;

            if (({ interactive: 1, complete: 1 })[document.readyState]) {
                this.translateDom();
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    this.translateDom();
                });
            }
            I18n.observer.fire(I18n.Events.LANGUAGE_CHANGED, this._language);
        }
    }

    /** @type {string} */
    static get language() {
        return this._language || this.fallbackLanguage;
    }

    /** @type {dict} */
    static get dictionary() {
        if (!this._dict) throw new Error('I18n not initialized');
        return this._dict;
    }

    /** @type {string} */
    static get fallbackLanguage() {
        if (!this._fallbackLanguage) throw new Error('I18n not initialized');
        return this._fallbackLanguage;
    }

    /** @returns {DOMParser} */
    static get parser() {
        /** @type {DOMParser} */
        this._parser = this._parser || new DOMParser();

        return this._parser;
    }
}

I18n.observer = new Nimiq.Observable();
I18n.Events = {
    LANGUAGE_CHANGED: 'language-changed',
};
const TRANSLATIONS = {
    en: {
        _language: 'English',
        loading: 'Loading...',
        continue: 'Continue',

        'passphrase-strength': 'Strength',
        'passphrase-placeholder': 'Enter passphrase',
        'passphrase-repeat-placeholder': 'Repeat passphrase',

        'privacy-warning-heading': 'Are you being watched?',
        'privacy-warning-text': 'Now is the perfect time to assess your surroundings. '
                              + 'Nearby windows? Hidden cameras? Shoulder spies? '
                              + 'Anyone with your backup phrase can access and spend your NIM.',
        'privacy-agent-continue': 'Continue',

        'recovery-words-title': 'Recovery Words',
        'recovery-words-input-label': 'Recovery Words',
        'recovery-words-input-field-placeholder': 'word #',
        'recovery-words-explanation': 'There really is no password recovery. The following words are a backup '
                                    + 'of your Key File and will grant you access to your wallet even if your '
                                    + 'Key File is lost.',
        'recovery-words-storing': 'Write those words on a piece of paper and store it at a safe, offline place.',

        'create-heading-choose-identicon': 'Choose your account avatar',
        'create-text-select-avatar': 'Select an avatar for your wallet\'s default account from the selection below.',
        'create-hint-more-accounts': 'You can add more accounts later.',
        'create-heading-keyfile': 'This is your Key File',
        'create-text-keyfile-info': 'Your Key File gives you full access to your wallet. '
                                  + 'You\'ll need it everytime you log in.',
        'create-hint-keyfile-password': 'To protect your wallet, first protect it with a password.',
        'create-heading-backup-account': 'Create a backup',
        'create-heading-validate-backup': 'Validate your backup',

        'import-heading-log-in': 'Log in',
        'import-link-no-wallet': 'Don\'t have a wallet yet?',
        'import-heading-protect': 'Protect your wallet',
        'import-text-set-password': 'You can now set a password to encrypt your wallet on this device.',

        'import-file-lost-file': 'Lost your Key File? You can recover your account with your 24 Recovery Words.',
        'import-file-button-words': 'Enter Recovery Words',
        'import-file-heading-unlock': 'Unlock your Key File',
        'import-file-text-unprotected-keyfile': 'Your Key File is unprotected.',

        'file-import-prompt': 'Drop your Key File here',
        'file-import-click-hint': 'Or click to select a file.',

        'enter-recovery-words-heading': 'Import from recovery words',
        'enter-recovery-words-subheading': 'Please enter your 24 recovery words.',

        'choose-key-type-heading': 'Choose key type',
        'choose-key-type-subheading': 'We couldn\'t determine the type of your key. Please select it below.',
        'choose-key-type-or': 'or',
        'choose-key-type-legacy-address-heading': 'Single address',
        'choose-key-type-legacy-address-info': 'Created before xx/xx/2018',
        'choose-key-type-bip39-address-heading': 'Multiple addresses',
        'choose-key-type-bip39-address-info': 'Created after xx/xx/2018',

        'sign-tx-heading': 'New Transaction',
        'sign-tx-includes': 'includes',
        'sign-tx-fee': 'fee',
        'sign-tx-youre-sending': 'You\'re sending',
        'sign-tx-to': 'to',
        'sign-tx-pay-with': 'Pay with',

        'passphrasebox-enter-passphrase': 'Enter your passphrase',
        'passphrasebox-protect-keyfile': 'Protect your keyfile with a password',
        'passphrasebox-repeat-password': 'Repeat your password',
        'passphrasebox-continue': 'Continue',
        'passphrasebox-log-in': 'Log in to your wallet',
        'passphrasebox-log-out': 'Confirm logout',
        'passphrasebox-download': 'Download key file',
        'passphrasebox-confirm-tx': 'Confirm transaction',
        'passphrasebox-password-strength-8': 'Great, that\'s a good password!',
        'passphrasebox-password-strength-10': 'Super, that\'s a strong password!',
        'passphrasebox-password-strength-12': 'Excellent, that\'s a very strong password!',
        'passphrasebox-password-hint': 'Your password should have at least 8 characters.',
        'passphrasebox-password-skip': 'Skip password protection for now',

        'identicon-selector-loading': 'Mixing colors',
        'identicon-selector-button-select': 'Select',
        'identicon-selector-link-back': 'Back',

        'downloadkeyfile-heading-protected': 'Your Key File is protected!',
        'downloadkeyfile-heading-unprotected': 'Your Key File is not protected!',
        'downloadkeyfile-safe-place': 'Store it in a safe place. If you lose it, it cannot be recovered!',
        'downloadkeyfile-download': 'Download Key File',
        'downloadkeyfile-download-anyway': 'Download anyway',

        'validate-words-text': 'Please select the correct word from your list of recovery words.',
        'validate-words-back': 'Back to words',
        'validate-words-skip': 'Skip validation for now',
    },
    de: {
        _language: 'Deutsch',
        loading: 'Wird geladen...',
        continue: 'Weiter',

        'passphrase-strength': 'Stärke',
        'passphrase-placeholder': 'Passphrase eingeben',
        'passphrase-repeat-placeholder': 'Passphrase wiederholen',

        'privacy-warning-heading': 'Wirst du beobachtet?',
        'privacy-warning-text': 'Jetzt ist eine gute Zeit um sich umzuschauen. Gibt es Fenster in der Nähe? '
                              + 'Versteckte Kameras? Jemand der über deine Schulter schaut? '
                              + 'Jeder der deine Wiederherstellungswörter hat, kann auf deine NIM zugreifen '
                              + 'und sie ausgeben.',
        'privacy-agent-continue': 'Weiter',

        'recovery-words-title': 'Wiederherstellungswörter',
        'recovery-words-input-label': 'Wiederherstellungswörter',
        'recovery-words-input-field-placeholder': 'Wort ',
        'recovery-words-explanation': 'Es gibt wirklich keine Password-Wiederherstellung. Die folgenden Wörter '
                                    + 'sind ein Backup von deiner Schlüsseldatei und werden dir Zugang zu deiner '
                                    + 'Wallet gewähren, auch wenn deine Schlüsseldatei verloren ist.',
        'recovery-words-storing': 'Schreibe diese Wörter auf ein Stück Papier und verwahre es an einem sicheren, '
                                + 'analogen Ort.',

        'create-heading-choose-identicon': 'Wähle deinen Konto Avatar',
        'create-text-select-avatar': 'Wähle einen Avatar für den Standard-Account deiner Wallet aus der Auswahl unten.',
        'create-hint-more-accounts': 'Neue Konten kannst du später hinzufügen.',
        'create-heading-keyfile': 'Das ist deine Wallet Datei',
        'create-text-keyfile-info': 'Deine Wallet Datei gibt dir vollen Zugang zu deiner Wallet. '
                                  + 'Du brauchst sie jedesmal wenn du dich einloggst.',
        'create-hint-keyfile-password': 'Um deine Wallet zu schützen, schütze es mit einem Passwort.',
        'create-heading-backup-account': 'Erstelle ein Backup',
        'create-heading-validate-backup': 'Überprüfe dein Backup',

        'import-heading-log-in': 'Einloggen',
        'import-link-no-wallet': 'Du hast noch keine Wallet?',
        'import-heading-protect': 'Wallet verschlüsseln',
        'import-text-set-password': 'Du kannst jetzt ein Passwort eingeben, um deine Wallet auf diesem '
                                  + 'Gerät zu verschlüsseln.',

        'import-file-lost-file': 'Schlüsseldatei verloren? Du kannst deinen Account mit deinen 24 '
                               + 'Wiederherstellungswörtern wiederherstellen',
        'import-file-button-words': 'Wiederherstellungswörter eingeben',
        'import-file-heading-unlock': 'Entsperre deine Schlüsseldatei',
        'import-file-text-unprotected-keyfile': 'Deine Schlüsseldatei ist ungeschützt.',

        'file-import-prompt': 'Ziehe deine Schlüsseldatei auf dieses Feld',
        'file-import-click-hint': 'Oder klicke um eine Datei auszuwählen.',

        'enter-recovery-words-heading': 'Mit Wiederherstellungswörtern importieren',
        'enter-recovery-words-subheading': 'Bitte gib deine 24 Wiederherstellungswörter ein.',

        'choose-key-type-heading': 'Schlüsseltyp wählen',
        'choose-key-type-subheading': 'Wir konnten den Typ deines Schlüssels nicht automatisch ermitteln. '
                                    + 'Bitte wähle ihn unten aus.',
        'choose-key-type-or': 'oder',
        'choose-key-type-legacy-address-heading': 'Einzelne Adresse',
        'choose-key-type-legacy-address-info': 'Erstellt vor xx.xx.2018',
        'choose-key-type-bip39-address-heading': 'Mehrere Adressen',
        'choose-key-type-bip39-address-info': 'Erstellt nach xx.xx.2018',

        'sign-tx-heading': 'Neue Überweisung',
        'sign-tx-includes': 'inklusive',
        'sign-tx-fee': 'Gebühr',
        'sign-tx-youre-sending': 'Du sendest',
        'sign-tx-to': 'an',
        'sign-tx-pay-with': 'Zahle mit',

        'passphrasebox-enter-passphrase': 'Gib deine Passphrase ein',
        'passphrasebox-protect-keyfile': 'Sichere dein KeyFile mit einem Passwort',
        'passphrasebox-repeat-password': 'Wiederhole dein Passwort',
        'passphrasebox-continue': 'Weiter',
        'passphrasebox-log-in': 'In deine Wallet einloggen',
        'passphrasebox-log-out': 'Abmeldung bestätigen',
        'passphrasebox-download': 'KeyFile herunterladen',
        'passphrasebox-confirm-tx': 'Überweisung bestätigen',
        'passphrasebox-password-strength-8': 'Schön, das ist ein gutes Passwort!',
        'passphrasebox-password-strength-10': 'Super, das ist ein starkes Passwort!',
        'passphrasebox-password-strength-12': 'Exzellent, das ist ein sehr starkes Passwort!',
        'passphrasebox-password-hint': 'Dein Passwort muss mindestens 8 Zeichen haben.',
        'passphrasebox-password-skip': 'Passwortschutz erstmal überspringen',

        'identicon-selector-loading': 'Mische Farben',
        'identicon-selector-button-select': 'Auswählen',
        'identicon-selector-link-back': 'Zurück',

        'downloadkeyfile-heading-protected': 'Dein Schlüsseldatei ist geschützt!',
        'downloadkeyfile-heading-unprotected': 'Dein Schlüsseldatei ist nicht geschützt!',
        'downloadkeyfile-safe-place': 'Lagere sie in einem sicheren Ort. Wenn du sie verlierst, '
                                    + 'kann sie nicht wiederhergestellt werden!',
        'downloadkeyfile-download': 'Schlüsseldatei herunterladen',
        'downloadkeyfile-download-anyway': 'Trotzdem herunterladen',

        'validate-words-text': 'Bitte wähle das richtige Wort aus deiner Liste von Wiederherstellungswörtern aus.',
        'validate-words-back': 'Zurück zu den Wörtern',
        'validate-words-skip': 'Überprüfung erstmal überspringen',
    },
};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
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
/* global Nimiq */
/* global AnimationUtils */
/* global QrScanner */
/* global I18n */

class FileImport extends Nimiq.Observable {
    /**
     * @param {HTMLDivElement} [$el]
     */
    constructor($el) {
        super();
        this.$el = FileImport._createElement($el);

        /** @type {HTMLElement} */
        this.$errorMessage = (this.$el.querySelector('.error-message'));
        /** @type {HTMLInputElement} */
        this.$fileInput = (this.$el.querySelector('input'));

        // TODO Re-add the drop target interaction and event listeners?

        this.$el.addEventListener('click', this._openFileInput.bind(this));
        this.$fileInput.addEventListener('change', this._onFileSelected.bind(this));
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('file-import');

        $el.innerHTML = `
            <h3 data-i18n="file-import-prompt">Drop your Key File here</h3>
            <span class="click-hint" data-i18n="file-import-click-hint">Or click to select a file.</span>
            <span class="error-message"></span>
            <input type="file" accept="image/*">
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @returns {HTMLElement}
     */
    getElement() {
        return this.$el;
    }

    _openFileInput() {
        this.$fileInput.click();
    }

    /**
     * @param {DOMEvent} event
     */
    _onFileSelected(event) {
        this.$errorMessage.textContent = '';
        // @ts-ignore
        const files = event.target.files;
        this._readFile(files[0]);
        this.$fileInput.value = '';
    }

    _onQrError() {
        AnimationUtils.animate('shake', this.$el);
        this.$errorMessage.textContent = 'Could not read Key File.';
    }

    /**
     * @param {File} file
     */
    async _readFile(file) {
        // TODO Add WalletBackup to keyguard-next code base
        // const qrPosition = WalletBackup.calculateQrPosition();
        const qrPosition = {
            x: 156,
            y: 548.6886,
            width: 173.4,
            height: 173.4,
            size: 185.4,
            padding: 12,
        };

        try {
            const decoded = await QrScanner.scanImage(file, qrPosition, null, null, false, true);
            this.fire(FileImport.Events.IMPORT, decoded);
        } catch (e) {
            this._onQrError();
        }
    }
}

FileImport.Events = {
    IMPORT: 'import',
};
/* global Nimiq */
/* global AnimationUtils */
/* global I18n */

class PassphraseInput extends Nimiq.Observable {
    /**
     * @param {?HTMLElement} $el
     * @param {string} placeholder
     * @param {boolean} [showStrengthIndicator]
     */
    constructor($el, placeholder = '••••••••', showStrengthIndicator = false) {
        super();
        this._minLength = PassphraseInput.DEFAULT_MIN_LENGTH;
        this._showStrengthIndicator = showStrengthIndicator;
        this.$el = PassphraseInput._createElement($el);
        this.$inputContainer = /** @type {HTMLElement} */ (this.$el.querySelector('.input-container'));
        this.$input = /** @type {HTMLInputElement} */ (this.$el.querySelector('input.password'));
        this.$eyeButton = /** @type {HTMLElement} */ (this.$el.querySelector('.eye-button'));

        /** @type {HTMLElement} */
        this.$strengthIndicator = (this.$el.querySelector('.strength-indicator'));
        /** @type {HTMLElement} */
        this.$strengthIndicatorContainer = (this.$el.querySelector('.strength-indicator-container'));
        if (!showStrengthIndicator) {
            this.$strengthIndicatorContainer.style.display = 'none';
        }

        this.$input.placeholder = placeholder;

        this.$eyeButton.addEventListener('click', () => this._changeVisibility());

        this._onInputChanged();
        this.$input.addEventListener('input', () => this._onInputChanged());
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-input');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <div class="input-container">
                <input class="password" type="password" placeholder="Enter Passphrase">
                <span class="eye-button icon-eye"/>
            </div>
            <div class="strength-indicator-container">
                <div class="label"><span data-i18n="passphrase-strength">Strength</span>:</div>
                <meter max="130" low="10" optimum="100" class="strength-indicator"></meter>
            </div>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    /** @type {HTMLInputElement} */
    get input() {
        return this.$input;
    }

    focus() {
        this.$input.focus();
    }

    reset() {
        this.$input.value = '';
        this._changeVisibility(false);
        this._onInputChanged();
    }

    async onPassphraseIncorrect() {
        await AnimationUtils.animate('shake', this.$inputContainer);
        this.reset();
    }

    /** @param {boolean} [becomeVisible] */
    _changeVisibility(becomeVisible) {
        becomeVisible = typeof becomeVisible !== 'undefined'
            ? becomeVisible
            : this.$input.getAttribute('type') === 'password';
        this.$input.setAttribute('type', becomeVisible ? 'text' : 'password');
        this.$eyeButton.classList.toggle('icon-eye-off', becomeVisible);
        this.$eyeButton.classList.toggle('icon-eye', !becomeVisible);
        this.$input.focus();
    }

    _onInputChanged() {
        const passphraseLength = this.$input.value.length;
        this._updateStrengthIndicator();
        this.valid = passphraseLength >= this._minLength;

        this.fire(PassphraseInput.Events.VALID, this.valid);
    }

    _updateStrengthIndicator() {
        const passphraseLength = this.$input.value.length;
        let strengthIndicatorValue;
        if (passphraseLength === 0) {
            strengthIndicatorValue = 0;
        } else if (passphraseLength < 7) {
            strengthIndicatorValue = 10;
        } else if (passphraseLength < 10) {
            strengthIndicatorValue = 70;
        } else if (passphraseLength < 14) {
            strengthIndicatorValue = 100;
        } else {
            strengthIndicatorValue = 130;
        }
        this.$strengthIndicator.setAttribute('value', String(strengthIndicatorValue));
    }

    /**
     * @returns {string}
     */
    get text() {
        return this.$input.value;
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._minLength = minLength || PassphraseInput.DEFAULT_MIN_LENGTH;
    }
}

PassphraseInput.Events = {
    VALID: 'passphraseinput-valid',
};

PassphraseInput.DEFAULT_MIN_LENGTH = 8;
/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
            hideInput: false, // TODO: When a key is not encrypted, no passphrase is required
            buttonI18nTag: 'passphrasebox-confirm-tx',
        };

        super();

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.cancel')).addEventListener('click', () => this._onCancel());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'center', options.bgColor);

        // To enable i18n validation with the dynamic nature of the passphrase box's contents,
        // all possible i18n tags and texts have to be specified here in the below format to
        // enable the validator to find them with its regular expression.
        /* eslint-disable max-len */
        const buttonVersions = {
            'passphrasebox-continue': '<button class="submit" data-i18n="passphrasebox-continue">Continue</button>',
            'passphrasebox-log-in': '<button class="submit" data-i18n="passphrasebox-log-in">Log in to your wallet</button>',
            'passphrasebox-log-out': '<button class="submit" data-i18n="passphrasebox-log-out">Confirm logout</button>',
            'passphrasebox-confirm-tx': '<button class="submit" data-i18n="passphrasebox-confirm-tx">Confirm transaction</button>',
        };
        /* eslint-enable max-len */

        if (!buttonVersions[options.buttonI18nTag]) throw new Error('PassphraseBox button i18n tag not defined');

        $el.innerHTML = `
            <a class="cancel icon-cancel"></a>
            <h2 class="prompt" data-i18n="passphrasebox-enter-passphrase">Enter your passphrase</h2>
            <div passphrase-input></div>
            ${buttonVersions[options.buttonI18nTag]}
        `;

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this._passphraseInput.focus();
    }

    reset() {
        this._passphraseInput.reset();
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._passphraseInput.setMinLength(minLength);
    }

    /**
     * @returns {Promise<void>}
     */
    async onPassphraseIncorrect() {
        return this._passphraseInput.onPassphraseIncorrect();
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();
        this.fire(PassphraseBox.Events.SUBMIT, this._passphraseInput.text);
    }

    _onCancel() {
        this.fire(PassphraseBox.Events.CANCEL);
    }
}

PassphraseBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    CANCEL: 'passphrasebox-cancel',
};
/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseSetterBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
        };

        super();

        this._password = '';

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseSetterBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.password-skip')).addEventListener('click', () => this._onSkip());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'setter', 'center', options.bgColor);

        /* eslint-disable max-len */
        $el.innerHTML = `
            <h2 class="prompt protect" data-i18n="passphrasebox-protect-keyfile">Protect your keyfile with a password</h2>
            <h2 class="prompt repeat" data-i18n="passphrasebox-repeat-password">Repeat your password</h2>

            <div passphrase-input></div>

            <div class="password-strength strength-8"  data-i18n="passphrasebox-password-strength-8" >Great, that's a good password!</div>
            <div class="password-strength strength-10" data-i18n="passphrasebox-password-strength-10">Super, that's a strong password!</div>
            <div class="password-strength strength-12" data-i18n="passphrasebox-password-strength-12">Excellent, that's a very strong password!</div>

            <div class="password-hint" data-i18n="passphrasebox-password-hint">Your password should have at least 8 characters.</div>
            <a tabindex="0" class="password-skip" data-i18n="passphrasebox-password-skip">Skip password protection for now</a>

            <button class="submit" data-i18n="passphrasebox-continue">Continue</button>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this._passphraseInput.focus();
    }

    /**
     * @param {boolean} [isWrongPassphrase]
     */
    async reset(isWrongPassphrase) {
        this._password = '';

        if (isWrongPassphrase) await this._passphraseInput.onPassphraseIncorrect();
        else this._passphraseInput.reset();

        this.$el.classList.remove('repeat');
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);

        const length = this._passphraseInput.text.length;
        this.$el.classList.toggle('strength-8', length < 10);
        this.$el.classList.toggle('strength-10', length >= 10 && length < 12);
        this.$el.classList.toggle('strength-12', length >= 12);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();

        if (!this._password) {
            this._password = this._passphraseInput.text;
            this._passphraseInput.reset();
            this.$el.classList.add('repeat');
        } else if (this._password !== this._passphraseInput.text) {
            this.reset(true);
        } else {
            this.fire(PassphraseSetterBox.Events.SUBMIT, this._password);
            this.reset();
        }
    }

    _onSkip() {
        this.fire(PassphraseSetterBox.Events.SKIP);
    }
}

PassphraseSetterBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    SKIP: 'passphrasebox-skip',
};
/* global BrowserDetection */
/* global KeyStore */
/* global CookieJar */
/* global I18n */

/**
 * A common parent class for pop-up requests.
 *
 * Usage:
 * Inherit this class in your popup request API class:
 * ```
 *  class SignTransactionApi extends TopLevelApi {
 *
 *      // Define the onRequest method to receive the client's request object:
 *      onRequest(request) {
 *          // do something...
 *
 *          // When done, call this.resolve() with the result object
 *          this.resolve(result);
 *
 *          // Or this.reject() with an error
 *          this.reject(error);
 *      }
 *  }
 *
 *  // Finally, start your API:
 *  runKeyguard(SignTransactionApi);
 * ```
 */
class TopLevelApi { // eslint-disable-line no-unused-vars
    constructor() {
        if (window.self !== window.top) {
            // PopupAPI may not run in a frame
            throw new Error('Illegal use');
        }

        /** @type {Function} */
        this._resolve = () => { throw new Error('Method not defined'); };

        /** @type {Function} */
        this._reject = () => { throw new Error('Method not defined'); };

        I18n.initialize(window.TRANSLATIONS, 'en');
        I18n.translateDom();

        window.addEventListener('beforeunload', () => {
            this.reject(new Error('Keyguard popup closed'));
        });
    }

    /**
     * Method to be called by the Keyguard client via RPC
     *
     * @param {KeyguardRequest} request
     */
    async request(request) {
        /**
         * Detect migrate signalling set by the iframe
         *
         * @deprecated Only for database migration
         */
        if ((BrowserDetection.isIos() || BrowserDetection.isSafari()) && this._hasMigrateFlag()) {
            await KeyStore.instance.migrateAccountsToKeys();
        }

        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;

            this.onRequest(request).catch(reject);
        });
    }

    /**
     * Overwritten by each request's API class
     *
     * @param {KeyguardRequest} request
     * @abstract
     */
    async onRequest(request) { // eslint-disable-line no-unused-vars
        throw new Error('Not implemented');
    }

    /**
     * Called by a page's API class on success
     *
     * @param {*} result
     * @returns {Promise<void>}
     */
    async resolve(result) {
        // Keys might have changed, so update cookie for iOS and Safari users
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            const keys = await KeyStore.instance.list();
            CookieJar.fill(keys);
        }

        this._resolve(result);
    }

    /**
     * Called by a page's API class on error
     *
     * @param {Error} error
     */
    reject(error) {
        this._reject(error);
    }

    /**
     * @deprecated Only for database migration
     * @returns {boolean}
     */
    _hasMigrateFlag() {
        const match = document.cookie.match(new RegExp('migrate=([^;]+)'));
        return !!match && match[1] === '1';
    }
}
/* global TopLevelApi */
/* global FileImport */
/* global PassphraseBox */
/* global PassphraseSetterBox */
/* global Nimiq */
/* global Key */
/* global KeyStore */

class ImportFileApi extends TopLevelApi {
    constructor() {
        super();

        this._encryptedKey = new Nimiq.SerialBuffer(0);
        this._keyType = Key.Type.BIP39;

        // Start UI
        const dom = this._makeView();
        this._passphraseBox = dom.passphraseBox;
        this._passphraseSetterBox = dom.passphraseSetterBox;

        this.$loading = /** @type {HTMLDivElement} */ (document.querySelector('#loading'));
    }

    /**
     * @param {ImportRequest} request
     */
    async onRequest(request) {
        this._request = request;

        // Global cancel link
        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());

        this.run();
    }

    /**
     * @returns {{passphraseBox: PassphraseBox, passphraseSetterBox: PassphraseSetterBox}}
     */
    _makeView() {
        // Containers
        /** @type {HTMLDivElement} */
        const $fileImport = (document.querySelector('.file-import'));
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('.passphrase-box'));
        /** @type {HTMLFormElement} */
        const $passphraseSetterBox = (document.querySelector('.passphrase-setter-box'));

        // Components
        const fileImport = new FileImport($fileImport);
        const passphraseBox = new PassphraseBox($passphraseBox, { buttonI18nTag: 'passphrasebox-log-in' });
        const passphraseSetterBox = new PassphraseSetterBox($passphraseSetterBox);

        // Events
        fileImport.on(FileImport.Events.IMPORT, this._onFileImported.bind(this));
        passphraseBox.on(PassphraseBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());
        passphraseSetterBox.on(PassphraseSetterBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseSetterBox.on(PassphraseSetterBox.Events.SKIP, () => this._onPassphraseEntered(null));

        return {
            passphraseBox,
            passphraseSetterBox,
        };
    }

    /**
     * Determine key type and forward user to Passphrase input
     *
     * @param {string} encryptedKeyBase64 - Encrypted KeyPair in base64 format
     */
    _onFileImported(encryptedKeyBase64) {
        if (encryptedKeyBase64.substr(0, 2) === '#3') {
            // BIP39 Key File
            this._keyType = Key.Type.BIP39;

            this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
            this._passphraseBox.setMinLength();

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) this._goToEnterPassphrase();
            else this._goToSetPassphrase();
        } else {
            // Legacy Account Access File
            this._keyType = Key.Type.LEGACY;

            if (encryptedKeyBase64.substr(0, 2) === '#2') {
                // PIN-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
                this._passphraseBox.setMinLength(6);
            } else {
                // Passphrase-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64);
                this._passphraseBox.setMinLength(8);
            }

            this._goToEnterPassphrase();
        }
    }

    run() {
        window.location.hash = ImportFileApi.Pages.FILE_IMPORT;

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {string?} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        const key = await this._decryptAndStoreKey(passphrase);
        if (!key) {
            this._passphraseBox.onPassphraseIncorrect();
            return;
        }

        /** @type {{keyPath: string, address: Uint8Array}[]} */
        const addresses = [];

        if (key.type === Key.Type.LEGACY) {
            const address = key.deriveAddress('');
            addresses.push({
                keyPath: 'm/0\'',
                address: address.serialize(),
            });
        } else if (key.type === Key.Type.BIP39) {
            /** @type {ImportRequest} */
            (this._request).requestedKeyPaths.forEach(keyPath => {
                addresses.push({
                    keyPath,
                    address: key.deriveAddress(keyPath).serialize(),
                });
            });
        } else {
            throw new Error(`Unkown key type ${key.type}`);
        }

        /** @type {ImportResult} */
        const result = {
            keyId: key.id,
            keyType: key.type,
            addresses,
        };

        this.resolve(result);
    }

    /**
     * @param {string?} passphrase
     * @returns {Promise<?Key>}
     */
    async _decryptAndStoreKey(passphrase) {
        this.$loading.style.display = 'flex';
        try {
            // Separating the processing of the encryptionKey (password) and the secret (key) is necessary
            // to cover these scenarios:
            //     1. Encrypted key file with password or PIN
            //     2. Unencrypted key file and no new password set
            //     3. Unencrypted key file and new password set

            let secret = new Uint8Array(0);
            let encryptionKey = null;

            if (passphrase !== null) {
                // TODO Support for UTF-8 passwords
                encryptionKey = Nimiq.BufferUtils.fromAscii(passphrase);
            }

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) {
                secret = await Nimiq.CryptoUtils.decryptOtpKdf(
                    this._encryptedKey,
                    /** @type {Uint8Array} */ (encryptionKey),
                );
            } else {
                // Key File was not encrypted and the imported Uint8Array is the plain secret
                secret = this._encryptedKey;
            }

            const key = new Key(secret, this._keyType);
            await KeyStore.instance.put(key, encryptionKey || undefined);

            return key;
        } catch (e) {
            this.$loading.style.display = 'none';
            return null;
        }
    }

    _goToEnterPassphrase() {
        window.location.hash = ImportFileApi.Pages.ENTER_PASSPHRASE;
        this._passphraseBox.reset();
        this._passphraseBox.focus();
    }

    _goToSetPassphrase() {
        window.location.hash = ImportFileApi.Pages.SET_PASSPHRASE;
        this._passphraseSetterBox.reset();
        this._passphraseSetterBox.focus();
    }
}

ImportFileApi.Pages = {
    FILE_IMPORT: 'file-import',
    ENTER_PASSPHRASE: 'enter-passphrase',
    SET_PASSPHRASE: 'set-passphrase',
};
/* global runKeyguard */
/* global ImportFileApi */

runKeyguard(ImportFileApi);
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
class AnimationUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {string} className
     * @param {HTMLElement} el
     * @param {Function} [afterStartCallback]
     * @param {Function} [beforeEndCallback]
     */
    static async animate(className, el, afterStartCallback, beforeEndCallback) {
        return new Promise(resolve => {
            // 'animiationend' is a native DOM event that fires upon CSS animation completion
            /** @param {Event} e */
            const listener = e => {
                if (e.target !== el) return;
                if (beforeEndCallback instanceof Function) beforeEndCallback();
                this.stopAnimate(className, el);
                el.removeEventListener('animationend', listener);
                resolve();
            };
            el.addEventListener('animationend', listener);
            el.classList.add(className);
            if (afterStartCallback instanceof Function) afterStartCallback();
        });
    }

    /**
     * @param {string} className
     * @param {HTMLElement} el
     */
    static stopAnimate(className, el) {
        el.classList.remove(className);
    }
}
/* eslint-disable prefer-promise-reject-errors, no-throw-literal */

// eslint-disable-next-line max-len
/** @typedef {HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | File} imageOrFileOrUrl */

class QrScanner {
    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {HTMLVideoElement} video
     * @param {((value: string) => string | PromiseLike<string>)} [onDecode]
     * @param {number} [canvasSize] - Edge length of the quadratic canvas
     */
    constructor(video, onDecode, canvasSize = QrScanner.DEFAULT_CANVAS_SIZE) {
        this.$video = video;
        this.$canvas = document.createElement('canvas');
        this._onDecode = onDecode;
        this._active = false;

        this.$canvas.width = canvasSize;
        this.$canvas.height = canvasSize;
        this._sourceRect = {
            x: 0,
            y: 0,
            width: canvasSize,
            height: canvasSize,
        };

        this.$video.addEventListener('canplay', () => this._updateSourceRect());
        this.$video.addEventListener('play', () => {
            this._updateSourceRect();
            this._scanFrame();
        }, false);
        this._qrWorker = new Worker(QrScanner.WORKER_PATH);
    }

    _updateSourceRect() {
        const smallestDimension = Math.min(this.$video.videoWidth, this.$video.videoHeight);
        const sourceRectSize = Math.round(2 / 3 * smallestDimension);
        this._sourceRect.width = sourceRectSize;
        this._sourceRect.height = sourceRectSize;
        this._sourceRect.x = (this.$video.videoWidth - sourceRectSize) / 2;
        this._sourceRect.y = (this.$video.videoHeight - sourceRectSize) / 2;
    }

    /**
     * Triggers this._onDecode for each frame, calls itself recursively until the video is paused or ends
     *
     * @returns {boolean}
     */
    _scanFrame() {
        if (this.$video.paused || this.$video.ended) return false;
        requestAnimationFrame(() => {
            QrScanner.scanImage(this.$video, this._sourceRect, this._qrWorker, this.$canvas, true)
                .then(this._onDecode, /** @param {string} error */ error => {
                    if (error !== 'QR code not found.') {
                        console.error(error);
                    }
                })
                .then(() => this._scanFrame());
        });

        return true;
    }

    /**
     * @param {string | object} [facingMode]
     * @param {boolean} [exact]
     * @returns {Promise<MediaStream>}
     */
    _getCameraStream(facingMode, exact = false) {
        const constraintsToTry = [{
            width: { min: 1024 },
        }, {
            width: { min: 768 },
        }, {}];

        if (facingMode) {
            if (exact) {
                facingMode = { exact: facingMode };
            }
            constraintsToTry.forEach(constraint => { constraint.facingMode = facingMode; });
        }
        return this._getMatchingCameraStream(constraintsToTry);
    }

    /**
     * @param {Array} constraintsToTry
     * @returns {Promise<MediaStream>}
     */
    async _getMatchingCameraStream(constraintsToTry) {
        if (constraintsToTry.length === 0) {
            return Promise.reject('Camera not found.');
        }
        return navigator.mediaDevices.getUserMedia({
            video: constraintsToTry.shift(),
        }).catch(() => this._getMatchingCameraStream(constraintsToTry));
    }

    start() {
        if (this._active) {
            return Promise.resolve();
        }
        this._active = true;
        clearTimeout(/** @type {number | undefined} */ (this._offTimeout));
        let facingMode = 'environment';
        return this._getCameraStream('environment', true)
            .catch(() => {
                // we (probably) don't have an environment camera
                facingMode = 'user';
                return this._getCameraStream(); // throws if we can't access the camera
            })
            .then(stream => {
                this.$video.srcObject = stream;
                this._setVideoMirror(facingMode);
            })
            .catch(e => {
                this._active = false;
                throw e;
            });
    }

    stop() {
        if (!this._active) {
            return;
        }
        this._active = false;
        this.$video.pause();
        this._offTimeout = (setTimeout(() => {
            // @ts-ignore
            this.$video.srcObject.getTracks()[0].stop();
            this.$video.srcObject = null;
        }, 3000));
    }

    /**
     * @param {string} facingMode
     */
    _setVideoMirror(facingMode) {
        // in user facing mode mirror the video to make it easier for the user to position the QR code
        const scaleFactor = facingMode === 'user' ? -1 : 1;
        this.$video.style.transform = `scaleX(${scaleFactor})`;
    }

    /**
     * @param {number} red
     * @param {number} green
     * @param {number} blue
     */
    setGrayscaleWeights(red, green, blue) {
        this._qrWorker.postMessage({
            type: 'grayscaleWeights',
            data: { red, green, blue },
        });
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @param {object?} sourceRect
     * @param {Worker?} worker
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @param {boolean} [alsoTryWithoutSourceRect]
     * @returns {Promise<string>}
     */
    static async scanImage(imageOrFileOrUrl, sourceRect = null, worker = null, canvas = null, fixedCanvasSize = false,
        alsoTryWithoutSourceRect = false) {
        const promise = new Promise((resolve, reject) => {
            worker = worker || new Worker(QrScanner.WORKER_PATH);
            /** @type {number | undefined} */
            let timeout;
            /** @type {EventListener} */
            let onError;
            /**
             * @param {Event} event
             */
            const onMessage = event => {
                // @ts-ignore
                if (event.data.type !== 'qrResult') {
                    return;
                }
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                // @ts-ignore
                if (event.data.data !== null) {
                    // @ts-ignore
                    resolve(event.data.data);
                } else {
                    reject('QR code not found.');
                }
            };
            onError = () => {
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                reject('Worker error.');
            };
            worker.addEventListener('message', onMessage);
            worker.addEventListener('error', onError);
            timeout = setTimeout(onError, 3000);
            QrScanner._loadImage(imageOrFileOrUrl).then(image => {
                const imageData = QrScanner._getImageData(image, sourceRect, canvas, fixedCanvasSize);
                /** @type {Worker} */ (worker).postMessage({
                    type: 'decode',
                    data: imageData,
                }, [imageData.data.buffer]);
            }).catch(reject);
        });

        if (sourceRect && alsoTryWithoutSourceRect) {
            return promise.catch(() => QrScanner.scanImage(imageOrFileOrUrl, null, worker, canvas, fixedCanvasSize));
        }
        return promise;
    }


    /**
     * @param {HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap} image
     * @param {object?} sourceRect
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @returns {ImageData}
     */
    static _getImageData(image, sourceRect = null, canvas = null, fixedCanvasSize = false) {
        canvas = canvas || document.createElement('canvas');
        const sourceRectX = sourceRect && sourceRect.x ? sourceRect.x : 0;
        const sourceRectY = sourceRect && sourceRect.y ? sourceRect.y : 0;
        // @ts-ignore
        const sourceRectWidth = sourceRect && sourceRect.width ? sourceRect.width : image.width || image.videoWidth;
        const sourceRectHeight = sourceRect && sourceRect.height
            ? sourceRect.height
            : image.height
            // @ts-ignore
            || image.videoHeight;
        if (!fixedCanvasSize && (canvas.width !== sourceRectWidth || canvas.height !== sourceRectHeight)) {
            canvas.width = sourceRectWidth;
            canvas.height = sourceRectHeight;
        }
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw ('Cannot get canvas 2D context');
        context.imageSmoothingEnabled = false; // gives less blurry images
        context.drawImage(
            image,
            sourceRectX,
            sourceRectY,
            sourceRectWidth,
            sourceRectHeight,
            0,
            0,
            canvas.width,
            canvas.height,
        );
        return context.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @returns {Promise<HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap>}
     */
    static async _loadImage(imageOrFileOrUrl) {
        if (imageOrFileOrUrl instanceof HTMLCanvasElement
            || imageOrFileOrUrl instanceof HTMLVideoElement
            // @ts-ignore
            || (window.ImageBitmap && imageOrFileOrUrl instanceof window.ImageBitmap)
        ) {
            // @ts-ignore
            return Promise.resolve(imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof Image) {
            return QrScanner._awaitImageLoad(imageOrFileOrUrl).then(() => imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof File || imageOrFileOrUrl instanceof URL
            || typeof (imageOrFileOrUrl) === 'string') {
            const image = new Image();
            if (imageOrFileOrUrl instanceof File) {
                image.src = URL.createObjectURL(imageOrFileOrUrl);
            } else {
                // @ts-ignore
                image.src = imageOrFileOrUrl;
            }
            return QrScanner._awaitImageLoad(image).then(() => {
                if (imageOrFileOrUrl instanceof File) {
                    URL.revokeObjectURL(image.src);
                }
                return image;
            });
        }
        return Promise.reject('Unsupported image type.');
    }

    /**
     * @param {HTMLImageElement} image
     */
    static async _awaitImageLoad(image) {
        return new Promise((resolve, reject) => {
            if (image.complete && image.naturalWidth !== 0) {
                // already loaded
                resolve();
            } else {
                /** @type {EventListener} */
                let onError;
                const onLoad = () => { // eslint-disable-line require-jsdoc-except/require-jsdoc
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    resolve();
                };
                onError = () => {
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    reject('Image load error');
                };
                image.addEventListener('load', onLoad);
                image.addEventListener('error', onError);
            }
        });
    }
}
QrScanner.DEFAULT_CANVAS_SIZE = 400;
QrScanner.WORKER_PATH = '../../lib/QrScannerWorker.min.js';
/* global TRANSLATIONS */ // eslint-disable-line no-unused-vars
/* global Nimiq */

/**
 * @typedef {{[language: string]: {[id: string]: string}}} dict
 */

class I18n { // eslint-disable-line no-unused-vars
    /**
     * @param {dict} dictionary - Dictionary of all languages and phrases
     * @param {string} fallbackLanguage - Language to be used if no translation for the current language can be found
     */
    static initialize(dictionary, fallbackLanguage) {
        this._dict = dictionary;

        if (!(fallbackLanguage in this._dict)) {
            throw new Error(`Fallback language "${fallbackLanguage}" not defined`);
        }
        /** @type {string} */
        this._fallbackLanguage = fallbackLanguage;

        this.language = navigator.language;
    }

    /**
     * @param {HTMLElement} [dom] - The DOM element to be translated, or body by default
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     */
    static translateDom(dom = document.body, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;

        /* eslint-disable-next-line valid-jsdoc */ // Multi-line descriptions are not valid JSDoc, apparently
        /**
         * @param {string} tag
         * @param {(element: HTMLElement, translation: string) => void} callback - callback(element, translation) for
         * each matching element
         */
        const translateElements = (tag, callback) => {
            const attribute = `data-${tag}`;
            /** @type {NodeListOf<HTMLElement>} */
            const elements = dom.querySelectorAll(`[${attribute}]`);
            elements.forEach(element => {
                const id = element.getAttribute(attribute);
                if (!id) return;
                callback(element, this._translate(id, language));
            });
        };

        /**
         * @param {string} tag
         */
        const translateAttribute = tag => {
            translateElements(`i18n-${tag}`, (element, translation) => element.setAttribute(tag, translation));
        };

        translateElements('i18n', (element, translation) => {
            const sanitized = translation.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const withMarkup = sanitized.replace(/\[strong]/g, '<strong>').replace(/\[\/strong]/g, '</strong>');
            element.innerHTML = withMarkup;
        });
        translateAttribute('value');
        translateAttribute('placeholder');
    }

    /**
     * @param {string} id - translation dict ID
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     * @returns {string}
     */
    static translatePhrase(id, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;
        return this._translate(id, language);
    }

    /**
     * @param {string} id
     * @param {string} language
     * @returns {string}
     */
    static _translate(id, language) {
        if (!this.dictionary[language] || !this.dictionary[language][id]) {
            throw new Error(`I18n: ${language}/${id} is undefined!`);
        }
        return this.dictionary[language][id];
    }

    /**
     * @returns {string[]} ISO codes of all available languages.
     */
    static availableLanguages() {
        return Object.keys(this.dictionary);
    }

    /**
     * @param {string} language
     */
    static switchLanguage(language) {
        this.language = language;
    }

    /**
     * Selects a supported language closed to the desired language. Examples it might return:
     * en-us => en-us, en-us => en, en => en-us, fr => en.
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     * @returns {string}
     */
    static getClosestSupportedLanguage(language) {
        // If this language is supported, return it directly
        if (language in this.dictionary) return language;

        // Return the base language, if it exists in the dictionary
        const baseLanguage = language.split('-')[0];
        if (baseLanguage !== language && baseLanguage in this.dictionary) return baseLanguage;

        // Check if other versions (siblings) of the base language exist
        const languagePrefix = `${baseLanguage}-`;
        const siblingLanguage = this.availableLanguages()
            .find(supportedLanguage => supportedLanguage.startsWith(languagePrefix));

        return siblingLanguage || this.fallbackLanguage;
    }

    /**
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     */
    static set language(language) {
        const languageToUse = this.getClosestSupportedLanguage(language);

        if (languageToUse !== language) {
            // eslint-disable-next-line no-console
            console.warn(`Language ${language} not supported, using ${languageToUse} instead.`);
        }

        if (this._language !== languageToUse) {
            /** @type {string} */
            this._language = languageToUse;

            if (({ interactive: 1, complete: 1 })[document.readyState]) {
                this.translateDom();
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    this.translateDom();
                });
            }
            I18n.observer.fire(I18n.Events.LANGUAGE_CHANGED, this._language);
        }
    }

    /** @type {string} */
    static get language() {
        return this._language || this.fallbackLanguage;
    }

    /** @type {dict} */
    static get dictionary() {
        if (!this._dict) throw new Error('I18n not initialized');
        return this._dict;
    }

    /** @type {string} */
    static get fallbackLanguage() {
        if (!this._fallbackLanguage) throw new Error('I18n not initialized');
        return this._fallbackLanguage;
    }

    /** @returns {DOMParser} */
    static get parser() {
        /** @type {DOMParser} */
        this._parser = this._parser || new DOMParser();

        return this._parser;
    }
}

I18n.observer = new Nimiq.Observable();
I18n.Events = {
    LANGUAGE_CHANGED: 'language-changed',
};
const TRANSLATIONS = {
    en: {
        _language: 'English',
        loading: 'Loading...',
        continue: 'Continue',

        'passphrase-strength': 'Strength',
        'passphrase-placeholder': 'Enter passphrase',
        'passphrase-repeat-placeholder': 'Repeat passphrase',

        'privacy-warning-heading': 'Are you being watched?',
        'privacy-warning-text': 'Now is the perfect time to assess your surroundings. '
                              + 'Nearby windows? Hidden cameras? Shoulder spies? '
                              + 'Anyone with your backup phrase can access and spend your NIM.',
        'privacy-agent-continue': 'Continue',

        'recovery-words-title': 'Recovery Words',
        'recovery-words-input-label': 'Recovery Words',
        'recovery-words-input-field-placeholder': 'word #',
        'recovery-words-explanation': 'There really is no password recovery. The following words are a backup '
                                    + 'of your Key File and will grant you access to your wallet even if your '
                                    + 'Key File is lost.',
        'recovery-words-storing': 'Write those words on a piece of paper and store it at a safe, offline place.',

        'create-heading-choose-identicon': 'Choose your account avatar',
        'create-text-select-avatar': 'Select an avatar for your wallet\'s default account from the selection below.',
        'create-hint-more-accounts': 'You can add more accounts later.',
        'create-heading-keyfile': 'This is your Key File',
        'create-text-keyfile-info': 'Your Key File gives you full access to your wallet. '
                                  + 'You\'ll need it everytime you log in.',
        'create-hint-keyfile-password': 'To protect your wallet, first protect it with a password.',
        'create-heading-backup-account': 'Create a backup',
        'create-heading-validate-backup': 'Validate your backup',

        'import-heading-log-in': 'Log in',
        'import-link-no-wallet': 'Don\'t have a wallet yet?',
        'import-heading-protect': 'Protect your wallet',
        'import-text-set-password': 'You can now set a password to encrypt your wallet on this device.',

        'import-file-lost-file': 'Lost your Key File? You can recover your account with your 24 Recovery Words.',
        'import-file-button-words': 'Enter Recovery Words',
        'import-file-heading-unlock': 'Unlock your Key File',
        'import-file-text-unprotected-keyfile': 'Your Key File is unprotected.',

        'file-import-prompt': 'Drop your Key File here',
        'file-import-click-hint': 'Or click to select a file.',

        'enter-recovery-words-heading': 'Import from recovery words',
        'enter-recovery-words-subheading': 'Please enter your 24 recovery words.',

        'choose-key-type-heading': 'Choose key type',
        'choose-key-type-subheading': 'We couldn\'t determine the type of your key. Please select it below.',
        'choose-key-type-or': 'or',
        'choose-key-type-legacy-address-heading': 'Single address',
        'choose-key-type-legacy-address-info': 'Created before xx/xx/2018',
        'choose-key-type-bip39-address-heading': 'Multiple addresses',
        'choose-key-type-bip39-address-info': 'Created after xx/xx/2018',

        'sign-tx-heading': 'New Transaction',
        'sign-tx-includes': 'includes',
        'sign-tx-fee': 'fee',
        'sign-tx-youre-sending': 'You\'re sending',
        'sign-tx-to': 'to',
        'sign-tx-pay-with': 'Pay with',

        'passphrasebox-enter-passphrase': 'Enter your passphrase',
        'passphrasebox-protect-keyfile': 'Protect your keyfile with a password',
        'passphrasebox-repeat-password': 'Repeat your password',
        'passphrasebox-continue': 'Continue',
        'passphrasebox-log-in': 'Log in to your wallet',
        'passphrasebox-log-out': 'Confirm logout',
        'passphrasebox-download': 'Download key file',
        'passphrasebox-confirm-tx': 'Confirm transaction',
        'passphrasebox-password-strength-8': 'Great, that\'s a good password!',
        'passphrasebox-password-strength-10': 'Super, that\'s a strong password!',
        'passphrasebox-password-strength-12': 'Excellent, that\'s a very strong password!',
        'passphrasebox-password-hint': 'Your password should have at least 8 characters.',
        'passphrasebox-password-skip': 'Skip password protection for now',

        'identicon-selector-loading': 'Mixing colors',
        'identicon-selector-button-select': 'Select',
        'identicon-selector-link-back': 'Back',

        'downloadkeyfile-heading-protected': 'Your Key File is protected!',
        'downloadkeyfile-heading-unprotected': 'Your Key File is not protected!',
        'downloadkeyfile-safe-place': 'Store it in a safe place. If you lose it, it cannot be recovered!',
        'downloadkeyfile-download': 'Download Key File',
        'downloadkeyfile-download-anyway': 'Download anyway',

        'validate-words-text': 'Please select the correct word from your list of recovery words.',
        'validate-words-back': 'Back to words',
        'validate-words-skip': 'Skip validation for now',
    },
    de: {
        _language: 'Deutsch',
        loading: 'Wird geladen...',
        continue: 'Weiter',

        'passphrase-strength': 'Stärke',
        'passphrase-placeholder': 'Passphrase eingeben',
        'passphrase-repeat-placeholder': 'Passphrase wiederholen',

        'privacy-warning-heading': 'Wirst du beobachtet?',
        'privacy-warning-text': 'Jetzt ist eine gute Zeit um sich umzuschauen. Gibt es Fenster in der Nähe? '
                              + 'Versteckte Kameras? Jemand der über deine Schulter schaut? '
                              + 'Jeder der deine Wiederherstellungswörter hat, kann auf deine NIM zugreifen '
                              + 'und sie ausgeben.',
        'privacy-agent-continue': 'Weiter',

        'recovery-words-title': 'Wiederherstellungswörter',
        'recovery-words-input-label': 'Wiederherstellungswörter',
        'recovery-words-input-field-placeholder': 'Wort ',
        'recovery-words-explanation': 'Es gibt wirklich keine Password-Wiederherstellung. Die folgenden Wörter '
                                    + 'sind ein Backup von deiner Schlüsseldatei und werden dir Zugang zu deiner '
                                    + 'Wallet gewähren, auch wenn deine Schlüsseldatei verloren ist.',
        'recovery-words-storing': 'Schreibe diese Wörter auf ein Stück Papier und verwahre es an einem sicheren, '
                                + 'analogen Ort.',

        'create-heading-choose-identicon': 'Wähle deinen Konto Avatar',
        'create-text-select-avatar': 'Wähle einen Avatar für den Standard-Account deiner Wallet aus der Auswahl unten.',
        'create-hint-more-accounts': 'Neue Konten kannst du später hinzufügen.',
        'create-heading-keyfile': 'Das ist deine Wallet Datei',
        'create-text-keyfile-info': 'Deine Wallet Datei gibt dir vollen Zugang zu deiner Wallet. '
                                  + 'Du brauchst sie jedesmal wenn du dich einloggst.',
        'create-hint-keyfile-password': 'Um deine Wallet zu schützen, schütze es mit einem Passwort.',
        'create-heading-backup-account': 'Erstelle ein Backup',
        'create-heading-validate-backup': 'Überprüfe dein Backup',

        'import-heading-log-in': 'Einloggen',
        'import-link-no-wallet': 'Du hast noch keine Wallet?',
        'import-heading-protect': 'Wallet verschlüsseln',
        'import-text-set-password': 'Du kannst jetzt ein Passwort eingeben, um deine Wallet auf diesem '
                                  + 'Gerät zu verschlüsseln.',

        'import-file-lost-file': 'Schlüsseldatei verloren? Du kannst deinen Account mit deinen 24 '
                               + 'Wiederherstellungswörtern wiederherstellen',
        'import-file-button-words': 'Wiederherstellungswörter eingeben',
        'import-file-heading-unlock': 'Entsperre deine Schlüsseldatei',
        'import-file-text-unprotected-keyfile': 'Deine Schlüsseldatei ist ungeschützt.',

        'file-import-prompt': 'Ziehe deine Schlüsseldatei auf dieses Feld',
        'file-import-click-hint': 'Oder klicke um eine Datei auszuwählen.',

        'enter-recovery-words-heading': 'Mit Wiederherstellungswörtern importieren',
        'enter-recovery-words-subheading': 'Bitte gib deine 24 Wiederherstellungswörter ein.',

        'choose-key-type-heading': 'Schlüsseltyp wählen',
        'choose-key-type-subheading': 'Wir konnten den Typ deines Schlüssels nicht automatisch ermitteln. '
                                    + 'Bitte wähle ihn unten aus.',
        'choose-key-type-or': 'oder',
        'choose-key-type-legacy-address-heading': 'Einzelne Adresse',
        'choose-key-type-legacy-address-info': 'Erstellt vor xx.xx.2018',
        'choose-key-type-bip39-address-heading': 'Mehrere Adressen',
        'choose-key-type-bip39-address-info': 'Erstellt nach xx.xx.2018',

        'sign-tx-heading': 'Neue Überweisung',
        'sign-tx-includes': 'inklusive',
        'sign-tx-fee': 'Gebühr',
        'sign-tx-youre-sending': 'Du sendest',
        'sign-tx-to': 'an',
        'sign-tx-pay-with': 'Zahle mit',

        'passphrasebox-enter-passphrase': 'Gib deine Passphrase ein',
        'passphrasebox-protect-keyfile': 'Sichere dein KeyFile mit einem Passwort',
        'passphrasebox-repeat-password': 'Wiederhole dein Passwort',
        'passphrasebox-continue': 'Weiter',
        'passphrasebox-log-in': 'In deine Wallet einloggen',
        'passphrasebox-log-out': 'Abmeldung bestätigen',
        'passphrasebox-download': 'KeyFile herunterladen',
        'passphrasebox-confirm-tx': 'Überweisung bestätigen',
        'passphrasebox-password-strength-8': 'Schön, das ist ein gutes Passwort!',
        'passphrasebox-password-strength-10': 'Super, das ist ein starkes Passwort!',
        'passphrasebox-password-strength-12': 'Exzellent, das ist ein sehr starkes Passwort!',
        'passphrasebox-password-hint': 'Dein Passwort muss mindestens 8 Zeichen haben.',
        'passphrasebox-password-skip': 'Passwortschutz erstmal überspringen',

        'identicon-selector-loading': 'Mische Farben',
        'identicon-selector-button-select': 'Auswählen',
        'identicon-selector-link-back': 'Zurück',

        'downloadkeyfile-heading-protected': 'Dein Schlüsseldatei ist geschützt!',
        'downloadkeyfile-heading-unprotected': 'Dein Schlüsseldatei ist nicht geschützt!',
        'downloadkeyfile-safe-place': 'Lagere sie in einem sicheren Ort. Wenn du sie verlierst, '
                                    + 'kann sie nicht wiederhergestellt werden!',
        'downloadkeyfile-download': 'Schlüsseldatei herunterladen',
        'downloadkeyfile-download-anyway': 'Trotzdem herunterladen',

        'validate-words-text': 'Bitte wähle das richtige Wort aus deiner Liste von Wiederherstellungswörtern aus.',
        'validate-words-back': 'Zurück zu den Wörtern',
        'validate-words-skip': 'Überprüfung erstmal überspringen',
    },
};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
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
/* global Nimiq */
/* global AnimationUtils */
/* global QrScanner */
/* global I18n */

class FileImport extends Nimiq.Observable {
    /**
     * @param {HTMLDivElement} [$el]
     */
    constructor($el) {
        super();
        this.$el = FileImport._createElement($el);

        /** @type {HTMLElement} */
        this.$errorMessage = (this.$el.querySelector('.error-message'));
        /** @type {HTMLInputElement} */
        this.$fileInput = (this.$el.querySelector('input'));

        // TODO Re-add the drop target interaction and event listeners?

        this.$el.addEventListener('click', this._openFileInput.bind(this));
        this.$fileInput.addEventListener('change', this._onFileSelected.bind(this));
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('file-import');

        $el.innerHTML = `
            <h3 data-i18n="file-import-prompt">Drop your Key File here</h3>
            <span class="click-hint" data-i18n="file-import-click-hint">Or click to select a file.</span>
            <span class="error-message"></span>
            <input type="file" accept="image/*">
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @returns {HTMLElement}
     */
    getElement() {
        return this.$el;
    }

    _openFileInput() {
        this.$fileInput.click();
    }

    /**
     * @param {DOMEvent} event
     */
    _onFileSelected(event) {
        this.$errorMessage.textContent = '';
        // @ts-ignore
        const files = event.target.files;
        this._readFile(files[0]);
        this.$fileInput.value = '';
    }

    _onQrError() {
        AnimationUtils.animate('shake', this.$el);
        this.$errorMessage.textContent = 'Could not read Key File.';
    }

    /**
     * @param {File} file
     */
    async _readFile(file) {
        // TODO Add WalletBackup to keyguard-next code base
        // const qrPosition = WalletBackup.calculateQrPosition();
        const qrPosition = {
            x: 156,
            y: 548.6886,
            width: 173.4,
            height: 173.4,
            size: 185.4,
            padding: 12,
        };

        try {
            const decoded = await QrScanner.scanImage(file, qrPosition, null, null, false, true);
            this.fire(FileImport.Events.IMPORT, decoded);
        } catch (e) {
            this._onQrError();
        }
    }
}

FileImport.Events = {
    IMPORT: 'import',
};
/* global Nimiq */
/* global AnimationUtils */
/* global I18n */

class PassphraseInput extends Nimiq.Observable {
    /**
     * @param {?HTMLElement} $el
     * @param {string} placeholder
     * @param {boolean} [showStrengthIndicator]
     */
    constructor($el, placeholder = '••••••••', showStrengthIndicator = false) {
        super();
        this._minLength = PassphraseInput.DEFAULT_MIN_LENGTH;
        this._showStrengthIndicator = showStrengthIndicator;
        this.$el = PassphraseInput._createElement($el);
        this.$inputContainer = /** @type {HTMLElement} */ (this.$el.querySelector('.input-container'));
        this.$input = /** @type {HTMLInputElement} */ (this.$el.querySelector('input.password'));
        this.$eyeButton = /** @type {HTMLElement} */ (this.$el.querySelector('.eye-button'));

        /** @type {HTMLElement} */
        this.$strengthIndicator = (this.$el.querySelector('.strength-indicator'));
        /** @type {HTMLElement} */
        this.$strengthIndicatorContainer = (this.$el.querySelector('.strength-indicator-container'));
        if (!showStrengthIndicator) {
            this.$strengthIndicatorContainer.style.display = 'none';
        }

        this.$input.placeholder = placeholder;

        this.$eyeButton.addEventListener('click', () => this._changeVisibility());

        this._onInputChanged();
        this.$input.addEventListener('input', () => this._onInputChanged());
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-input');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <div class="input-container">
                <input class="password" type="password" placeholder="Enter Passphrase">
                <span class="eye-button icon-eye"/>
            </div>
            <div class="strength-indicator-container">
                <div class="label"><span data-i18n="passphrase-strength">Strength</span>:</div>
                <meter max="130" low="10" optimum="100" class="strength-indicator"></meter>
            </div>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    /** @type {HTMLInputElement} */
    get input() {
        return this.$input;
    }

    focus() {
        this.$input.focus();
    }

    reset() {
        this.$input.value = '';
        this._changeVisibility(false);
        this._onInputChanged();
    }

    async onPassphraseIncorrect() {
        await AnimationUtils.animate('shake', this.$inputContainer);
        this.reset();
    }

    /** @param {boolean} [becomeVisible] */
    _changeVisibility(becomeVisible) {
        becomeVisible = typeof becomeVisible !== 'undefined'
            ? becomeVisible
            : this.$input.getAttribute('type') === 'password';
        this.$input.setAttribute('type', becomeVisible ? 'text' : 'password');
        this.$eyeButton.classList.toggle('icon-eye-off', becomeVisible);
        this.$eyeButton.classList.toggle('icon-eye', !becomeVisible);
        this.$input.focus();
    }

    _onInputChanged() {
        const passphraseLength = this.$input.value.length;
        this._updateStrengthIndicator();
        this.valid = passphraseLength >= this._minLength;

        this.fire(PassphraseInput.Events.VALID, this.valid);
    }

    _updateStrengthIndicator() {
        const passphraseLength = this.$input.value.length;
        let strengthIndicatorValue;
        if (passphraseLength === 0) {
            strengthIndicatorValue = 0;
        } else if (passphraseLength < 7) {
            strengthIndicatorValue = 10;
        } else if (passphraseLength < 10) {
            strengthIndicatorValue = 70;
        } else if (passphraseLength < 14) {
            strengthIndicatorValue = 100;
        } else {
            strengthIndicatorValue = 130;
        }
        this.$strengthIndicator.setAttribute('value', String(strengthIndicatorValue));
    }

    /**
     * @returns {string}
     */
    get text() {
        return this.$input.value;
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._minLength = minLength || PassphraseInput.DEFAULT_MIN_LENGTH;
    }
}

PassphraseInput.Events = {
    VALID: 'passphraseinput-valid',
};

PassphraseInput.DEFAULT_MIN_LENGTH = 8;
/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
            hideInput: false, // TODO: When a key is not encrypted, no passphrase is required
            buttonI18nTag: 'passphrasebox-confirm-tx',
        };

        super();

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.cancel')).addEventListener('click', () => this._onCancel());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'center', options.bgColor);

        // To enable i18n validation with the dynamic nature of the passphrase box's contents,
        // all possible i18n tags and texts have to be specified here in the below format to
        // enable the validator to find them with its regular expression.
        /* eslint-disable max-len */
        const buttonVersions = {
            'passphrasebox-continue': '<button class="submit" data-i18n="passphrasebox-continue">Continue</button>',
            'passphrasebox-log-in': '<button class="submit" data-i18n="passphrasebox-log-in">Log in to your wallet</button>',
            'passphrasebox-log-out': '<button class="submit" data-i18n="passphrasebox-log-out">Confirm logout</button>',
            'passphrasebox-confirm-tx': '<button class="submit" data-i18n="passphrasebox-confirm-tx">Confirm transaction</button>',
        };
        /* eslint-enable max-len */

        if (!buttonVersions[options.buttonI18nTag]) throw new Error('PassphraseBox button i18n tag not defined');

        $el.innerHTML = `
            <a class="cancel icon-cancel"></a>
            <h2 class="prompt" data-i18n="passphrasebox-enter-passphrase">Enter your passphrase</h2>
            <div passphrase-input></div>
            ${buttonVersions[options.buttonI18nTag]}
        `;

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this._passphraseInput.focus();
    }

    reset() {
        this._passphraseInput.reset();
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._passphraseInput.setMinLength(minLength);
    }

    /**
     * @returns {Promise<void>}
     */
    async onPassphraseIncorrect() {
        return this._passphraseInput.onPassphraseIncorrect();
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();
        this.fire(PassphraseBox.Events.SUBMIT, this._passphraseInput.text);
    }

    _onCancel() {
        this.fire(PassphraseBox.Events.CANCEL);
    }
}

PassphraseBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    CANCEL: 'passphrasebox-cancel',
};
/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseSetterBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
        };

        super();

        this._password = '';

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseSetterBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.password-skip')).addEventListener('click', () => this._onSkip());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'setter', 'center', options.bgColor);

        /* eslint-disable max-len */
        $el.innerHTML = `
            <h2 class="prompt protect" data-i18n="passphrasebox-protect-keyfile">Protect your keyfile with a password</h2>
            <h2 class="prompt repeat" data-i18n="passphrasebox-repeat-password">Repeat your password</h2>

            <div passphrase-input></div>

            <div class="password-strength strength-8"  data-i18n="passphrasebox-password-strength-8" >Great, that's a good password!</div>
            <div class="password-strength strength-10" data-i18n="passphrasebox-password-strength-10">Super, that's a strong password!</div>
            <div class="password-strength strength-12" data-i18n="passphrasebox-password-strength-12">Excellent, that's a very strong password!</div>

            <div class="password-hint" data-i18n="passphrasebox-password-hint">Your password should have at least 8 characters.</div>
            <a tabindex="0" class="password-skip" data-i18n="passphrasebox-password-skip">Skip password protection for now</a>

            <button class="submit" data-i18n="passphrasebox-continue">Continue</button>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this._passphraseInput.focus();
    }

    /**
     * @param {boolean} [isWrongPassphrase]
     */
    async reset(isWrongPassphrase) {
        this._password = '';

        if (isWrongPassphrase) await this._passphraseInput.onPassphraseIncorrect();
        else this._passphraseInput.reset();

        this.$el.classList.remove('repeat');
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);

        const length = this._passphraseInput.text.length;
        this.$el.classList.toggle('strength-8', length < 10);
        this.$el.classList.toggle('strength-10', length >= 10 && length < 12);
        this.$el.classList.toggle('strength-12', length >= 12);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();

        if (!this._password) {
            this._password = this._passphraseInput.text;
            this._passphraseInput.reset();
            this.$el.classList.add('repeat');
        } else if (this._password !== this._passphraseInput.text) {
            this.reset(true);
        } else {
            this.fire(PassphraseSetterBox.Events.SUBMIT, this._password);
            this.reset();
        }
    }

    _onSkip() {
        this.fire(PassphraseSetterBox.Events.SKIP);
    }
}

PassphraseSetterBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    SKIP: 'passphrasebox-skip',
};
/* global BrowserDetection */
/* global KeyStore */
/* global CookieJar */
/* global I18n */

/**
 * A common parent class for pop-up requests.
 *
 * Usage:
 * Inherit this class in your popup request API class:
 * ```
 *  class SignTransactionApi extends TopLevelApi {
 *
 *      // Define the onRequest method to receive the client's request object:
 *      onRequest(request) {
 *          // do something...
 *
 *          // When done, call this.resolve() with the result object
 *          this.resolve(result);
 *
 *          // Or this.reject() with an error
 *          this.reject(error);
 *      }
 *  }
 *
 *  // Finally, start your API:
 *  runKeyguard(SignTransactionApi);
 * ```
 */
class TopLevelApi { // eslint-disable-line no-unused-vars
    constructor() {
        if (window.self !== window.top) {
            // PopupAPI may not run in a frame
            throw new Error('Illegal use');
        }

        /** @type {Function} */
        this._resolve = () => { throw new Error('Method not defined'); };

        /** @type {Function} */
        this._reject = () => { throw new Error('Method not defined'); };

        I18n.initialize(window.TRANSLATIONS, 'en');
        I18n.translateDom();

        window.addEventListener('beforeunload', () => {
            this.reject(new Error('Keyguard popup closed'));
        });
    }

    /**
     * Method to be called by the Keyguard client via RPC
     *
     * @param {KeyguardRequest} request
     */
    async request(request) {
        /**
         * Detect migrate signalling set by the iframe
         *
         * @deprecated Only for database migration
         */
        if ((BrowserDetection.isIos() || BrowserDetection.isSafari()) && this._hasMigrateFlag()) {
            await KeyStore.instance.migrateAccountsToKeys();
        }

        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;

            this.onRequest(request).catch(reject);
        });
    }

    /**
     * Overwritten by each request's API class
     *
     * @param {KeyguardRequest} request
     * @abstract
     */
    async onRequest(request) { // eslint-disable-line no-unused-vars
        throw new Error('Not implemented');
    }

    /**
     * Called by a page's API class on success
     *
     * @param {*} result
     * @returns {Promise<void>}
     */
    async resolve(result) {
        // Keys might have changed, so update cookie for iOS and Safari users
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            const keys = await KeyStore.instance.list();
            CookieJar.fill(keys);
        }

        this._resolve(result);
    }

    /**
     * Called by a page's API class on error
     *
     * @param {Error} error
     */
    reject(error) {
        this._reject(error);
    }

    /**
     * @deprecated Only for database migration
     * @returns {boolean}
     */
    _hasMigrateFlag() {
        const match = document.cookie.match(new RegExp('migrate=([^;]+)'));
        return !!match && match[1] === '1';
    }
}
/* global TopLevelApi */
/* global FileImport */
/* global PassphraseBox */
/* global PassphraseSetterBox */
/* global Nimiq */
/* global Key */
/* global KeyStore */

class ImportFileApi extends TopLevelApi {
    constructor() {
        super();

        this._encryptedKey = new Nimiq.SerialBuffer(0);
        this._keyType = Key.Type.BIP39;

        // Start UI
        const dom = this._makeView();
        this._passphraseBox = dom.passphraseBox;
        this._passphraseSetterBox = dom.passphraseSetterBox;

        this.$loading = /** @type {HTMLDivElement} */ (document.querySelector('#loading'));
    }

    /**
     * @param {ImportRequest} request
     */
    async onRequest(request) {
        this._request = request;

        // Global cancel link
        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());

        this.run();
    }

    /**
     * @returns {{passphraseBox: PassphraseBox, passphraseSetterBox: PassphraseSetterBox}}
     */
    _makeView() {
        // Containers
        /** @type {HTMLDivElement} */
        const $fileImport = (document.querySelector('.file-import'));
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('.passphrase-box'));
        /** @type {HTMLFormElement} */
        const $passphraseSetterBox = (document.querySelector('.passphrase-setter-box'));

        // Components
        const fileImport = new FileImport($fileImport);
        const passphraseBox = new PassphraseBox($passphraseBox, { buttonI18nTag: 'passphrasebox-log-in' });
        const passphraseSetterBox = new PassphraseSetterBox($passphraseSetterBox);

        // Events
        fileImport.on(FileImport.Events.IMPORT, this._onFileImported.bind(this));
        passphraseBox.on(PassphraseBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());
        passphraseSetterBox.on(PassphraseSetterBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseSetterBox.on(PassphraseSetterBox.Events.SKIP, () => this._onPassphraseEntered(null));

        return {
            passphraseBox,
            passphraseSetterBox,
        };
    }

    /**
     * Determine key type and forward user to Passphrase input
     *
     * @param {string} encryptedKeyBase64 - Encrypted KeyPair in base64 format
     */
    _onFileImported(encryptedKeyBase64) {
        if (encryptedKeyBase64.substr(0, 2) === '#3') {
            // BIP39 Key File
            this._keyType = Key.Type.BIP39;

            this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
            this._passphraseBox.setMinLength();

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) this._goToEnterPassphrase();
            else this._goToSetPassphrase();
        } else {
            // Legacy Account Access File
            this._keyType = Key.Type.LEGACY;

            if (encryptedKeyBase64.substr(0, 2) === '#2') {
                // PIN-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
                this._passphraseBox.setMinLength(6);
            } else {
                // Passphrase-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64);
                this._passphraseBox.setMinLength(8);
            }

            this._goToEnterPassphrase();
        }
    }

    run() {
        window.location.hash = ImportFileApi.Pages.FILE_IMPORT;

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {string?} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        const key = await this._decryptAndStoreKey(passphrase);
        if (!key) {
            this._passphraseBox.onPassphraseIncorrect();
            return;
        }

        /** @type {{keyPath: string, address: Uint8Array}[]} */
        const addresses = [];

        if (key.type === Key.Type.LEGACY) {
            const address = key.deriveAddress('');
            addresses.push({
                keyPath: 'm/0\'',
                address: address.serialize(),
            });
        } else if (key.type === Key.Type.BIP39) {
            /** @type {ImportRequest} */
            (this._request).requestedKeyPaths.forEach(keyPath => {
                addresses.push({
                    keyPath,
                    address: key.deriveAddress(keyPath).serialize(),
                });
            });
        } else {
            throw new Error(`Unkown key type ${key.type}`);
        }

        /** @type {ImportResult} */
        const result = {
            keyId: key.id,
            keyType: key.type,
            addresses,
        };

        this.resolve(result);
    }

    /**
     * @param {string?} passphrase
     * @returns {Promise<?Key>}
     */
    async _decryptAndStoreKey(passphrase) {
        this.$loading.style.display = 'flex';
        try {
            // Separating the processing of the encryptionKey (password) and the secret (key) is necessary
            // to cover these scenarios:
            //     1. Encrypted key file with password or PIN
            //     2. Unencrypted key file and no new password set
            //     3. Unencrypted key file and new password set

            let secret = new Uint8Array(0);
            let encryptionKey = null;

            if (passphrase !== null) {
                // TODO Support for UTF-8 passwords
                encryptionKey = Nimiq.BufferUtils.fromAscii(passphrase);
            }

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) {
                secret = await Nimiq.CryptoUtils.decryptOtpKdf(
                    this._encryptedKey,
                    /** @type {Uint8Array} */ (encryptionKey),
                );
            } else {
                // Key File was not encrypted and the imported Uint8Array is the plain secret
                secret = this._encryptedKey;
            }

            const key = new Key(secret, this._keyType);
            await KeyStore.instance.put(key, encryptionKey || undefined);

            return key;
        } catch (e) {
            this.$loading.style.display = 'none';
            return null;
        }
    }

    _goToEnterPassphrase() {
        window.location.hash = ImportFileApi.Pages.ENTER_PASSPHRASE;
        this._passphraseBox.reset();
        this._passphraseBox.focus();
    }

    _goToSetPassphrase() {
        window.location.hash = ImportFileApi.Pages.SET_PASSPHRASE;
        this._passphraseSetterBox.reset();
        this._passphraseSetterBox.focus();
    }
}

ImportFileApi.Pages = {
    FILE_IMPORT: 'file-import',
    ENTER_PASSPHRASE: 'enter-passphrase',
    SET_PASSPHRASE: 'set-passphrase',
};
/* global runKeyguard */
/* global ImportFileApi */

runKeyguard(ImportFileApi);
