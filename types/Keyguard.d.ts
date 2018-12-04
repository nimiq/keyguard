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
    type: Key.Type
    encrypted: boolean
    hasPin: boolean
    secret: Uint8Array
}
