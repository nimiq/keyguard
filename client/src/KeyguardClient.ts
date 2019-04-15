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
    SignMessageRequest,
    SimpleRequest,
    IFrameRequest,
    DeriveAddressesResult,
    ListLegacyResult,
    ListResult,
    SimpleResult,
    IFrameResult,
    RedirectResult,
    ExportRequest,
    ObjectType,
} from './PublicRequest';

import Observable from './Observable';

export class KeyguardClient {
    private static readonly DEFAULT_ENDPOINT =
        window.location.origin === 'https://accounts.nimiq.com' ? 'https://keyguard.nimiq.com'
        : window.location.origin === 'https://accounts.nimiq-testnet.com' ? 'https://keyguard.nimiq-testnet.com'
        : `${location.protocol}//${location.hostname}:8000/src`;

    private readonly _endpoint: string;
    private _redirectClient: RedirectRpcClient;
    private _observable: Observable;
    private _redirectBehavior: RedirectRequestBehavior;
    private _iframeBehavior: IFrameRequestBehavior;

    constructor(
        endpoint = KeyguardClient.DEFAULT_ENDPOINT,
        returnURL?: string,
        localState?: ObjectType|null,
        preserveRequests?: boolean,
    ) {
        this._endpoint = endpoint;
        this._redirectBehavior = new RedirectRequestBehavior(returnURL, localState);
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
        resolve: (result: RedirectResult, state?: ObjectType|null) => any,
        reject: (error: Error, state?: ObjectType|null) => any,
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

    public export(request: ExportRequest) {
        this._redirectRequest<ExportRequest>(KeyguardCommand.EXPORT, request);
    }

    public changePassword(request: SimpleRequest) {
        this._redirectRequest<SimpleRequest>(KeyguardCommand.CHANGE_PASSWORD, request);
    }

    public signTransaction(request: SignTransactionRequest) {
        this._redirectRequest<SignTransactionRequest>(KeyguardCommand.SIGN_TRANSACTION, request);
    }

    public deriveAddress(request: DeriveAddressRequest) {
        this._redirectRequest<DeriveAddressRequest>(KeyguardCommand.DERIVE_ADDRESS, request);
    }

    public signMessage(request: SignMessageRequest) {
        this._redirectRequest<SignMessageRequest>(KeyguardCommand.SIGN_MESSAGE, request);
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
        this._redirectBehavior.request(this._endpoint, command, [ request ]);
        // return value of redirect call is received in _onResolve()
    }

    private async _iframeRequest<T1 extends IFrameRequest, T2 extends IFrameResult>(
        command: KeyguardCommand,
        request?: T1,
    ): Promise<T2> {
        const args = request ? [request] : [];
        return this._iframeBehavior.request(this._endpoint, command, args);
    }

    private _onReject(
        error: any,
        id?: number,
        state?: ObjectType|null,
     ) {
        const [parsedState, command] = this._parseState(state);
        this._observable.fire(`${command}-reject`, error, parsedState);
    }

    private _onResolve<T extends RedirectResult>(
        result: T,
        id?: number,
        state?: ObjectType|null,
    ) {
        const [parsedState, command] = this._parseState(state);
        this._observable.fire(`${command}-resolve`, result, parsedState);
    }

    private _parseState(state?: ObjectType|null) {
        if (state) {
            const command = state.__command;
            if (command) {
                delete state.__command;
                return [state, command];
            }
        }
        throw new Error('Invalid state after RPC request');
    }
}

import '../../src/lib/SignMessageConstants.js';

// tslint:disable-next-line:variable-name
export const MSG_PREFIX = window.__messageSigningPrefix.MSG_PREFIX;
