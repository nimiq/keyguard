type KeyRecord = {
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

type SignTransactionRequest = {
    layout?: 'standard' | 'checkout' | 'cashlink'
    shopOrigin?: string
    appName: string

    keyId: string
    keyPath: string
    keyLabel?: string

    sender: Uint8Array
    senderType: Nimiq.Account.Type
    senderLabel?: string
    recipient: Uint8Array
    recipientType: Nimiq.Account.Type
    recipientLabel?: string
    value: number
    fee: number
    validityStartHeight: number
    data: Uint8Array
    flags: number
    networkId: number
}

type ParsedSignTransactionRequest = {
    layout: 'standard' | 'checkout' | 'cashlink'
    shopOrigin?: string
    appName: string

    keyInfo: KeyInfo
    keyPath: string
    transaction: Nimiq.ExtendedTransaction

    keyLabel?: string
    senderLabel?: string
    recipientLabel?: string
}

type SignTransactionResult = {
    publicKey: Uint8Array
    signature: Uint8Array
}

type ExportWordsRequest = {
    keyId: string
    keyLabel?: string
}

type SignMessageRequest = {
    keyId: string
    keyPath: string
    keyLabel?: string

    message: string
}

type SignMessageResult = {
    message: string
    publicKey: string
    signature: string
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
}

type ImportResult = {
    keyId: string;
    addresses: {keyPath: string, address: Uint8Array}[]
}

type RemoveKeyRequest = {
    keyId: string
    keyLabel?: string
}

type KeyguardRequest = CreateRequest | ImportRequest | RemoveKeyRequest | SignTransactionRequest | SignMessageRequest

interface Newable {
    new(...args: any[]): any
}

type DOMEvent = Event & {
    target: Element
    data: any
}

interface Window {
    rpcServer: Rpc.RpcServer
    KeyStore: any
    TRANSLATIONS: dict
}
