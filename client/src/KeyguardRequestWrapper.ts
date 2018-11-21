export type CreateRequest = KeyguardRequest.CreateRequest;
export type CreateResult = KeyguardRequest.CreateResult;
export type SimpleRequest = KeyguardRequest.SimpleRequest;
export type SimpleResult = KeyguardRequest.SimpleResult;
export type DeriveAddressRequest = KeyguardRequest.DeriveAddressRequest;
export type DeriveAddressResult = KeyguardRequest.DeriveAddressResult;
export type AccountInfo = KeyguardRequest.KeyInfoObject;
export type SignMessageRequest = KeyguardRequest.SignMessageRequest;
export type SignMessageResult = KeyguardRequest.SignMessageResult;
export type SignTransactionRequest = KeyguardRequest.SignTransactionRequest;
export type SignTransactionResult = KeyguardRequest.SignTransactionResult;
export type ImportRequest = KeyguardRequest.ImportRequest;
export type ImportResult = KeyguardRequest.ImportResult;

export type RpcResult = CreateResult
    | ImportResult
    | SignTransactionResult
    | SignMessageResult
    | DeriveAddressResult
    | SimpleRequest;
