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
class Iqons {
    /* Public API */

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async svg(text) {
        const hash = this._hash(text);
        return this._svgTemplate(
            parseInt(hash[0], 10),
            parseInt(hash[2], 10),
            parseInt(hash[3] + hash[4], 10),
            parseInt(hash[5] + hash[6], 10),
            parseInt(hash[7] + hash[8], 10),
            parseInt(hash[9] + hash[10], 10),
            parseInt(hash[11], 10),
        );
    }

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async toDataUrl(text) {
        const base64string = btoa(await this.svg(text));
        return `data:image/svg+xml;base64,${base64string.replace(/#/g, '%23')}`;
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholder(color, strokeWidth) {
        color = color || '#bbb';
        strokeWidth = strokeWidth || 1;
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
    <path fill="none" stroke="${color}" stroke-width="${2 * strokeWidth}" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
    <g transform="scale(0.9) translate(9, 8)">
        <circle cx="80" cy="80" r="40" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity=".9"></circle>
        <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>\`
    </g>
</svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholderToDataUrl(color, strokeWidth) {
        return `data:image/svg+xml;base64,${btoa(this.placeholder(color, strokeWidth))}`;
    }

    /* Private API */

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _svgTemplate(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        return this._$svg(await this._$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor));
    }

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        if (color === backgroundColor) {
            color += 1;
            if (color > 9) color = 0;
        }

        while (accentColor === color || accentColor === backgroundColor) {
            accentColor += 1;
            if (accentColor > 9) accentColor = 0;
        }

        const colorString = this.colors[color];
        const backgroundColorString = this.colors[backgroundColor];
        const accentColorString = this.colors[accentColor];

        /* eslint-disable max-len */
        return `<g color="${colorString}" fill="${accentColorString}">
    <rect fill="${backgroundColorString}" x="0" y="0" width="160" height="160"></rect>
    <circle cx="80" cy="80" r="40" fill="${colorString}"></circle>
    <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>
    ${await this._generatePart('top', topNr)}
    ${await this._generatePart('side', sidesNr)}
    ${await this._generatePart('face', faceNr)}
    ${await this._generatePart('bottom', bottomNr)}
</g>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} content
     * @returns {string}
     */
    static _$svg(content) {
        const randomId = this._getRandomId();
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
    <defs>
        <clipPath id="hexagon-clip-${randomId}" transform="scale(0.5) translate(0, 16)">
            <path d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
        </clipPath>
    </defs>
    <path fill="white" stroke="#bbbbbb" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
    <g transform="scale(0.9) translate(9, 8)">
        <g clip-path="url(#hexagon-clip-${randomId})">
            ${content}
        </g>
    </g>
</svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} part
     * @param {number} index
     * @returns {Promise<string>}
     */
    static async _generatePart(part, index) {
        const assets = await this._getAssets();
        const selector = `#${part}_${this._assetIndex(index, part)}`;
        const $part = assets.querySelector(selector);
        return ($part && $part.innerHTML) || '';
    }

    /**
     * @returns {Promise<Document>}
     */
    static async _getAssets() {
        /** @type {Promise<Document>} */
        this._assetPromise = this._assetPromise || fetch(this.svgPath)
            .then(response => response.text())
            .then(assetsText => {
                const parser = new DOMParser();
                const assets = parser.parseFromString(assetsText, 'image/svg+xml');
                this._assets = assets;
                return assets;
            });
        return this._assetPromise;
    }

    static get hasAssets() {
        return !!this._assets;
    }

    /** @type {string[]} */
    static get colors() {
        return [
            '#fb8c00', // orange-600
            '#d32f2f', // red-700
            '#fbc02d', // yellow-700
            '#3949ab', // indigo-600
            '#03a9f4', // light-blue-500
            '#8e24aa', // purple-600
            '#009688', // teal-500
            '#f06292', // pink-300
            '#7cb342', // light-green-600
            '#795548', // brown-400
        ];
    }

    /** @type {object} */
    static get assetCounts() {
        return {
            face: Iqons.CATALOG.face.length,
            side: Iqons.CATALOG.side.length,
            top: Iqons.CATALOG.top.length,
            bottom: Iqons.CATALOG.bottom.length,
        };
    }

    /**
     * @param {number} index
     * @param {string} part
     * @returns {string}
     */
    static _assetIndex(index, part) {
        index = (index % this.assetCounts[part]) + 1;
        let fullIndex = index.toString();
        if (index < 10) fullIndex = `0${fullIndex}`;
        return fullIndex;
    }

    /**
     * @param {string} text
     * @returns {string}
     */
    static _hash(text) {
        return (`${text
            .split('')
            .map(c => Number(c.charCodeAt(0)) + 3)
            .reduce((a, e) => a * (1 - a) * this._chaosHash(e), 0.5)}`)
            .split('')
            .reduce((a, e) => e + a, '')
            .substr(4, 17);
    }

    /**
     * @param {number} number
     * @returns {number}
     */
    static _chaosHash(number) {
        const k = 3.569956786876;
        let an = 1 / number;
        for (let i = 0; i < 100; i++) {
            an = (1 - an) * an * k;
        }
        return an;
    }

    /**
     * @returns {number}
     */
    static _getRandomId() {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0];
    }
}

Iqons.svgPath = '../../lib/Iqons.min.svg';

Iqons.CATALOG = {
    face: [
        'face_01', 'face_02', 'face_03', 'face_04', 'face_05', 'face_06', 'face_07',
        'face_08', 'face_09', 'face_10', 'face_11', 'face_12', 'face_13', 'face_14',
        'face_15', 'face_16', 'face_17', 'face_18', 'face_19', 'face_20', 'face_21',
    ],
    side: [
        'side_01', 'side_02', 'side_03', 'side_04', 'side_05', 'side_06', 'side_07',
        'side_08', 'side_09', 'side_10', 'side_11', 'side_12', 'side_13', 'side_14',
        'side_15', 'side_16', 'side_17', 'side_18', 'side_19', 'side_20', 'side_21',
    ],
    top: [
        'top_01', 'top_02', 'top_03', 'top_04', 'top_05', 'top_06', 'top_07',
        'top_08', 'top_09', 'top_10', 'top_11', 'top_12', 'top_13', 'top_14',
        'top_15', 'top_16', 'top_17', 'top_18', 'top_19', 'top_20', 'top_21',
    ],
    bottom: [
        'bottom_01', 'bottom_02', 'bottom_03', 'bottom_04', 'bottom_05', 'bottom_06', 'bottom_07',
        'bottom_08', 'bottom_09', 'bottom_10', 'bottom_11', 'bottom_12', 'bottom_13', 'bottom_14',
        'bottom_15', 'bottom_16', 'bottom_17', 'bottom_18', 'bottom_19', 'bottom_20', 'bottom_21',
    ],
};
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
/* global Iqons */

class Identicon { // eslint-disable-line no-unused-vars
    /**
     * @param {string} [address]
     * @param {HTMLDivElement} [$el]
     */
    constructor(address, $el) {
        this._address = address;

        this.$el = Identicon._createElement($el);
        this.$imgEl = this.$el.firstChild;

        this._updateIqon();
    }

    /**
     * @returns {HTMLDivElement}
     */
    getElement() {
        return this.$el;
    }

    /**
     * @param {string} address
     */
    set address(address) {
        this._address = address;
        this._updateIqon();
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        const $element = $el || document.createElement('div');
        const imageElement = document.createElement('img');
        $element.classList.add('identicon');
        $element.appendChild(imageElement);

        return $element;
    }

    _updateIqon() {
        if (!this._address || !Iqons.hasAssets) {
            /** @type {HTMLImageElement} */ (this.$imgEl).src = Iqons.placeholderToDataUrl();
        }

        if (this._address) {
            Iqons.toDataUrl(this._address).then(url => {
                // Placeholder setting above is synchronous, thus this async result will replace the placeholder
                /** @type {HTMLImageElement} */ (this.$imgEl).src = url;
            });
        }
    }
}
/* global Nimiq */

class PaymentInfoLine extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {string} domain
     * @param {string} formattedAmount
     */
    constructor($el, domain, formattedAmount) {
        super();
        this.$el = PaymentInfoLine._createElement($el, domain, formattedAmount);
        this.$el.classList.remove('display-none');
    }

    /**
     * @param {?HTMLElement} [$el]
     * @param {string} domain
     * @param {string} formattedAmount
     * @returns {HTMLElement}
     */
    static _createElement($el, domain, formattedAmount) {
        $el = $el || document.createElement('div');
        $el.classList.add('payment-info-line');

        $el.innerHTML = `
            <div class="description">
                Payment to
                <span domain></span>
            </div>
            <div class="amount">
                <span amount></span>
                <span class="nim-symbol"></span>
            </div>
        `;

        /** @type {HTMLElement} */ ($el.querySelector('[domain]')).textContent = domain;
        /** @type {HTMLElement} */ ($el.querySelector('[amount]')).textContent = formattedAmount;

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
}
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
/* global Nimiq */
/* global KeyStore */
/* global Identicon */
/* global PassphraseBox */

class BaseLayout {
    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        /** @type {HTMLDivElement} */
        const $pageBody = (document.querySelector('#confirm-transaction .transaction'));

        /** @type {HTMLDivElement} */
        const $senderIdenticon = ($pageBody.querySelector('#sender-identicon'));
        /** @type {HTMLDivElement} */
        const $recipientIdenticon = ($pageBody.querySelector('#recipient-identicon'));

        /** @type {HTMLDivElement} */
        const $senderLabel = ($pageBody.querySelector('#sender-label'));
        /** @type {HTMLDivElement} */
        const $recipientLabel = ($pageBody.querySelector('#recipient-label'));

        /** @type {HTMLDivElement} */
        const $senderAddress = ($pageBody.querySelector('#sender-address'));
        /** @type {HTMLDivElement} */
        const $recipientAddress = ($pageBody.querySelector('#recipient-address'));

        /** @type {HTMLDivElement} */
        const $value = ($pageBody.querySelector('#value'));
        /** @type {HTMLDivElement} */
        const $fee = ($pageBody.querySelector('#fee'));
        /** @type {HTMLDivElement} */
        const $data = ($pageBody.querySelector('#data'));

        // Set sender data.
        const transaction = request.transaction;
        const senderAddress = transaction.sender.toUserFriendlyAddress();
        new Identicon(senderAddress, $senderIdenticon); // eslint-disable-line no-new
        $senderAddress.textContent = senderAddress;
        if (request.senderLabel) {
            $senderLabel.classList.remove('display-none');
            $senderLabel.textContent = request.senderLabel;
        }

        // Set recipient data.
        if ($recipientAddress) {
            const recipientAddress = transaction.recipient.toUserFriendlyAddress();
            if (request.layout === 'checkout') {
                new Identicon(undefined, $recipientIdenticon); // eslint-disable-line no-new
            } else {
                new Identicon(recipientAddress, $recipientIdenticon); // eslint-disable-line no-new
            }
            $recipientAddress.textContent = recipientAddress;
            if (request.recipientLabel) {
                $recipientLabel.classList.remove('display-none');
                $recipientLabel.textContent = request.recipientLabel;
            }
        }

        // Set value and fee.
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);

        $value.textContent = this._formatNumber(totalNim);

        if ($fee && transaction.fee > 0) {
            $fee.textContent = Nimiq.Policy.satoshisToCoins(transaction.fee).toString();
            /** @type {HTMLDivElement} */
            const $feeSection = ($pageBody.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        // Set transaction extra data.
        if ($data && transaction.data.byteLength > 0) {
            // FIXME Detect and use proper encoding.
            $data.textContent = Nimiq.BufferUtils.toAscii(transaction.data);
            /** @type {HTMLDivElement} */
            const $dataSection = ($pageBody.querySelector('.data-section'));
            $dataSection.classList.remove('display-none');
        }

        // Set up passphrase box.
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('#passphrase-box'));
        this._passphraseBox = new PassphraseBox($passphraseBox, {
            bgColor: 'purple',
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passphrasebox-confirm-tx',
        });

        this._passphraseBox.on(
            PassphraseBox.Events.SUBMIT,
            passphrase => this._onConfirm(request, resolve, reject, passphrase),
        );
        this._passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());
    }

    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     * @param {string} passphrase
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, passphrase) {
        document.body.classList.add('loading');

        try {
            // XXX Passphrase encoding
            const passphraseBuf = Nimiq.BufferUtils.fromAscii(passphrase);
            const key = await KeyStore.instance.get(request.keyInfo.id, passphraseBuf);
            if (!key) {
                reject(new Error('Failed to retrieve key'));
                return;
            }

            const publicKey = key.derivePublicKey(request.keyPath);
            const signature = key.sign(request.keyPath, request.transaction.serializeContent());
            const result = /** @type {SignTransactionResult} */ {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
            resolve(result);
        } catch (e) {
            console.error(e);
            document.body.classList.remove('loading');

            // Assume the passphrase was wrong
            this._passphraseBox.onPassphraseIncorrect();
        }
    }

    run() {
        // Go to start page
        window.location.hash = BaseLayout.Pages.CONFIRM_TRANSACTION;
        this._passphraseBox.focus();

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {number} value
     * @param {number} [maxDecimals]
     * @param {number} [minDecimals]
     * @returns {string}
     */
    _formatNumber(value, maxDecimals = 5, minDecimals = 2) {
        const roundingFactor = 10 ** maxDecimals;
        value = Math.floor(value * roundingFactor) / roundingFactor;

        const result = parseFloat(value.toFixed(minDecimals)) === value
            ? value.toFixed(minDecimals)
            : value.toString();

        if (Math.abs(value) < 10000) return result;

        // Add thin spaces (U+202F) every 3 digits. Stop at the decimal separator if there is one.
        const regexp = minDecimals > 0 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(\d{3})+$)/g;
        return result.replace(regexp, '$1\u202F');
    }
}

BaseLayout.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
/* global BaseLayout */
/* global I18n */

class LayoutStandard extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutStandard._createElement($el);
        super(request, resolve, reject);
        this.$el = container;
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-standard');

        $el.innerHTML = `
            <div class="page-header">
                <!-- <a tabindex="0" class="page-header-back-button icon-back-arrow"></a> -->
                <h1 data-i18n="sign-tx-heading">New Transaction</h1>
            </div>

            <div class="page-body transaction">
                <div class="center accounts">
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="label display-none" id="sender-label"></div>
                        <div class="address" id="sender-address"></div>
                    </div>

                    <i class="arrow icon-forward-chevron"></i>

                    <div class="account">
                        <div class="identicon" id="recipient-identicon"></div>
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center total">
                    <div class="value">
                        <span id="value"></span><span class="nim-symbol"></span>
                    </div>
                </div>

                <div class="center fee-section display-none">
                    <span data-i18n="sign-tx-includes">includes</span>
                    <span id="fee"></span>
                    <span class="nim-symbol"></span>
                    <span data-i18n="sign-tx-fee">fee</span>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }
}
/* global BaseLayout */
/* global I18n */
/* global Nimiq */
/* global PaymentInfoLine */

class LayoutCheckout extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        request.recipientLabel = LayoutCheckout._originToDomain(request.shopOrigin);

        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutCheckout._createElement($el);
        super(request, resolve, reject);
        this.$el = container;

        // Set up payment-info-line
        const $paymentInfoLine = /** @type {HTMLElement} */ (document.querySelector('.payment-info-line'));

        const transaction = request.transaction;
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);
        new PaymentInfoLine( // eslint-disable-line no-new
            $paymentInfoLine,
            LayoutCheckout._originToDomain(request.shopOrigin),
            this._formatNumber(totalNim),
        );
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-checkout');

        $el.innerHTML = `
            <div class="page-body transaction">
                <h1>
                    <span data-i18n="sign-tx-youre-sending">You're sending</span>
                    <strong id="value"></strong>
                    <strong class="nim-symbol"></strong>
                    <span data-i18n="sign-tx-to">to</span>
                </h1>

                <div class="account shop-account">
                    <div class="identicon-cover"></div>
                    <div class="identicon" id="recipient-identicon"></div>
                    <div class="account-text">
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>

                <div class="sender-section">
                    <h2 data-i18n="sign-tx-pay-with">Pay with</h2>
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="account-text">
                            <div class="label display-none" id="sender-label"></div>
                            <div class="address" id="sender-address"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @param {string} [origin]
     * @returns {string}
     */
    static _originToDomain(origin) {
        if (!origin) return '---';
        return origin.split('://')[1] || '---';
    }
}
/* global Nimiq */
/* global KeyStore */
/* global TopLevelApi */
/* global LayoutStandard */
/* global LayoutCheckout */

class SignTransactionApi extends TopLevelApi {
    /**
     * @param {SignTransactionRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await SignTransactionApi._parseRequest(request);
        const $layoutContainer = document.getElementById('layout-container');

        const handler = new SignTransactionApi.Layouts[parsedRequest.layout](
            $layoutContainer,
            parsedRequest,
            this.resolve.bind(this),
            this.reject.bind(this),
        );

        handler.run();
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Promise<ParsedSignTransactionRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        // Check that the layout is valid
        if (request.layout && !SignTransactionApi.Layouts[request.layout]) {
            throw new Error('Invalid selected layout');
        }

        // Check that keyId is given.
        if (typeof request.keyId !== 'string' || !request.keyId) {
            throw new Error('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Error('Unknown keyId');
        }

        // Check that keyPath is given.
        if (typeof request.keyPath !== 'string' || !request.keyPath) {
            throw new Error('keyPath is required');
        }

        // Check that keyPath is valid.
        if (!Nimiq.ExtendedPrivateKey.isValidPath(request.keyPath)) {
            throw new Error('Invalid keyPath');
        }

        // Parse transaction.
        const transaction = SignTransactionApi._parseTransaction(request);

        // Check that the transaction is for the correct network.
        if (transaction.networkId !== Nimiq.GenesisConfig.NETWORK_ID) {
            throw new Error('Transaction is not valid in this network');
        }

        // Check that sender != recipient.
        if (transaction.recipient.equals(transaction.sender)) {
            throw new Error('Sender and recipient must not match');
        }

        // Check sender / recipient account type.
        const accountTypes = new Set([Nimiq.Account.Type.BASIC, Nimiq.Account.Type.VESTING, Nimiq.Account.Type.HTLC]);
        if (!accountTypes.has(transaction.senderType) || !accountTypes.has(transaction.recipientType)) {
            throw new Error('Invalid sender type');
        }

        // Validate labels.
        const labels = [request.keyLabel, request.senderLabel, request.recipientLabel];
        if (labels.some(label => label !== undefined && (typeof label !== 'string' || label.length > 64))) {
            throw new Error('Invalid label');
        }

        return /** @type {ParsedSignTransactionRequest} */ {
            layout: request.layout || 'standard',
            shopOrigin: request.shopOrigin,
            appName: request.appName,

            keyInfo,
            keyPath: request.keyPath,
            transaction,

            keyLabel: request.keyLabel,
            senderLabel: request.senderLabel,
            recipientLabel: request.recipientLabel,
        };
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Nimiq.ExtendedTransaction}
     * @private
     */
    static _parseTransaction(request) {
        const sender = new Nimiq.Address(request.sender);
        const senderType = request.senderType || Nimiq.Account.Type.BASIC;
        const recipient = new Nimiq.Address(request.recipient);
        const recipientType = request.recipientType || Nimiq.Account.Type.BASIC;
        const flags = request.flags || Nimiq.Transaction.Flag.NONE;
        const data = request.data || new Uint8Array(0);
        const networkId = request.networkId || Nimiq.GenesisConfig.NETWORK_ID;
        return new Nimiq.ExtendedTransaction(
            sender,
            senderType,
            recipient,
            recipientType,
            request.value,
            request.fee,
            request.validityStartHeight,
            flags,
            data,
            new Uint8Array(0), // proof
            networkId,
        );
    }
}

SignTransactionApi.Layouts = {
    standard: LayoutStandard,
    checkout: LayoutCheckout,
    // 'cashlink': LayoutCashlink,
};
/* global SignTransactionApi */
/* global runKeyguard */

