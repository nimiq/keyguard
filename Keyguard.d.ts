type KeyInfo = {
    id: string,
    type: Key.Type,
    encrypted: boolean,
    userFriendlyId: string,
}

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
    type: string,
    label: string
}

// Deprecated, only used for migrating databases
type AccountEntry = AccountInfo & {
    encryptedKeyPair: Uint8Array
}

type BasicTransactionRequest = {
    type: BASIC_TX,
    sender: string
    senderType?: Nimiq.Account.Type
    senderLabel?: string
    recipient: string
    recipientType?: Nimiq.Account.Type
    signer: string
    signerLabel?: string
    value: number
    fee: number
    network: string
    validityStartHeight: number
    mockKeyType?: EncryptionType
}

type ExtendedTransactionRequest = {
    type: EXTENDED_TX,
    sender: string
    senderType?: Nimiq.Account.Type
    senderLabel?: string
    recipient: string
    recipientType?: Nimiq.Account.Type
    signer: string
    signerLabel?: string
    value: number
    fee: number
    network: string
    validityStartHeight: number
    mockKeyType?: EncryptionType
    extraData: string
}

type TransactionRequest = BasicTransactionRequest | ExtendedTransactionRequest

type SignedTransactionResult = {
    type: BASIC_TX | EXTENDED_TX
    sender: string
    senderType?: Nimiq.Account.Type
    recipient: string
    recipientType?: Nimiq.Account.Type
    signerPubKey: Nimiq.SerialBuffer
    value: number
    fee: number
    validityStartHeight: number,
    signature: Nimiq.SerialBuffer
    extraData?: string
    hash: string
}

type CreateRequest = {
}

type MessageRequest = {
    message: string | Uint8Array
    signer: string
}

type KeyguardRequest = TransactionRequest | CreateRequest | MessageRequest

type SignedMessageResult = {
    message: string | Uint8Array
    proof: Nimiq.SignatureProof
}

interface Window {
    rpcServer: RpcServerInstance
    KeyStore: any
    TRANSLATIONS: dict
}

interface Newable {
    new(...args: any[]): any;
}

type DOMEvent = Event & {
    target: Element
}

interface RpcServerInstance {}

interface RpcClientInstance {
    call(command: string, args?: any[]): Promise<any>
    close(): void
}
