import { RedirectRpcClient } from '@nimiq/rpc';
import { RequestBehavior, RedirectRequestBehavior, IFrameRequestBehavior } from './RequestBehavior';
import { KeyguardCommand } from './KeyguardCommand';
import * as KeyguardRequest from './PublicRequest';
import { PublicToInternal } from './InternalRequest';
import Observable from './Observable';

type HasKeyId<T> = T & {
    keyId: string;
};

export class KeyguardClient {
    private static readonly DEFAULT_ENDPOINT =
        window.location.origin === 'https://accounts.nimiq.com' ? 'https://keyguard-next.nimiq.com'
        : window.location.origin === 'https://accounts.nimiq-testnet.com' ? 'https://keyguard-next.nimiq-testnet.com'
        : `${location.protocol}//${location.hostname}:8000/src`;

    private static hasKeyId(request: T KeyguardRequest.Request): request is HasKeyId<typeof request> {
        return request.keyId === undefined ? false : true;
    }

    private static mapIdStringToNumber<T extends KeyguardRequest.Request>(request: T)
        : PublicToInternal<T> {
        if (request && request.keyId) {
            if (request.keyId.substr(0, 1) !== 'K') {
                throw new Error('keyId must start with K');
            }
            const parsedKeyId = parseInt(request.keyId.substr(1), 10);
            if (isNaN(parsedKeyId)) {
                throw new Error('keyId cannot be parsed');
            }
            request.keyId = parsedKeyId;
        }
        return request;
    }

    private static mapIdNumberToString(result: any) {
        if (result && result.keyId) {
            result.keyId = `K${result.keyId}`;
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

    public create(request: KeyguardRequest.CreateRequest, requestBehavior = this._defaultBehavior)
        : Promise<KeyguardRequest.KeyResult[]> {
        return this._request(requestBehavior,  KeyguardCommand.CREATE, request);
    }

    public remove(request: KeyguardRequest.SimpleRequest, requestBehavior = this._defaultBehavior)
        : Promise<KeyguardRequest.SimpleResult> {
        return this._request(requestBehavior,  KeyguardCommand.REMOVE, request);
    }

    public import(request: KeyguardRequest.ImportRequest, requestBehavior = this._defaultBehavior)
        : Promise<KeyguardRequest.KeyResult[]> {
        return this._request(requestBehavior,  KeyguardCommand.IMPORT, request);
    }

    public async export(request: KeyguardRequest.SimpleRequest, requestBehavior = this._defaultBehavior)
        : Promise<KeyguardRequest.SimpleResult> {
        return this._request(requestBehavior,  KeyguardCommand.EXPORT, request);
    }

    public async changePassphrase(request: KeyguardRequest.SimpleRequest, requestBehavior = this._defaultBehavior)
        : Promise<KeyguardRequest.SimpleResult> {
        return this._request(requestBehavior,  KeyguardCommand.CHANGE_PASSPHRASE, request);
    }

    public async signTransaction(request: KeyguardRequest.SignTransactionRequest,
                                 requestBehavior = this._defaultBehavior)
        : Promise<KeyguardRequest.SignTransactionResult> {
        return this._request(requestBehavior,  KeyguardCommand.SIGN_TRANSACTION, request);
    }

    public async signMessage(request: KeyguardRequest.SignMessageRequest,
                             requestBehavior = this._defaultBehavior)
        : Promise<KeyguardRequest.SignMessageResult> {
        return this._request(requestBehavior,  KeyguardCommand.SIGN_MESSAGE, request);
    }

    public async deriveAddress(request: KeyguardRequest.DeriveAddressRequest,
                               requestBehavior = this._defaultBehavior)
        : Promise<KeyguardRequest.DeriveAddressResult> {
        return this._request(requestBehavior,  KeyguardCommand.DERIVE_ADDRESS, request);
    }

    /* IFRAME REQUESTS */

    public async list(requestBehavior = this._defaultIframeBehavior)
    : Promise<KeyguardRequest.KeyInfoObject[]> {
        return this._request(requestBehavior, KeyguardCommand.LIST);
    }

    public async hasKeys(requestBehavior = this._defaultIframeBehavior)
    : Promise<boolean> {
        return this._request(requestBehavior, KeyguardCommand.HAS_KEYS);
    }

    public async deriveAddresses(keyId: string, paths: string[], requestBehavior = this._defaultIframeBehavior)
    : Promise<Uint8Array[]> {
        return this._request(requestBehavior, KeyguardCommand.DERIVE_ADDRESSES, { keyId, paths });
    }

    public async releaseKey(keyId: string, shouldBeRemoved = false, requestBehavior = this._defaultIframeBehavior)
    : Promise<true> {
        return this._request(requestBehavior, KeyguardCommand.RELEASE_KEY, { keyId, shouldBeRemoved });
    }

    public async listLegacyAccounts(requestBehavior = this._defaultIframeBehavior)
    : Promise<KeyguardRequest.LegacyKeyInfoObject[]> {
        return this._request(requestBehavior, KeyguardCommand.LIST_LEGACY_ACCOUNTS);
    }

    public async hasLegacyAccounts(requestBehavior = this._defaultIframeBehavior)
    : Promise<boolean> {
        return this._request(requestBehavior, KeyguardCommand.HAS_LEGACY_ACCOUNTS);
    }

    public async migrateAccountsToKeys(requestBehavior = this._defaultIframeBehavior)
    : Promise<boolean> {
        return this._request(requestBehavior, KeyguardCommand.MIGRATE_ACCOUNTS_TO_KEYS);
    }

    /* PRIVATE METHODS */

    private async _request(
        behavior: RequestBehavior,
        command: KeyguardCommand,
        request: KeyguardRequest.Request | null = null,
    ): Promise<any> {
        const args: KeyguardRequest.Request[] = request
            ? [ KeyguardClient.mapIdStringToNumber(request) ]
            : [];
        const result = await behavior.request(this._endpoint, command, args );
        return KeyguardClient.mapIdNumberToString(result);
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
