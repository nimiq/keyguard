type KeyInfo = {
    userFriendlyAddress: string,
    type: EncryptionType
}

type KeyEntry = KeyInfo & {
    encryptedKeyPair: Uint8Array
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
    type: TransactionType.BASIC
    sender: string
    recipient: string
    signer: string
    value: number
    fee: number
    network: string
    validityStartHeight: number
}

type SignedTransactionResult = {
    sender: string,
    senderPubKey: Nimiq.SerialBuffer,
    recipient: string,
    value: number,
    fee: number,
    validityStartHeight: number,
    signature: Nimiq.SerialBuffer,
    extraData: string,
    hash: string
}

type ExtendedTransactionRequest = BasicTransactionRequest & {
   type: TransactionType.EXTENDED
   extraData: string
}

type TransactionRequest = BasicTransactionRequest | ExtendedTransactionRequest

type CreateRequest = {
    type: EncryptionType
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