runKeyguard(SignTransactionApi);
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
class Iqons {
    /* Public API */

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async svg(text) {
        const hash = this._hash(text);
        return this._svgTemplate(
            parseInt(hash[0], 10),
            parseInt(hash[2], 10),
            parseInt(hash[3] + hash[4], 10),
            parseInt(hash[5] + hash[6], 10),
            parseInt(hash[7] + hash[8], 10),
            parseInt(hash[9] + hash[10], 10),
            parseInt(hash[11], 10),
        );
    }

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async toDataUrl(text) {
        const base64string = btoa(await this.svg(text));
        return `data:image/svg+xml;base64,${base64string.replace(/#/g, '%23')}`;
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholder(color, strokeWidth) {
        color = color || '#bbb';
        strokeWidth = strokeWidth || 1;
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
    <path fill="none" stroke="${color}" stroke-width="${2 * strokeWidth}" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
    <g transform="scale(0.9) translate(9, 8)">
        <circle cx="80" cy="80" r="40" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity=".9"></circle>
        <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>\`
    </g>
</svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholderToDataUrl(color, strokeWidth) {
        return `data:image/svg+xml;base64,${btoa(this.placeholder(color, strokeWidth))}`;
    }

    /* Private API */

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _svgTemplate(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        return this._$svg(await this._$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor));
    }

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        if (color === backgroundColor) {
            color += 1;
            if (color > 9) color = 0;
        }

        while (accentColor === color || accentColor === backgroundColor) {
            accentColor += 1;
            if (accentColor > 9) accentColor = 0;
        }

        const colorString = this.colors[color];
        const backgroundColorString = this.colors[backgroundColor];
        const accentColorString = this.colors[accentColor];

        /* eslint-disable max-len */
        return `<g color="${colorString}" fill="${accentColorString}">
    <rect fill="${backgroundColorString}" x="0" y="0" width="160" height="160"></rect>
    <circle cx="80" cy="80" r="40" fill="${colorString}"></circle>
    <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>
    ${await this._generatePart('top', topNr)}
    ${await this._generatePart('side', sidesNr)}
    ${await this._generatePart('face', faceNr)}
    ${await this._generatePart('bottom', bottomNr)}
</g>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} content
     * @returns {string}
     */
    static _$svg(content) {
        const randomId = this._getRandomId();
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
    <defs>
        <clipPath id="hexagon-clip-${randomId}" transform="scale(0.5) translate(0, 16)">
            <path d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
        </clipPath>
    </defs>
    <path fill="white" stroke="#bbbbbb" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
    <g transform="scale(0.9) translate(9, 8)">
        <g clip-path="url(#hexagon-clip-${randomId})">
            ${content}
        </g>
    </g>
</svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} part
     * @param {number} index
     * @returns {Promise<string>}
     */
    static async _generatePart(part, index) {
        const assets = await this._getAssets();
        const selector = `#${part}_${this._assetIndex(index, part)}`;
        const $part = assets.querySelector(selector);
        return ($part && $part.innerHTML) || '';
    }

    /**
     * @returns {Promise<Document>}
     */
    static async _getAssets() {
        /** @type {Promise<Document>} */
        this._assetPromise = this._assetPromise || fetch(this.svgPath)
            .then(response => response.text())
            .then(assetsText => {
                const parser = new DOMParser();
                const assets = parser.parseFromString(assetsText, 'image/svg+xml');
                this._assets = assets;
                return assets;
            });
        return this._assetPromise;
    }

    static get hasAssets() {
        return !!this._assets;
    }

    /** @type {string[]} */
    static get colors() {
        return [
            '#fb8c00', // orange-600
            '#d32f2f', // red-700
            '#fbc02d', // yellow-700
            '#3949ab', // indigo-600
            '#03a9f4', // light-blue-500
            '#8e24aa', // purple-600
            '#009688', // teal-500
            '#f06292', // pink-300
            '#7cb342', // light-green-600
            '#795548', // brown-400
        ];
    }

    /** @type {object} */
    static get assetCounts() {
        return {
            face: Iqons.CATALOG.face.length,
            side: Iqons.CATALOG.side.length,
            top: Iqons.CATALOG.top.length,
            bottom: Iqons.CATALOG.bottom.length,
        };
    }

    /**
     * @param {number} index
     * @param {string} part
     * @returns {string}
     */
    static _assetIndex(index, part) {
        index = (index % this.assetCounts[part]) + 1;
        let fullIndex = index.toString();
        if (index < 10) fullIndex = `0${fullIndex}`;
        return fullIndex;
    }

    /**
     * @param {string} text
     * @returns {string}
     */
    static _hash(text) {
        return (`${text
            .split('')
            .map(c => Number(c.charCodeAt(0)) + 3)
            .reduce((a, e) => a * (1 - a) * this._chaosHash(e), 0.5)}`)
            .split('')
            .reduce((a, e) => e + a, '')
            .substr(4, 17);
    }

    /**
     * @param {number} number
     * @returns {number}
     */
    static _chaosHash(number) {
        const k = 3.569956786876;
        let an = 1 / number;
        for (let i = 0; i < 100; i++) {
            an = (1 - an) * an * k;
        }
        return an;
    }

    /**
     * @returns {number}
     */
    static _getRandomId() {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0];
    }
}

Iqons.svgPath = '../../lib/Iqons.min.svg';

Iqons.CATALOG = {
    face: [
        'face_01', 'face_02', 'face_03', 'face_04', 'face_05', 'face_06', 'face_07',
        'face_08', 'face_09', 'face_10', 'face_11', 'face_12', 'face_13', 'face_14',
        'face_15', 'face_16', 'face_17', 'face_18', 'face_19', 'face_20', 'face_21',
    ],
    side: [
        'side_01', 'side_02', 'side_03', 'side_04', 'side_05', 'side_06', 'side_07',
        'side_08', 'side_09', 'side_10', 'side_11', 'side_12', 'side_13', 'side_14',
        'side_15', 'side_16', 'side_17', 'side_18', 'side_19', 'side_20', 'side_21',
    ],
    top: [
        'top_01', 'top_02', 'top_03', 'top_04', 'top_05', 'top_06', 'top_07',
        'top_08', 'top_09', 'top_10', 'top_11', 'top_12', 'top_13', 'top_14',
        'top_15', 'top_16', 'top_17', 'top_18', 'top_19', 'top_20', 'top_21',
    ],
    bottom: [
        'bottom_01', 'bottom_02', 'bottom_03', 'bottom_04', 'bottom_05', 'bottom_06', 'bottom_07',
        'bottom_08', 'bottom_09', 'bottom_10', 'bottom_11', 'bottom_12', 'bottom_13', 'bottom_14',
        'bottom_15', 'bottom_16', 'bottom_17', 'bottom_18', 'bottom_19', 'bottom_20', 'bottom_21',
    ],
};
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
/* global Iqons */

class Identicon { // eslint-disable-line no-unused-vars
    /**
     * @param {string} [address]
     * @param {HTMLDivElement} [$el]
     */
    constructor(address, $el) {
        this._address = address;

        this.$el = Identicon._createElement($el);
        this.$imgEl = this.$el.firstChild;

        this._updateIqon();
    }

    /**
     * @returns {HTMLDivElement}
     */
    getElement() {
        return this.$el;
    }

    /**
     * @param {string} address
     */
    set address(address) {
        this._address = address;
        this._updateIqon();
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        const $element = $el || document.createElement('div');
        const imageElement = document.createElement('img');
        $element.classList.add('identicon');
        $element.appendChild(imageElement);

        return $element;
    }

    _updateIqon() {
        if (!this._address || !Iqons.hasAssets) {
            /** @type {HTMLImageElement} */ (this.$imgEl).src = Iqons.placeholderToDataUrl();
        }

        if (this._address) {
            Iqons.toDataUrl(this._address).then(url => {
                // Placeholder setting above is synchronous, thus this async result will replace the placeholder
                /** @type {HTMLImageElement} */ (this.$imgEl).src = url;
            });
        }
    }
}
/* global Nimiq */

class PaymentInfoLine extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {string} domain
     * @param {string} formattedAmount
     */
    constructor($el, domain, formattedAmount) {
        super();
        this.$el = PaymentInfoLine._createElement($el, domain, formattedAmount);
        this.$el.classList.remove('display-none');
    }

    /**
     * @param {?HTMLElement} [$el]
     * @param {string} domain
     * @param {string} formattedAmount
     * @returns {HTMLElement}
     */
    static _createElement($el, domain, formattedAmount) {
        $el = $el || document.createElement('div');
        $el.classList.add('payment-info-line');

        $el.innerHTML = `
            <div class="description">
                Payment to
                <span domain></span>
            </div>
            <div class="amount">
                <span amount></span>
                <span class="nim-symbol"></span>
            </div>
        `;

        /** @type {HTMLElement} */ ($el.querySelector('[domain]')).textContent = domain;
        /** @type {HTMLElement} */ ($el.querySelector('[amount]')).textContent = formattedAmount;

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
}
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
/* global Nimiq */
/* global KeyStore */
/* global Identicon */
/* global PassphraseBox */

class BaseLayout {
    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        /** @type {HTMLDivElement} */
        const $pageBody = (document.querySelector('#confirm-transaction .transaction'));

        /** @type {HTMLDivElement} */
        const $senderIdenticon = ($pageBody.querySelector('#sender-identicon'));
        /** @type {HTMLDivElement} */
        const $recipientIdenticon = ($pageBody.querySelector('#recipient-identicon'));

        /** @type {HTMLDivElement} */
        const $senderLabel = ($pageBody.querySelector('#sender-label'));
        /** @type {HTMLDivElement} */
        const $recipientLabel = ($pageBody.querySelector('#recipient-label'));

        /** @type {HTMLDivElement} */
        const $senderAddress = ($pageBody.querySelector('#sender-address'));
        /** @type {HTMLDivElement} */
        const $recipientAddress = ($pageBody.querySelector('#recipient-address'));

        /** @type {HTMLDivElement} */
        const $value = ($pageBody.querySelector('#value'));
        /** @type {HTMLDivElement} */
        const $fee = ($pageBody.querySelector('#fee'));
        /** @type {HTMLDivElement} */
        const $data = ($pageBody.querySelector('#data'));

        // Set sender data.
        const transaction = request.transaction;
        const senderAddress = transaction.sender.toUserFriendlyAddress();
        new Identicon(senderAddress, $senderIdenticon); // eslint-disable-line no-new
        $senderAddress.textContent = senderAddress;
        if (request.senderLabel) {
            $senderLabel.classList.remove('display-none');
            $senderLabel.textContent = request.senderLabel;
        }

        // Set recipient data.
        if ($recipientAddress) {
            const recipientAddress = transaction.recipient.toUserFriendlyAddress();
            if (request.layout === 'checkout') {
                new Identicon(undefined, $recipientIdenticon); // eslint-disable-line no-new
            } else {
                new Identicon(recipientAddress, $recipientIdenticon); // eslint-disable-line no-new
            }
            $recipientAddress.textContent = recipientAddress;
            if (request.recipientLabel) {
                $recipientLabel.classList.remove('display-none');
                $recipientLabel.textContent = request.recipientLabel;
            }
        }

        // Set value and fee.
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);

        $value.textContent = this._formatNumber(totalNim);

        if ($fee && transaction.fee > 0) {
            $fee.textContent = Nimiq.Policy.satoshisToCoins(transaction.fee).toString();
            /** @type {HTMLDivElement} */
            const $feeSection = ($pageBody.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        // Set transaction extra data.
        if ($data && transaction.data.byteLength > 0) {
            // FIXME Detect and use proper encoding.
            $data.textContent = Nimiq.BufferUtils.toAscii(transaction.data);
            /** @type {HTMLDivElement} */
            const $dataSection = ($pageBody.querySelector('.data-section'));
            $dataSection.classList.remove('display-none');
        }

        // Set up passphrase box.
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('#passphrase-box'));
        this._passphraseBox = new PassphraseBox($passphraseBox, {
            bgColor: 'purple',
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passphrasebox-confirm-tx',
        });

        this._passphraseBox.on(
            PassphraseBox.Events.SUBMIT,
            passphrase => this._onConfirm(request, resolve, reject, passphrase),
        );
        this._passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());
    }

    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     * @param {string} passphrase
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, passphrase) {
        document.body.classList.add('loading');

        try {
            // XXX Passphrase encoding
            const passphraseBuf = Nimiq.BufferUtils.fromAscii(passphrase);
            const key = await KeyStore.instance.get(request.keyInfo.id, passphraseBuf);
            if (!key) {
                reject(new Error('Failed to retrieve key'));
                return;
            }

            const publicKey = key.derivePublicKey(request.keyPath);
            const signature = key.sign(request.keyPath, request.transaction.serializeContent());
            const result = /** @type {SignTransactionResult} */ {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
            resolve(result);
        } catch (e) {
            console.error(e);
            document.body.classList.remove('loading');

            // Assume the passphrase was wrong
            this._passphraseBox.onPassphraseIncorrect();
        }
    }

    run() {
        // Go to start page
        window.location.hash = BaseLayout.Pages.CONFIRM_TRANSACTION;
        this._passphraseBox.focus();

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {number} value
     * @param {number} [maxDecimals]
     * @param {number} [minDecimals]
     * @returns {string}
     */
    _formatNumber(value, maxDecimals = 5, minDecimals = 2) {
        const roundingFactor = 10 ** maxDecimals;
        value = Math.floor(value * roundingFactor) / roundingFactor;

        const result = parseFloat(value.toFixed(minDecimals)) === value
            ? value.toFixed(minDecimals)
            : value.toString();

        if (Math.abs(value) < 10000) return result;

        // Add thin spaces (U+202F) every 3 digits. Stop at the decimal separator if there is one.
        const regexp = minDecimals > 0 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(\d{3})+$)/g;
        return result.replace(regexp, '$1\u202F');
    }
}

BaseLayout.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
/* global BaseLayout */
/* global I18n */

class LayoutStandard extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutStandard._createElement($el);
        super(request, resolve, reject);
        this.$el = container;
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-standard');

        $el.innerHTML = `
            <div class="page-header">
                <!-- <a tabindex="0" class="page-header-back-button icon-back-arrow"></a> -->
                <h1 data-i18n="sign-tx-heading">New Transaction</h1>
            </div>

            <div class="page-body transaction">
                <div class="center accounts">
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="label display-none" id="sender-label"></div>
                        <div class="address" id="sender-address"></div>
                    </div>

                    <i class="arrow icon-forward-chevron"></i>

                    <div class="account">
                        <div class="identicon" id="recipient-identicon"></div>
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center total">
                    <div class="value">
                        <span id="value"></span><span class="nim-symbol"></span>
                    </div>
                </div>

                <div class="center fee-section display-none">
                    <span data-i18n="sign-tx-includes">includes</span>
                    <span id="fee"></span>
                    <span class="nim-symbol"></span>
                    <span data-i18n="sign-tx-fee">fee</span>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }
}
/* global BaseLayout */
/* global I18n */
/* global Nimiq */
/* global PaymentInfoLine */

class LayoutCheckout extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        request.recipientLabel = LayoutCheckout._originToDomain(request.shopOrigin);

        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutCheckout._createElement($el);
        super(request, resolve, reject);
        this.$el = container;

        // Set up payment-info-line
        const $paymentInfoLine = /** @type {HTMLElement} */ (document.querySelector('.payment-info-line'));

        const transaction = request.transaction;
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);
        new PaymentInfoLine( // eslint-disable-line no-new
            $paymentInfoLine,
            LayoutCheckout._originToDomain(request.shopOrigin),
            this._formatNumber(totalNim),
        );
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-checkout');

        $el.innerHTML = `
            <div class="page-body transaction">
                <h1>
                    <span data-i18n="sign-tx-youre-sending">You're sending</span>
                    <strong id="value"></strong>
                    <strong class="nim-symbol"></strong>
                    <span data-i18n="sign-tx-to">to</span>
                </h1>

                <div class="account shop-account">
                    <div class="identicon-cover"></div>
                    <div class="identicon" id="recipient-identicon"></div>
                    <div class="account-text">
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>

                <div class="sender-section">
                    <h2 data-i18n="sign-tx-pay-with">Pay with</h2>
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="account-text">
                            <div class="label display-none" id="sender-label"></div>
                            <div class="address" id="sender-address"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @param {string} [origin]
     * @returns {string}
     */
    static _originToDomain(origin) {
        if (!origin) return '---';
        return origin.split('://')[1] || '---';
    }
}
/* global Nimiq */
/* global KeyStore */
/* global TopLevelApi */
/* global LayoutStandard */
/* global LayoutCheckout */

class SignTransactionApi extends TopLevelApi {
    /**
     * @param {SignTransactionRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await SignTransactionApi._parseRequest(request);
        const $layoutContainer = document.getElementById('layout-container');

        const handler = new SignTransactionApi.Layouts[parsedRequest.layout](
            $layoutContainer,
            parsedRequest,
            this.resolve.bind(this),
            this.reject.bind(this),
        );

        handler.run();
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Promise<ParsedSignTransactionRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        // Check that the layout is valid
        if (request.layout && !SignTransactionApi.Layouts[request.layout]) {
            throw new Error('Invalid selected layout');
        }

        // Check that keyId is given.
        if (typeof request.keyId !== 'string' || !request.keyId) {
            throw new Error('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Error('Unknown keyId');
        }

        // Check that keyPath is given.
        if (typeof request.keyPath !== 'string' || !request.keyPath) {
            throw new Error('keyPath is required');
        }

        // Check that keyPath is valid.
        if (!Nimiq.ExtendedPrivateKey.isValidPath(request.keyPath)) {
            throw new Error('Invalid keyPath');
        }

        // Parse transaction.
        const transaction = SignTransactionApi._parseTransaction(request);

        // Check that the transaction is for the correct network.
        if (transaction.networkId !== Nimiq.GenesisConfig.NETWORK_ID) {
            throw new Error('Transaction is not valid in this network');
        }

        // Check that sender != recipient.
        if (transaction.recipient.equals(transaction.sender)) {
            throw new Error('Sender and recipient must not match');
        }

        // Check sender / recipient account type.
        const accountTypes = new Set([Nimiq.Account.Type.BASIC, Nimiq.Account.Type.VESTING, Nimiq.Account.Type.HTLC]);
        if (!accountTypes.has(transaction.senderType) || !accountTypes.has(transaction.recipientType)) {
            throw new Error('Invalid sender type');
        }

        // Validate labels.
        const labels = [request.keyLabel, request.senderLabel, request.recipientLabel];
        if (labels.some(label => label !== undefined && (typeof label !== 'string' || label.length > 64))) {
            throw new Error('Invalid label');
        }

        return /** @type {ParsedSignTransactionRequest} */ {
            layout: request.layout || 'standard',
            shopOrigin: request.shopOrigin,
            appName: request.appName,

            keyInfo,
            keyPath: request.keyPath,
            transaction,

            keyLabel: request.keyLabel,
            senderLabel: request.senderLabel,
            recipientLabel: request.recipientLabel,
        };
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Nimiq.ExtendedTransaction}
     * @private
     */
    static _parseTransaction(request) {
        const sender = new Nimiq.Address(request.sender);
        const senderType = request.senderType || Nimiq.Account.Type.BASIC;
        const recipient = new Nimiq.Address(request.recipient);
        const recipientType = request.recipientType || Nimiq.Account.Type.BASIC;
        const flags = request.flags || Nimiq.Transaction.Flag.NONE;
        const data = request.data || new Uint8Array(0);
        const networkId = request.networkId || Nimiq.GenesisConfig.NETWORK_ID;
        return new Nimiq.ExtendedTransaction(
            sender,
            senderType,
            recipient,
            recipientType,
            request.value,
            request.fee,
            request.validityStartHeight,
            flags,
            data,
            new Uint8Array(0), // proof
            networkId,
        );
    }
}

SignTransactionApi.Layouts = {
    standard: LayoutStandard,
    checkout: LayoutCheckout,
    // 'cashlink': LayoutCashlink,
};
/* global SignTransactionApi */
/* global runKeyguard */

