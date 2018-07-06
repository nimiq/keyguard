declare namespace Nimiq {
    type Address = any
    const Address: any

    const BufferUtils: any

    class KeyPairClass {
        publicKey: PublicKey
        privateKey: PrivateKey
        isLocked: boolean
        generate() : KeyPairClass
        unserialize(buffer: SerialBuffer): KeyPairClass
        fromEncrypted(buffer: SerialBuffer, passphraseOrPin: Uint8Array): KeyPairClass
        exportEncrypted(passphrase: string | Uint8Array, unlockKey: string): SerialBuffer
        serialize(): SerialBuffer
        lock(key: string | Uint8Array): void
        relock(): KeyPairClass
        unlock(key: string | Uint8Array): void
        equals(object: any): boolean
    }

    const KeyPair: KeyPairClass

    type SerialBuffer = any
    const SerialBuffer: any

    interface Signature { }

    class SignatureClass {
        create(key1: any, key2: any, msg: Uint8Array) : Signature
    }

    const Signature : SignatureClass

    type Transaction = any
    const Transaction: any

    type BasicTransaction = Transaction & { }
    const BasicTransaction: any

    type ExtendedTransaction = Transaction & { }
    const ExtendedTransaction: any

    const Account: any

    type SignatureProof = any
    const SignatureProof: any

    type PublicKey = any
    const PublicKey: any

    type PrivateKey = any
    const PrivateKey: any

    namespace Account {
        type Type = 0 | 1 | 2
    }

    class PolicyClass {
        coinsToSatoshis: (coins: number) => number
        satoshisToCoins: (satoshis: number) => number
    }

    const Policy: PolicyClass

    class GenesisConfigClass {
        test: () => void
        NETWORK_NAME: string
    }

    const GenesisConfig: GenesisConfigClass

    class Observable {
        on: (type: string, callback: Function) => number
        off: (type: string, id: number) => void
        fire: (type: string, ...args: any[]) => (Promise<any>|null)
    }

    class WasmHelperClass {
        doImportBrowser: () => void
    }

    const WasmHelper: WasmHelperClass
}
