import { RedirectRpcClient } from '@nimiq/rpc';
import { RequestBehavior } from './RequestBehavior';
import { KeyguardCommand, } from './RequestTypes';
export class KeyguardClient {
    constructor(endpoint = KeyguardClient.DEFAULT_ENDPOINT, defaultBehavior) {
        this._endpoint = endpoint;
        this._defaultBehavior = defaultBehavior || new RequestBehavior();
        this._redirectClient = new RedirectRpcClient('', RequestBehavior.getAllowedOrigin(this._endpoint));
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
    create(request, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, KeyguardCommand.CREATE, [request]);
    }
    remove(keyId, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, KeyguardCommand.REMOVE, [{ keyId }]);
    }
    importWords(defaultKeyPath, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, KeyguardCommand.IMPORT_WORDS, [{ defaultKeyPath }]);
    }
    importFile(requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, KeyguardCommand.IMPORT_FILE, []);
    }
    async exportWords(keyId, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, KeyguardCommand.EXPORT_WORDS, [{ keyId }]);
    }
    async exportFile(keyId, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, KeyguardCommand.EXPORT_FILE, [{ keyId }]);
    }
    async signTransaction(request, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, KeyguardCommand.SIGN_TRANSACTION, [request]);
    }
    async signMessage(request, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, KeyguardCommand.SIGN_MESSAGE, [request]);
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
//# sourceMappingURL=KeyguardClient.js.map