runKeyguard(SignTransactionApi);
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
class Iqons {
    /* Public API */

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async svg(text) {
        const hash = this._hash(text);
        return this._svgTemplate(
            parseInt(hash[0], 10),
            parseInt(hash[2], 10),
            parseInt(hash[3] + hash[4], 10),
            parseInt(hash[5] + hash[6], 10),
            parseInt(hash[7] + hash[8], 10),
            parseInt(hash[9] + hash[10], 10),
            parseInt(hash[11], 10),
        );
    }

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async toDataUrl(text) {
        const base64string = btoa(await this.svg(text));
        return `data:image/svg+xml;base64,${base64string.replace(/#/g, '%23')}`;
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholder(color, strokeWidth) {
        color = color || '#bbb';
        strokeWidth = strokeWidth || 1;
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
    <path fill="none" stroke="${color}" stroke-width="${2 * strokeWidth}" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
    <g transform="scale(0.9) translate(9, 8)">
        <circle cx="80" cy="80" r="40" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity=".9"></circle>
        <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>\`
    </g>
</svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholderToDataUrl(color, strokeWidth) {
        return `data:image/svg+xml;base64,${btoa(this.placeholder(color, strokeWidth))}`;
    }

    /* Private API */

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _svgTemplate(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        return this._$svg(await this._$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor));
    }

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        if (color === backgroundColor) {
            color += 1;
            if (color > 9) color = 0;
        }

        while (accentColor === color || accentColor === backgroundColor) {
            accentColor += 1;
            if (accentColor > 9) accentColor = 0;
        }

        const colorString = this.colors[color];
        const backgroundColorString = this.colors[backgroundColor];
        const accentColorString = this.colors[accentColor];

        /* eslint-disable max-len */
        return `<g color="${colorString}" fill="${accentColorString}">
    <rect fill="${backgroundColorString}" x="0" y="0" width="160" height="160"></rect>
    <circle cx="80" cy="80" r="40" fill="${colorString}"></circle>
    <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>
    ${await this._generatePart('top', topNr)}
    ${await this._generatePart('side', sidesNr)}
    ${await this._generatePart('face', faceNr)}
    ${await this._generatePart('bottom', bottomNr)}
</g>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} content
     * @returns {string}
     */
    static _$svg(content) {
        const randomId = this._getRandomId();
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
    <defs>
        <clipPath id="hexagon-clip-${randomId}" transform="scale(0.5) translate(0, 16)">
            <path d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
        </clipPath>
    </defs>
    <path fill="white" stroke="#bbbbbb" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
    <g transform="scale(0.9) translate(9, 8)">
        <g clip-path="url(#hexagon-clip-${randomId})">
            ${content}
        </g>
    </g>
</svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} part
     * @param {number} index
     * @returns {Promise<string>}
     */
    static async _generatePart(part, index) {
        const assets = await this._getAssets();
        const selector = `#${part}_${this._assetIndex(index, part)}`;
        const $part = assets.querySelector(selector);
        return ($part && $part.innerHTML) || '';
    }

    /**
     * @returns {Promise<Document>}
     */
    static async _getAssets() {
        /** @type {Promise<Document>} */
        this._assetPromise = this._assetPromise || fetch(this.svgPath)
            .then(response => response.text())
            .then(assetsText => {
                const parser = new DOMParser();
                const assets = parser.parseFromString(assetsText, 'image/svg+xml');
                this._assets = assets;
                return assets;
            });
        return this._assetPromise;
    }

    static get hasAssets() {
        return !!this._assets;
    }

    /** @type {string[]} */
    static get colors() {
        return [
            '#fb8c00', // orange-600
            '#d32f2f', // red-700
            '#fbc02d', // yellow-700
            '#3949ab', // indigo-600
            '#03a9f4', // light-blue-500
            '#8e24aa', // purple-600
            '#009688', // teal-500
            '#f06292', // pink-300
            '#7cb342', // light-green-600
            '#795548', // brown-400
        ];
    }

    /** @type {object} */
    static get assetCounts() {
        return {
            face: Iqons.CATALOG.face.length,
            side: Iqons.CATALOG.side.length,
            top: Iqons.CATALOG.top.length,
            bottom: Iqons.CATALOG.bottom.length,
        };
    }

    /**
     * @param {number} index
     * @param {string} part
     * @returns {string}
     */
    static _assetIndex(index, part) {
        index = (index % this.assetCounts[part]) + 1;
        let fullIndex = index.toString();
        if (index < 10) fullIndex = `0${fullIndex}`;
        return fullIndex;
    }

    /**
     * @param {string} text
     * @returns {string}
     */
    static _hash(text) {
        return (`${text
            .split('')
            .map(c => Number(c.charCodeAt(0)) + 3)
            .reduce((a, e) => a * (1 - a) * this._chaosHash(e), 0.5)}`)
            .split('')
            .reduce((a, e) => e + a, '')
            .substr(4, 17);
    }

    /**
     * @param {number} number
     * @returns {number}
     */
    static _chaosHash(number) {
        const k = 3.569956786876;
        let an = 1 / number;
        for (let i = 0; i < 100; i++) {
            an = (1 - an) * an * k;
        }
        return an;
    }

    /**
     * @returns {number}
     */
    static _getRandomId() {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0];
    }
}

Iqons.svgPath = '../../lib/Iqons.min.svg';

Iqons.CATALOG = {
    face: [
        'face_01', 'face_02', 'face_03', 'face_04', 'face_05', 'face_06', 'face_07',
        'face_08', 'face_09', 'face_10', 'face_11', 'face_12', 'face_13', 'face_14',
        'face_15', 'face_16', 'face_17', 'face_18', 'face_19', 'face_20', 'face_21',
    ],
    side: [
        'side_01', 'side_02', 'side_03', 'side_04', 'side_05', 'side_06', 'side_07',
        'side_08', 'side_09', 'side_10', 'side_11', 'side_12', 'side_13', 'side_14',
        'side_15', 'side_16', 'side_17', 'side_18', 'side_19', 'side_20', 'side_21',
    ],
    top: [
        'top_01', 'top_02', 'top_03', 'top_04', 'top_05', 'top_06', 'top_07',
        'top_08', 'top_09', 'top_10', 'top_11', 'top_12', 'top_13', 'top_14',
        'top_15', 'top_16', 'top_17', 'top_18', 'top_19', 'top_20', 'top_21',
    ],
    bottom: [
        'bottom_01', 'bottom_02', 'bottom_03', 'bottom_04', 'bottom_05', 'bottom_06', 'bottom_07',
        'bottom_08', 'bottom_09', 'bottom_10', 'bottom_11', 'bottom_12', 'bottom_13', 'bottom_14',
        'bottom_15', 'bottom_16', 'bottom_17', 'bottom_18', 'bottom_19', 'bottom_20', 'bottom_21',
    ],
};
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
/* global Iqons */

class Identicon { // eslint-disable-line no-unused-vars
    /**
     * @param {string} [address]
     * @param {HTMLDivElement} [$el]
     */
    constructor(address, $el) {
        this._address = address;

        this.$el = Identicon._createElement($el);
        this.$imgEl = this.$el.firstChild;

        this._updateIqon();
    }

    /**
     * @returns {HTMLDivElement}
     */
    getElement() {
        return this.$el;
    }

    /**
     * @param {string} address
     */
    set address(address) {
        this._address = address;
        this._updateIqon();
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        const $element = $el || document.createElement('div');
        const imageElement = document.createElement('img');
        $element.classList.add('identicon');
        $element.appendChild(imageElement);

        return $element;
    }

    _updateIqon() {
        if (!this._address || !Iqons.hasAssets) {
            /** @type {HTMLImageElement} */ (this.$imgEl).src = Iqons.placeholderToDataUrl();
        }

        if (this._address) {
            Iqons.toDataUrl(this._address).then(url => {
                // Placeholder setting above is synchronous, thus this async result will replace the placeholder
                /** @type {HTMLImageElement} */ (this.$imgEl).src = url;
            });
        }
    }
}
/* global Nimiq */

class PaymentInfoLine extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {string} domain
     * @param {string} formattedAmount
     */
    constructor($el, domain, formattedAmount) {
        super();
        this.$el = PaymentInfoLine._createElement($el, domain, formattedAmount);
        this.$el.classList.remove('display-none');
    }

    /**
     * @param {?HTMLElement} [$el]
     * @param {string} domain
     * @param {string} formattedAmount
     * @returns {HTMLElement}
     */
    static _createElement($el, domain, formattedAmount) {
        $el = $el || document.createElement('div');
        $el.classList.add('payment-info-line');

        $el.innerHTML = `
            <div class="description">
                Payment to
                <span domain></span>
            </div>
            <div class="amount">
                <span amount></span>
                <span class="nim-symbol"></span>
            </div>
        `;

        /** @type {HTMLElement} */ ($el.querySelector('[domain]')).textContent = domain;
        /** @type {HTMLElement} */ ($el.querySelector('[amount]')).textContent = formattedAmount;

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
}
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
/* global Nimiq */
/* global KeyStore */
/* global Identicon */
/* global PassphraseBox */

class BaseLayout {
    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        /** @type {HTMLDivElement} */
        const $pageBody = (document.querySelector('#confirm-transaction .transaction'));

        /** @type {HTMLDivElement} */
        const $senderIdenticon = ($pageBody.querySelector('#sender-identicon'));
        /** @type {HTMLDivElement} */
        const $recipientIdenticon = ($pageBody.querySelector('#recipient-identicon'));

        /** @type {HTMLDivElement} */
        const $senderLabel = ($pageBody.querySelector('#sender-label'));
        /** @type {HTMLDivElement} */
        const $recipientLabel = ($pageBody.querySelector('#recipient-label'));

        /** @type {HTMLDivElement} */
        const $senderAddress = ($pageBody.querySelector('#sender-address'));
        /** @type {HTMLDivElement} */
        const $recipientAddress = ($pageBody.querySelector('#recipient-address'));

        /** @type {HTMLDivElement} */
        const $value = ($pageBody.querySelector('#value'));
        /** @type {HTMLDivElement} */
        const $fee = ($pageBody.querySelector('#fee'));
        /** @type {HTMLDivElement} */
        const $data = ($pageBody.querySelector('#data'));

        // Set sender data.
        const transaction = request.transaction;
        const senderAddress = transaction.sender.toUserFriendlyAddress();
        new Identicon(senderAddress, $senderIdenticon); // eslint-disable-line no-new
        $senderAddress.textContent = senderAddress;
        if (request.senderLabel) {
            $senderLabel.classList.remove('display-none');
            $senderLabel.textContent = request.senderLabel;
        }

        // Set recipient data.
        if ($recipientAddress) {
            const recipientAddress = transaction.recipient.toUserFriendlyAddress();
            if (request.layout === 'checkout') {
                new Identicon(undefined, $recipientIdenticon); // eslint-disable-line no-new
            } else {
                new Identicon(recipientAddress, $recipientIdenticon); // eslint-disable-line no-new
            }
            $recipientAddress.textContent = recipientAddress;
            if (request.recipientLabel) {
                $recipientLabel.classList.remove('display-none');
                $recipientLabel.textContent = request.recipientLabel;
            }
        }

        // Set value and fee.
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);

        $value.textContent = this._formatNumber(totalNim);

        if ($fee && transaction.fee > 0) {
            $fee.textContent = Nimiq.Policy.satoshisToCoins(transaction.fee).toString();
            /** @type {HTMLDivElement} */
            const $feeSection = ($pageBody.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        // Set transaction extra data.
        if ($data && transaction.data.byteLength > 0) {
            // FIXME Detect and use proper encoding.
            $data.textContent = Nimiq.BufferUtils.toAscii(transaction.data);
            /** @type {HTMLDivElement} */
            const $dataSection = ($pageBody.querySelector('.data-section'));
            $dataSection.classList.remove('display-none');
        }

        // Set up passphrase box.
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('#passphrase-box'));
        this._passphraseBox = new PassphraseBox($passphraseBox, {
            bgColor: 'purple',
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passphrasebox-confirm-tx',
        });

        this._passphraseBox.on(
            PassphraseBox.Events.SUBMIT,
            passphrase => this._onConfirm(request, resolve, reject, passphrase),
        );
        this._passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());
    }

    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     * @param {string} passphrase
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, passphrase) {
        document.body.classList.add('loading');

        try {
            // XXX Passphrase encoding
            const passphraseBuf = Nimiq.BufferUtils.fromAscii(passphrase);
            const key = await KeyStore.instance.get(request.keyInfo.id, passphraseBuf);
            if (!key) {
                reject(new Error('Failed to retrieve key'));
                return;
            }

            const publicKey = key.derivePublicKey(request.keyPath);
            const signature = key.sign(request.keyPath, request.transaction.serializeContent());
            const result = /** @type {SignTransactionResult} */ {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
            resolve(result);
        } catch (e) {
            console.error(e);
            document.body.classList.remove('loading');

            // Assume the passphrase was wrong
            this._passphraseBox.onPassphraseIncorrect();
        }
    }

    run() {
        // Go to start page
        window.location.hash = BaseLayout.Pages.CONFIRM_TRANSACTION;
        this._passphraseBox.focus();

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {number} value
     * @param {number} [maxDecimals]
     * @param {number} [minDecimals]
     * @returns {string}
     */
    _formatNumber(value, maxDecimals = 5, minDecimals = 2) {
        const roundingFactor = 10 ** maxDecimals;
        value = Math.floor(value * roundingFactor) / roundingFactor;

        const result = parseFloat(value.toFixed(minDecimals)) === value
            ? value.toFixed(minDecimals)
            : value.toString();

        if (Math.abs(value) < 10000) return result;

        // Add thin spaces (U+202F) every 3 digits. Stop at the decimal separator if there is one.
        const regexp = minDecimals > 0 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(\d{3})+$)/g;
        return result.replace(regexp, '$1\u202F');
    }
}

BaseLayout.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
/* global BaseLayout */
/* global I18n */

class LayoutStandard extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutStandard._createElement($el);
        super(request, resolve, reject);
        this.$el = container;
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-standard');

        $el.innerHTML = `
            <div class="page-header">
                <!-- <a tabindex="0" class="page-header-back-button icon-back-arrow"></a> -->
                <h1 data-i18n="sign-tx-heading">New Transaction</h1>
            </div>

            <div class="page-body transaction">
                <div class="center accounts">
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="label display-none" id="sender-label"></div>
                        <div class="address" id="sender-address"></div>
                    </div>

                    <i class="arrow icon-forward-chevron"></i>

                    <div class="account">
                        <div class="identicon" id="recipient-identicon"></div>
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center total">
                    <div class="value">
                        <span id="value"></span><span class="nim-symbol"></span>
                    </div>
                </div>

                <div class="center fee-section display-none">
                    <span data-i18n="sign-tx-includes">includes</span>
                    <span id="fee"></span>
                    <span class="nim-symbol"></span>
                    <span data-i18n="sign-tx-fee">fee</span>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }
}
/* global BaseLayout */
/* global I18n */
/* global Nimiq */
/* global PaymentInfoLine */

class LayoutCheckout extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        request.recipientLabel = LayoutCheckout._originToDomain(request.shopOrigin);

        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutCheckout._createElement($el);
        super(request, resolve, reject);
        this.$el = container;

        // Set up payment-info-line
        const $paymentInfoLine = /** @type {HTMLElement} */ (document.querySelector('.payment-info-line'));

        const transaction = request.transaction;
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);
        new PaymentInfoLine( // eslint-disable-line no-new
            $paymentInfoLine,
            LayoutCheckout._originToDomain(request.shopOrigin),
            this._formatNumber(totalNim),
        );
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-checkout');

        $el.innerHTML = `
            <div class="page-body transaction">
                <h1>
                    <span data-i18n="sign-tx-youre-sending">You're sending</span>
                    <strong id="value"></strong>
                    <strong class="nim-symbol"></strong>
                    <span data-i18n="sign-tx-to">to</span>
                </h1>

                <div class="account shop-account">
                    <div class="identicon-cover"></div>
                    <div class="identicon" id="recipient-identicon"></div>
                    <div class="account-text">
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>

                <div class="sender-section">
                    <h2 data-i18n="sign-tx-pay-with">Pay with</h2>
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="account-text">
                            <div class="label display-none" id="sender-label"></div>
                            <div class="address" id="sender-address"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @param {string} [origin]
     * @returns {string}
     */
    static _originToDomain(origin) {
        if (!origin) return '---';
        return origin.split('://')[1] || '---';
    }
}
/* global Nimiq */
/* global KeyStore */
/* global TopLevelApi */
/* global LayoutStandard */
/* global LayoutCheckout */

class SignTransactionApi extends TopLevelApi {
    /**
     * @param {SignTransactionRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await SignTransactionApi._parseRequest(request);
        const $layoutContainer = document.getElementById('layout-container');

        const handler = new SignTransactionApi.Layouts[parsedRequest.layout](
            $layoutContainer,
            parsedRequest,
            this.resolve.bind(this),
            this.reject.bind(this),
        );

        handler.run();
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Promise<ParsedSignTransactionRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        // Check that the layout is valid
        if (request.layout && !SignTransactionApi.Layouts[request.layout]) {
            throw new Error('Invalid selected layout');
        }

        // Check that keyId is given.
        if (typeof request.keyId !== 'string' || !request.keyId) {
            throw new Error('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Error('Unknown keyId');
        }

        // Check that keyPath is given.
        if (typeof request.keyPath !== 'string' || !request.keyPath) {
            throw new Error('keyPath is required');
        }

        // Check that keyPath is valid.
        if (!Nimiq.ExtendedPrivateKey.isValidPath(request.keyPath)) {
            throw new Error('Invalid keyPath');
        }

        // Parse transaction.
        const transaction = SignTransactionApi._parseTransaction(request);

        // Check that the transaction is for the correct network.
        if (transaction.networkId !== Nimiq.GenesisConfig.NETWORK_ID) {
            throw new Error('Transaction is not valid in this network');
        }

        // Check that sender != recipient.
        if (transaction.recipient.equals(transaction.sender)) {
            throw new Error('Sender and recipient must not match');
        }

        // Check sender / recipient account type.
        const accountTypes = new Set([Nimiq.Account.Type.BASIC, Nimiq.Account.Type.VESTING, Nimiq.Account.Type.HTLC]);
        if (!accountTypes.has(transaction.senderType) || !accountTypes.has(transaction.recipientType)) {
            throw new Error('Invalid sender type');
        }

        // Validate labels.
        const labels = [request.keyLabel, request.senderLabel, request.recipientLabel];
        if (labels.some(label => label !== undefined && (typeof label !== 'string' || label.length > 64))) {
            throw new Error('Invalid label');
        }

        return /** @type {ParsedSignTransactionRequest} */ {
            layout: request.layout || 'standard',
            shopOrigin: request.shopOrigin,
            appName: request.appName,

            keyInfo,
            keyPath: request.keyPath,
            transaction,

            keyLabel: request.keyLabel,
            senderLabel: request.senderLabel,
            recipientLabel: request.recipientLabel,
        };
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Nimiq.ExtendedTransaction}
     * @private
     */
    static _parseTransaction(request) {
        const sender = new Nimiq.Address(request.sender);
        const senderType = request.senderType || Nimiq.Account.Type.BASIC;
        const recipient = new Nimiq.Address(request.recipient);
        const recipientType = request.recipientType || Nimiq.Account.Type.BASIC;
        const flags = request.flags || Nimiq.Transaction.Flag.NONE;
        const data = request.data || new Uint8Array(0);
        const networkId = request.networkId || Nimiq.GenesisConfig.NETWORK_ID;
        return new Nimiq.ExtendedTransaction(
            sender,
            senderType,
            recipient,
            recipientType,
            request.value,
            request.fee,
            request.validityStartHeight,
            flags,
            data,
            new Uint8Array(0), // proof
            networkId,
        );
    }
}

SignTransactionApi.Layouts = {
    standard: LayoutStandard,
    checkout: LayoutCheckout,
    // 'cashlink': LayoutCashlink,
};
/* global SignTransactionApi */
/* global runKeyguard */

