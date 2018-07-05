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

interface Window { rpcServer: any; KeyStore: any }
