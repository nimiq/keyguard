type KeyInfo = {
    userFriendlyAddress: string,
    type: EncryptionType
}

type KeyEntry = {
    encryptedKeyPair: Uint8Array,
    userFriendlyAddress: string,
    type: EncryptionType
}

// Deprecated, only used for migrating databases
type AccountInfo = {
    userFriendlyAddress: string,
    type: EncryptionType,
    label: string
}

// Deprecated, only used for migrating databases
type AccountEntry = {
    encryptedKeyPair: Uint8Array,
    userFriendlyAddress: string,
    type: string,
    label: string
}

type TxType = {
    BASIC: 'basic',
    EXTENDED: 'extended'
}

type BasicTransactionRequest = {
    type: TxType["BASIC"]
    sender: string
    recipient: string
    signer: string
    value: number
    fee: number
    network: string
    validityStartHeight: number
}

type ExtendedTransactionRequest = BasicTransactionRequest & {
   type: TxType["EXTENDED"]
   extraData: string
}

type TransactionRequest = BasicTransactionRequest | ExtendedTransactionRequest

interface Window { rpcServer: RpcServer; KeyStore: any }
