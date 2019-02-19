import { RedirectRpcClient } from '@nimiq/rpc';
import { RequestBehavior, RedirectRequestBehavior, IFrameRequestBehavior } from './RequestBehavior';
import { KeyguardCommand } from './KeyguardCommand';
import { Request, CreateRequest, ImportRequest, SimpleRequest, SignTransactionRequest, SignMessageRequest,
    DeriveAddressRequest, DeriveAddressesRequest, RemoveKeyRequest, ReleaseKeyRequest, EmptyRequest,
    RedirectRequest, IFrameRequest, IFrameResult, ListResult, SimpleResult, DeriveAddressesResult,
    ListLegacyResult, RedirectResult} from './PublicRequest';
import { PublicToInternal, InternalToPublic } from './InternalRequest';
import Observable from './Observable';

export class KeyguardClient {
    private static readonly DEFAULT_ENDPOINT =
        window.location.origin === 'https://accounts.nimiq.com' ? 'https://keyguard-next.nimiq.com'
        : window.location.origin === 'https://accounts.nimiq-testnet.com' ? 'https://keyguard-next.nimiq-testnet.com'
        : `${location.protocol}//${location.hostname}:8000/src`;

    private static parseId(id: string) {
        if (id.substr(0, 1) !== 'K') {
            throw new Error('keyId must start with K');
        }
        const parsedId = parseInt(id.substr(1), 10);
        if (isNaN(parsedId)) {
            throw new Error('keyId cannot be parsed');
        }
        return parsedId;
    }

    private static publicToInternal<T extends Request>(object: any)
        : PublicToInternal<T> {
        if (object && object.keyId) {
            object.keyId = KeyguardClient.parseId(object.keyId);
        }
        if (object && object.id) {
            object.id = KeyguardClient.parseId(object.id);
        }
        return object;
    }

    // Not really well typed. Return type gets any. Feel free to improve.
    private static internalToPublic(result: any): InternalToPublic<typeof result> {
        if (result instanceof Array) {
            return result.map((x) => KeyguardClient.internalToPublic(x));
        }
        if (result && result.keyId) {
            result.keyId = `K${result.keyId}`;
        }
        if (result && result.id) {
            result.id = `K${result.id}`;
        }
        return result;
    }

    private readonly _endpoint: string;
    private _redirectClient: RedirectRpcClient;
    private _observable: Observable;
    private _redirectBehavior: RedirectRequestBehavior;
    private _iframeBehavior: IFrameRequestBehavior;

    constructor(
        endpoint = KeyguardClient.DEFAULT_ENDPOINT,
        localState?: any,
        preserveRequests?: boolean,
    ) {
        this._endpoint = endpoint;
        this._redirectBehavior = new RedirectRequestBehavior(undefined, localState);
        this._iframeBehavior = new IFrameRequestBehavior();

        // If this is a page-reload, allow location.origin as RPC origin
        const allowedOrigin = new URL(document.referrer).origin === window.location.origin
            ? window.location.origin
            : RequestBehavior.getAllowedOrigin(this._endpoint);

        // Listen for response
        this._redirectClient = new RedirectRpcClient('', allowedOrigin, preserveRequests);
        this._redirectClient.onResponse('request', this._onResolve.bind(this), this._onReject.bind(this));

        this._observable = new Observable();
    }

    public init() {
        return this._redirectClient.init();
    }

    public on(
        command: KeyguardCommand,
        resolve: (result: any, state?: any) => any,
        reject: (...args: any[]) => any,
    ) {
        this._observable.on(`${command}-resolve`, resolve);
        this._observable.on(`${command}-reject`, reject);
    }

    /* TOP-LEVEL REQUESTS */

    public async create(request: CreateRequest): Promise<void> {
        this._redirectRequest<CreateRequest> (KeyguardCommand.CREATE, request);
    }

    public async remove(request: RemoveKeyRequest): Promise<void> {
        this._redirectRequest<RemoveKeyRequest>(KeyguardCommand.REMOVE, request);
    }