runKeyguard(SignTransactionApi);
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
class Iqons {
    /* Public API */

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async svg(text) {
        const hash = this._hash(text);
        return this._svgTemplate(
            parseInt(hash[0], 10),
            parseInt(hash[2], 10),
            parseInt(hash[3] + hash[4], 10),
            parseInt(hash[5] + hash[6], 10),
            parseInt(hash[7] + hash[8], 10),
            parseInt(hash[9] + hash[10], 10),
            parseInt(hash[11], 10),
        );
    }

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async toDataUrl(text) {
        const base64string = btoa(await this.svg(text));
        return `data:image/svg+xml;base64,${base64string.replace(/#/g, '%23')}`;
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholder(color, strokeWidth) {
        color = color || '#bbb';
        strokeWidth = strokeWidth || 1;
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
    <path fill="none" stroke="${color}" stroke-width="${2 * strokeWidth}" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
    <g transform="scale(0.9) translate(9, 8)">
        <circle cx="80" cy="80" r="40" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity=".9"></circle>
        <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>\`
    </g>
</svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholderToDataUrl(color, strokeWidth) {
        return `data:image/svg+xml;base64,${btoa(this.placeholder(color, strokeWidth))}`;
    }

    /* Private API */

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _svgTemplate(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        return this._$svg(await this._$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor));
    }

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        if (color === backgroundColor) {
            color += 1;
            if (color > 9) color = 0;
        }

        while (accentColor === color || accentColor === backgroundColor) {
            accentColor += 1;
            if (accentColor > 9) accentColor = 0;
        }

        const colorString = this.colors[color];
        const backgroundColorString = this.colors[backgroundColor];
        const accentColorString = this.colors[accentColor];

        /* eslint-disable max-len */
        return `<g color="${colorString}" fill="${accentColorString}">
    <rect fill="${backgroundColorString}" x="0" y="0" width="160" height="160"></rect>
    <circle cx="80" cy="80" r="40" fill="${colorString}"></circle>
    <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>
    ${await this._generatePart('top', topNr)}
    ${await this._generatePart('side', sidesNr)}
    ${await this._generatePart('face', faceNr)}
    ${await this._generatePart('bottom', bottomNr)}
</g>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} content
     * @returns {string}
     */
    static _$svg(content) {
        const randomId = this._getRandomId();
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
    <defs>
        <clipPath id="hexagon-clip-${randomId}" transform="scale(0.5) translate(0, 16)">
            <path d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
        </clipPath>
    </defs>
    <path fill="white" stroke="#bbbbbb" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
    <g transform="scale(0.9) translate(9, 8)">
        <g clip-path="url(#hexagon-clip-${randomId})">
            ${content}
        </g>
    </g>
</svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} part
     * @param {number} index
     * @returns {Promise<string>}
     */
    static async _generatePart(part, index) {
        const assets = await this._getAssets();
        const selector = `#${part}_${this._assetIndex(index, part)}`;
        const $part = assets.querySelector(selector);
        return ($part && $part.innerHTML) || '';
    }

    /**
     * @returns {Promise<Document>}
     */
    static async _getAssets() {
        /** @type {Promise<Document>} */
        this._assetPromise = this._assetPromise || fetch(this.svgPath)
            .then(response => response.text())
            .then(assetsText => {
                const parser = new DOMParser();
                const assets = parser.parseFromString(assetsText, 'image/svg+xml');
                this._assets = assets;
                return assets;
            });
        return this._assetPromise;
    }

    static get hasAssets() {
        return !!this._assets;
    }

    /** @type {string[]} */
    static get colors() {
        return [
            '#fb8c00', // orange-600
            '#d32f2f', // red-700
            '#fbc02d', // yellow-700
            '#3949ab', // indigo-600
            '#03a9f4', // light-blue-500
            '#8e24aa', // purple-600
            '#009688', // teal-500
            '#f06292', // pink-300
            '#7cb342', // light-green-600
            '#795548', // brown-400
        ];
    }

    /** @type {object} */
    static get assetCounts() {
        return {
            face: Iqons.CATALOG.face.length,
            side: Iqons.CATALOG.side.length,
            top: Iqons.CATALOG.top.length,
            bottom: Iqons.CATALOG.bottom.length,
        };
    }

    /**
     * @param {number} index
     * @param {string} part
     * @returns {string}
     */
    static _assetIndex(index, part) {
        index = (index % this.assetCounts[part]) + 1;
        let fullIndex = index.toString();
        if (index < 10) fullIndex = `0${fullIndex}`;
        return fullIndex;
    }

    /**
     * @param {string} text
     * @returns {string}
     */
    static _hash(text) {
        return (`${text
            .split('')
            .map(c => Number(c.charCodeAt(0)) + 3)
            .reduce((a, e) => a * (1 - a) * this._chaosHash(e), 0.5)}`)
            .split('')
            .reduce((a, e) => e + a, '')
            .substr(4, 17);
    }

    /**
     * @param {number} number
     * @returns {number}
     */
    static _chaosHash(number) {
        const k = 3.569956786876;
        let an = 1 / number;
        for (let i = 0; i < 100; i++) {
            an = (1 - an) * an * k;
        }
        return an;
    }

    /**
     * @returns {number}
     */
    static _getRandomId() {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0];
    }
}

Iqons.svgPath = '../../lib/Iqons.min.svg';

Iqons.CATALOG = {
    face: [
        'face_01', 'face_02', 'face_03', 'face_04', 'face_05', 'face_06', 'face_07',
        'face_08', 'face_09', 'face_10', 'face_11', 'face_12', 'face_13', 'face_14',
        'face_15', 'face_16', 'face_17', 'face_18', 'face_19', 'face_20', 'face_21',
    ],
    side: [
        'side_01', 'side_02', 'side_03', 'side_04', 'side_05', 'side_06', 'side_07',
        'side_08', 'side_09', 'side_10', 'side_11', 'side_12', 'side_13', 'side_14',
        'side_15', 'side_16', 'side_17', 'side_18', 'side_19', 'side_20', 'side_21',
    ],
    top: [
        'top_01', 'top_02', 'top_03', 'top_04', 'top_05', 'top_06', 'top_07',
        'top_08', 'top_09', 'top_10', 'top_11', 'top_12', 'top_13', 'top_14',
        'top_15', 'top_16', 'top_17', 'top_18', 'top_19', 'top_20', 'top_21',
    ],
    bottom: [
        'bottom_01', 'bottom_02', 'bottom_03', 'bottom_04', 'bottom_05', 'bottom_06', 'bottom_07',
        'bottom_08', 'bottom_09', 'bottom_10', 'bottom_11', 'bottom_12', 'bottom_13', 'bottom_14',
        'bottom_15', 'bottom_16', 'bottom_17', 'bottom_18', 'bottom_19', 'bottom_20', 'bottom_21',
    ],
};
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
/* global Iqons */

class Identicon { // eslint-disable-line no-unused-vars
    /**
     * @param {string} [address]
     * @param {HTMLDivElement} [$el]
     */
    constructor(address, $el) {
        this._address = address;

        this.$el = Identicon._createElement($el);
        this.$imgEl = this.$el.firstChild;

        this._updateIqon();
    }

    /**
     * @returns {HTMLDivElement}
     */
    getElement() {
        return this.$el;
    }

    /**
     * @param {string} address
     */
    set address(address) {
        this._address = address;
        this._updateIqon();
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        const $element = $el || document.createElement('div');
        const imageElement = document.createElement('img');
        $element.classList.add('identicon');
        $element.appendChild(imageElement);

        return $element;
    }

    _updateIqon() {
        if (!this._address || !Iqons.hasAssets) {
            /** @type {HTMLImageElement} */ (this.$imgEl).src = Iqons.placeholderToDataUrl();
        }

        if (this._address) {
            Iqons.toDataUrl(this._address).then(url => {
                // Placeholder setting above is synchronous, thus this async result will replace the placeholder
                /** @type {HTMLImageElement} */ (this.$imgEl).src = url;
            });
        }
    }
}
/* global Nimiq */

class PaymentInfoLine extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {string} domain
     * @param {string} formattedAmount
     */
    constructor($el, domain, formattedAmount) {
        super();
        this.$el = PaymentInfoLine._createElement($el, domain, formattedAmount);
        this.$el.classList.remove('display-none');
    }

    /**
     * @param {?HTMLElement} [$el]
     * @param {string} domain
     * @param {string} formattedAmount
     * @returns {HTMLElement}
     */
    static _createElement($el, domain, formattedAmount) {
        $el = $el || document.createElement('div');
        $el.classList.add('payment-info-line');

        $el.innerHTML = `
            <div class="description">
                Payment to
                <span domain></span>
            </div>
            <div class="amount">
                <span amount></span>
                <span class="nim-symbol"></span>
            </div>
        `;

        /** @type {HTMLElement} */ ($el.querySelector('[domain]')).textContent = domain;
        /** @type {HTMLElement} */ ($el.querySelector('[amount]')).textContent = formattedAmount;

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
}
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
/* global Nimiq */
/* global KeyStore */
/* global Identicon */
/* global PassphraseBox */

class BaseLayout {
    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        /** @type {HTMLDivElement} */
        const $pageBody = (document.querySelector('#confirm-transaction .transaction'));

        /** @type {HTMLDivElement} */
        const $senderIdenticon = ($pageBody.querySelector('#sender-identicon'));
        /** @type {HTMLDivElement} */
        const $recipientIdenticon = ($pageBody.querySelector('#recipient-identicon'));

        /** @type {HTMLDivElement} */
        const $senderLabel = ($pageBody.querySelector('#sender-label'));
        /** @type {HTMLDivElement} */
        const $recipientLabel = ($pageBody.querySelector('#recipient-label'));

        /** @type {HTMLDivElement} */
        const $senderAddress = ($pageBody.querySelector('#sender-address'));
        /** @type {HTMLDivElement} */
        const $recipientAddress = ($pageBody.querySelector('#recipient-address'));

        /** @type {HTMLDivElement} */
        const $value = ($pageBody.querySelector('#value'));
        /** @type {HTMLDivElement} */
        const $fee = ($pageBody.querySelector('#fee'));
        /** @type {HTMLDivElement} */
        const $data = ($pageBody.querySelector('#data'));

        // Set sender data.
        const transaction = request.transaction;
        const senderAddress = transaction.sender.toUserFriendlyAddress();
        new Identicon(senderAddress, $senderIdenticon); // eslint-disable-line no-new
        $senderAddress.textContent = senderAddress;
        if (request.senderLabel) {
            $senderLabel.classList.remove('display-none');
            $senderLabel.textContent = request.senderLabel;
        }

        // Set recipient data.
        if ($recipientAddress) {
            const recipientAddress = transaction.recipient.toUserFriendlyAddress();
            if (request.layout === 'checkout') {
                new Identicon(undefined, $recipientIdenticon); // eslint-disable-line no-new
            } else {
                new Identicon(recipientAddress, $recipientIdenticon); // eslint-disable-line no-new
            }
            $recipientAddress.textContent = recipientAddress;
            if (request.recipientLabel) {
                $recipientLabel.classList.remove('display-none');
                $recipientLabel.textContent = request.recipientLabel;
            }
        }

        // Set value and fee.
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);

        $value.textContent = this._formatNumber(totalNim);

        if ($fee && transaction.fee > 0) {
            $fee.textContent = Nimiq.Policy.satoshisToCoins(transaction.fee).toString();
            /** @type {HTMLDivElement} */
            const $feeSection = ($pageBody.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        // Set transaction extra data.
        if ($data && transaction.data.byteLength > 0) {
            // FIXME Detect and use proper encoding.
            $data.textContent = Nimiq.BufferUtils.toAscii(transaction.data);
            /** @type {HTMLDivElement} */
            const $dataSection = ($pageBody.querySelector('.data-section'));
            $dataSection.classList.remove('display-none');
        }

        // Set up passphrase box.
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('#passphrase-box'));
        this._passphraseBox = new PassphraseBox($passphraseBox, {
            bgColor: 'purple',
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passphrasebox-confirm-tx',
        });

        this._passphraseBox.on(
            PassphraseBox.Events.SUBMIT,
            passphrase => this._onConfirm(request, resolve, reject, passphrase),
        );
        this._passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());
    }

    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     * @param {string} passphrase
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, passphrase) {
        document.body.classList.add('loading');

        try {
            // XXX Passphrase encoding
            const passphraseBuf = Nimiq.BufferUtils.fromAscii(passphrase);
            const key = await KeyStore.instance.get(request.keyInfo.id, passphraseBuf);
            if (!key) {
                reject(new Error('Failed to retrieve key'));
                return;
            }

            const publicKey = key.derivePublicKey(request.keyPath);
            const signature = key.sign(request.keyPath, request.transaction.serializeContent());
            const result = /** @type {SignTransactionResult} */ {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
            resolve(result);
        } catch (e) {
            console.error(e);
            document.body.classList.remove('loading');

            // Assume the passphrase was wrong
            this._passphraseBox.onPassphraseIncorrect();
        }
    }

    run() {
        // Go to start page
        window.location.hash = BaseLayout.Pages.CONFIRM_TRANSACTION;
        this._passphraseBox.focus();

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {number} value
     * @param {number} [maxDecimals]
     * @param {number} [minDecimals]
     * @returns {string}
     */
    _formatNumber(value, maxDecimals = 5, minDecimals = 2) {
        const roundingFactor = 10 ** maxDecimals;
        value = Math.floor(value * roundingFactor) / roundingFactor;

        const result = parseFloat(value.toFixed(minDecimals)) === value
            ? value.toFixed(minDecimals)
            : value.toString();

        if (Math.abs(value) < 10000) return result;

        // Add thin spaces (U+202F) every 3 digits. Stop at the decimal separator if there is one.
        const regexp = minDecimals > 0 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(\d{3})+$)/g;
        return result.replace(regexp, '$1\u202F');
    }
}

BaseLayout.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
/* global BaseLayout */
/* global I18n */

class LayoutStandard extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutStandard._createElement($el);
        super(request, resolve, reject);
        this.$el = container;
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-standard');

        $el.innerHTML = `
            <div class="page-header">
                <!-- <a tabindex="0" class="page-header-back-button icon-back-arrow"></a> -->
                <h1 data-i18n="sign-tx-heading">New Transaction</h1>
            </div>

            <div class="page-body transaction">
                <div class="center accounts">
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="label display-none" id="sender-label"></div>
                        <div class="address" id="sender-address"></div>
                    </div>

                    <i class="arrow icon-forward-chevron"></i>

                    <div class="account">
                        <div class="identicon" id="recipient-identicon"></div>
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center total">
                    <div class="value">
                        <span id="value"></span><span class="nim-symbol"></span>
                    </div>
                </div>

                <div class="center fee-section display-none">
                    <span data-i18n="sign-tx-includes">includes</span>
                    <span id="fee"></span>
                    <span class="nim-symbol"></span>
                    <span data-i18n="sign-tx-fee">fee</span>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }
}
/* global BaseLayout */
/* global I18n */
/* global Nimiq */
/* global PaymentInfoLine */

class LayoutCheckout extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        request.recipientLabel = LayoutCheckout._originToDomain(request.shopOrigin);

        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutCheckout._createElement($el);
        super(request, resolve, reject);
        this.$el = container;

        // Set up payment-info-line
        const $paymentInfoLine = /** @type {HTMLElement} */ (document.querySelector('.payment-info-line'));

        const transaction = request.transaction;
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);
        new PaymentInfoLine( // eslint-disable-line no-new
            $paymentInfoLine,
            LayoutCheckout._originToDomain(request.shopOrigin),
            this._formatNumber(totalNim),
        );
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-checkout');

        $el.innerHTML = `
            <div class="page-body transaction">
                <h1>
                    <span data-i18n="sign-tx-youre-sending">You're sending</span>
                    <strong id="value"></strong>
                    <strong class="nim-symbol"></strong>
                    <span data-i18n="sign-tx-to">to</span>
                </h1>

                <div class="account shop-account">
                    <div class="identicon-cover"></div>
                    <div class="identicon" id="recipient-identicon"></div>
                    <div class="account-text">
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>

                <div class="sender-section">
                    <h2 data-i18n="sign-tx-pay-with">Pay with</h2>
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="account-text">
                            <div class="label display-none" id="sender-label"></div>
                            <div class="address" id="sender-address"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @param {string} [origin]
     * @returns {string}
     */
    static _originToDomain(origin) {
        if (!origin) return '---';
        return origin.split('://')[1] || '---';
    }
}
/* global Nimiq */
/* global KeyStore */
/* global TopLevelApi */
/* global LayoutStandard */
/* global LayoutCheckout */

class SignTransactionApi extends TopLevelApi {
    /**
     * @param {SignTransactionRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await SignTransactionApi._parseRequest(request);
        const $layoutContainer = document.getElementById('layout-container');

        const handler = new SignTransactionApi.Layouts[parsedRequest.layout](
            $layoutContainer,
            parsedRequest,
            this.resolve.bind(this),
            this.reject.bind(this),
        );

        handler.run();
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Promise<ParsedSignTransactionRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        // Check that the layout is valid
        if (request.layout && !SignTransactionApi.Layouts[request.layout]) {
            throw new Error('Invalid selected layout');
        }

        // Check that keyId is given.
        if (typeof request.keyId !== 'string' || !request.keyId) {
            throw new Error('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Error('Unknown keyId');
        }

        // Check that keyPath is given.
        if (typeof request.keyPath !== 'string' || !request.keyPath) {
            throw new Error('keyPath is required');
        }

        // Check that keyPath is valid.
        if (!Nimiq.ExtendedPrivateKey.isValidPath(request.keyPath)) {
            throw new Error('Invalid keyPath');
        }

        // Parse transaction.
        const transaction = SignTransactionApi._parseTransaction(request);

        // Check that the transaction is for the correct network.
        if (transaction.networkId !== Nimiq.GenesisConfig.NETWORK_ID) {
            throw new Error('Transaction is not valid in this network');
        }

        // Check that sender != recipient.
        if (transaction.recipient.equals(transaction.sender)) {
            throw new Error('Sender and recipient must not match');
        }

        // Check sender / recipient account type.
        const accountTypes = new Set([Nimiq.Account.Type.BASIC, Nimiq.Account.Type.VESTING, Nimiq.Account.Type.HTLC]);
        if (!accountTypes.has(transaction.senderType) || !accountTypes.has(transaction.recipientType)) {
            throw new Error('Invalid sender type');
        }

        // Validate labels.
        const labels = [request.keyLabel, request.senderLabel, request.recipientLabel];
        if (labels.some(label => label !== undefined && (typeof label !== 'string' || label.length > 64))) {
            throw new Error('Invalid label');
        }

        return /** @type {ParsedSignTransactionRequest} */ {
            layout: request.layout || 'standard',
            shopOrigin: request.shopOrigin,
            appName: request.appName,

            keyInfo,
            keyPath: request.keyPath,
            transaction,

            keyLabel: request.keyLabel,
            senderLabel: request.senderLabel,
            recipientLabel: request.recipientLabel,
        };
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Nimiq.ExtendedTransaction}
     * @private
     */
    static _parseTransaction(request) {
        const sender = new Nimiq.Address(request.sender);
        const senderType = request.senderType || Nimiq.Account.Type.BASIC;
        const recipient = new Nimiq.Address(request.recipient);
        const recipientType = request.recipientType || Nimiq.Account.Type.BASIC;
        const flags = request.flags || Nimiq.Transaction.Flag.NONE;
        const data = request.data || new Uint8Array(0);
        const networkId = request.networkId || Nimiq.GenesisConfig.NETWORK_ID;
        return new Nimiq.ExtendedTransaction(
            sender,
            senderType,
            recipient,
            recipientType,
            request.value,
            request.fee,
            request.validityStartHeight,
            flags,
            data,
            new Uint8Array(0), // proof
            networkId,
        );
    }
}

SignTransactionApi.Layouts = {
    standard: LayoutStandard,
    checkout: LayoutCheckout,
    // 'cashlink': LayoutCashlink,
};
/* global SignTransactionApi */
/* global runKeyguard */

