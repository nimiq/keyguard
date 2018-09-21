import { RequestBehavior } from './RequestBehavior';
import { KeyguardCommand, CreateRequest, CreateResult, SignMessageResult, SignTransactionRequest, SignTransactionResult, SignMessageRequest, ImportRequest, ImportResult } from './RequestTypes';
export declare class KeyguardClient {
    private static readonly DEFAULT_ENDPOINT;
    private readonly _endpoint;
    private _redirectClient;
    private _observable;
    private _defaultBehavior;
    constructor(endpoint?: string, defaultBehavior?: RequestBehavior);
    init(): Promise<void>;
    on(command: KeyguardCommand, resolve: (...args: any[]) => any, reject: (...args: any[]) => any): void;
    create(request: CreateRequest, requestBehavior?: RequestBehavior): Promise<CreateResult>;
    remove(keyId: string, requestBehavior?: RequestBehavior): Promise<any>;
    import(request: ImportRequest, requestBehavior?: RequestBehavior): Promise<ImportResult>;
    exportWords(keyId: string, requestBehavior?: RequestBehavior): Promise<any>;
    exportFile(keyId: string, requestBehavior?: RequestBehavior): Promise<any>;
    signTransaction(request: SignTransactionRequest, requestBehavior?: RequestBehavior): Promise<SignTransactionResult>;
    signMessage(request: SignMessageRequest, requestBehavior?: RequestBehavior): Promise<SignMessageResult>;
    private _request;
    private _onReject;
    private _onResolve;
}
