'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var rpc = require('@nimiq/rpc');

class RequestBehavior {
    static getAllowedOrigin(endpoint) {
        // FIXME derive from endpoint url
        return '*';
    }
    static getRequestUrl(endpoint, command) {
        return `${endpoint}/request/${command}/`;
    }
    constructor(targetUrl, localState) {
        const location = window.location;
        this._targetUrl = targetUrl
            || `${location.protocol}//${location.hostname}:${location.port}${location.pathname}`;
        this._localState = localState || {};
        // Reject local state with reserved property.
        if (localState && typeof localState.__command !== 'undefined') {
            throw new Error('Invalid localState: Property \'__command\' is reserved');
        }
    }
    async request(endpoint, command, args) {
        const url = RequestBehavior.getRequestUrl(endpoint, command);
        const origin = RequestBehavior.getAllowedOrigin(endpoint);
        const client = new rpc.RedirectRpcClient(url, origin);
        await client.init();
        const state = Object.assign({ __command: command }, this._localState);
        client.callAndSaveLocalState(this._targetUrl, state, 'request', ...args);
    }
}

(function (KeyguardCommand) {
    KeyguardCommand["CREATE"] = "create";
    KeyguardCommand["REMOVE"] = "remove-key";
    KeyguardCommand["IMPORT_WORDS"] = "import-words";
    KeyguardCommand["IMPORT_FILE"] = "import-file";
    KeyguardCommand["EXPORT_WORDS"] = "export-words";
    KeyguardCommand["EXPORT_FILE"] = "export-file";
    KeyguardCommand["SIGN_TRANSACTION"] = "sign-transaction";
    KeyguardCommand["SIGN_MESSAGE"] = "sign-message";
})(exports.KeyguardCommand || (exports.KeyguardCommand = {}));

class KeyguardClient {
    constructor(endpoint = KeyguardClient.DEFAULT_ENDPOINT, defaultBehavior) {
        this._endpoint = endpoint;
        this._defaultBehavior = defaultBehavior || new RequestBehavior();
        this._redirectClient = new rpc.RedirectRpcClient('', RequestBehavior.getAllowedOrigin(this._endpoint));
        this._redirectClient.onResponse('request', this._onResolve.bind(this), this._onReject.bind(this));
        this._observable = new Nimiq.Observable();
    }
    init() {
        return this._redirectClient.init();
    }
    on(command, resolve, reject) {
        this._observable.on(`${command}-resolve`, resolve);
        this._observable.on(`${command}-reject`, reject);
    }
    create(defaultKeyPath, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, exports.KeyguardCommand.CREATE, [{ defaultKeyPath }]);
    }
    remove(keyId, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, exports.KeyguardCommand.REMOVE, [{ keyId }]);
    }
    importWords(defaultKeyPath, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, exports.KeyguardCommand.IMPORT_WORDS, [{ defaultKeyPath }]);
    }
    importFile(requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, exports.KeyguardCommand.IMPORT_FILE, []);
    }
    async exportWords(keyId, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, exports.KeyguardCommand.EXPORT_WORDS, [{ keyId }]);
    }
    async exportFile(keyId, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, exports.KeyguardCommand.EXPORT_FILE, [{ keyId }]);
    }
    async signTransaction(request, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, exports.KeyguardCommand.SIGN_TRANSACTION, [request]);
    }
    async signMessage(request, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, exports.KeyguardCommand.SIGN_MESSAGE, [request]);
    }
    /* PRIVATE METHODS */
    _request(behavior, command, args) {
        return behavior.request(this._endpoint, command, args);
    }
    _onReject(error, id, state) {
        const command = state.__command;
        if (!command) {
            throw new Error('Invalid state after RPC request');
        }
        delete state.__command;
        this._observable.fire(`${command}-reject`, error, state);
    }
    _onResolve(result, id, state) {
        const command = state.__command;
        if (!command) {
            throw new Error('Invalid state after RPC request');
        }
        delete state.__command;
        this._observable.fire(`${command}-resolve`, result, state);
    }
}
KeyguardClient.DEFAULT_ENDPOINT = 'http://localhost:8000/src';

exports.KeyguardClient = KeyguardClient;
exports.RequestBehavior = RequestBehavior;