runKeyguard(SignTransactionApi);
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
class Iqons {
    /* Public API */

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async svg(text) {
        const hash = this._hash(text);
        return this._svgTemplate(
            parseInt(hash[0], 10),
            parseInt(hash[2], 10),
            parseInt(hash[3] + hash[4], 10),
            parseInt(hash[5] + hash[6], 10),
            parseInt(hash[7] + hash[8], 10),
            parseInt(hash[9] + hash[10], 10),
            parseInt(hash[11], 10),
        );
    }

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async toDataUrl(text) {
        const base64string = btoa(await this.svg(text));
        return `data:image/svg+xml;base64,${base64string.replace(/#/g, '%23')}`;
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholder(color, strokeWidth) {
        color = color || '#bbb';
        strokeWidth = strokeWidth || 1;
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
    <path fill="none" stroke="${color}" stroke-width="${2 * strokeWidth}" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
    <g transform="scale(0.9) translate(9, 8)">
        <circle cx="80" cy="80" r="40" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity=".9"></circle>
        <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>\`
    </g>
</svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholderToDataUrl(color, strokeWidth) {
        return `data:image/svg+xml;base64,${btoa(this.placeholder(color, strokeWidth))}`;
    }

    /* Private API */

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _svgTemplate(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        return this._$svg(await this._$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor));
    }

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        if (color === backgroundColor) {
            color += 1;
            if (color > 9) color = 0;
        }

        while (accentColor === color || accentColor === backgroundColor) {
            accentColor += 1;
            if (accentColor > 9) accentColor = 0;
        }

        const colorString = this.colors[color];
        const backgroundColorString = this.colors[backgroundColor];
        const accentColorString = this.colors[accentColor];

        /* eslint-disable max-len */
        return `<g color="${colorString}" fill="${accentColorString}">
    <rect fill="${backgroundColorString}" x="0" y="0" width="160" height="160"></rect>
    <circle cx="80" cy="80" r="40" fill="${colorString}"></circle>
    <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>
    ${await this._generatePart('top', topNr)}
    ${await this._generatePart('side', sidesNr)}
    ${await this._generatePart('face', faceNr)}
    ${await this._generatePart('bottom', bottomNr)}
</g>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} content
     * @returns {string}
     */
    static _$svg(content) {
        const randomId = this._getRandomId();
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
    <defs>
        <clipPath id="hexagon-clip-${randomId}" transform="scale(0.5) translate(0, 16)">
            <path d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
        </clipPath>
    </defs>
    <path fill="white" stroke="#bbbbbb" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
    <g transform="scale(0.9) translate(9, 8)">
        <g clip-path="url(#hexagon-clip-${randomId})">
            ${content}
        </g>
    </g>
</svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} part
     * @param {number} index
     * @returns {Promise<string>}
     */
    static async _generatePart(part, index) {
        const assets = await this._getAssets();
        const selector = `#${part}_${this._assetIndex(index, part)}`;
        const $part = assets.querySelector(selector);
        return ($part && $part.innerHTML) || '';
    }

    /**
     * @returns {Promise<Document>}
     */
    static async _getAssets() {
        /** @type {Promise<Document>} */
        this._assetPromise = this._assetPromise || fetch(this.svgPath)
            .then(response => response.text())
            .then(assetsText => {
                const parser = new DOMParser();
                const assets = parser.parseFromString(assetsText, 'image/svg+xml');
                this._assets = assets;
                return assets;
            });
        return this._assetPromise;
    }

    static get hasAssets() {
        return !!this._assets;
    }

    /** @type {string[]} */
    static get colors() {
        return [
            '#fb8c00', // orange-600
            '#d32f2f', // red-700
            '#fbc02d', // yellow-700
            '#3949ab', // indigo-600
            '#03a9f4', // light-blue-500
            '#8e24aa', // purple-600
            '#009688', // teal-500
            '#f06292', // pink-300
            '#7cb342', // light-green-600
            '#795548', // brown-400
        ];
    }

    /** @type {object} */
    static get assetCounts() {
        return {
            face: Iqons.CATALOG.face.length,
            side: Iqons.CATALOG.side.length,
            top: Iqons.CATALOG.top.length,
            bottom: Iqons.CATALOG.bottom.length,
        };
    }

    /**
     * @param {number} index
     * @param {string} part
     * @returns {string}
     */
    static _assetIndex(index, part) {
        index = (index % this.assetCounts[part]) + 1;
        let fullIndex = index.toString();
        if (index < 10) fullIndex = `0${fullIndex}`;
        return fullIndex;
    }

    /**
     * @param {string} text
     * @returns {string}
     */
    static _hash(text) {
        return (`${text
            .split('')
            .map(c => Number(c.charCodeAt(0)) + 3)
            .reduce((a, e) => a * (1 - a) * this._chaosHash(e), 0.5)}`)
            .split('')
            .reduce((a, e) => e + a, '')
            .substr(4, 17);
    }

    /**
     * @param {number} number
     * @returns {number}
     */
    static _chaosHash(number) {
        const k = 3.569956786876;
        let an = 1 / number;
        for (let i = 0; i < 100; i++) {
            an = (1 - an) * an * k;
        }
        return an;
    }

    /**
     * @returns {number}
     */
    static _getRandomId() {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0];
    }
}

Iqons.svgPath = '../../lib/Iqons.min.svg';

Iqons.CATALOG = {
    face: [
        'face_01', 'face_02', 'face_03', 'face_04', 'face_05', 'face_06', 'face_07',
        'face_08', 'face_09', 'face_10', 'face_11', 'face_12', 'face_13', 'face_14',
        'face_15', 'face_16', 'face_17', 'face_18', 'face_19', 'face_20', 'face_21',
    ],
    side: [
        'side_01', 'side_02', 'side_03', 'side_04', 'side_05', 'side_06', 'side_07',
        'side_08', 'side_09', 'side_10', 'side_11', 'side_12', 'side_13', 'side_14',
        'side_15', 'side_16', 'side_17', 'side_18', 'side_19', 'side_20', 'side_21',
    ],
    top: [
        'top_01', 'top_02', 'top_03', 'top_04', 'top_05', 'top_06', 'top_07',
        'top_08', 'top_09', 'top_10', 'top_11', 'top_12', 'top_13', 'top_14',
        'top_15', 'top_16', 'top_17', 'top_18', 'top_19', 'top_20', 'top_21',
    ],
    bottom: [
        'bottom_01', 'bottom_02', 'bottom_03', 'bottom_04', 'bottom_05', 'bottom_06', 'bottom_07',
        'bottom_08', 'bottom_09', 'bottom_10', 'bottom_11', 'bottom_12', 'bottom_13', 'bottom_14',
        'bottom_15', 'bottom_16', 'bottom_17', 'bottom_18', 'bottom_19', 'bottom_20', 'bottom_21',
    ],
};
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
/* global Iqons */

class Identicon { // eslint-disable-line no-unused-vars
    /**
     * @param {string} [address]
     * @param {HTMLDivElement} [$el]
     */
    constructor(address, $el) {
        this._address = address;

        this.$el = Identicon._createElement($el);
        this.$imgEl = this.$el.firstChild;

        this._updateIqon();
    }

    /**
     * @returns {HTMLDivElement}
     */
    getElement() {
        return this.$el;
    }

    /**
     * @param {string} address
     */
    set address(address) {
        this._address = address;
        this._updateIqon();
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        const $element = $el || document.createElement('div');
        const imageElement = document.createElement('img');
        $element.classList.add('identicon');
        $element.appendChild(imageElement);

        return $element;
    }

    _updateIqon() {
        if (!this._address || !Iqons.hasAssets) {
            /** @type {HTMLImageElement} */ (this.$imgEl).src = Iqons.placeholderToDataUrl();
        }

        if (this._address) {
            Iqons.toDataUrl(this._address).then(url => {
                // Placeholder setting above is synchronous, thus this async result will replace the placeholder
                /** @type {HTMLImageElement} */ (this.$imgEl).src = url;
            });
        }
    }
}
/* global Nimiq */

class PaymentInfoLine extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {string} domain
     * @param {string} formattedAmount
     */
    constructor($el, domain, formattedAmount) {
        super();
        this.$el = PaymentInfoLine._createElement($el, domain, formattedAmount);
        this.$el.classList.remove('display-none');
    }

    /**
     * @param {?HTMLElement} [$el]
     * @param {string} domain
     * @param {string} formattedAmount
     * @returns {HTMLElement}
     */
    static _createElement($el, domain, formattedAmount) {
        $el = $el || document.createElement('div');
        $el.classList.add('payment-info-line');

        $el.innerHTML = `
            <div class="description">
                Payment to
                <span domain></span>
            </div>
            <div class="amount">
                <span amount></span>
                <span class="nim-symbol"></span>
            </div>
        `;

        /** @type {HTMLElement} */ ($el.querySelector('[domain]')).textContent = domain;
        /** @type {HTMLElement} */ ($el.querySelector('[amount]')).textContent = formattedAmount;

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
}
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
/* global Nimiq */
/* global KeyStore */
/* global Identicon */
/* global PassphraseBox */

class BaseLayout {
    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        /** @type {HTMLDivElement} */
        const $pageBody = (document.querySelector('#confirm-transaction .transaction'));

        /** @type {HTMLDivElement} */
        const $senderIdenticon = ($pageBody.querySelector('#sender-identicon'));
        /** @type {HTMLDivElement} */
        const $recipientIdenticon = ($pageBody.querySelector('#recipient-identicon'));

        /** @type {HTMLDivElement} */
        const $senderLabel = ($pageBody.querySelector('#sender-label'));
        /** @type {HTMLDivElement} */
        const $recipientLabel = ($pageBody.querySelector('#recipient-label'));

        /** @type {HTMLDivElement} */
        const $senderAddress = ($pageBody.querySelector('#sender-address'));
        /** @type {HTMLDivElement} */
        const $recipientAddress = ($pageBody.querySelector('#recipient-address'));

        /** @type {HTMLDivElement} */
        const $value = ($pageBody.querySelector('#value'));
        /** @type {HTMLDivElement} */
        const $fee = ($pageBody.querySelector('#fee'));
        /** @type {HTMLDivElement} */
        const $data = ($pageBody.querySelector('#data'));

        // Set sender data.
        const transaction = request.transaction;
        const senderAddress = transaction.sender.toUserFriendlyAddress();
        new Identicon(senderAddress, $senderIdenticon); // eslint-disable-line no-new
        $senderAddress.textContent = senderAddress;
        if (request.senderLabel) {
            $senderLabel.classList.remove('display-none');
            $senderLabel.textContent = request.senderLabel;
        }

        // Set recipient data.
        if ($recipientAddress) {
            const recipientAddress = transaction.recipient.toUserFriendlyAddress();
            if (request.layout === 'checkout') {
                new Identicon(undefined, $recipientIdenticon); // eslint-disable-line no-new
            } else {
                new Identicon(recipientAddress, $recipientIdenticon); // eslint-disable-line no-new
            }
            $recipientAddress.textContent = recipientAddress;
            if (request.recipientLabel) {
                $recipientLabel.classList.remove('display-none');
                $recipientLabel.textContent = request.recipientLabel;
            }
        }

        // Set value and fee.
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);

        $value.textContent = this._formatNumber(totalNim);

        if ($fee && transaction.fee > 0) {
            $fee.textContent = Nimiq.Policy.satoshisToCoins(transaction.fee).toString();
            /** @type {HTMLDivElement} */
            const $feeSection = ($pageBody.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        // Set transaction extra data.
        if ($data && transaction.data.byteLength > 0) {
            // FIXME Detect and use proper encoding.
            $data.textContent = Nimiq.BufferUtils.toAscii(transaction.data);
            /** @type {HTMLDivElement} */
            const $dataSection = ($pageBody.querySelector('.data-section'));
            $dataSection.classList.remove('display-none');
        }

        // Set up passphrase box.
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('#passphrase-box'));
        this._passphraseBox = new PassphraseBox($passphraseBox, {
            bgColor: 'purple',
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passphrasebox-confirm-tx',
        });

        this._passphraseBox.on(
            PassphraseBox.Events.SUBMIT,
            passphrase => this._onConfirm(request, resolve, reject, passphrase),
        );
        this._passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());
    }

    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     * @param {string} passphrase
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, passphrase) {
        document.body.classList.add('loading');

        try {
            // XXX Passphrase encoding
            const passphraseBuf = Nimiq.BufferUtils.fromAscii(passphrase);
            const key = await KeyStore.instance.get(request.keyInfo.id, passphraseBuf);
            if (!key) {
                reject(new Error('Failed to retrieve key'));
                return;
            }

            const publicKey = key.derivePublicKey(request.keyPath);
            const signature = key.sign(request.keyPath, request.transaction.serializeContent());
            const result = /** @type {SignTransactionResult} */ {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
            resolve(result);
        } catch (e) {
            console.error(e);
            document.body.classList.remove('loading');

            // Assume the passphrase was wrong
            this._passphraseBox.onPassphraseIncorrect();
        }
    }

    run() {
        // Go to start page
        window.location.hash = BaseLayout.Pages.CONFIRM_TRANSACTION;
        this._passphraseBox.focus();

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {number} value
     * @param {number} [maxDecimals]
     * @param {number} [minDecimals]
     * @returns {string}
     */
    _formatNumber(value, maxDecimals = 5, minDecimals = 2) {
        const roundingFactor = 10 ** maxDecimals;
        value = Math.floor(value * roundingFactor) / roundingFactor;

        const result = parseFloat(value.toFixed(minDecimals)) === value
            ? value.toFixed(minDecimals)
            : value.toString();

        if (Math.abs(value) < 10000) return result;

        // Add thin spaces (U+202F) every 3 digits. Stop at the decimal separator if there is one.
        const regexp = minDecimals > 0 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(\d{3})+$)/g;
        return result.replace(regexp, '$1\u202F');
    }
}

BaseLayout.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
/* global BaseLayout */
/* global I18n */

class LayoutStandard extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutStandard._createElement($el);
        super(request, resolve, reject);
        this.$el = container;
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-standard');

        $el.innerHTML = `
            <div class="page-header">
                <!-- <a tabindex="0" class="page-header-back-button icon-back-arrow"></a> -->
                <h1 data-i18n="sign-tx-heading">New Transaction</h1>
            </div>

            <div class="page-body transaction">
                <div class="center accounts">
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="label display-none" id="sender-label"></div>
                        <div class="address" id="sender-address"></div>
                    </div>

                    <i class="arrow icon-forward-chevron"></i>

                    <div class="account">
                        <div class="identicon" id="recipient-identicon"></div>
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center total">
                    <div class="value">
                        <span id="value"></span><span class="nim-symbol"></span>
                    </div>
                </div>

                <div class="center fee-section display-none">
                    <span data-i18n="sign-tx-includes">includes</span>
                    <span id="fee"></span>
                    <span class="nim-symbol"></span>
                    <span data-i18n="sign-tx-fee">fee</span>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }
}
/* global BaseLayout */
/* global I18n */
/* global Nimiq */
/* global PaymentInfoLine */

class LayoutCheckout extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        request.recipientLabel = LayoutCheckout._originToDomain(request.shopOrigin);

        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutCheckout._createElement($el);
        super(request, resolve, reject);
        this.$el = container;

        // Set up payment-info-line
        const $paymentInfoLine = /** @type {HTMLElement} */ (document.querySelector('.payment-info-line'));

        const transaction = request.transaction;
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);
        new PaymentInfoLine( // eslint-disable-line no-new
            $paymentInfoLine,
            LayoutCheckout._originToDomain(request.shopOrigin),
            this._formatNumber(totalNim),
        );
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-checkout');

        $el.innerHTML = `
            <div class="page-body transaction">
                <h1>
                    <span data-i18n="sign-tx-youre-sending">You're sending</span>
                    <strong id="value"></strong>
                    <strong class="nim-symbol"></strong>
                    <span data-i18n="sign-tx-to">to</span>
                </h1>

                <div class="account shop-account">
                    <div class="identicon-cover"></div>
                    <div class="identicon" id="recipient-identicon"></div>
                    <div class="account-text">
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>

                <div class="sender-section">
                    <h2 data-i18n="sign-tx-pay-with">Pay with</h2>
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="account-text">
                            <div class="label display-none" id="sender-label"></div>
                            <div class="address" id="sender-address"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @param {string} [origin]
     * @returns {string}
     */
    static _originToDomain(origin) {
        if (!origin) return '---';
        return origin.split('://')[1] || '---';
    }
}
/* global Nimiq */
/* global KeyStore */
/* global TopLevelApi */
/* global LayoutStandard */
/* global LayoutCheckout */

class SignTransactionApi extends TopLevelApi {
    /**
     * @param {SignTransactionRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await SignTransactionApi._parseRequest(request);
        const $layoutContainer = document.getElementById('layout-container');

        const handler = new SignTransactionApi.Layouts[parsedRequest.layout](
            $layoutContainer,
            parsedRequest,
            this.resolve.bind(this),
            this.reject.bind(this),
        );

        handler.run();
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Promise<ParsedSignTransactionRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        // Check that the layout is valid
        if (request.layout && !SignTransactionApi.Layouts[request.layout]) {
            throw new Error('Invalid selected layout');
        }

        // Check that keyId is given.
        if (typeof request.keyId !== 'string' || !request.keyId) {
            throw new Error('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Error('Unknown keyId');
        }

        // Check that keyPath is given.
        if (typeof request.keyPath !== 'string' || !request.keyPath) {
            throw new Error('keyPath is required');
        }

        // Check that keyPath is valid.
        if (!Nimiq.ExtendedPrivateKey.isValidPath(request.keyPath)) {
            throw new Error('Invalid keyPath');
        }

        // Parse transaction.
        const transaction = SignTransactionApi._parseTransaction(request);

        // Check that the transaction is for the correct network.
        if (transaction.networkId !== Nimiq.GenesisConfig.NETWORK_ID) {
            throw new Error('Transaction is not valid in this network');
        }

        // Check that sender != recipient.
        if (transaction.recipient.equals(transaction.sender)) {
            throw new Error('Sender and recipient must not match');
        }

        // Check sender / recipient account type.
        const accountTypes = new Set([Nimiq.Account.Type.BASIC, Nimiq.Account.Type.VESTING, Nimiq.Account.Type.HTLC]);
        if (!accountTypes.has(transaction.senderType) || !accountTypes.has(transaction.recipientType)) {
            throw new Error('Invalid sender type');
        }

        // Validate labels.
        const labels = [request.keyLabel, request.senderLabel, request.recipientLabel];
        if (labels.some(label => label !== undefined && (typeof label !== 'string' || label.length > 64))) {
            throw new Error('Invalid label');
        }

        return /** @type {ParsedSignTransactionRequest} */ {
            layout: request.layout || 'standard',
            shopOrigin: request.shopOrigin,
            appName: request.appName,

            keyInfo,
            keyPath: request.keyPath,
            transaction,

            keyLabel: request.keyLabel,
            senderLabel: request.senderLabel,
            recipientLabel: request.recipientLabel,
        };
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Nimiq.ExtendedTransaction}
     * @private
     */
    static _parseTransaction(request) {
        const sender = new Nimiq.Address(request.sender);
        const senderType = request.senderType || Nimiq.Account.Type.BASIC;
        const recipient = new Nimiq.Address(request.recipient);
        const recipientType = request.recipientType || Nimiq.Account.Type.BASIC;
        const flags = request.flags || Nimiq.Transaction.Flag.NONE;
        const data = request.data || new Uint8Array(0);
        const networkId = request.networkId || Nimiq.GenesisConfig.NETWORK_ID;
        return new Nimiq.ExtendedTransaction(
            sender,
            senderType,
            recipient,
            recipientType,
            request.value,
            request.fee,
            request.validityStartHeight,
            flags,
            data,
            new Uint8Array(0), // proof
            networkId,
        );
    }
}

SignTransactionApi.Layouts = {
    standard: LayoutStandard,
    checkout: LayoutCheckout,
    // 'cashlink': LayoutCashlink,
};
/* global SignTransactionApi */
/* global runKeyguard */

