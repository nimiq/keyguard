declare namespace Nimiq {
    class Address {
        fromString(str: string): Address
        fromBase64(base64: string): Address
        fromHex(hex: string): Address
        toUserFriendlyAddress(): string
        static fromUserFriendlyAddress(str: string): Address
        equals(o: Address): boolean
    }

    class BufferUtils {
        static fromAscii(buf: string): Uint8Array
        static fromHex(buf: string): Uint8Array
    }

    class KeyPair {
        publicKey: PublicKey
        privateKey: PrivateKey
        isLocked: boolean
        generate(): KeyPair
        static unserialize(buffer: SerialBuffer): KeyPair
        static fromEncrypted(buffer: SerialBuffer, passphraseOrPin: Uint8Array): KeyPair
        exportEncrypted(passphrase: string | Uint8Array, unlockKey?: Uint8Array): SerialBuffer
        serialize(): SerialBuffer
        lock(key: string | Uint8Array): void
        relock(): KeyPair
        unlock(key: string | Uint8Array): void
        equals(o: any): boolean
    }

    type SerialBuffer = any
    const SerialBuffer: any

    interface Signature {
        create(key1: any, key2: any, msg: Uint8Array): Signature
        serialize(): SerialBuffer
    }
    const Signature: Signature

    class Transaction {
        proof: SerialBuffer
        sender: Address
        senderType: number
        recipient: Address
        recipientType: number
        value: number
        fee: number
        data: Uint8Array
        validityStartHeight: number
        hash(): Hash
        serializeContent(): SerialBuffer
        verify(): boolean
        static Flag: any
    }

    class BasicTransaction extends Transaction {
        constructor(
            publicKey: PublicKey,
            recipient: Address,
            value: number,
            fee: number,
            validityStartHeight: number
        )
    }

    class ExtendedTransaction extends Transaction {
        constructor(
            sender: Address,
            senderType: number,
            recipient: Address,
            recipientType: number,
            value: number,
            fee: number,
            validityStartHeight: number,
            flags: number,
            data: Uint8Array
        )
    }

    type Hash = any
    const Hash: any

    class SignatureProof {
        static singleSig(publicKey: PublicKey, signature: Signature): SignatureProof
        static unserialize(buf: SerialBuffer): SignatureProof
        serialize(): SerialBuffer
        verify(address: Address | null, data: Uint8Array): boolean
        static verifyTransaction(transaction: Transaction): boolean
        publicKey: PublicKey
        signature: Signature
    }

    class PublicKey {
        serialize(): SerialBuffer
        toAddress(): Address
    }

    type PrivateKey = any
    const PrivateKey: any

    namespace Account {
        type Type = 0 | 1 | 2
    }
    const Account: any

    class Policy {
        static coinsToSatoshis(coins: number): number
        static satoshisToCoins(satoshis: number): number
    }

    class GenesisConfig {
        static test(): void
        static NETWORK_NAME: string
    }

    class Observable {
        on(type: string, callback: Function): number
        off(type: string, id: number): void
        fire(type: string, ...args: any[]): (Promise<any>|null)
    }

    class WasmHelper {
        static doImportBrowser: () => void
    }
}
