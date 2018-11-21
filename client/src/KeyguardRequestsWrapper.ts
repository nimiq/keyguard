export type CreateRequest = KeyguardRequests.CreateRequest;
export type CreateResult = KeyguardRequests.CreateResult;
export type SimpleRequest = KeyguardRequests.SimpleRequest;
export type SimpleResult = KeyguardRequests.SimpleResult;
export type DeriveAddressRequest = KeyguardRequests.DeriveAddressRequest;
export type DeriveAddressResult = KeyguardRequests.DeriveAddressResult;
export type AccountInfo = KeyguardRequests.KeyInfoObject;
export type SignMessageRequest = KeyguardRequests.SignMessageRequest;
export type SignMessageResult = KeyguardRequests.SignMessageResult;
export type SignTransactionRequest = KeyguardRequests.SignTransactionRequest;
export type SignTransactionResult = KeyguardRequests.SignTransactionResult;
export type ImportRequest = KeyguardRequests.ImportRequest;
export type ImportResult = KeyguardRequests.ImportResult;

export type RpcResult = CreateResult
    | ImportResult
    | SignTransactionResult
    | SignMessageResult
    | DeriveAddressResult
    | SimpleRequest;
