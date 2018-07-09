class KeyguardClient {
    constructor() {
        this._keyguardSrc = '../src/';

        this._connected = new Promise(res => {
            this._connectedResolver = res;
        });

        this._startIFrame();
    }

    /**
     * @param {boolean} [listFromAccountStore] Deprecated, list from old AccountStore
     * @returns {Promise<KeyInfo[] | AccountInfo[]>}
     */
    async list(listFromAccountStore) {
        await this._connected;
        return this.iframe.call('list', [listFromAccountStore]);
    }

    /**
     * @returns {Promise<boolean>}
     * @deprecated Only for database migration
     */
    async migrateDB() {
        await this._connected;
        return this.iframe.call('migrateAccountsToKeys');
    }

    /**
     * @param {EncryptionType} [type]
     * @param {string} [label]
     * @returns {Promise<void>}
     */
    async create(type, label) {
        return this._popup('create', [{
            type: type || EncryptionType.HIGH,
            label,
        }]);
    }

    /**
     * @returns {Promise<void>}
     */
    async importWords() {
        return this._popup('import-words');
    }

    /**
     * @returns {Promise<void>}
     */
    async importFile() {
        return this._popup('import-file');
    }

    /**
     * @param {string} address
     * @returns {Promise<void>}
     */
    async export(address) {
        return this._popup('export-words', [address]);
    }

    /**
     * @param {TransactionRequest} txRequest
     * @returns {Promise<SignedTransactionResult>}
     */
    async signTransaction(txRequest) {
        return this._popup('sign-transaction', [txRequest]);
    }

    /**
     * @param {MessageRequest} msgRequest
     * @returns {Promise<SignedMessageResult>}
     */
    async signMessage(msgRequest) {
        return this._popup('signMessage', [msgRequest]);
    }

    /**
     * @param {string} address
     * @returns {Promise<void>}
     */
    async changeEncryption(address) {
        return this._popup('change-encryption', [address]);
    }

    /**
     * @param {string} address
     * @returns {Promise<void>}
     */
    async delete(address) {
        return this._popup('delete', [address]);
    }

    /* PRIVATE METHODS */

    async _startIFrame() {
        const $iframe = await this._createIframe();
        if (!$iframe.contentWindow) throw new Error(`IFrame contentWindow is ${typeof $iframe.contentWindow}`);
        this._iframe = await RpcClient.create($iframe.contentWindow, KeyguardClient.KEYGUARD_ORIGIN);
        this._connectedResolver();
    }

    /**
     * @returns {Promise<HTMLIFrameElement>}
     */
    async _createIframe() {
        return new Promise(resolve => {
            const $iframe = document.createElement('iframe');
            $iframe.onload = resolve;
            $iframe.name = 'Nimiq Keyguard IFrame';
            document.body.appendChild($iframe);
            $iframe.src = `${this._keyguardSrc}request/iframe/`;
        });
    }

    /**
     * @param {string} requestName - The request name in kebab-case (folder name)
     * @param {any[]} [args]
     */
    async _popup(requestName, args) {
        const $popup = window.open(
            `${this._keyguardSrc}request/${requestName}/`,
            'Nimiq Keyguard Popup',
            `left=${window.innerWidth / 2 - 250},top=100,width=500,height=820,location=yes,dependent=yes`,
        );

        if (!$popup) {
            throw new Error('Keyguard popup could not be opened.');
        }

        // Await popup loaded
        await new Promise(res => { $popup.onload = res; });

        const rpcClient = await RpcClient.create($popup, KeyguardClient.KEYGUARD_ORIGIN);

        // FIXME Remove after debugging
        this.popup = rpcClient;

        try {
            const result = await rpcClient.call('request', args);
            rpcClient.close();
            $popup.close();
            return result;
        } catch (e) {
            rpcClient.close();
            throw e;
        }
    }

    /** @type {RpcClientInstance} */
    get iframe() {
        if (!this._iframe) throw new Error('IFrame not available');
        return this._iframe;
    }
}

KeyguardClient.KEYGUARD_ORIGIN = '*';
