type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

type KeyId2KeyInfo<T extends { keyId: string }> = Omit<T, 'keyId'> & { keyInfo: KeyInfo }

interface TransactionInfo {
    sender: Uint8Array
    senderType: Nimiq.Account.Type
    recipient: Uint8Array
    recipientType: Nimiq.Account.Type
    value: number
    fee: number
    validityStartHeight: number
    data?: Uint8Array
    flags?: number
    networkId?: number
} 

type ConstructTransaction<T extends TransactionInfo> = Omit<T,
    'sender' | 'senderType' | 'recipient' | 'recipientType' | 'value' | 'fee' |
        'validityStartHeight' | 'data' | 'flags' | 'networkId'
> & { transaction: Nimiq.ExtendedTransaction }

type SignTransactionRequestLayout = 'standard' | 'checkout' | 'cashlink'

interface SignTransactionRequest extends TransactionInfo {
    layout?: SignTransactionRequestLayout
    shopOrigin?: string
    appName: string

    keyId: string
    keyPath: string
    keyLabel?: string

    senderLabel?: string
    recipientLabel?: string
}

type ParsedSignTransactionRequest = ConstructTransaction<KeyId2KeyInfo<SignTransactionRequest>>
    & { layout: SignTransactionRequestLayout }

interface KeyRecord {
    id: string
    type: Key.Type
    encrypted: boolean
    secret: Uint8Array
}

declare namespace Key {
    type Type = 0 | 1
}

// Deprecated, only used for migrating databases
type AccountInfo = {
    userFriendlyAddress: string
    type: string
    label: string
}

// Deprecated, only used for migrating databases
type AccountRecord = AccountInfo & {
    encryptedKeyPair: Uint8Array
}

type KeyInfoObject = {
    id: string
    type: Key.Type
    encrypted: boolean
    userFriendlyId?: string
}

type SignTransactionResult = {
    publicKey: Uint8Array
    signature: Uint8Array
}

type ExportWordsRequest = {
    appName: string
    keyId: string
    keyLabel?: string
}

type ExportWordsResult = {
    success: boolean
}

type ParsedExportWordsRequest = {
    appName: string;
    keyInfo: KeyInfo;
    keyLabel?: string;
}

type ExportFileRequest = {
    appName: string
    keyId: string
    keyLabel?: string
}

type ParsedExportFileRequest = {
    appName: string;
    keyInfo: KeyInfo;
    keyLabel?: string;
}

type ExportFileResult = {
    success: boolean
}

type SignMessageRequest = {
    appName: string

    keyId: string
    keyPath: string

    keyLabel?: string
    addressLabel?: string
    message: string | Uint8Array
}

type ParsedSignMessageRequest = {
    appName: string

    keyInfo: KeyInfo
    keyPath: string

    keyLabel?: string
    addressLabel?: string
    message: Uint8Array
}

type SignMessageResult = {
    publicKey: Uint8Array
    signature: Uint8Array
}

type CreateRequest = {
    appName: string;
    defaultKeyPath: string;
}

type CreateResult = {
    keyId: string
    keyPath: string
    address: Uint8Array
}

type ImportRequest = {
    appName: string;
    defaultKeyPath: string;
    requestedKeyPaths: string[];
}

type ImportResult = {
    keyId: string;
    keyType: Key.Type;
    addresses: {keyPath: string, address: Uint8Array}[];
}

type RemoveKeyRequest = {
    appName: string
    keyId: string
    keyLabel?: string
}

type ParsedRemoveKeyRequest = {
    appName: string;
    keyInfo: KeyInfo;
    keyLabel?: string;
}

type RemoveKeyResult = {
    success: boolean
}

type KeyguardRequest = CreateRequest
    | ImportRequest
    | RemoveKeyRequest
    | SignTransactionRequest
    | SignMessageRequest
    | ExportWordsRequest
    | ExportFileRequest