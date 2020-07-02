import { RedirectRpcClient, PostMessageRpcClient } from '@nimiq/rpc';
import { KeyguardCommand } from './KeyguardCommand';
import { ObjectType } from './PublicRequest';

enum BehaviorType {
    REDIRECT,
    IFRAME,
}

export class RequestBehavior {
    public static getAllowedOrigin(endpoint: string) {
        const url = new URL(endpoint);
        return url.origin;
    }

    private readonly _type: BehaviorType;

    constructor(type: BehaviorType) {
        this._type = type;
    }

    public async request(endpoint: string, command: KeyguardCommand, args: any[]): Promise<void> {
        throw new Error('Not implemented');
    }

    public get type() {
        return this._type;
    }
}

export class RedirectRequestBehavior extends RequestBehavior {
    public static getRequestUrl(endpoint: string, command: KeyguardCommand) {
        return `${endpoint}/request/${command}/`;
    }

    private readonly _returnUrl: string;
    private readonly _localState: ObjectType|null;
    private readonly _handleHistoryBack: boolean;

    constructor(returnUrl?: string, localState?: ObjectType|null, handleHistoryBack = false) {
        super(BehaviorType.REDIRECT);
        const location = window.location;
        this._returnUrl = returnUrl || `${location.origin}${location.pathname}`;
        this._localState = localState || {};
        this._handleHistoryBack = handleHistoryBack;

        // Reject local state with reserved property.
        if (typeof this._localState.__command !== 'undefined') {
            throw new Error('Invalid localState: Property \'__command\' is reserved');
        }
    }

    public async request(endpoint: string, command: KeyguardCommand, args: any[]): Promise<void> {
        const url = RedirectRequestBehavior.getRequestUrl(endpoint, command);
        const allowedOrigin = RequestBehavior.getAllowedOrigin(endpoint);

        const client = new RedirectRpcClient(url, allowedOrigin);

        const state = Object.assign({ __command: command }, this._localState);
        client.callAndSaveLocalState(this._returnUrl, state, 'request', this._handleHistoryBack, ...args);
    }
}

export class IFrameRequestBehavior extends RequestBehavior {
    private static IFRAME_PATH_SUFFIX = '/request/iframe/';

    private _iframeEndpoint: string | null = null;
    private _iframePromise: Promise<HTMLIFrameElement> | null = null;
    private _clientPromise: Promise<PostMessageRpcClient> | null = null;

    constructor() {
        super(BehaviorType.IFRAME);
    }

    public async request(endpoint: string, command: KeyguardCommand, args: any[]): Promise<any> {
        const client = await this._getClient(endpoint);
        return client.call(command, ...args);
    }

    public async createIFrame(endpoint: string): Promise<HTMLIFrameElement> {
        if (this._iframeEndpoint && this._iframeEndpoint !== endpoint) {
            throw new Error('Keyguard iframe is already opened with another endpoint' +
                `(opened: ${this._iframeEndpoint}, expected: ${endpoint})`);
        }
        this._iframeEndpoint = endpoint;

        this._iframePromise = this._iframePromise || new Promise((resolve, reject) => {
            const $iframe = document.createElement('iframe');
            $iframe.name = 'NimiqKeyguardIFrame';
            $iframe.style.display = 'none';
            document.body.appendChild($iframe);
            $iframe.src = `${endpoint}${IFrameRequestBehavior.IFRAME_PATH_SUFFIX}`;
            $iframe.onload = () => resolve($iframe);
            $iframe.onerror = reject;
        });

        return this._iframePromise;
    }

    private _getClient(endpoint: string): Promise<PostMessageRpcClient> {
        this._clientPromise = this._clientPromise || new Promise(async (resolve) => {
            const iframe = await this.createIFrame(endpoint);
            if (!iframe.contentWindow) {
                throw new Error(`IFrame contentWindow is ${typeof iframe.contentWindow}`);
            }

            const origin = RequestBehavior.getAllowedOrigin(endpoint);
            const client = new PostMessageRpcClient(iframe.contentWindow, origin);
            await client.init();

            resolve(client);
        });

        return this._clientPromise;
    }
}
