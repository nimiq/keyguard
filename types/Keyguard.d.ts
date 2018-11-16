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

type KeyRecord = {
    id: string
    type: Key.Type
    encrypted: boolean
    secret: Uint8Array
}
