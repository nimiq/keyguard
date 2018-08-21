/* global Nimiq */
/* global Rpc */
/* global RequestBehavior */
/* global PopupRequestBehavior */

class KeyguardClient {
    /**
     * @param {string} endpoint
     * @param {RequestBehavior} [defaultBehavior]
     */
    constructor(endpoint = '../src', defaultBehavior) {
        this._endpoint = endpoint;
        this._defaultBehavior = defaultBehavior || new PopupRequestBehavior();

        this._redirectClient = new Rpc.RedirectRpcClient('', RequestBehavior.getAllowedOrigin(this._endpoint));
        this._redirectClient.onResponse('request', this._onResolve.bind(this), this._onReject.bind(this));

        this._observable = new Nimiq.Observable();
    }

    init() {
        return this._redirectClient.init();
    }

    /**
     * @param {KeyguardClient.Command} command
     * @param {Function} resolve
     * @param {Function} reject
     */
    on(command, resolve, reject) {
        this._observable.on(`${command}-resolve`, resolve);
        this._observable.on(`${command}-reject`, reject);
    }

    /**
     * @param {string} defaultKeyPath
     * @param {RequestBehavior} [requestBehavior]
     * @returns {Promise<*>}
     */
    create(defaultKeyPath, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, KeyguardClient.Command.CREATE, [{ defaultKeyPath }]);
    }

    /**
     * @param {string} keyId
     * @param {RequestBehavior} [requestBehavior]
     * @returns {Promise<*>}
     */
    remove(keyId, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, KeyguardClient.Command.REMOVE, [{ keyId }]);
    }

    /**
     * @param {string} defaultKeyPath
     * @param {RequestBehavior} [requestBehavior]
     * @returns {Promise<*>}
     */
    importWords(defaultKeyPath, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, KeyguardClient.Command.IMPORT_WORDS, [{ defaultKeyPath }]);
    }

    /**
     * @param {RequestBehavior} [requestBehavior]
     * @returns {Promise<*>}
     */
    importFile(requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, KeyguardClient.Command.IMPORT_FILE, []);
    }

    /**
     * @param {string} keyId
     * @param {RequestBehavior} [requestBehavior]
     * @returns {Promise<void>}
     */
    async exportWords(keyId, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, KeyguardClient.Command.EXPORT_WORDS, [{ keyId }]);
    }

    /**
     * @param {string} keyId
     * @param {RequestBehavior} [requestBehavior]
     * @returns {Promise<void>}
     */
    async exportFile(keyId, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, KeyguardClient.Command.EXPORT_FILE, [{ keyId }]);
    }

    /**
     * @param {SignTransactionRequest} request
     * @param {RequestBehavior} [requestBehavior]
     * @returns {Promise<SignTransactionResult>}
     */
    async signTransaction(request, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, KeyguardClient.Command.SIGN_TRANSACTION, [request]);
    }

    /**
     * @param {SignMessageRequest} request
     * @param {RequestBehavior} [requestBehavior]
     * @returns {Promise<SignMessageResult>}
     */
    async signMessage(request, requestBehavior = this._defaultBehavior) {
        return this._request(requestBehavior, KeyguardClient.Command.SIGN_MESSAGE, [request]);
    }

    // /**
    //  * @param {boolean} [listFromAccountStore] Deprecated, list from old AccountStore
    //  * @returns {Promise<KeyInfo[] | AccountInfo[]>}
    //  */
    // async list(listFromAccountStore) {
    //     await this._connected;
    //     return this.iframeClient.call('list', [listFromAccountStore]);
    // }
    //
    // /**
    //  * @returns {Promise<boolean>}
    //  * @deprecated Only for database migration
    //  */
    // async migrateDB() {
    //     await this._connected;
    //     return this.iframeClient.call('migrateAccountsToKeys');
    // }

    createPopup(command, options) {
        const url = RequestBehavior.getRequestUrl(this._endpoint, command);
        const behavior = new PopupRequestBehavior(options);
        return behavior.createPopup(url);
    }

    /* PRIVATE METHODS */

    /**
     * @param {RequestBehavior} behavior
     * @param {KeyguardClient.Command} command
     * @param {Array<*>} args
     * @returns {Promise.<*>}
     * @private
     */
    _request(behavior, command, args) {
        return behavior.request(this._endpoint, command, args);
    }

    _onResolve(result, id, state) {
        const command = state.__command;
        if (!command) {
            throw new Error('Invalid state after RPC request');
        }
        delete state.__command;

        this._observable.fire(`${command}-resolve`, result, state);
    }

    _onReject(error, id, state) {
        const command = state.__command;
        if (!command) {
            throw new Error('Invalid state after RPC request');
        }
        delete state.__command;

        this._observable.fire(`${command}-reject`, error, state);
    }

    // /**
    //  * @returns {Promise<HTMLIFrameElement>}
    //  */
    // async _createIframe() {
    //     return new Promise((resolve, reject) => {
    //         const $iframe = document.createElement('iframe');
    //         $iframe.name = 'Nimiq Keyguard IFrame';
    //         $iframe.style.display = 'none';
    //         document.body.appendChild($iframe);
    //         $iframe.src = `${this._keyguardSrc}/request/iframe/`;
    //         $iframe.onload = () => resolve($iframe);
    //         $iframe.onerror = reject;
    //     });
    // }
}

// FIXME Replace by real origin (or from config)
KeyguardClient.KEYGUARD_ORIGIN = '*';

/** @enum {string} */
KeyguardClient.Command = {
    CREATE: 'create',
    REMOVE: 'remove-key',
    IMPORT_WORDS: 'import-words',
    IMPORT_FILE: 'import-file',
    EXPORT_WORDS: 'export-words',
    EXPORT_FILE: 'export-file',
    SIGN_TRANSACTION: 'sign-transaction',
    SIGN_MESSAGE: 'sign-message',
};
