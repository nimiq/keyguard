type KeyRecord = {
    id: string,
    type: Key.Type,
    encrypted: boolean,
    secret: Uint8Array
}

declare namespace Key {
    type Type = 0 | 1
}

// Deprecated, only used for migrating databases
type AccountInfo = {
    userFriendlyAddress: string,
    type: string
    label: string
}

// Deprecated, only used for migrating databases
type AccountRecord = AccountInfo & {
    encryptedKeyPair: Uint8Array
}

type SignTransactionRequest = {
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

type SignMessageRequest = {
    keyId: string
    keyPath: string
    keyLabel?: string

    message: string
}

type SignMessageResult = {
    message: string
    publicKey: string,
    signature: string
}

type CreateRequest = {
    defaultKeyPath: string
}

type ImportWordsRequest = {
    defaultKeyPath: string
}

type RemoveKeyRequest = {
    keyId: string
    keyLabel?: string
}

type KeyguardRequest = CreateRequest | ImportWordsRequest | RemoveKeyRequest | SignTransactionRequest | SignMessageRequest


interface Newable {
    new(...args: any[]): any;
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
