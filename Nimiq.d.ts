declare namespace Nimiq {
    type Address = any
    const Address: any;

    const BufferUtils: any

    type KeyPair = any
    const KeyPair: any

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

    namespace Account  {
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
