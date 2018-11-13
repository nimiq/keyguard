export enum KeyguardCommand {
    CREATE = 'create',
    REMOVE = 'remove-key',
    IMPORT = 'import',
    EXPORT_WORDS = 'export-words',
    EXPORT_FILE = 'export-file',
    SIGN_TRANSACTION = 'sign-transaction',
    SIGN_MESSAGE = 'sign-message',
    DERIVE_ADDRESS = 'derive-address',

    // Iframe requests
    LIST = 'list',
    MIGRATE_ACCOUNTS_TO_KEYS = 'migrateAccountsToKeys',
    DERIVE_ADDRESSES = 'deriveAddresses',
    RELEASE_KEY = 'releaseKey',
}

declare namespace Key {
    type Type = 0 | 1;
}

export interface CreateRequest {
    appName: string;
    defaultKeyPath?: string;
}

export interface CreateResult {
    keyId: string;
    keyPath: string;
    address: Uint8Array;
}

export interface RemoveKeyRequest {
    appName: string;
    keyId: string;
    keyLabel?: string;
}

export interface RemoveKeyResult {
    success: boolean;
}

export interface ImportRequest {
    appName: string;
    defaultKeyPath: string;
    requestedKeyPaths: string[];
}

export interface ImportResult {
    keyId: string;
    keyType: Key.Type;
    addresses: Array<{keyPath: string, address: Uint8Array}>;
}

export interface ExportWordsRequest {
    appName: string;
    keyId: string;
    keyLabel?: string;
}

export interface ExportWordsResult {
    success: boolean;
}

export interface ExportFileRequest {
    appName: string;
    keyId: string;
    keyLabel?: string;
}

export interface ExportFileResult {
    success: boolean;
}

export interface SignTransactionRequest {
    layout?: 'standard' | 'checkout' | 'cashlink';
    shopOrigin?: string;
    appName: string;

    keyId: string;
    keyPath: string;
    keyLabel?: string;

    sender: Uint8Array;
    senderType?: Nimiq.Account.Type;
    senderLabel?: string;
    recipient: Uint8Array;
    recipientType?: Nimiq.Account.Type;
    recipientLabel?: string;
    value: number;
    fee: number;
    validityStartHeight: number;
    data?: Uint8Array;
    flags?: number;
    networkId?: number;
}

export interface SignTransactionResult {
    publicKey: Uint8Array;
    signature: Uint8Array;
}

export interface SignMessageRequest {
    appName: string;

    keyId: string;
    keyPath: string;

    keyLabel?: string;
    addressLabel?: string;
    message: string | Uint8Array;
}

export interface SignMessageResult {
    publicKey: Uint8Array;
    signature: Uint8Array;
}

export interface DeriveAddressRequest {
    appName: string;
    keyId: string;
    keyLabel?: string;
    baseKeyPath: string;
    indicesToDerive: string[];
}

export interface DeriveAddressResult {
    keyPath: string;
    address: Uint8Array;
}

export type RpcResult = CreateResult
    | ImportResult
    | SignTransactionResult
    | SignMessageResult
    | RemoveKeyResult
    | ExportFileResult
    | ExportWordsResult;

// Deprecated, only used for migrating databases
export interface AccountInfo {
    userFriendlyAddress: string;
    type: string;
    label: string;
}

export interface KeyInfoObject {
    id: string;
    type: Key.Type;
    encrypted: boolean;
    userFriendlyId?: string;
}
