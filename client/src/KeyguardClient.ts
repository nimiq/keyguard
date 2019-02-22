import { RedirectRpcClient } from '@nimiq/rpc';

import {
    RequestBehavior,
    RedirectRequestBehavior,
    IFrameRequestBehavior,
} from './RequestBehavior';

import { KeyguardCommand } from './KeyguardCommand';

import {
    CreateRequest,
    DeriveAddressRequest,
    DeriveAddressesRequest,
    EmptyRequest,
    ImportRequest,
    RedirectRequest,
    RemoveKeyRequest,
    ReleaseKeyRequest,
    SignTransactionRequest,
    SimpleRequest,
    IFrameRequest,
    Request,
    DeriveAddressesResult,
    ListLegacyResult,
    ListResult,
    SimpleResult,
    IFrameResult,
    RedirectResult,
} from './PublicRequest';

import {
    InternalToPublic,
    PublicToInternal,
} from './InternalRequest';

import Observable from './Observable';

export class KeyguardClient {
    private static readonly DEFAULT_ENDPOINT =
        window.location.origin === 'https://accounts.nimiq.com' ? 'https://keyguard-next.nimiq.com'
        : window.location.origin === 'https://accounts.nimiq-testnet.com' ? 'https://keyguard-next.nimiq-testnet.com'
        : `${location.protocol}//${location.hostname}:8000/src`;

    private static parseId(id: string) {
        if (id.substr(0, 1) === 'K') {
            const parsedId = parseInt(id.substr(1), 10);
            if (!isNaN(parsedId)) return parsedId;
        }
        throw new Error('keyId cannot be parsed');
    }

    private static publicToInternal<T extends Request>(object: any)
        : PublicToInternal<T> {
        if (object && object.keyId) {
            object.keyId = KeyguardClient.parseId(object.keyId);
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
        // For ListResult and LegacyListResult
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
        resolve: (result: RedirectResult, state?: any) => any,
        reject: (error: Error, state?: any) => any,
    ) {
        this._observable.on(`${command}-resolve`, resolve);
        this._observable.on(`${command}-reject`, reject);
    }

    /* TOP-LEVEL REQUESTS */

    public create(request: CreateRequest) {
        this._redirectRequest<CreateRequest> (KeyguardCommand.CREATE, request);
    }

    public remove(request: RemoveKeyRequest) {
        this._redirectRequest<RemoveKeyRequest>(KeyguardCommand.REMOVE, request);
    }

    public import(request: ImportRequest) {
        this._redirectRequest<ImportRequest>(KeyguardCommand.IMPORT, request);
    }

    public export(request: SimpleRequest) {
        this._redirectRequest<SimpleRequest>(KeyguardCommand.EXPORT, request);
    }

    public changePassphrase(request: SimpleRequest) {
        this._redirectRequest<SimpleRequest>(KeyguardCommand.CHANGE_PASSPHRASE, request);
    }

    public signTransaction(request: SignTransactionRequest) {
        this._redirectRequest<SignTransactionRequest>(KeyguardCommand.SIGN_TRANSACTION, request);
    }

    public deriveAddress(request: DeriveAddressRequest) {
        this._redirectRequest<DeriveAddressRequest>(KeyguardCommand.DERIVE_ADDRESS, request);
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
    ) {
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