runKeyguard(SignTransactionApi);
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
class Iqons {
    /* Public API */

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async svg(text) {
        const hash = this._hash(text);
        return this._svgTemplate(
            parseInt(hash[0], 10),
            parseInt(hash[2], 10),
            parseInt(hash[3] + hash[4], 10),
            parseInt(hash[5] + hash[6], 10),
            parseInt(hash[7] + hash[8], 10),
            parseInt(hash[9] + hash[10], 10),
            parseInt(hash[11], 10),
        );
    }

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async toDataUrl(text) {
        const base64string = btoa(await this.svg(text));
        return `data:image/svg+xml;base64,${base64string.replace(/#/g, '%23')}`;
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholder(color, strokeWidth) {
        color = color || '#bbb';
        strokeWidth = strokeWidth || 1;
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
    <path fill="none" stroke="${color}" stroke-width="${2 * strokeWidth}" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
    <g transform="scale(0.9) translate(9, 8)">
        <circle cx="80" cy="80" r="40" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity=".9"></circle>
        <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>\`
    </g>
</svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholderToDataUrl(color, strokeWidth) {
        return `data:image/svg+xml;base64,${btoa(this.placeholder(color, strokeWidth))}`;
    }

    /* Private API */

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _svgTemplate(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        return this._$svg(await this._$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor));
    }

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        if (color === backgroundColor) {
            color += 1;
            if (color > 9) color = 0;
        }

        while (accentColor === color || accentColor === backgroundColor) {
            accentColor += 1;
            if (accentColor > 9) accentColor = 0;
        }

        const colorString = this.colors[color];
        const backgroundColorString = this.colors[backgroundColor];
        const accentColorString = this.colors[accentColor];

        /* eslint-disable max-len */
        return `<g color="${colorString}" fill="${accentColorString}">
    <rect fill="${backgroundColorString}" x="0" y="0" width="160" height="160"></rect>
    <circle cx="80" cy="80" r="40" fill="${colorString}"></circle>
    <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>
    ${await this._generatePart('top', topNr)}
    ${await this._generatePart('side', sidesNr)}
    ${await this._generatePart('face', faceNr)}
    ${await this._generatePart('bottom', bottomNr)}
</g>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} content
     * @returns {string}
     */
    static _$svg(content) {
        const randomId = this._getRandomId();
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
    <defs>
        <clipPath id="hexagon-clip-${randomId}" transform="scale(0.5) translate(0, 16)">
            <path d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
        </clipPath>
    </defs>
    <path fill="white" stroke="#bbbbbb" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
    <g transform="scale(0.9) translate(9, 8)">
        <g clip-path="url(#hexagon-clip-${randomId})">
            ${content}
        </g>
    </g>
</svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} part
     * @param {number} index
     * @returns {Promise<string>}
     */
    static async _generatePart(part, index) {
        const assets = await this._getAssets();
        const selector = `#${part}_${this._assetIndex(index, part)}`;
        const $part = assets.querySelector(selector);
        return ($part && $part.innerHTML) || '';
    }

    /**
     * @returns {Promise<Document>}
     */
    static async _getAssets() {
        /** @type {Promise<Document>} */
        this._assetPromise = this._assetPromise || fetch(this.svgPath)
            .then(response => response.text())
            .then(assetsText => {
                const parser = new DOMParser();
                const assets = parser.parseFromString(assetsText, 'image/svg+xml');
                this._assets = assets;
                return assets;
            });
        return this._assetPromise;
    }

    static get hasAssets() {
        return !!this._assets;
    }

    /** @type {string[]} */
    static get colors() {
        return [
            '#fb8c00', // orange-600
            '#d32f2f', // red-700
            '#fbc02d', // yellow-700
            '#3949ab', // indigo-600
            '#03a9f4', // light-blue-500
            '#8e24aa', // purple-600
            '#009688', // teal-500
            '#f06292', // pink-300
            '#7cb342', // light-green-600
            '#795548', // brown-400
        ];
    }

    /** @type {object} */
    static get assetCounts() {
        return {
            face: Iqons.CATALOG.face.length,
            side: Iqons.CATALOG.side.length,
            top: Iqons.CATALOG.top.length,
            bottom: Iqons.CATALOG.bottom.length,
        };
    }

    /**
     * @param {number} index
     * @param {string} part
     * @returns {string}
     */
    static _assetIndex(index, part) {
        index = (index % this.assetCounts[part]) + 1;
        let fullIndex = index.toString();
        if (index < 10) fullIndex = `0${fullIndex}`;
        return fullIndex;
    }

    /**
     * @param {string} text
     * @returns {string}
     */
    static _hash(text) {
        return (`${text
            .split('')
            .map(c => Number(c.charCodeAt(0)) + 3)
            .reduce((a, e) => a * (1 - a) * this._chaosHash(e), 0.5)}`)
            .split('')
            .reduce((a, e) => e + a, '')
            .substr(4, 17);
    }

    /**
     * @param {number} number
     * @returns {number}
     */
    static _chaosHash(number) {
        const k = 3.569956786876;
        let an = 1 / number;
        for (let i = 0; i < 100; i++) {
            an = (1 - an) * an * k;
        }
        return an;
    }

    /**
     * @returns {number}
     */
    static _getRandomId() {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0];
    }
}

Iqons.svgPath = '../../lib/Iqons.min.svg';

Iqons.CATALOG = {
    face: [
        'face_01', 'face_02', 'face_03', 'face_04', 'face_05', 'face_06', 'face_07',
        'face_08', 'face_09', 'face_10', 'face_11', 'face_12', 'face_13', 'face_14',
        'face_15', 'face_16', 'face_17', 'face_18', 'face_19', 'face_20', 'face_21',
    ],
    side: [
        'side_01', 'side_02', 'side_03', 'side_04', 'side_05', 'side_06', 'side_07',
        'side_08', 'side_09', 'side_10', 'side_11', 'side_12', 'side_13', 'side_14',
        'side_15', 'side_16', 'side_17', 'side_18', 'side_19', 'side_20', 'side_21',
    ],
    top: [
        'top_01', 'top_02', 'top_03', 'top_04', 'top_05', 'top_06', 'top_07',
        'top_08', 'top_09', 'top_10', 'top_11', 'top_12', 'top_13', 'top_14',
        'top_15', 'top_16', 'top_17', 'top_18', 'top_19', 'top_20', 'top_21',
    ],
    bottom: [
        'bottom_01', 'bottom_02', 'bottom_03', 'bottom_04', 'bottom_05', 'bottom_06', 'bottom_07',
        'bottom_08', 'bottom_09', 'bottom_10', 'bottom_11', 'bottom_12', 'bottom_13', 'bottom_14',
        'bottom_15', 'bottom_16', 'bottom_17', 'bottom_18', 'bottom_19', 'bottom_20', 'bottom_21',
    ],
};
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
/* global Iqons */

class Identicon { // eslint-disable-line no-unused-vars
    /**
     * @param {string} [address]
     * @param {HTMLDivElement} [$el]
     */
    constructor(address, $el) {
        this._address = address;

        this.$el = Identicon._createElement($el);
        this.$imgEl = this.$el.firstChild;

        this._updateIqon();
    }

    /**
     * @returns {HTMLDivElement}
     */
    getElement() {
        return this.$el;
    }

    /**
     * @param {string} address
     */
    set address(address) {
        this._address = address;
        this._updateIqon();
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        const $element = $el || document.createElement('div');
        const imageElement = document.createElement('img');
        $element.classList.add('identicon');
        $element.appendChild(imageElement);

        return $element;
    }

    _updateIqon() {
        if (!this._address || !Iqons.hasAssets) {
            /** @type {HTMLImageElement} */ (this.$imgEl).src = Iqons.placeholderToDataUrl();
        }

        if (this._address) {
            Iqons.toDataUrl(this._address).then(url => {
                // Placeholder setting above is synchronous, thus this async result will replace the placeholder
                /** @type {HTMLImageElement} */ (this.$imgEl).src = url;
            });
        }
    }
}
/* global Nimiq */

class PaymentInfoLine extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {string} domain
     * @param {string} formattedAmount
     */
    constructor($el, domain, formattedAmount) {
        super();
        this.$el = PaymentInfoLine._createElement($el, domain, formattedAmount);
        this.$el.classList.remove('display-none');
    }

    /**
     * @param {?HTMLElement} [$el]
     * @param {string} domain
     * @param {string} formattedAmount
     * @returns {HTMLElement}
     */
    static _createElement($el, domain, formattedAmount) {
        $el = $el || document.createElement('div');
        $el.classList.add('payment-info-line');

        $el.innerHTML = `
            <div class="description">
                Payment to
                <span domain></span>
            </div>
            <div class="amount">
                <span amount></span>
                <span class="nim-symbol"></span>
            </div>
        `;

        /** @type {HTMLElement} */ ($el.querySelector('[domain]')).textContent = domain;
        /** @type {HTMLElement} */ ($el.querySelector('[amount]')).textContent = formattedAmount;

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
}
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
/* global Nimiq */
/* global KeyStore */
/* global Identicon */
/* global PassphraseBox */

class BaseLayout {
    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        /** @type {HTMLDivElement} */
        const $pageBody = (document.querySelector('#confirm-transaction .transaction'));

        /** @type {HTMLDivElement} */
        const $senderIdenticon = ($pageBody.querySelector('#sender-identicon'));
        /** @type {HTMLDivElement} */
        const $recipientIdenticon = ($pageBody.querySelector('#recipient-identicon'));

        /** @type {HTMLDivElement} */
        const $senderLabel = ($pageBody.querySelector('#sender-label'));
        /** @type {HTMLDivElement} */
        const $recipientLabel = ($pageBody.querySelector('#recipient-label'));

        /** @type {HTMLDivElement} */
        const $senderAddress = ($pageBody.querySelector('#sender-address'));
        /** @type {HTMLDivElement} */
        const $recipientAddress = ($pageBody.querySelector('#recipient-address'));

        /** @type {HTMLDivElement} */
        const $value = ($pageBody.querySelector('#value'));
        /** @type {HTMLDivElement} */
        const $fee = ($pageBody.querySelector('#fee'));
        /** @type {HTMLDivElement} */
        const $data = ($pageBody.querySelector('#data'));

        // Set sender data.
        const transaction = request.transaction;
        const senderAddress = transaction.sender.toUserFriendlyAddress();
        new Identicon(senderAddress, $senderIdenticon); // eslint-disable-line no-new
        $senderAddress.textContent = senderAddress;
        if (request.senderLabel) {
            $senderLabel.classList.remove('display-none');
            $senderLabel.textContent = request.senderLabel;
        }

        // Set recipient data.
        if ($recipientAddress) {
            const recipientAddress = transaction.recipient.toUserFriendlyAddress();
            if (request.layout === 'checkout') {
                new Identicon(undefined, $recipientIdenticon); // eslint-disable-line no-new
            } else {
                new Identicon(recipientAddress, $recipientIdenticon); // eslint-disable-line no-new
            }
            $recipientAddress.textContent = recipientAddress;
            if (request.recipientLabel) {
                $recipientLabel.classList.remove('display-none');
                $recipientLabel.textContent = request.recipientLabel;
            }
        }

        // Set value and fee.
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);

        $value.textContent = this._formatNumber(totalNim);

        if ($fee && transaction.fee > 0) {
            $fee.textContent = Nimiq.Policy.satoshisToCoins(transaction.fee).toString();
            /** @type {HTMLDivElement} */
            const $feeSection = ($pageBody.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        // Set transaction extra data.
        if ($data && transaction.data.byteLength > 0) {
            // FIXME Detect and use proper encoding.
            $data.textContent = Nimiq.BufferUtils.toAscii(transaction.data);
            /** @type {HTMLDivElement} */
            const $dataSection = ($pageBody.querySelector('.data-section'));
            $dataSection.classList.remove('display-none');
        }

        // Set up passphrase box.
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('#passphrase-box'));
        this._passphraseBox = new PassphraseBox($passphraseBox, {
            bgColor: 'purple',
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passphrasebox-confirm-tx',
        });

        this._passphraseBox.on(
            PassphraseBox.Events.SUBMIT,
            passphrase => this._onConfirm(request, resolve, reject, passphrase),
        );
        this._passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());
    }

    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     * @param {string} passphrase
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, passphrase) {
        document.body.classList.add('loading');

        try {
            // XXX Passphrase encoding
            const passphraseBuf = Nimiq.BufferUtils.fromAscii(passphrase);
            const key = await KeyStore.instance.get(request.keyInfo.id, passphraseBuf);
            if (!key) {
                reject(new Error('Failed to retrieve key'));
                return;
            }

            const publicKey = key.derivePublicKey(request.keyPath);
            const signature = key.sign(request.keyPath, request.transaction.serializeContent());
            const result = /** @type {SignTransactionResult} */ {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
            resolve(result);
        } catch (e) {
            console.error(e);
            document.body.classList.remove('loading');

            // Assume the passphrase was wrong
            this._passphraseBox.onPassphraseIncorrect();
        }
    }

    run() {
        // Go to start page
        window.location.hash = BaseLayout.Pages.CONFIRM_TRANSACTION;
        this._passphraseBox.focus();

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {number} value
     * @param {number} [maxDecimals]
     * @param {number} [minDecimals]
     * @returns {string}
     */
    _formatNumber(value, maxDecimals = 5, minDecimals = 2) {
        const roundingFactor = 10 ** maxDecimals;
        value = Math.floor(value * roundingFactor) / roundingFactor;

        const result = parseFloat(value.toFixed(minDecimals)) === value
            ? value.toFixed(minDecimals)
            : value.toString();

        if (Math.abs(value) < 10000) return result;

        // Add thin spaces (U+202F) every 3 digits. Stop at the decimal separator if there is one.
        const regexp = minDecimals > 0 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(\d{3})+$)/g;
        return result.replace(regexp, '$1\u202F');
    }
}

BaseLayout.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
/* global BaseLayout */
/* global I18n */

class LayoutStandard extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutStandard._createElement($el);
        super(request, resolve, reject);
        this.$el = container;
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-standard');

        $el.innerHTML = `
            <div class="page-header">
                <!-- <a tabindex="0" class="page-header-back-button icon-back-arrow"></a> -->
                <h1 data-i18n="sign-tx-heading">New Transaction</h1>
            </div>

            <div class="page-body transaction">
                <div class="center accounts">
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="label display-none" id="sender-label"></div>
                        <div class="address" id="sender-address"></div>
                    </div>

                    <i class="arrow icon-forward-chevron"></i>

                    <div class="account">
                        <div class="identicon" id="recipient-identicon"></div>
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center total">
                    <div class="value">
                        <span id="value"></span><span class="nim-symbol"></span>
                    </div>
                </div>

                <div class="center fee-section display-none">
                    <span data-i18n="sign-tx-includes">includes</span>
                    <span id="fee"></span>
                    <span class="nim-symbol"></span>
                    <span data-i18n="sign-tx-fee">fee</span>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }
}
/* global BaseLayout */
/* global I18n */
/* global Nimiq */
/* global PaymentInfoLine */

class LayoutCheckout extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        request.recipientLabel = LayoutCheckout._originToDomain(request.shopOrigin);

        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutCheckout._createElement($el);
        super(request, resolve, reject);
        this.$el = container;

        // Set up payment-info-line
        const $paymentInfoLine = /** @type {HTMLElement} */ (document.querySelector('.payment-info-line'));

        const transaction = request.transaction;
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);
        new PaymentInfoLine( // eslint-disable-line no-new
            $paymentInfoLine,
            LayoutCheckout._originToDomain(request.shopOrigin),
            this._formatNumber(totalNim),
        );
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-checkout');

        $el.innerHTML = `
            <div class="page-body transaction">
                <h1>
                    <span data-i18n="sign-tx-youre-sending">You're sending</span>
                    <strong id="value"></strong>
                    <strong class="nim-symbol"></strong>
                    <span data-i18n="sign-tx-to">to</span>
                </h1>

                <div class="account shop-account">
                    <div class="identicon-cover"></div>
                    <div class="identicon" id="recipient-identicon"></div>
                    <div class="account-text">
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>

                <div class="sender-section">
                    <h2 data-i18n="sign-tx-pay-with">Pay with</h2>
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="account-text">
                            <div class="label display-none" id="sender-label"></div>
                            <div class="address" id="sender-address"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @param {string} [origin]
     * @returns {string}
     */
    static _originToDomain(origin) {
        if (!origin) return '---';
        return origin.split('://')[1] || '---';
    }
}
/* global Nimiq */
/* global KeyStore */
/* global TopLevelApi */
/* global LayoutStandard */
/* global LayoutCheckout */

class SignTransactionApi extends TopLevelApi {
    /**
     * @param {SignTransactionRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await SignTransactionApi._parseRequest(request);
        const $layoutContainer = document.getElementById('layout-container');

        const handler = new SignTransactionApi.Layouts[parsedRequest.layout](
            $layoutContainer,
            parsedRequest,
            this.resolve.bind(this),
            this.reject.bind(this),
        );

        handler.run();
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Promise<ParsedSignTransactionRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        // Check that the layout is valid
        if (request.layout && !SignTransactionApi.Layouts[request.layout]) {
            throw new Error('Invalid selected layout');
        }

        // Check that keyId is given.
        if (typeof request.keyId !== 'string' || !request.keyId) {
            throw new Error('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Error('Unknown keyId');
        }

        // Check that keyPath is given.
        if (typeof request.keyPath !== 'string' || !request.keyPath) {
            throw new Error('keyPath is required');
        }

        // Check that keyPath is valid.
        if (!Nimiq.ExtendedPrivateKey.isValidPath(request.keyPath)) {
            throw new Error('Invalid keyPath');
        }

        // Parse transaction.
        const transaction = SignTransactionApi._parseTransaction(request);

        // Check that the transaction is for the correct network.
        if (transaction.networkId !== Nimiq.GenesisConfig.NETWORK_ID) {
            throw new Error('Transaction is not valid in this network');
        }

        // Check that sender != recipient.
        if (transaction.recipient.equals(transaction.sender)) {
            throw new Error('Sender and recipient must not match');
        }

        // Check sender / recipient account type.
        const accountTypes = new Set([Nimiq.Account.Type.BASIC, Nimiq.Account.Type.VESTING, Nimiq.Account.Type.HTLC]);
        if (!accountTypes.has(transaction.senderType) || !accountTypes.has(transaction.recipientType)) {
            throw new Error('Invalid sender type');
        }

        // Validate labels.
        const labels = [request.keyLabel, request.senderLabel, request.recipientLabel];
        if (labels.some(label => label !== undefined && (typeof label !== 'string' || label.length > 64))) {
            throw new Error('Invalid label');
        }

        return /** @type {ParsedSignTransactionRequest} */ {
            layout: request.layout || 'standard',
            shopOrigin: request.shopOrigin,
            appName: request.appName,

            keyInfo,
            keyPath: request.keyPath,
            transaction,

            keyLabel: request.keyLabel,
            senderLabel: request.senderLabel,
            recipientLabel: request.recipientLabel,
        };
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Nimiq.ExtendedTransaction}
     * @private
     */
    static _parseTransaction(request) {
        const sender = new Nimiq.Address(request.sender);
        const senderType = request.senderType || Nimiq.Account.Type.BASIC;
        const recipient = new Nimiq.Address(request.recipient);
        const recipientType = request.recipientType || Nimiq.Account.Type.BASIC;
        const flags = request.flags || Nimiq.Transaction.Flag.NONE;
        const data = request.data || new Uint8Array(0);
        const networkId = request.networkId || Nimiq.GenesisConfig.NETWORK_ID;
        return new Nimiq.ExtendedTransaction(
            sender,
            senderType,
            recipient,
            recipientType,
            request.value,
            request.fee,
            request.validityStartHeight,
            flags,
            data,
            new Uint8Array(0), // proof
            networkId,
        );
    }
}

SignTransactionApi.Layouts = {
    standard: LayoutStandard,
    checkout: LayoutCheckout,
    // 'cashlink': LayoutCashlink,
};
/* global SignTransactionApi */
/* global runKeyguard */

