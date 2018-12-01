import { RedirectRpcClient } from '@nimiq/rpc';
import { RequestBehavior, RedirectRequestBehavior, IFrameRequestBehavior } from './RequestBehavior';
import { KeyguardCommand } from './KeyguardCommand';

export class KeyguardClient {
    private static readonly DEFAULT_ENDPOINT =
        window.location.origin === 'https://accounts.nimiq.com' ? 'https://keyguard-next.nimiq.com'
        : window.location.origin === 'https://accounts.nimiq-testnet.com' ? 'https://keyguard-next.nimiq-testnet.com'
        : 'http://localhost:8000/src';

    private readonly _endpoint: string;
    private _redirectClient: RedirectRpcClient;
    private _observable: Nimiq.Observable;
    private _defaultBehavior: RequestBehavior;
    private _defaultIframeBehavior: RequestBehavior;

    constructor(
        endpoint = KeyguardClient.DEFAULT_ENDPOINT,
        defaultBehavior?: RequestBehavior,
        defaultIframeBehavior?: RequestBehavior,
    ) {
        this._endpoint = endpoint;
        this._defaultBehavior = defaultBehavior || new RedirectRequestBehavior();
        this._defaultIframeBehavior = defaultIframeBehavior || new IFrameRequestBehavior();

        // Listen for response
        this._redirectClient = new RedirectRpcClient('', RequestBehavior.getAllowedOrigin(this._endpoint));
        this._redirectClient.onResponse('request', this._onResolve.bind(this), this._onReject.bind(this));

        this._observable = new Nimiq.Observable();
    }

    public init() {
        return this._redirectClient.init();
    }

    public on(command: KeyguardCommand, resolve: (...args: any[]) => any, reject: (...args: any[]) => any) {
        this._observable.on(`${command}-resolve`, resolve);
        this._observable.on(`${command}-reject`, reject);
    }

    /* TOP-LEVEL REQUESTS */

    public create(request: KeyguardRequest.CreateRequest, requestBehavior = this._defaultBehavior)
        : Promise<KeyguardRequest.CreateResult> {
        return this._request(requestBehavior,  KeyguardCommand.CREATE, [request]);
    }

    public remove(request: KeyguardRequest.SimpleRequest, requestBehavior = this._defaultBehavior)
        : Promise<KeyguardRequest.SimpleResult> {
        return this._request(requestBehavior,  KeyguardCommand.REMOVE, [request]);
    }

    public import(request: KeyguardRequest.ImportRequest, requestBehavior = this._defaultBehavior)
        : Promise<KeyguardRequest.ImportResult> {
        return this._request(requestBehavior,  KeyguardCommand.IMPORT, [request]);
    }

    public async export(request: KeyguardRequest.SimpleRequest, requestBehavior = this._defaultBehavior)
        : Promise<KeyguardRequest.SimpleResult> {
        return this._request(requestBehavior,  KeyguardCommand.EXPORT, [request]);
    }

    public async changePassphrase(request: KeyguardRequest.SimpleRequest, requestBehavior = this._defaultBehavior)
        : Promise<KeyguardRequest.SimpleResult> {
        return this._request(requestBehavior,  KeyguardCommand.CHANGE_PASSPHRASE, [request]);
    }

    public async signTransaction(request: KeyguardRequest.SignTransactionRequest,
                                 requestBehavior = this._defaultBehavior)
        : Promise<KeyguardRequest.SignTransactionResult> {
        return this._request(requestBehavior,  KeyguardCommand.SIGN_TRANSACTION, [request]);
    }

    public async signMessage(request: KeyguardRequest.SignMessageRequest,
                             requestBehavior = this._defaultBehavior)
        : Promise<KeyguardRequest.SignMessageResult> {
        return this._request(requestBehavior,  KeyguardCommand.SIGN_MESSAGE, [request]);
    }

    public async deriveAddress(request: KeyguardRequest.DeriveAddressRequest,
                               requestBehavior = this._defaultBehavior)
        : Promise<KeyguardRequest.DeriveAddressResult> {
        return this._request(requestBehavior,  KeyguardCommand.DERIVE_ADDRESS, [request]);
    }

    /* IFRAME REQUESTS */

    public async list(fromLegacyStore?: boolean, requestBehavior = this._defaultIframeBehavior)
    : Promise<KeyguardRequest.KeyInfoObject[]> {
        return this._request(requestBehavior, KeyguardCommand.LIST, [fromLegacyStore]);
    }

    public async hasKeys(inLegacyStore?: boolean, requestBehavior = this._defaultIframeBehavior): Promise<boolean> {
        return this._request(requestBehavior, KeyguardCommand.HAS_KEYS, [inLegacyStore]);
    }

    public async migrateAccountsToKeys(requestBehavior = this._defaultIframeBehavior): Promise<void> {
        return this._request(requestBehavior, KeyguardCommand.MIGRATE_ACCOUNTS_TO_KEYS, []);
    }

    public async deriveAddresses(keyId: string, paths: string[], requestBehavior = this._defaultIframeBehavior)
    : Promise<Uint8Array[]> {
        return this._request(requestBehavior, KeyguardCommand.DERIVE_ADDRESSES, [keyId, paths]);
    }

    public async releaseKey(keyId: string, requestBehavior = this._defaultIframeBehavior)
    : Promise<true> {
        return this._request(requestBehavior, KeyguardCommand.RELEASE_KEY, [keyId]);
    }

    /* PRIVATE METHODS */

    private _request(behavior: RequestBehavior, command: KeyguardCommand, args: any[]): Promise<any> {
        return behavior.request(this._endpoint, command, args);
    }

    private _onReject(error: any, id: number, state: any) {
        const command = state.__command;
        if (!command) {
            throw new Error('Invalid state after RPC request');
        }
        delete state.__command;

        this._observable.fire(`${command}-reject`, error, state);
    }

    private _onResolve(result: any, id: number, state: any) {
        const command = state.__command;
        if (!command) {
            throw new Error('Invalid state after RPC request');
        }
        delete state.__command;

        this._observable.fire(`${command}-resolve`, result, state);
    }
}
