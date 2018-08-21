import { RequestBehavior } from './RequestBehavior';
import { KeyguardCommand, SignMessageResult, SignTransactionRequest, SignTransactionResult, SignMessageRequest } from './RequestTypes';
export declare class KeyguardClient {
    private static readonly DEFAULT_ENDPOINT;
    private readonly _endpoint;
    private _redirectClient;
    private _observable;
    private _defaultBehavior;
    constructor(endpoint?: string, defaultBehavior?: RequestBehavior);
    init(): Promise<void>;
    on(command: KeyguardCommand, resolve: (...args: any[]) => any, reject: (...args: any[]) => any): void;
    create(defaultKeyPath: string, requestBehavior?: RequestBehavior): Promise<any>;
    remove(keyId: string, requestBehavior?: RequestBehavior): Promise<any>;
    importWords(defaultKeyPath: string, requestBehavior?: RequestBehavior): Promise<any>;
    importFile(requestBehavior?: RequestBehavior): Promise<any>;
    exportWords(keyId: string, requestBehavior?: RequestBehavior): Promise<any>;
    exportFile(keyId: string, requestBehavior?: RequestBehavior): Promise<any>;
    signTransaction(request: SignTransactionRequest, requestBehavior?: RequestBehavior): Promise<SignTransactionResult>;
    signMessage(request: SignMessageRequest, requestBehavior?: RequestBehavior): Promise<SignMessageResult>;
    private _request;
    private _onReject;
    private _onResolve;
}