runKeyguard(SignTransactionApi);
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
class Iqons {
    /* Public API */

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async svg(text) {
        const hash = this._hash(text);
        return this._svgTemplate(
            parseInt(hash[0], 10),
            parseInt(hash[2], 10),
            parseInt(hash[3] + hash[4], 10),
            parseInt(hash[5] + hash[6], 10),
            parseInt(hash[7] + hash[8], 10),
            parseInt(hash[9] + hash[10], 10),
            parseInt(hash[11], 10),
        );
    }

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async toDataUrl(text) {
        const base64string = btoa(await this.svg(text));
        return `data:image/svg+xml;base64,${base64string.replace(/#/g, '%23')}`;
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholder(color, strokeWidth) {
        color = color || '#bbb';
        strokeWidth = strokeWidth || 1;
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
    <path fill="none" stroke="${color}" stroke-width="${2 * strokeWidth}" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
    <g transform="scale(0.9) translate(9, 8)">
        <circle cx="80" cy="80" r="40" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity=".9"></circle>
        <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>\`
    </g>
</svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholderToDataUrl(color, strokeWidth) {
        return `data:image/svg+xml;base64,${btoa(this.placeholder(color, strokeWidth))}`;
    }

    /* Private API */

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _svgTemplate(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        return this._$svg(await this._$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor));
    }

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        if (color === backgroundColor) {
            color += 1;
            if (color > 9) color = 0;
        }

        while (accentColor === color || accentColor === backgroundColor) {
            accentColor += 1;
            if (accentColor > 9) accentColor = 0;
        }

        const colorString = this.colors[color];
        const backgroundColorString = this.colors[backgroundColor];
        const accentColorString = this.colors[accentColor];

        /* eslint-disable max-len */
        return `<g color="${colorString}" fill="${accentColorString}">
    <rect fill="${backgroundColorString}" x="0" y="0" width="160" height="160"></rect>
    <circle cx="80" cy="80" r="40" fill="${colorString}"></circle>
    <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>
    ${await this._generatePart('top', topNr)}
    ${await this._generatePart('side', sidesNr)}
    ${await this._generatePart('face', faceNr)}
    ${await this._generatePart('bottom', bottomNr)}
</g>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} content
     * @returns {string}
     */
    static _$svg(content) {
        const randomId = this._getRandomId();
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
    <defs>
        <clipPath id="hexagon-clip-${randomId}" transform="scale(0.5) translate(0, 16)">
            <path d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
        </clipPath>
    </defs>
    <path fill="white" stroke="#bbbbbb" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
    <g transform="scale(0.9) translate(9, 8)">
        <g clip-path="url(#hexagon-clip-${randomId})">
            ${content}
        </g>
    </g>
</svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} part
     * @param {number} index
     * @returns {Promise<string>}
     */
    static async _generatePart(part, index) {
        const assets = await this._getAssets();
        const selector = `#${part}_${this._assetIndex(index, part)}`;
        const $part = assets.querySelector(selector);
        return ($part && $part.innerHTML) || '';
    }

    /**
     * @returns {Promise<Document>}
     */
    static async _getAssets() {
        /** @type {Promise<Document>} */
        this._assetPromise = this._assetPromise || fetch(this.svgPath)
            .then(response => response.text())
            .then(assetsText => {
                const parser = new DOMParser();
                const assets = parser.parseFromString(assetsText, 'image/svg+xml');
                this._assets = assets;
                return assets;
            });
        return this._assetPromise;
    }

    static get hasAssets() {
        return !!this._assets;
    }

    /** @type {string[]} */
    static get colors() {
        return [
            '#fb8c00', // orange-600
            '#d32f2f', // red-700
            '#fbc02d', // yellow-700
            '#3949ab', // indigo-600
            '#03a9f4', // light-blue-500
            '#8e24aa', // purple-600
            '#009688', // teal-500
            '#f06292', // pink-300
            '#7cb342', // light-green-600
            '#795548', // brown-400
        ];
    }

    /** @type {object} */
    static get assetCounts() {
        return {
            face: Iqons.CATALOG.face.length,
            side: Iqons.CATALOG.side.length,
            top: Iqons.CATALOG.top.length,
            bottom: Iqons.CATALOG.bottom.length,
        };
    }

    /**
     * @param {number} index
     * @param {string} part
     * @returns {string}
     */
    static _assetIndex(index, part) {
        index = (index % this.assetCounts[part]) + 1;
        let fullIndex = index.toString();
        if (index < 10) fullIndex = `0${fullIndex}`;
        return fullIndex;
    }

    /**
     * @param {string} text
     * @returns {string}
     */
    static _hash(text) {
        return (`${text
            .split('')
            .map(c => Number(c.charCodeAt(0)) + 3)
            .reduce((a, e) => a * (1 - a) * this._chaosHash(e), 0.5)}`)
            .split('')
            .reduce((a, e) => e + a, '')
            .substr(4, 17);
    }

    /**
     * @param {number} number
     * @returns {number}
     */
    static _chaosHash(number) {
        const k = 3.569956786876;
        let an = 1 / number;
        for (let i = 0; i < 100; i++) {
            an = (1 - an) * an * k;
        }
        return an;
    }

    /**
     * @returns {number}
     */
    static _getRandomId() {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0];
    }
}

Iqons.svgPath = '../../lib/Iqons.min.svg';

Iqons.CATALOG = {
    face: [
        'face_01', 'face_02', 'face_03', 'face_04', 'face_05', 'face_06', 'face_07',
        'face_08', 'face_09', 'face_10', 'face_11', 'face_12', 'face_13', 'face_14',
        'face_15', 'face_16', 'face_17', 'face_18', 'face_19', 'face_20', 'face_21',
    ],
    side: [
        'side_01', 'side_02', 'side_03', 'side_04', 'side_05', 'side_06', 'side_07',
        'side_08', 'side_09', 'side_10', 'side_11', 'side_12', 'side_13', 'side_14',
        'side_15', 'side_16', 'side_17', 'side_18', 'side_19', 'side_20', 'side_21',
    ],
    top: [
        'top_01', 'top_02', 'top_03', 'top_04', 'top_05', 'top_06', 'top_07',
        'top_08', 'top_09', 'top_10', 'top_11', 'top_12', 'top_13', 'top_14',
        'top_15', 'top_16', 'top_17', 'top_18', 'top_19', 'top_20', 'top_21',
    ],
    bottom: [
        'bottom_01', 'bottom_02', 'bottom_03', 'bottom_04', 'bottom_05', 'bottom_06', 'bottom_07',
        'bottom_08', 'bottom_09', 'bottom_10', 'bottom_11', 'bottom_12', 'bottom_13', 'bottom_14',
        'bottom_15', 'bottom_16', 'bottom_17', 'bottom_18', 'bottom_19', 'bottom_20', 'bottom_21',
    ],
};
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
/* global Iqons */

class Identicon { // eslint-disable-line no-unused-vars
    /**
     * @param {string} [address]
     * @param {HTMLDivElement} [$el]
     */
    constructor(address, $el) {
        this._address = address;

        this.$el = Identicon._createElement($el);
        this.$imgEl = this.$el.firstChild;

        this._updateIqon();
    }

    /**
     * @returns {HTMLDivElement}
     */
    getElement() {
        return this.$el;
    }

    /**
     * @param {string} address
     */
    set address(address) {
        this._address = address;
        this._updateIqon();
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        const $element = $el || document.createElement('div');
        const imageElement = document.createElement('img');
        $element.classList.add('identicon');
        $element.appendChild(imageElement);

        return $element;
    }

    _updateIqon() {
        if (!this._address || !Iqons.hasAssets) {
            /** @type {HTMLImageElement} */ (this.$imgEl).src = Iqons.placeholderToDataUrl();
        }

        if (this._address) {
            Iqons.toDataUrl(this._address).then(url => {
                // Placeholder setting above is synchronous, thus this async result will replace the placeholder
                /** @type {HTMLImageElement} */ (this.$imgEl).src = url;
            });
        }
    }
}
/* global Nimiq */

class PaymentInfoLine extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {string} domain
     * @param {string} formattedAmount
     */
    constructor($el, domain, formattedAmount) {
        super();
        this.$el = PaymentInfoLine._createElement($el, domain, formattedAmount);
        this.$el.classList.remove('display-none');
    }

    /**
     * @param {?HTMLElement} [$el]
     * @param {string} domain
     * @param {string} formattedAmount
     * @returns {HTMLElement}
     */
    static _createElement($el, domain, formattedAmount) {
        $el = $el || document.createElement('div');
        $el.classList.add('payment-info-line');

        $el.innerHTML = `
            <div class="description">
                Payment to
                <span domain></span>
            </div>
            <div class="amount">
                <span amount></span>
                <span class="nim-symbol"></span>
            </div>
        `;

        /** @type {HTMLElement} */ ($el.querySelector('[domain]')).textContent = domain;
        /** @type {HTMLElement} */ ($el.querySelector('[amount]')).textContent = formattedAmount;

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
}
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
/* global Nimiq */
/* global KeyStore */
/* global Identicon */
/* global PassphraseBox */

class BaseLayout {
    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        /** @type {HTMLDivElement} */
        const $pageBody = (document.querySelector('#confirm-transaction .transaction'));

        /** @type {HTMLDivElement} */
        const $senderIdenticon = ($pageBody.querySelector('#sender-identicon'));
        /** @type {HTMLDivElement} */
        const $recipientIdenticon = ($pageBody.querySelector('#recipient-identicon'));

        /** @type {HTMLDivElement} */
        const $senderLabel = ($pageBody.querySelector('#sender-label'));
        /** @type {HTMLDivElement} */
        const $recipientLabel = ($pageBody.querySelector('#recipient-label'));

        /** @type {HTMLDivElement} */
        const $senderAddress = ($pageBody.querySelector('#sender-address'));
        /** @type {HTMLDivElement} */
        const $recipientAddress = ($pageBody.querySelector('#recipient-address'));

        /** @type {HTMLDivElement} */
        const $value = ($pageBody.querySelector('#value'));
        /** @type {HTMLDivElement} */
        const $fee = ($pageBody.querySelector('#fee'));
        /** @type {HTMLDivElement} */
        const $data = ($pageBody.querySelector('#data'));

        // Set sender data.
        const transaction = request.transaction;
        const senderAddress = transaction.sender.toUserFriendlyAddress();
        new Identicon(senderAddress, $senderIdenticon); // eslint-disable-line no-new
        $senderAddress.textContent = senderAddress;
        if (request.senderLabel) {
            $senderLabel.classList.remove('display-none');
            $senderLabel.textContent = request.senderLabel;
        }

        // Set recipient data.
        if ($recipientAddress) {
            const recipientAddress = transaction.recipient.toUserFriendlyAddress();
            if (request.layout === 'checkout') {
                new Identicon(undefined, $recipientIdenticon); // eslint-disable-line no-new
            } else {
                new Identicon(recipientAddress, $recipientIdenticon); // eslint-disable-line no-new
            }
            $recipientAddress.textContent = recipientAddress;
            if (request.recipientLabel) {
                $recipientLabel.classList.remove('display-none');
                $recipientLabel.textContent = request.recipientLabel;
            }
        }

        // Set value and fee.
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);

        $value.textContent = this._formatNumber(totalNim);

        if ($fee && transaction.fee > 0) {
            $fee.textContent = Nimiq.Policy.satoshisToCoins(transaction.fee).toString();
            /** @type {HTMLDivElement} */
            const $feeSection = ($pageBody.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        // Set transaction extra data.
        if ($data && transaction.data.byteLength > 0) {
            // FIXME Detect and use proper encoding.
            $data.textContent = Nimiq.BufferUtils.toAscii(transaction.data);
            /** @type {HTMLDivElement} */
            const $dataSection = ($pageBody.querySelector('.data-section'));
            $dataSection.classList.remove('display-none');
        }

        // Set up passphrase box.
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('#passphrase-box'));
        this._passphraseBox = new PassphraseBox($passphraseBox, {
            bgColor: 'purple',
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passphrasebox-confirm-tx',
        });

        this._passphraseBox.on(
            PassphraseBox.Events.SUBMIT,
            passphrase => this._onConfirm(request, resolve, reject, passphrase),
        );
        this._passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());
    }

    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     * @param {string} passphrase
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, passphrase) {
        document.body.classList.add('loading');

        try {
            // XXX Passphrase encoding
            const passphraseBuf = Nimiq.BufferUtils.fromAscii(passphrase);
            const key = await KeyStore.instance.get(request.keyInfo.id, passphraseBuf);
            if (!key) {
                reject(new Error('Failed to retrieve key'));
                return;
            }

            const publicKey = key.derivePublicKey(request.keyPath);
            const signature = key.sign(request.keyPath, request.transaction.serializeContent());
            const result = /** @type {SignTransactionResult} */ {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
            resolve(result);
        } catch (e) {
            console.error(e);
            document.body.classList.remove('loading');

            // Assume the passphrase was wrong
            this._passphraseBox.onPassphraseIncorrect();
        }
    }

    run() {
        // Go to start page
        window.location.hash = BaseLayout.Pages.CONFIRM_TRANSACTION;
        this._passphraseBox.focus();

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {number} value
     * @param {number} [maxDecimals]
     * @param {number} [minDecimals]
     * @returns {string}
     */
    _formatNumber(value, maxDecimals = 5, minDecimals = 2) {
        const roundingFactor = 10 ** maxDecimals;
        value = Math.floor(value * roundingFactor) / roundingFactor;

        const result = parseFloat(value.toFixed(minDecimals)) === value
            ? value.toFixed(minDecimals)
            : value.toString();

        if (Math.abs(value) < 10000) return result;

        // Add thin spaces (U+202F) every 3 digits. Stop at the decimal separator if there is one.
        const regexp = minDecimals > 0 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(\d{3})+$)/g;
        return result.replace(regexp, '$1\u202F');
    }
}

BaseLayout.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
/* global BaseLayout */
/* global I18n */

class LayoutStandard extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutStandard._createElement($el);
        super(request, resolve, reject);
        this.$el = container;
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-standard');

        $el.innerHTML = `
            <div class="page-header">
                <!-- <a tabindex="0" class="page-header-back-button icon-back-arrow"></a> -->
                <h1 data-i18n="sign-tx-heading">New Transaction</h1>
            </div>

            <div class="page-body transaction">
                <div class="center accounts">
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="label display-none" id="sender-label"></div>
                        <div class="address" id="sender-address"></div>
                    </div>

                    <i class="arrow icon-forward-chevron"></i>

                    <div class="account">
                        <div class="identicon" id="recipient-identicon"></div>
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center total">
                    <div class="value">
                        <span id="value"></span><span class="nim-symbol"></span>
                    </div>
                </div>

                <div class="center fee-section display-none">
                    <span data-i18n="sign-tx-includes">includes</span>
                    <span id="fee"></span>
                    <span class="nim-symbol"></span>
                    <span data-i18n="sign-tx-fee">fee</span>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }
}
/* global BaseLayout */
/* global I18n */
/* global Nimiq */
/* global PaymentInfoLine */

class LayoutCheckout extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        request.recipientLabel = LayoutCheckout._originToDomain(request.shopOrigin);

        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutCheckout._createElement($el);
        super(request, resolve, reject);
        this.$el = container;

        // Set up payment-info-line
        const $paymentInfoLine = /** @type {HTMLElement} */ (document.querySelector('.payment-info-line'));

        const transaction = request.transaction;
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);
        new PaymentInfoLine( // eslint-disable-line no-new
            $paymentInfoLine,
            LayoutCheckout._originToDomain(request.shopOrigin),
            this._formatNumber(totalNim),
        );
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-checkout');

        $el.innerHTML = `
            <div class="page-body transaction">
                <h1>
                    <span data-i18n="sign-tx-youre-sending">You're sending</span>
                    <strong id="value"></strong>
                    <strong class="nim-symbol"></strong>
                    <span data-i18n="sign-tx-to">to</span>
                </h1>

                <div class="account shop-account">
                    <div class="identicon-cover"></div>
                    <div class="identicon" id="recipient-identicon"></div>
                    <div class="account-text">
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>

                <div class="sender-section">
                    <h2 data-i18n="sign-tx-pay-with">Pay with</h2>
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="account-text">
                            <div class="label display-none" id="sender-label"></div>
                            <div class="address" id="sender-address"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @param {string} [origin]
     * @returns {string}
     */
    static _originToDomain(origin) {
        if (!origin) return '---';
        return origin.split('://')[1] || '---';
    }
}
/* global Nimiq */
/* global KeyStore */
/* global TopLevelApi */
/* global LayoutStandard */
/* global LayoutCheckout */

class SignTransactionApi extends TopLevelApi {
    /**
     * @param {SignTransactionRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await SignTransactionApi._parseRequest(request);
        const $layoutContainer = document.getElementById('layout-container');

        const handler = new SignTransactionApi.Layouts[parsedRequest.layout](
            $layoutContainer,
            parsedRequest,
            this.resolve.bind(this),
            this.reject.bind(this),
        );

        handler.run();
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Promise<ParsedSignTransactionRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        // Check that the layout is valid
        if (request.layout && !SignTransactionApi.Layouts[request.layout]) {
            throw new Error('Invalid selected layout');
        }

        // Check that keyId is given.
        if (typeof request.keyId !== 'string' || !request.keyId) {
            throw new Error('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Error('Unknown keyId');
        }

        // Check that keyPath is given.
        if (typeof request.keyPath !== 'string' || !request.keyPath) {
            throw new Error('keyPath is required');
        }

        // Check that keyPath is valid.
        if (!Nimiq.ExtendedPrivateKey.isValidPath(request.keyPath)) {
            throw new Error('Invalid keyPath');
        }

        // Parse transaction.
        const transaction = SignTransactionApi._parseTransaction(request);

        // Check that the transaction is for the correct network.
        if (transaction.networkId !== Nimiq.GenesisConfig.NETWORK_ID) {
            throw new Error('Transaction is not valid in this network');
        }

        // Check that sender != recipient.
        if (transaction.recipient.equals(transaction.sender)) {
            throw new Error('Sender and recipient must not match');
        }

        // Check sender / recipient account type.
        const accountTypes = new Set([Nimiq.Account.Type.BASIC, Nimiq.Account.Type.VESTING, Nimiq.Account.Type.HTLC]);
        if (!accountTypes.has(transaction.senderType) || !accountTypes.has(transaction.recipientType)) {
            throw new Error('Invalid sender type');
        }

        // Validate labels.
        const labels = [request.keyLabel, request.senderLabel, request.recipientLabel];
        if (labels.some(label => label !== undefined && (typeof label !== 'string' || label.length > 64))) {
            throw new Error('Invalid label');
        }

        return /** @type {ParsedSignTransactionRequest} */ {
            layout: request.layout || 'standard',
            shopOrigin: request.shopOrigin,
            appName: request.appName,

            keyInfo,
            keyPath: request.keyPath,
            transaction,

            keyLabel: request.keyLabel,
            senderLabel: request.senderLabel,
            recipientLabel: request.recipientLabel,
        };
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Nimiq.ExtendedTransaction}
     * @private
     */
    static _parseTransaction(request) {
        const sender = new Nimiq.Address(request.sender);
        const senderType = request.senderType || Nimiq.Account.Type.BASIC;
        const recipient = new Nimiq.Address(request.recipient);
        const recipientType = request.recipientType || Nimiq.Account.Type.BASIC;
        const flags = request.flags || Nimiq.Transaction.Flag.NONE;
        const data = request.data || new Uint8Array(0);
        const networkId = request.networkId || Nimiq.GenesisConfig.NETWORK_ID;
        return new Nimiq.ExtendedTransaction(
            sender,
            senderType,
            recipient,
            recipientType,
            request.value,
            request.fee,
            request.validityStartHeight,
            flags,
            data,
            new Uint8Array(0), // proof
            networkId,
        );
    }
}

SignTransactionApi.Layouts = {
    standard: LayoutStandard,
    checkout: LayoutCheckout,
    // 'cashlink': LayoutCashlink,
};
/* global SignTransactionApi */
/* global runKeyguard */