    public async import(request: ImportRequest): Promise<void> {
        return this._redirectRequest<ImportRequest>(KeyguardCommand.IMPORT, request);
    }

    public async export(request: SimpleRequest): Promise<void> {
        return this._redirectRequest<SimpleRequest>(KeyguardCommand.EXPORT, request);
    }

    public async changePassphrase(request: SimpleRequest): Promise<void> {
        return this._redirectRequest<SimpleRequest>(KeyguardCommand.CHANGE_PASSPHRASE, request);
    }

    public async signTransaction(request: SignTransactionRequest): Promise<void> {
        return this._redirectRequest<SignTransactionRequest>(KeyguardCommand.SIGN_TRANSACTION, request);
    }

    public async deriveAddress(request: DeriveAddressRequest): Promise<void> {
        return this._redirectRequest<DeriveAddressRequest>(KeyguardCommand.DERIVE_ADDRESS, request);
    }

    /* IFRAME REQUESTS */

    public async list(): Promise<ListResult> {
        return this._iframeRequest<EmptyRequest, ListResult>(KeyguardCommand.LIST);
    }

    public async hasKeys(): Promise<SimpleResult> {
        return this._iframeRequest<EmptyRequest, SimpleResult>(KeyguardCommand.HAS_KEYS);
    }

    public async deriveAddresses(keyId: string, paths: string[]): Promise<DeriveAddressesResult> {
        return this._iframeRequest<DeriveAddressesRequest, DeriveAddressesResult>
            (KeyguardCommand.DERIVE_ADDRESSES, { keyId, paths });
    }

    public async releaseKey(keyId: string, shouldBeRemoved = false): Promise<SimpleResult> {
        return this._iframeRequest<ReleaseKeyRequest, SimpleResult>
            (KeyguardCommand.RELEASE_KEY, { keyId, shouldBeRemoved });
    }

    public async listLegacyAccounts(): Promise<ListLegacyResult> {
        return this._iframeRequest<EmptyRequest, ListLegacyResult>(KeyguardCommand.LIST_LEGACY_ACCOUNTS);
    }

    public async hasLegacyAccounts(): Promise<SimpleResult> {
        return this._iframeRequest<EmptyRequest, SimpleResult>(KeyguardCommand.HAS_LEGACY_ACCOUNTS);
    }

    public async migrateAccountsToKeys(): Promise<SimpleResult> {
        return this._iframeRequest<EmptyRequest, SimpleResult>(KeyguardCommand.MIGRATE_ACCOUNTS_TO_KEYS);
    }

    /* PRIVATE METHODS */

    private async _redirectRequest<T extends RedirectRequest>(
        command: KeyguardCommand,
        request: T,
    ): Promise<void> {
        const internalRequest = KeyguardClient.publicToInternal(request);
        this._redirectBehavior.request(this._endpoint, command, [ internalRequest ]);
        // return value of redirect call is received in _onResolve()
    }

    private async _iframeRequest<T1 extends IFrameRequest, T2 extends IFrameResult>(
        command: KeyguardCommand,
        request?: T1,
    ): Promise<T2> {
        const args = request ? [ KeyguardClient.publicToInternal(request) ] : [];
        const internalResult = await this._iframeBehavior.request(this._endpoint, command, args);
        const publicResult = KeyguardClient.internalToPublic(internalResult) as T2;
        return publicResult;
    }

    private _onReject(error: any, id: number, state: any) {
        const command = state.__command;
        if (!command) {
            throw new Error('Invalid state after RPC request');
        }
        delete state.__command;

        this._observable.fire(`${command}-reject`, error, state);
    }

    private _onResolve<T extends RedirectResult>(internalResult: PublicToInternal<T>, id: number, state: any) {
        const command = state.__command;
        if (!command) {
            throw new Error('Invalid state after RPC request');
        }
        delete state.__command;

        const publicResult: T = KeyguardClient.internalToPublic(internalResult);

        this._observable.fire(`${command}-resolve`, publicResult, state);
    }
}
