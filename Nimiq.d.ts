declare namespace Nimiq {
    class AddressClass {
        fromString(str: string): AddressClass
        fromBase64(base64: string): AddressClass
        fromHex(hex: string): AddressClass
        toUserFriendlyAddress(): string
        fromUserFriendlyAddress(str: string): AddressClass
        equals(o: AddressClass): boolean
    }
    const Address: AddressClass

    class BufferUtilsClass {
        fromAscii(buf: string): Uint8Array
        fromHex(buf: string): Uint8Array
    }
    const BufferUtils: BufferUtilsClass

    class KeyPairClass {
        publicKey: PublicKeyClass
        privateKey: PrivateKey
        isLocked: boolean
        generate() : KeyPairClass
        unserialize(buffer: SerialBuffer): KeyPairClass
        fromEncrypted(buffer: SerialBuffer, passphraseOrPin: Uint8Array): KeyPairClass
        exportEncrypted(passphrase: string | Uint8Array, unlockKey?: Uint8Array): SerialBuffer
        serialize(): SerialBuffer
        lock(key: string | Uint8Array): void
        relock(): KeyPairClass
        unlock(key: string | Uint8Array): void
        equals(o: any): boolean
    }
    const KeyPair: KeyPairClass

    type SerialBuffer = any
    const SerialBuffer: any

    class SignatureClass {
        create(key1: any, key2: any, msg: Uint8Array) : SignatureClass
        serialize(): SerialBuffer
    }
    const Signature : SignatureClass

    type Transaction = any
    const Transaction: any

    type BasicTransaction = Transaction & { }
    const BasicTransaction: any

    type ExtendedTransaction = Transaction & { }
    const ExtendedTransaction: any

    const Account: any

    class SignatureProofClass {
        singleSig(publicKey: PublicKeyClass, signature: SignatureClass): SignatureProofClass
        unserialize(buf: SerialBuffer): SignatureProofClass
        serialize(): SerialBuffer
        verify(address: AddressClass | null, data: Uint8Array): boolean
        verifyTransaction(transaction: Transaction): boolean
        publicKey: PublicKeyClass
        signature: SignatureClass
    }
    const SignatureProof: SignatureProofClass

    class PublicKeyClass {
        serialize(): SerialBuffer
        toAddress(): AddressClass
    }
    const PublicKey: PublicKeyClass

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
