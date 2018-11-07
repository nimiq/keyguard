import {RedirectRpcClient} from '@nimiq/rpc';
import {RequestBehavior, RedirectRequestBehavior, IFrameRequestBehavior} from './RequestBehavior';
import {
    KeyguardCommand,
    CreateRequest,
    CreateResult,
    SignTransactionRequest,
    SignTransactionResult,
    SignMessageRequest,
    SignMessageResult,
    ImportRequest,
    ImportResult,
    RemoveKeyRequest,
    RemoveKeyResult,
    ExportWordsRequest,
    ExportWordsResult,
    ExportFileRequest,
    ExportFileResult,
    DeriveAddressRequest,
    DeriveAddressResult,
    KeyInfoObject,
    AccountInfo,
} from './RequestTypes';

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

    public create(request: CreateRequest, requestBehavior = this._defaultBehavior): Promise<CreateResult> {
        return this._request(requestBehavior,  KeyguardCommand.CREATE, [request]);
    }

    public remove(request: RemoveKeyRequest, requestBehavior = this._defaultBehavior): Promise<RemoveKeyResult> {
        return this._request(requestBehavior,  KeyguardCommand.REMOVE, [request]);
    }

    public import(request: ImportRequest, requestBehavior = this._defaultBehavior): Promise<ImportResult> {
        return this._request(requestBehavior,  KeyguardCommand.IMPORT, [request]);
    }

    public async exportWords(request: ExportWordsRequest, requestBehavior = this._defaultBehavior)
        : Promise<ExportWordsResult> {
        return this._request(requestBehavior,  KeyguardCommand.EXPORT_WORDS, [request]);
    }

    public async exportFile(request: ExportFileRequest, requestBehavior = this._defaultBehavior)
        : Promise<ExportFileResult> {
        return this._request(requestBehavior,  KeyguardCommand.EXPORT_FILE, [request]);
    }

    public async signTransaction(request: SignTransactionRequest,
                                 requestBehavior = this._defaultBehavior): Promise<SignTransactionResult> {
        return this._request(requestBehavior,  KeyguardCommand.SIGN_TRANSACTION, [request]);
    }

    public async signMessage(request: SignMessageRequest,
                             requestBehavior = this._defaultBehavior): Promise<SignMessageResult> {
        return this._request(requestBehavior,  KeyguardCommand.SIGN_MESSAGE, [request]);
    }

    public async deriveAddress(request: DeriveAddressRequest,
                               requestBehavior = this._defaultBehavior): Promise<DeriveAddressResult> {
        return this._request(requestBehavior,  KeyguardCommand.DERIVE_ADDRESS, [request]);
    }

    /* IFRAME REQUESTS */

    public async list(listFromLegacyStore?: boolean, requestBehavior = this._defaultIframeBehavior)
    : Promise<KeyInfoObject[] | AccountInfo[]> {
        return this._request(requestBehavior, KeyguardCommand.LIST, [listFromLegacyStore]);
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