runKeyguard(SignTransactionApi);
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
class Iqons {
    /* Public API */

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async svg(text) {
        const hash = this._hash(text);
        return this._svgTemplate(
            parseInt(hash[0], 10),
            parseInt(hash[2], 10),
            parseInt(hash[3] + hash[4], 10),
            parseInt(hash[5] + hash[6], 10),
            parseInt(hash[7] + hash[8], 10),
            parseInt(hash[9] + hash[10], 10),
            parseInt(hash[11], 10),
        );
    }

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async toDataUrl(text) {
        const base64string = btoa(await this.svg(text));
        return `data:image/svg+xml;base64,${base64string.replace(/#/g, '%23')}`;
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholder(color, strokeWidth) {
        color = color || '#bbb';
        strokeWidth = strokeWidth || 1;
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
    <path fill="none" stroke="${color}" stroke-width="${2 * strokeWidth}" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
    <g transform="scale(0.9) translate(9, 8)">
        <circle cx="80" cy="80" r="40" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity=".9"></circle>
        <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>\`
    </g>
</svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholderToDataUrl(color, strokeWidth) {
        return `data:image/svg+xml;base64,${btoa(this.placeholder(color, strokeWidth))}`;
    }

    /* Private API */

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _svgTemplate(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        return this._$svg(await this._$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor));
    }

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        if (color === backgroundColor) {
            color += 1;
            if (color > 9) color = 0;
        }

        while (accentColor === color || accentColor === backgroundColor) {
            accentColor += 1;
            if (accentColor > 9) accentColor = 0;
        }

        const colorString = this.colors[color];
        const backgroundColorString = this.colors[backgroundColor];
        const accentColorString = this.colors[accentColor];

        /* eslint-disable max-len */
        return `<g color="${colorString}" fill="${accentColorString}">
    <rect fill="${backgroundColorString}" x="0" y="0" width="160" height="160"></rect>
    <circle cx="80" cy="80" r="40" fill="${colorString}"></circle>
    <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>
    ${await this._generatePart('top', topNr)}
    ${await this._generatePart('side', sidesNr)}
    ${await this._generatePart('face', faceNr)}
    ${await this._generatePart('bottom', bottomNr)}
</g>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} content
     * @returns {string}
     */
    static _$svg(content) {
        const randomId = this._getRandomId();
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
    <defs>
        <clipPath id="hexagon-clip-${randomId}" transform="scale(0.5) translate(0, 16)">
            <path d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
        </clipPath>
    </defs>
    <path fill="white" stroke="#bbbbbb" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
    <g transform="scale(0.9) translate(9, 8)">
        <g clip-path="url(#hexagon-clip-${randomId})">
            ${content}
        </g>
    </g>
</svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} part
     * @param {number} index
     * @returns {Promise<string>}
     */
    static async _generatePart(part, index) {
        const assets = await this._getAssets();
        const selector = `#${part}_${this._assetIndex(index, part)}`;
        const $part = assets.querySelector(selector);
        return ($part && $part.innerHTML) || '';
    }

    /**
     * @returns {Promise<Document>}
     */
    static async _getAssets() {
        /** @type {Promise<Document>} */
        this._assetPromise = this._assetPromise || fetch(this.svgPath)
            .then(response => response.text())
            .then(assetsText => {
                const parser = new DOMParser();
                const assets = parser.parseFromString(assetsText, 'image/svg+xml');
                this._assets = assets;
                return assets;
            });
        return this._assetPromise;
    }

    static get hasAssets() {
        return !!this._assets;
    }

    /** @type {string[]} */
    static get colors() {
        return [
            '#fb8c00', // orange-600
            '#d32f2f', // red-700
            '#fbc02d', // yellow-700
            '#3949ab', // indigo-600
            '#03a9f4', // light-blue-500
            '#8e24aa', // purple-600
            '#009688', // teal-500
            '#f06292', // pink-300
            '#7cb342', // light-green-600
            '#795548', // brown-400
        ];
    }

    /** @type {object} */
    static get assetCounts() {
        return {
            face: Iqons.CATALOG.face.length,
            side: Iqons.CATALOG.side.length,
            top: Iqons.CATALOG.top.length,
            bottom: Iqons.CATALOG.bottom.length,
        };
    }

    /**
     * @param {number} index
     * @param {string} part
     * @returns {string}
     */
    static _assetIndex(index, part) {
        index = (index % this.assetCounts[part]) + 1;
        let fullIndex = index.toString();
        if (index < 10) fullIndex = `0${fullIndex}`;
        return fullIndex;
    }

    /**
     * @param {string} text
     * @returns {string}
     */
    static _hash(text) {
        return (`${text
            .split('')
            .map(c => Number(c.charCodeAt(0)) + 3)
            .reduce((a, e) => a * (1 - a) * this._chaosHash(e), 0.5)}`)
            .split('')
            .reduce((a, e) => e + a, '')
            .substr(4, 17);
    }

    /**
     * @param {number} number
     * @returns {number}
     */
    static _chaosHash(number) {
        const k = 3.569956786876;
        let an = 1 / number;
        for (let i = 0; i < 100; i++) {
            an = (1 - an) * an * k;
        }
        return an;
    }

    /**
     * @returns {number}
     */
    static _getRandomId() {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0];
    }
}

Iqons.svgPath = '../../lib/Iqons.min.svg';

Iqons.CATALOG = {
    face: [
        'face_01', 'face_02', 'face_03', 'face_04', 'face_05', 'face_06', 'face_07',
        'face_08', 'face_09', 'face_10', 'face_11', 'face_12', 'face_13', 'face_14',
        'face_15', 'face_16', 'face_17', 'face_18', 'face_19', 'face_20', 'face_21',
    ],
    side: [
        'side_01', 'side_02', 'side_03', 'side_04', 'side_05', 'side_06', 'side_07',
        'side_08', 'side_09', 'side_10', 'side_11', 'side_12', 'side_13', 'side_14',
        'side_15', 'side_16', 'side_17', 'side_18', 'side_19', 'side_20', 'side_21',
    ],
    top: [
        'top_01', 'top_02', 'top_03', 'top_04', 'top_05', 'top_06', 'top_07',
        'top_08', 'top_09', 'top_10', 'top_11', 'top_12', 'top_13', 'top_14',
        'top_15', 'top_16', 'top_17', 'top_18', 'top_19', 'top_20', 'top_21',
    ],
    bottom: [
        'bottom_01', 'bottom_02', 'bottom_03', 'bottom_04', 'bottom_05', 'bottom_06', 'bottom_07',
        'bottom_08', 'bottom_09', 'bottom_10', 'bottom_11', 'bottom_12', 'bottom_13', 'bottom_14',
        'bottom_15', 'bottom_16', 'bottom_17', 'bottom_18', 'bottom_19', 'bottom_20', 'bottom_21',
    ],
};
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
/* global Iqons */

class Identicon { // eslint-disable-line no-unused-vars
    /**
     * @param {string} [address]
     * @param {HTMLDivElement} [$el]
     */
    constructor(address, $el) {
        this._address = address;

        this.$el = Identicon._createElement($el);
        this.$imgEl = this.$el.firstChild;

        this._updateIqon();
    }

    /**
     * @returns {HTMLDivElement}
     */
    getElement() {
        return this.$el;
    }

    /**
     * @param {string} address
     */
    set address(address) {
        this._address = address;
        this._updateIqon();
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        const $element = $el || document.createElement('div');
        const imageElement = document.createElement('img');
        $element.classList.add('identicon');
        $element.appendChild(imageElement);

        return $element;
    }

    _updateIqon() {
        if (!this._address || !Iqons.hasAssets) {
            /** @type {HTMLImageElement} */ (this.$imgEl).src = Iqons.placeholderToDataUrl();
        }

        if (this._address) {
            Iqons.toDataUrl(this._address).then(url => {
                // Placeholder setting above is synchronous, thus this async result will replace the placeholder
                /** @type {HTMLImageElement} */ (this.$imgEl).src = url;
            });
        }
    }
}
/* global Nimiq */

class PaymentInfoLine extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {string} domain
     * @param {string} formattedAmount
     */
    constructor($el, domain, formattedAmount) {
        super();
        this.$el = PaymentInfoLine._createElement($el, domain, formattedAmount);
        this.$el.classList.remove('display-none');
    }

    /**
     * @param {?HTMLElement} [$el]
     * @param {string} domain
     * @param {string} formattedAmount
     * @returns {HTMLElement}
     */
    static _createElement($el, domain, formattedAmount) {
        $el = $el || document.createElement('div');
        $el.classList.add('payment-info-line');

        $el.innerHTML = `
            <div class="description">
                Payment to
                <span domain></span>
            </div>
            <div class="amount">
                <span amount></span>
                <span class="nim-symbol"></span>
            </div>
        `;

        /** @type {HTMLElement} */ ($el.querySelector('[domain]')).textContent = domain;
        /** @type {HTMLElement} */ ($el.querySelector('[amount]')).textContent = formattedAmount;

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
}
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
/* global Nimiq */
/* global KeyStore */
/* global Identicon */
/* global PassphraseBox */

class BaseLayout {
    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        /** @type {HTMLDivElement} */
        const $pageBody = (document.querySelector('#confirm-transaction .transaction'));

        /** @type {HTMLDivElement} */
        const $senderIdenticon = ($pageBody.querySelector('#sender-identicon'));
        /** @type {HTMLDivElement} */
        const $recipientIdenticon = ($pageBody.querySelector('#recipient-identicon'));

        /** @type {HTMLDivElement} */
        const $senderLabel = ($pageBody.querySelector('#sender-label'));
        /** @type {HTMLDivElement} */
        const $recipientLabel = ($pageBody.querySelector('#recipient-label'));

        /** @type {HTMLDivElement} */
        const $senderAddress = ($pageBody.querySelector('#sender-address'));
        /** @type {HTMLDivElement} */
        const $recipientAddress = ($pageBody.querySelector('#recipient-address'));

        /** @type {HTMLDivElement} */
        const $value = ($pageBody.querySelector('#value'));
        /** @type {HTMLDivElement} */
        const $fee = ($pageBody.querySelector('#fee'));
        /** @type {HTMLDivElement} */
        const $data = ($pageBody.querySelector('#data'));

        // Set sender data.
        const transaction = request.transaction;
        const senderAddress = transaction.sender.toUserFriendlyAddress();
        new Identicon(senderAddress, $senderIdenticon); // eslint-disable-line no-new
        $senderAddress.textContent = senderAddress;
        if (request.senderLabel) {
            $senderLabel.classList.remove('display-none');
            $senderLabel.textContent = request.senderLabel;
        }

        // Set recipient data.
        if ($recipientAddress) {
            const recipientAddress = transaction.recipient.toUserFriendlyAddress();
            if (request.layout === 'checkout') {
                new Identicon(undefined, $recipientIdenticon); // eslint-disable-line no-new
            } else {
                new Identicon(recipientAddress, $recipientIdenticon); // eslint-disable-line no-new
            }
            $recipientAddress.textContent = recipientAddress;
            if (request.recipientLabel) {
                $recipientLabel.classList.remove('display-none');
                $recipientLabel.textContent = request.recipientLabel;
            }
        }

        // Set value and fee.
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);

        $value.textContent = this._formatNumber(totalNim);

        if ($fee && transaction.fee > 0) {
            $fee.textContent = Nimiq.Policy.satoshisToCoins(transaction.fee).toString();
            /** @type {HTMLDivElement} */
            const $feeSection = ($pageBody.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        // Set transaction extra data.
        if ($data && transaction.data.byteLength > 0) {
            // FIXME Detect and use proper encoding.
            $data.textContent = Nimiq.BufferUtils.toAscii(transaction.data);
            /** @type {HTMLDivElement} */
            const $dataSection = ($pageBody.querySelector('.data-section'));
            $dataSection.classList.remove('display-none');
        }

        // Set up passphrase box.
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('#passphrase-box'));
        this._passphraseBox = new PassphraseBox($passphraseBox, {
            bgColor: 'purple',
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passphrasebox-confirm-tx',
        });

        this._passphraseBox.on(
            PassphraseBox.Events.SUBMIT,
            passphrase => this._onConfirm(request, resolve, reject, passphrase),
        );
        this._passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());
    }

    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     * @param {string} passphrase
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, passphrase) {
        document.body.classList.add('loading');

        try {
            // XXX Passphrase encoding
            const passphraseBuf = Nimiq.BufferUtils.fromAscii(passphrase);
            const key = await KeyStore.instance.get(request.keyInfo.id, passphraseBuf);
            if (!key) {
                reject(new Error('Failed to retrieve key'));
                return;
            }

            const publicKey = key.derivePublicKey(request.keyPath);
            const signature = key.sign(request.keyPath, request.transaction.serializeContent());
            const result = /** @type {SignTransactionResult} */ {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
            resolve(result);
        } catch (e) {
            console.error(e);
            document.body.classList.remove('loading');

            // Assume the passphrase was wrong
            this._passphraseBox.onPassphraseIncorrect();
        }
    }

    run() {
        // Go to start page
        window.location.hash = BaseLayout.Pages.CONFIRM_TRANSACTION;
        this._passphraseBox.focus();

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {number} value
     * @param {number} [maxDecimals]
     * @param {number} [minDecimals]
     * @returns {string}
     */
    _formatNumber(value, maxDecimals = 5, minDecimals = 2) {
        const roundingFactor = 10 ** maxDecimals;
        value = Math.floor(value * roundingFactor) / roundingFactor;

        const result = parseFloat(value.toFixed(minDecimals)) === value
            ? value.toFixed(minDecimals)
            : value.toString();

        if (Math.abs(value) < 10000) return result;

        // Add thin spaces (U+202F) every 3 digits. Stop at the decimal separator if there is one.
        const regexp = minDecimals > 0 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(\d{3})+$)/g;
        return result.replace(regexp, '$1\u202F');
    }
}

BaseLayout.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
/* global BaseLayout */
/* global I18n */

class LayoutStandard extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutStandard._createElement($el);
        super(request, resolve, reject);
        this.$el = container;
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-standard');

        $el.innerHTML = `
            <div class="page-header">
                <!-- <a tabindex="0" class="page-header-back-button icon-back-arrow"></a> -->
                <h1 data-i18n="sign-tx-heading">New Transaction</h1>
            </div>

            <div class="page-body transaction">
                <div class="center accounts">
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="label display-none" id="sender-label"></div>
                        <div class="address" id="sender-address"></div>
                    </div>

                    <i class="arrow icon-forward-chevron"></i>

                    <div class="account">
                        <div class="identicon" id="recipient-identicon"></div>
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center total">
                    <div class="value">
                        <span id="value"></span><span class="nim-symbol"></span>
                    </div>
                </div>

                <div class="center fee-section display-none">
                    <span data-i18n="sign-tx-includes">includes</span>
                    <span id="fee"></span>
                    <span class="nim-symbol"></span>
                    <span data-i18n="sign-tx-fee">fee</span>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }
}
/* global BaseLayout */
/* global I18n */
/* global Nimiq */
/* global PaymentInfoLine */

class LayoutCheckout extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        request.recipientLabel = LayoutCheckout._originToDomain(request.shopOrigin);

        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutCheckout._createElement($el);
        super(request, resolve, reject);
        this.$el = container;

        // Set up payment-info-line
        const $paymentInfoLine = /** @type {HTMLElement} */ (document.querySelector('.payment-info-line'));

        const transaction = request.transaction;
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);
        new PaymentInfoLine( // eslint-disable-line no-new
            $paymentInfoLine,
            LayoutCheckout._originToDomain(request.shopOrigin),
            this._formatNumber(totalNim),
        );
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-checkout');

        $el.innerHTML = `
            <div class="page-body transaction">
                <h1>
                    <span data-i18n="sign-tx-youre-sending">You're sending</span>
                    <strong id="value"></strong>
                    <strong class="nim-symbol"></strong>
                    <span data-i18n="sign-tx-to">to</span>
                </h1>

                <div class="account shop-account">
                    <div class="identicon-cover"></div>
                    <div class="identicon" id="recipient-identicon"></div>
                    <div class="account-text">
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>

                <div class="sender-section">
                    <h2 data-i18n="sign-tx-pay-with">Pay with</h2>
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="account-text">
                            <div class="label display-none" id="sender-label"></div>
                            <div class="address" id="sender-address"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @param {string} [origin]
     * @returns {string}
     */
    static _originToDomain(origin) {
        if (!origin) return '---';
        return origin.split('://')[1] || '---';
    }
}
/* global Nimiq */
/* global KeyStore */
/* global TopLevelApi */
/* global LayoutStandard */
/* global LayoutCheckout */

class SignTransactionApi extends TopLevelApi {
    /**
     * @param {SignTransactionRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await SignTransactionApi._parseRequest(request);
        const $layoutContainer = document.getElementById('layout-container');

        const handler = new SignTransactionApi.Layouts[parsedRequest.layout](
            $layoutContainer,
            parsedRequest,
            this.resolve.bind(this),
            this.reject.bind(this),
        );

        handler.run();
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Promise<ParsedSignTransactionRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        // Check that the layout is valid
        if (request.layout && !SignTransactionApi.Layouts[request.layout]) {
            throw new Error('Invalid selected layout');
        }

        // Check that keyId is given.
        if (typeof request.keyId !== 'string' || !request.keyId) {
            throw new Error('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Error('Unknown keyId');
        }

        // Check that keyPath is given.
        if (typeof request.keyPath !== 'string' || !request.keyPath) {
            throw new Error('keyPath is required');
        }

        // Check that keyPath is valid.
        if (!Nimiq.ExtendedPrivateKey.isValidPath(request.keyPath)) {
            throw new Error('Invalid keyPath');
        }

        // Parse transaction.
        const transaction = SignTransactionApi._parseTransaction(request);

        // Check that the transaction is for the correct network.
        if (transaction.networkId !== Nimiq.GenesisConfig.NETWORK_ID) {
            throw new Error('Transaction is not valid in this network');
        }

        // Check that sender != recipient.
        if (transaction.recipient.equals(transaction.sender)) {
            throw new Error('Sender and recipient must not match');
        }

        // Check sender / recipient account type.
        const accountTypes = new Set([Nimiq.Account.Type.BASIC, Nimiq.Account.Type.VESTING, Nimiq.Account.Type.HTLC]);
        if (!accountTypes.has(transaction.senderType) || !accountTypes.has(transaction.recipientType)) {
            throw new Error('Invalid sender type');
        }

        // Validate labels.
        const labels = [request.keyLabel, request.senderLabel, request.recipientLabel];
        if (labels.some(label => label !== undefined && (typeof label !== 'string' || label.length > 64))) {
            throw new Error('Invalid label');
        }

        return /** @type {ParsedSignTransactionRequest} */ {
            layout: request.layout || 'standard',
            shopOrigin: request.shopOrigin,
            appName: request.appName,

            keyInfo,
            keyPath: request.keyPath,
            transaction,

            keyLabel: request.keyLabel,
            senderLabel: request.senderLabel,
            recipientLabel: request.recipientLabel,
        };
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Nimiq.ExtendedTransaction}
     * @private
     */
    static _parseTransaction(request) {
        const sender = new Nimiq.Address(request.sender);
        const senderType = request.senderType || Nimiq.Account.Type.BASIC;
        const recipient = new Nimiq.Address(request.recipient);
        const recipientType = request.recipientType || Nimiq.Account.Type.BASIC;
        const flags = request.flags || Nimiq.Transaction.Flag.NONE;
        const data = request.data || new Uint8Array(0);
        const networkId = request.networkId || Nimiq.GenesisConfig.NETWORK_ID;
        return new Nimiq.ExtendedTransaction(
            sender,
            senderType,
            recipient,
            recipientType,
            request.value,
            request.fee,
            request.validityStartHeight,
            flags,
            data,
            new Uint8Array(0), // proof
            networkId,
        );
    }
}

SignTransactionApi.Layouts = {
    standard: LayoutStandard,
    checkout: LayoutCheckout,
    // 'cashlink': LayoutCashlink,
};
/* global SignTransactionApi */
/* global runKeyguard */

runKeyguard(SignTransactionApi);
