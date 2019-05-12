(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.Rpc = {})));
}(this, (function (exports) { 'use strict';

    /* tslint:disable:no-bitwise */
    class Base64 {
        // base64 is 4/3 + up to two characters of the original data
        static byteLength(b64) {
            const [validLength, placeHoldersLength] = Base64._getLengths(b64);
            return Base64._byteLength(validLength, placeHoldersLength);
        }
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
        static encodeUrl(buffer) {
            return Base64.encode(buffer).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '.');
        }
        static decodeUrl(base64) {
            return Base64.decode(base64.replace(/_/g, '/').replace(/-/g, '+').replace(/\./g, '='));
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

    class RandomUtils {
        static generateRandomId() {
            const array = new Uint32Array(1);
            crypto.getRandomValues(array);
            return array[0];
        }
    }

    (function (ResponseStatus) {
        ResponseStatus["OK"] = "ok";
        ResponseStatus["ERROR"] = "error";
    })(exports.ResponseStatus || (exports.ResponseStatus = {}));
    const POSTMESSAGE_RETURN_URL = '<postMessage>';

    class RequestIdStorage {
        /**
         * @param storeState Whether to store state in sessionStorage
         */
        constructor(storeState = true) {
            this._store = storeState ? window.sessionStorage : null;
            this._validIds = new Map();
            if (storeState) {
                this._restoreIds();
            }
        }
        static _decodeIds(ids) {
            const obj = JSONUtils.parse(ids);
            const validIds = new Map();
            for (const key of Object.keys(obj)) {
                const integerKey = parseInt(key, 10);
                validIds.set(isNaN(integerKey) ? key : integerKey, obj[key]);
            }
            return validIds;
        }
        has(id) {
            return this._validIds.has(id);
        }
        getCommand(id) {
            const result = this._validIds.get(id);
            return result ? result[0] : null;
        }
        getState(id) {
            const result = this._validIds.get(id);
            return result ? result[1] : null;
        }
        add(id, command, state = null) {
            this._validIds.set(id, [command, state]);
            this._storeIds();
        }
        remove(id) {
            this._validIds.delete(id);
            this._storeIds();
        }
        clear() {
            this._validIds.clear();
            if (this._store) {
                this._store.removeItem(RequestIdStorage.KEY);
            }
        }
        _encodeIds() {
            const obj = Object.create(null);
            for (const [key, value] of this._validIds) {
                obj[key] = value;
            }
            return JSONUtils.stringify(obj);
        }
        _restoreIds() {
            const requests = this._store.getItem(RequestIdStorage.KEY);
            if (requests) {
                this._validIds = RequestIdStorage._decodeIds(requests);
            }
        }
        _storeIds() {
            if (this._store) {
                this._store.setItem(RequestIdStorage.KEY, this._encodeIds());
            }
        }
    }
    RequestIdStorage.KEY = 'rpcRequests';

    class UrlRpcEncoder {
        static receiveRedirectCommand(location) {
            const url = new URL(location.href);
            // Need referrer for origin check
            if (!document.referrer)
                return null;
            const referrer = new URL(document.referrer);
            // Parse query
            const params = new URLSearchParams(url.search);
            // Ignore messages without an ID
            if (!params.has('id'))
                return null;
            const fragment = new URLSearchParams(url.hash.substring(1));
            // Ignore messages without a command
            if (!fragment.has('command'))
                return null;
            const command = fragment.get('command');
            fragment.delete('command');
            // Ignore messages without a valid return path
            if (!fragment.has('returnURL'))
                return null;
            const returnURL = fragment.get('returnURL');
            fragment.delete('returnURL');
            const answerByPostMessage = returnURL === POSTMESSAGE_RETURN_URL
                && (window.opener || window.parent);
            // Only allow returning to same origin
            if (!answerByPostMessage && new URL(returnURL).origin !== referrer.origin)
                return null;
            // Parse args
            let args = [];
            if (fragment.has('args')) {
                try {
                    args = JSONUtils.parse(fragment.get('args'));
                }
                catch (e) {
                    // Do nothing
                }
            }
            args = Array.isArray(args) ? args : [];
            fragment.delete('args');
            this._setUrlFragment(url, fragment);
            return {
                origin: referrer.origin,
                data: {
                    id: parseInt(params.get('id'), 10),
                    command,
                    args,
                },
                returnURL,
                source: answerByPostMessage ? (window.opener || window.parent) : null,
            };
        }
        static receiveRedirectResponse(location) {
            const url = new URL(location.href);
            // Need referrer for origin check
            if (!document.referrer)
                return null;
            const referrer = new URL(document.referrer);
            // Parse query
            const params = new URLSearchParams(url.search);
            // Ignore messages without an ID
            if (!params.has('id'))
                return null;
            const fragment = new URLSearchParams(url.hash.substring(1));
            // Ignore messages without a status
            if (!fragment.has('status'))
                return null;
            const status = fragment.get('status') === exports.ResponseStatus.OK ? exports.ResponseStatus.OK : exports.ResponseStatus.ERROR;
            fragment.delete('status');
            // Ignore messages without a result
            if (!fragment.has('result'))
                return null;
            const result = JSONUtils.parse(fragment.get('result'));
            fragment.delete('result');
            this._setUrlFragment(url, fragment);
            return {
                origin: referrer.origin,
                data: {
                    id: parseInt(params.get('id'), 10),
                    status,
                    result,
                },
            };
        }
        static prepareRedirectReply(state, status, result) {
            const returnUrl = new URL(state.returnURL);
            const search = returnUrl.searchParams;
            search.set('id', state.id.toString());
            const fragment = new URLSearchParams(returnUrl.hash.substring(1));
            fragment.set('status', status);
            fragment.set('result', JSONUtils.stringify(result));
            returnUrl.hash = fragment.toString();
            return returnUrl.href;
        }
        static prepareRedirectInvocation(targetURL, id, returnURL, command, args) {
            const targetUrl = new URL(targetURL);
            const search = targetUrl.searchParams;
            search.set('id', id.toString());
            const fragment = new URLSearchParams(targetUrl.hash.substring(1));
            fragment.set('returnURL', returnURL);
            fragment.set('command', command);
            if (Array.isArray(args)) {
                fragment.set('args', JSONUtils.stringify(args));
            }
            targetUrl.hash = fragment.toString();
            return targetUrl.href;
        }
        static _setUrlFragment(url, fragment) {
            /*
            The Url might include a fragment on its own before adding the parameters to it.
            It might even have a fragment consisting of other parameters.
            A '=' at the last position of the remaining fragment string indicates that at least one fragment
            part is remaining. Since URLSearchParams will try to represent a key=value pair with the value
            missing the '=' is added.
            Unfortunately fragments (as in regular fragment, not parameters) ending in a '=' will not
            work with this implementation. All other fragments, including other sets of parameters should be
            preserved by removing the '=' in case it exists at the end of the fragment. However, if other
            parameters are used without values (i.e. #abc&123&value) they will now include a '=' except
            for the last one (i.e. #abc=&123=&value), which is a valid input to URLSearchParams.
            */
            if (fragment.toString().endsWith('=')) {
                url.hash = fragment.toString().slice(0, -1);
            }
            else {
                url.hash = fragment.toString();
            }
            history.replaceState(history.state, '', url.href);
        }
    }

    class RpcClient {
        constructor(allowedOrigin, storeState = false) {
            this._allowedOrigin = allowedOrigin;
            this._waitingRequests = new RequestIdStorage(storeState);
            this._responseHandlers = new Map();
            this._preserveRequests = false;
        }
        onResponse(command, resolve, reject) {
            this._responseHandlers.set(command, { resolve, reject });
        }
        _receive(message) {
            // Discard all messages from unwanted sources
            // or which are not replies
            // or which are not from the correct origin
            if (!message.data
                || !message.data.status
                || !message.data.id
                || (this._allowedOrigin !== '*' && message.origin !== this._allowedOrigin))
                return false;
            const data = message.data;
            const callback = this._getCallback(data.id);
            const state = this._waitingRequests.getState(data.id);
            if (callback) {
                if (!this._preserveRequests) {
                    this._waitingRequests.remove(data.id);
                    this._responseHandlers.delete(data.id);
                }
                console.debug('RpcClient RECEIVE', data);
                if (data.status === exports.ResponseStatus.OK) {
                    callback.resolve(data.result, data.id, state);
                }
                else if (data.status === exports.ResponseStatus.ERROR) {
                    const error = new Error(data.result.message);
                    if (data.result.stack) {
                        error.stack = data.result.stack;
                    }
                    if (data.result.name) {
                        error.name = data.result.name;
                    }
                    callback.reject(error, data.id, state);
                }
                return true;
            }
            else {
                console.warn('Unknown RPC response:', data);
                return false;
            }
        }
        _getCallback(id) {
            // Response handlers by id have priority to more general ones by command
            if (this._responseHandlers.has(id)) {
                return this._responseHandlers.get(id);
            }
            else {
                const command = this._waitingRequests.getCommand(id);
                if (command) {
                    return this._responseHandlers.get(command);
                }
            }
            return undefined;
        }
    }
    class PostMessageRpcClient extends RpcClient {
        constructor(targetWindow, allowedOrigin) {
            super(allowedOrigin);
            this._serverCloseCheckInterval = -1;
            this._target = targetWindow;
            this._connectionState = 0 /* DISCONNECTED */;
            this._receiveListener = this._receive.bind(this);
        }
        async init() {
            if (this._connectionState === 2 /* CONNECTED */) {
                return;
            }
            await this._connect();
            window.addEventListener('message', this._receiveListener);
            if (this._serverCloseCheckInterval !== -1)
                return;
            this._serverCloseCheckInterval = window.setInterval(() => this._checkIfServerClosed(), 300);
        }
        async call(command, ...args) {
            return this._call({
                command,
                args,
                id: RandomUtils.generateRandomId(),
            });
        }
        close() {
            // Clean up old requests and disconnect. Note that until the popup get's closed by the user
            // it's possible to connect again though by calling init.
            this._connectionState = 0 /* DISCONNECTED */;
            window.removeEventListener('message', this._receiveListener);
            window.clearInterval(this._serverCloseCheckInterval);
            this._serverCloseCheckInterval = -1;
            for (const [id, { reject }] of this._responseHandlers) {
                const state = this._waitingRequests.getState(id);
                reject('Connection was closed', typeof id === 'number' ? id : undefined, state);
            }
            this._waitingRequests.clear();
            this._responseHandlers.clear();
            if (this._target && this._target.closed)
                this._target = null;
        }
        _receive(message) {
            if (message.source !== this._target) {
                // ignore messages originating from another client's target window
                return false;
            }
            return super._receive(message);
        }
        async _call(request) {
            if (!this._target || this._target.closed) {
                throw new Error('Connection was closed.');
            }
            if (this._connectionState !== 2 /* CONNECTED */) {
                throw new Error('Client is not connected, call init first');
            }
            return new Promise((resolve, reject) => {
                // Store the request resolvers
                this._responseHandlers.set(request.id, { resolve, reject });
                this._waitingRequests.add(request.id, request.command);
                console.debug('RpcClient REQUEST', request.command, request.args);
                this._target.postMessage(request, this._allowedOrigin);
            });
        }
        _connect() {
            if (this._connectionState === 2 /* CONNECTED */)
                return;
            this._connectionState = 1 /* CONNECTING */;
            return new Promise((resolve, reject) => {
                const connectedListener = (message) => {
                    const { source, origin, data } = message;
                    if (source !== this._target
                        || data.status !== exports.ResponseStatus.OK
                        || data.result !== 'pong'
                        || data.id !== 1
                        || (this._allowedOrigin !== '*' && origin !== this._allowedOrigin))
                        return;
                    // Debugging printouts
                    if (data.result.stack) {
                        const error = new Error(data.result.message);
                        error.stack = data.result.stack;
                        if (data.result.name) {
                            error.name = data.result.name;
                        }
                        console.error(error);
                    }
                    window.removeEventListener('message', connectedListener);
                    this._connectionState = 2 /* CONNECTED */;
                    console.log('RpcClient: Connection established');
                    resolve(true);
                };
                window.addEventListener('message', connectedListener);
                /**
                 * Send 'ping' command every 100ms, until cancelled
                 */
                const tryToConnect = () => {
                    if (this._connectionState === 2 /* CONNECTED */)
                        return;
                    if (this._connectionState === 0 /* DISCONNECTED */
                        || this._checkIfServerClosed()) {
                        window.removeEventListener('message', connectedListener);
                        reject(new Error('Connection was closed'));
                        return;
                    }
                    try {
                        this._target.postMessage({ command: 'ping', id: 1 }, this._allowedOrigin);
                    }
                    catch (e) {
                        console.error(`postMessage failed: ${e}`);
                    }
                    window.setTimeout(tryToConnect, 100);
                };
                window.setTimeout(tryToConnect, 100);
            });
        }
        _checkIfServerClosed() {
            if (this._target && !this._target.closed)
                return false;
            this.close();
            return true;
        }
    }
    class RedirectRpcClient extends RpcClient {
        constructor(targetURL, allowedOrigin, preserveRequests = true) {
            super(allowedOrigin, /*storeState*/ true);
            this._target = targetURL;
            this._preserveRequests = preserveRequests;
        }
        async init() {
            // Check for a response in the URL (also removes params)
            const urlResponse = UrlRpcEncoder.receiveRedirectResponse(window.location);
            if (urlResponse) {
                this._receive(urlResponse);
                return;
            }
            // Check for a stored response referenced by a URL 'id' parameter
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.has('id')) {
                const storedResponse = window.sessionStorage.getItem(`response-${searchParams.get('id')}`);
                if (storedResponse) {
                    this._receive(JSONUtils.parse(storedResponse), false);
                    return;
                }
            }
            // If there is no response in the URL or stored the user must have navigated back in history.
            this._rejectOnBack();
        }
        /* tslint:disable-next-line:no-empty */
        close() { }
        call(returnURL, command, handleHistoryBack = false, ...args) {
            this.callAndSaveLocalState(returnURL, null, command, handleHistoryBack, ...args);
        }
        callAndSaveLocalState(returnURL, state, command, handleHistoryBack = false, ...args) {
            const id = RandomUtils.generateRandomId();
            const url = UrlRpcEncoder.prepareRedirectInvocation(this._target, id, returnURL, command, args);
            this._waitingRequests.add(id, command, state);
            if (handleHistoryBack) {
                /**
                 * The rpcBackRejectionId in the history.state is used to detect in the client
                 * if a history entry was visited before, which makes it a history.back
                 * navigation. The stored ID is then also used to retrieve the correct
                 * stored callback and waiting request, to be able to reject it.
                 */
                history.replaceState(Object.assign({}, history.state, { rpcBackRejectionId: id }), '');
            }
            console.debug('RpcClient REQUEST', command, args);
            window.location.href = url;
        }
        _receive(response, persistMessage = true) {
            const responseWasHandled = super._receive(response);
            if (responseWasHandled && persistMessage) {
                window.sessionStorage.setItem(`response-${response.data.id}`, JSONUtils.stringify(response));
            }
            return responseWasHandled;
        }
        _rejectOnBack() {
            if (!history.state || !history.state.rpcBackRejectionId)
                return;
            const id = history.state.rpcBackRejectionId;
            // Delete the ID, so the request is not rejected again when the page is refreshed/revisited
            history.replaceState(Object.assign({}, history.state, { rpcBackRejectionId: null }), '');
            const callback = this._getCallback(id);
            const state = this._waitingRequests.getState(id);
            if (callback) {
                if (!this._preserveRequests) {
                    this._waitingRequests.remove(id);
                    this._responseHandlers.delete(id);
                }
                console.debug('RpcClient BACK');
                const error = new Error('Request aborted');
                callback.reject(error, id, state);
            }
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
        get source() {
            return this._source;
        }
        static fromJSON(json) {
            const obj = JSONUtils.parse(json);
            return new State(obj);
        }
        constructor(message) {
            if (!message.data.id)
                throw Error('Missing id');
            this._origin = message.origin;
            this._id = message.data.id;
            this._postMessage = 'source' in message
                && !('returnURL' in message && message.returnURL !== POSTMESSAGE_RETURN_URL);
            this._returnURL = 'returnURL' in message ? message.returnURL : null;
            this._data = message.data;
            this._source = 'source' in message ? message.source : null;
        }
        toJSON() {
            const obj = {
                origin: this._origin,
                data: this._data,
            };
            if (this._postMessage) {
                if (this._source === window.opener) {
                    obj.source = 'opener';
                }
                else if (this._source === window.parent) {
                    obj.source = 'parent';
                }
                else {
                    obj.source = null;
                }
            }
            else {
                obj.returnURL = this._returnURL;
            }
            return JSONUtils.stringify(obj);
        }
        reply(status, result) {
            console.debug('RpcServer REPLY', result);
            if (status === exports.ResponseStatus.ERROR) {
                // serialize error objects
                result = typeof result === 'object'
                    ? { message: result.message, stack: result.stack, name: result.name }
                    : { message: result };
            }
            // TODO: Clear waiting request storage?
            if (this._postMessage) {
                // Send via postMessage (e.g., popup or url-persisted popup)
                let target;
                // If source is given, choose accordingly
                if (this._source) {
                    if (this._source === 'opener') {
                        target = window.opener;
                    }
                    else if (this._source === 'parent') {
                        target = window.parent;
                    }
                    else {
                        target = this._source;
                    }
                }
                else {
                    // Else guess
                    target = window.opener || window.parent;
                }
                target.postMessage({
                    status,
                    result,
                    id: this.id,
                }, this.origin);
            }
            else if (this._returnURL) {
                // Send via top-level navigation
                window.location.href = UrlRpcEncoder.prepareRedirectReply(this, status, result);
            }
        }
        toRequestObject() {
            return {
                origin: this._origin,
                data: this._data,
                returnURL: this._returnURL || POSTMESSAGE_RETURN_URL,
                source: typeof this._source === 'string' ? this._source : null,
            };
        }
    }

    class RpcServer {
        constructor(allowedOrigin) {
            this._clientTimeout = 0;
            this._allowedOrigin = allowedOrigin;
            this._responseHandlers = new Map();
            this._responseHandlers.set('ping', () => {
                return 'pong';
            });
            this._receiveListener = this._receive.bind(this);
        }
        static _ok(state, result) {
            state.reply(exports.ResponseStatus.OK, result);
        }
        static _error(state, error) {
            state.reply(exports.ResponseStatus.ERROR, error);
        }
        onRequest(command, fn) {
            this._responseHandlers.set(command, fn);
        }
        init(onClientTimeout) {
            window.addEventListener('message', this._receiveListener);
            if (onClientTimeout) {
                this._clientTimeout = window.setTimeout(() => { onClientTimeout(); }, 1000);
            }
            this._receiveRedirect();
        }
        close() {
            window.removeEventListener('message', this._receiveListener);
        }
        _receiveRedirect() {
            // Stop executing, because if this property exists the client's rejectOnBack should be triggered
            if (history.state && history.state.rpcBackRejectionId)
                return;
            // Check for a request in the URL (also removes params)
            const urlRequest = UrlRpcEncoder.receiveRedirectCommand(window.location);
            if (urlRequest) {
                this._receive(urlRequest);
                return;
            }
            // Check for a stored request referenced by a URL 'id' parameter
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.has('id')) {
                const storedRequest = window.sessionStorage.getItem(`request-${searchParams.get('id')}`);
                if (storedRequest) {
                    this._receive(JSONUtils.parse(storedRequest), false);
                }
            }
        }
        _receive(message, persistMessage = true) {
            window.clearTimeout(this._clientTimeout);
            let state = null;
            try {
                state = new State(message);
                // Cannot reply to a message that has no source window or return URL
                if (!('source' in message) && !('returnURL' in message))
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
                if (persistMessage) {
                    sessionStorage.setItem(`request-${state.data.id}`, JSONUtils.stringify(state.toRequestObject()));
                }
                const url = new URL(window.location.href);
                url.searchParams.set('id', state.data.id.toString());
                window.history.replaceState(history.state, '', url.href);
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

    exports.RpcClient = RpcClient;
    exports.PostMessageRpcClient = PostMessageRpcClient;
    exports.RedirectRpcClient = RedirectRpcClient;
    exports.RpcServer = RpcServer;
    exports.State = State;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
