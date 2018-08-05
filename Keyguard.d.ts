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

    sender: string
    senderType: Nimiq.Account.Type
    senderLabel?: string
    recipient: string
    recipientType: Nimiq.Account.Type
    recipientLabel?: string
    value: number
    fee: number
    validityStartHeight: number
    data: string
    flags: number
    network: string
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
    publicKey: string,
    signature: string
}

type RemoveKeyRequest = {
    keyId: string
    keyLabel?: string
}

type CreateRequest = {
}

type SignMessageRequest = {
    keyId: string
    keyPath: string
    keyLabel?: string

    message: string
}

type KeyguardRequest = CreateRequest | SignTransactionRequest | SignMessageRequest

type SignMessageResult = {
    message: string
    publicKey: string,
    signature: string
}


interface Newable {
    new(...args: any[]): any;
}

type DOMEvent = Event & {
    target: Element
    data: any
}

interface Window {
    rpcServer: RpcServerInstance
    KeyStore: any
    TRANSLATIONS: dict
}

interface RpcServerInstance {}

interface RpcClientInstance {
    call(command: string, args?: any[]): Promise<any>
    close(): void
}
