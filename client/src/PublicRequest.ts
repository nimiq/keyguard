import * as Nimiq from '@nimiq/core-web';
import { KeyguardCommand } from './KeyguardCommand';

export type ObjectType = {
    [key: string]: any;
};

// Returns B if T and B have same keys. Ignores modifiers (readonly, optional)
export type Is<T, B> = keyof T extends keyof B ? keyof B extends keyof T ? B : never : never;

// Base types for Requests
export type BasicRequest = {
    appName: string,
};

export type SingleKeyResult = {
    keyId: string;
    keyType: Nimiq.Secret.Type;
    addresses: Array<{
        keyPath: string,
        address: Uint8Array,
    }>;
    fileExported: boolean;
    wordsExported: boolean;
};

export type TransactionInfo = {
    sender: Uint8Array
    senderType: Nimiq.Account.Type
    recipient: Uint8Array
    value: number
    fee: number
    validityStartHeight: number
    recipientType?: Nimiq.Account.Type
    data?: Uint8Array
    flags?: number,
};

export type SignTransactionRequestLayout = 'standard' | 'checkout' | 'cashlink';

// Specific Requests

export type CreateRequest = BasicRequest & {
    defaultKeyPath: string,
    enableBackArrow?: boolean,
 };

export type DeriveAddressRequest = SimpleRequest & {
    baseKeyPath: string
    indicesToDerive: string[],
};

export type DeriveAddressesRequest = {
    keyId: string,
    paths: string[],
};

export type EmptyRequest = null;

export type ImportRequest = BasicRequest & {
    requestedKeyPaths: string[],
    isKeyLost?: boolean,
    enableBackArrow?: boolean,
};

export type ReleaseKeyRequest = {
    keyId: string,
    shouldBeRemoved: boolean,
};

export type RemoveKeyRequest = BasicRequest & {
    keyId: string,
    keyLabel: string,
};

export type SignatureResult = {
    publicKey: Uint8Array,
    signature: Uint8Array,
};

export type SimpleRequest = BasicRequest & {
    keyId: string,
    keyLabel?: string,
};

export type ExportRequest = SimpleRequest & {
    fileOnly?: boolean,
    wordsOnly?: boolean,
};

export type ExportResult = {
    fileExported: boolean,
    wordsExported: boolean,
};

export type SignTransactionRequest = SimpleRequest & TransactionInfo & {
    keyPath: string,
    layout?: SignTransactionRequestLayout,
    recipientLabel?: string,
    senderLabel?: string,
    shopOrigin?: string,
    shopLogoUrl?: string,
    cashlinkMessage?: string,
};

export type SignMessageRequest = SimpleRequest & {
    keyPath: string,
    message: Uint8Array | string,
    // `signer` is the address, because Keyguard would otherwise only be able to display it after decryption.
    // The Keyguard validates that the `keyPath` generates this address, before signing the message.
    signer: Uint8Array,
    signerLabel: string,
};

// Request unions

export type RedirectRequest = CreateRequest
    | ImportRequest
    | ExportRequest
    | SimpleRequest
    | SignTransactionRequest
    | SignMessageRequest
    | DeriveAddressRequest
    | RemoveKeyRequest;

export type IFrameRequest = EmptyRequest | DeriveAddressesRequest | ReleaseKeyRequest;

export type Request = RedirectRequest | IFrameRequest;

// Base types for Results

export type KeyInfoObject = {
    id: string;
    type: Nimiq.Secret.Type;
    hasPin: boolean;
};

export type LegacyKeyInfoObject = KeyInfoObject & {
    legacyAccount: {
        label: string,
        address: Uint8Array,
    };
};

// Specific Results

export type DerivedAddress = {
    address: Uint8Array,
    keyPath: string,
};
export type KeyResult = SingleKeyResult[];
export type ListResult = KeyInfoObject[];
export type ListLegacyResult = LegacyKeyInfoObject[];
export type SignTransactionResult = SignatureResult;
export type SimpleResult = { success: boolean };

// Result unions

export type IFrameResult = ListResult
    | ListLegacyResult
    | DerivedAddress[]
    | SimpleResult;

export type RedirectResult = KeyResult
    | SignTransactionResult
    | DerivedAddress[]
    | SimpleResult;

export type Result = RedirectResult | IFrameResult;

// Derived Result types

export type ResultType<T extends RedirectRequest> =
    T extends Is<T, SignMessageRequest> | Is<T, SignTransactionRequest> ? SignatureResult :
    T extends Is<T, DeriveAddressRequest> ? DerivedAddress[] :
    T extends Is<T, CreateRequest> | Is<T, ImportRequest> ? KeyResult :
    T extends Is<T, ExportRequest> ? ExportResult :
    T extends Is<T, RemoveKeyRequest> | Is<T, SimpleRequest> ? SimpleResult : never;

export type ResultByCommand<T extends KeyguardCommand> =
    T extends KeyguardCommand.SIGN_MESSAGE | KeyguardCommand.SIGN_TRANSACTION ? SignatureResult :
    T extends KeyguardCommand.DERIVE_ADDRESS ? DerivedAddress[] :
    T extends KeyguardCommand.CREATE | KeyguardCommand.IMPORT ? KeyResult :
    T extends KeyguardCommand.EXPORT ? ExportResult :
    T extends KeyguardCommand.REMOVE ? SimpleResult : never;

// Error constants

export type KeyguardError = {
    Types: {
        // used for request parsing errors.
        INVALID_REQUEST: 'InvalidRequest',
        // used for errors thrown from core methods
        CORE: 'Core',
        // used for internal keyguard Errors.
        KEYGUARD: 'Keyguard',
        // used for the remaining Errors which are not assigned an own type just yet.
        UNCLASSIFIED: 'Unclassified',
    },
    Messages: {
        // specifically used to trigger a redirect to create after returning to caller
        GOTO_CREATE: 'GOTO_CREATE',
        // used to signal a user initiated cancelation of the request
        CANCELED: 'CANCELED',
        // used to signal that a given keyId no longer exist in KG, to be treated by caller.
        KEY_NOT_FOUND: 'keyId not found',
        // network name does not exist
        INVALID_NETWORK_CONFIG: 'Invalid network config',
    },
};
