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

declare namespace Key {
    type Type = 0 | 1
}

type AccountType = string

declare namespace AccountType {
    type HIGH = 'high'
    type LOW = 'low'
}

// Deprecated, only used for migrating databases
type AccountInfo = {
    userFriendlyAddress: string
    type: AccountType
    label: string
}

// Deprecated, only used for migrating databases
type AccountRecord = AccountInfo & {
    encryptedKeyPair: Uint8Array
}

type KeyRecord = {
    id: string
    type: Nimiq.Secret.Type
    encrypted: boolean
    hasPin: boolean
    secret: Uint8Array
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
type Transform<T, K extends keyof T, E> = Omit<T, K> & E
type KeyId2KeyInfo<T extends { keyId: string }> = Transform<T, 'keyId', { keyInfo: KeyInfo }>
type ConstructTransaction<T extends KeyguardRequest.TransactionInfo> = Transform<T,
    'sender' | 'senderType' | 'recipient' | 'recipientType' | 'value' | 'fee' |
    'validityStartHeight' | 'data' | 'flags',
    { transaction: Nimiq.ExtendedTransaction }>

type ParsedSimpleRequest = KeyId2KeyInfo<KeyguardRequest.SimpleRequest>
type ParsedSignTransactionRequest = ConstructTransaction<Transform<KeyId2KeyInfo<KeyguardRequest.SignTransactionRequest>, 'shopLogoUrl',{ shopLogoUrl?: URL }>>
& { layout: KeyguardRequest.SignTransactionRequestLayout }
type ParsedSignMessageRequest = Transform<KeyId2KeyInfo<KeyguardRequest.SignMessageRequest>,
    'signer', { signer: Nimiq.Address }>
type ParsedDeriveAddressRequest = KeyId2KeyInfo<KeyguardRequest.DeriveAddressRequest>
