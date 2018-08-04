import RpcClient from './RpcClient';
import SignMessageRequest = Keyguard.SignMessageRequest;

export default class KeyguardClient {
    // FIXME Replace by real origin (or from config)
    private static KEYGUARD_ORIGIN = '*';

    private _keyguardSrc: string;

    private __iframeClient: any;

    private _connected: any;

    constructor(src = '../src') {
        this._keyguardSrc = src;

        this._connected = this._startIFrame();
    }

    /**
     * @param {boolean} [listFromAccountStore] Deprecated, list from old AccountStore
     * @returns {
     */
    public async list(listFromAccountStore = false): Promise<Keyguard.KeyInfo[] | Keyguard.AccountInfo[]> {
        await this._connected;
        return this._iframeClient.call('list', [listFromAccountStore]);
    }

    /**
     * @deprecated Only for database migration
     */
    public async migrateDB(): Promise<boolean> {
        await this._connected;
        return this._iframeClient.call('migrateAccountsToKeys');
    }

    public async create(label: string) {
        return this._startPopup('create', [{
            label,
        }]);
    }

    public async importWords() {
        return this._startPopup('import-words');
    }

    public async importFile() {
        return this._startPopup('import-file');
    }

    public async export(address: string): Promise<void> {
        return this._startPopup('export-words', [address]);
    }

    public async signTransaction(request: Keyguard.SignTransactionRequest): Promise<Keyguard.SignTransactionResult> {
        return this._startPopup('sign-transaction', [request]);
    }

    async signMessage(request: SignMessageRequest): Promise<Keyguard.SignMessageResult> {
        return this._startPopup('sign-message', [request]);
    }

    public async delete(address: string): Promise<void> {
        return this._startPopup('delete', [address]);
    }

    private async _startIFrame() {
        const $iframe = await this._createIframe();

        if (!$iframe.contentWindow) {
            throw new Error(`IFrame contentWindow is ${typeof $iframe.contentWindow}`);
        }

        this.__iframeClient = await RpcClient.create($iframe.contentWindow, KeyguardClient.KEYGUARD_ORIGIN);
    }

    private async _createIframe() {
        return new Promise((resolve, reject) => {
            const $iframe = document.createElement('iframe');
            resolve($iframe);
            $iframe.name = 'Nimiq Keyguard IFrame';
            $iframe.style.display = 'none';
            document.body.appendChild($iframe);
            $iframe.src = `${this._keyguardSrc}/request/iframe/`;
            $iframe.onload = () => resolve($iframe);
            $iframe.onerror = reject;
        }) as Promise<HTMLIFrameElement>;
    }

    /**
     * @param {string} requestName - The request name in kebab-case (folder name)
     * @param {any[]} [args]
     */
    private async _startPopup(requestName: string, args?: any[]) {
        const requestUrl = `${this._keyguardSrc}/request/${requestName}/`;

        const $popup = window.open(
            requestUrl,
            'NimiqPopup',
            `left=${window.innerWidth / 2 - 250},top=100,width=500,height=820,location=yes,dependent=yes`,
        );

        if (!$popup) {
            throw new Error('Nimiq popup could not be opened.');
        }

        // Await popup loaded
        await new Promise((res) => { $popup.onload = res; });

        // FIXME improve typing
        const rpcClient = await RpcClient.create($popup, KeyguardClient.KEYGUARD_ORIGIN) as any;

        try {
            const result = await rpcClient.call('request', args);
            rpcClient.close();
            $popup.close();
            return result;
        } catch (e) {
            rpcClient.close();
            $popup.close();
            throw e;
        }
    }

    private get _iframeClient() {
        if (!this.__iframeClient) {
          throw new Error('IFrame not available');
        }

        return this.__iframeClient;
    }
}
