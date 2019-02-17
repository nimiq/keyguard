import { RedirectRpcClient } from '@nimiq/rpc';
import { RequestBehavior, RedirectRequestBehavior, IFrameRequestBehavior } from './RequestBehavior';
import { KeyguardCommand } from './KeyguardCommand';
import { Request, CreateRequest, ImportRequest, SimpleRequest, SignTransactionRequest, SignMessageRequest,
    DeriveAddressRequest, DeriveAddressesRequest, RemoveKeyRequest, ReleaseKeyRequest, EmptyRequest, RpcResult,
    KeyResult, SignTransactionResult, SignMessageResult, DeriveAddressResult, DeriveAddressesResult, ListResult,
    ListLegacyResult, SimpleResult } from './PublicRequest';
import { PublicToInternal, InternalToPublic } from './InternalRequest';
import Observable from './Observable';
import Nimiq from '@nimiq/core-web';

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

    private static internalToPublic(result: any): any {
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
    private _defaultBehavior: RequestBehavior;
    private _defaultIframeBehavior: RequestBehavior;

    constructor(
        endpoint = KeyguardClient.DEFAULT_ENDPOINT,
        defaultBehavior?: RequestBehavior,
        defaultIframeBehavior?: RequestBehavior,
        preserveRequests?: boolean,
    ) {
        this._endpoint = endpoint;
        this._defaultBehavior = defaultBehavior || new RedirectRequestBehavior();
        this._defaultIframeBehavior = defaultIframeBehavior || new IFrameRequestBehavior();

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

    public on(command: KeyguardCommand, resolve: (...args: any[]) => any, reject: (...args: any[]) => any) {
        this._observable.on(`${command}-resolve`, resolve);
        this._observable.on(`${command}-reject`, reject);
    }

    /* TOP-LEVEL REQUESTS */

    public create(request: CreateRequest, requestBehavior = this._defaultBehavior): Promise<KeyResult> {
        return this._request<CreateRequest, KeyResult> (requestBehavior, KeyguardCommand.CREATE, request);
    }

    public remove(request: RemoveKeyRequest, requestBehavior = this._defaultBehavior): Promise<SimpleResult> {
        return this._request<RemoveKeyRequest, SimpleResult>(requestBehavior, KeyguardCommand.REMOVE, request);
    }

    public import(request: ImportRequest, requestBehavior = this._defaultBehavior): Promise<KeyResult> {
        return this._request<ImportRequest, KeyResult> (requestBehavior, KeyguardCommand.IMPORT, request);
    }

    public async export(request: SimpleRequest, requestBehavior = this._defaultBehavior)
        : Promise<SimpleResult> {
        return this._request<SimpleRequest, SimpleResult>(requestBehavior, KeyguardCommand.EXPORT, request);
    }

    public async changePassphrase(request: SimpleRequest, requestBehavior = this._defaultBehavior)
        : Promise<SimpleResult> {
        return this._request<SimpleRequest, SimpleResult>(requestBehavior, KeyguardCommand.CHANGE_PASSPHRASE, request);
    }

    public async signTransaction(request: SignTransactionRequest, requestBehavior = this._defaultBehavior)
        : Promise<SignTransactionResult> {
        return this._request<SignTransactionRequest, SignTransactionResult>
            (requestBehavior, KeyguardCommand.SIGN_TRANSACTION, request);
    }

    public async signMessage(request: SignMessageRequest, requestBehavior = this._defaultBehavior)
        : Promise<SignMessageResult> {
        return this._request<SignMessageRequest, SignMessageResult>
            (requestBehavior, KeyguardCommand.SIGN_MESSAGE, request);
    }

    public async deriveAddress(request: DeriveAddressRequest, requestBehavior = this._defaultBehavior)
        : Promise<DeriveAddressResult> {
        return this._request<DeriveAddressRequest, DeriveAddressResult>
            (requestBehavior, KeyguardCommand.DERIVE_ADDRESS, request);
    }

    /* IFRAME REQUESTS */

    public async list(requestBehavior = this._defaultIframeBehavior): Promise<ListResult> {
        return this._request<EmptyRequest, ListResult>(requestBehavior, KeyguardCommand.LIST, null);
    }

    public async hasKeys(requestBehavior = this._defaultIframeBehavior): Promise<boolean> {
        const result = await this._request<EmptyRequest, SimpleResult>(requestBehavior, KeyguardCommand.HAS_KEYS, null);
        return result.success;
    }

    public async deriveAddresses(keyId: string, paths: string[], requestBehavior = this._defaultIframeBehavior)
        : Promise<Nimiq.SerialBuffer[]> {
        return this._request<DeriveAddressesRequest, DeriveAddressesResult>
            (requestBehavior, KeyguardCommand.DERIVE_ADDRESSES, { keyId, paths });
    }

    public async releaseKey(keyId: string, shouldBeRemoved = false, requestBehavior = this._defaultIframeBehavior)
        : Promise<true> {
        await this._request<ReleaseKeyRequest, SimpleResult>
            (requestBehavior, KeyguardCommand.RELEASE_KEY, { keyId, shouldBeRemoved });
        return true;
    }

    public async listLegacyAccounts(requestBehavior = this._defaultIframeBehavior)
        : Promise<ListLegacyResult> {
        return this._request<EmptyRequest, ListLegacyResult>
            (requestBehavior, KeyguardCommand.LIST_LEGACY_ACCOUNTS, null);
    }

    public async hasLegacyAccounts(requestBehavior = this._defaultIframeBehavior)
        : Promise<boolean> {
        const result = await this._request<EmptyRequest, SimpleResult>
            (requestBehavior, KeyguardCommand.HAS_LEGACY_ACCOUNTS, null);
        return result.success;
    }

    public async migrateAccountsToKeys(requestBehavior = this._defaultIframeBehavior)
        : Promise<boolean> {
            const result = await this._request<EmptyRequest, SimpleResult>
                (requestBehavior, KeyguardCommand.MIGRATE_ACCOUNTS_TO_KEYS, null);
            return result.success;
    }

    /* PRIVATE METHODS */

    private async _request<T1 extends Request, T2 extends RpcResult>(
        behavior: RequestBehavior,
        command: KeyguardCommand,
        request: T1,
    ): Promise<InternalToPublic<T2>> {
        const internalRequest = KeyguardClient.publicToInternal(request);
        const result = await behavior.request(this._endpoint, command, [ internalRequest ]);
        return KeyguardClient.internalToPublic(result);
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
