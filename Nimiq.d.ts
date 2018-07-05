declare namespace Nimiq {
    type Address = any
    const Address: any

    const BufferUtils: any

    type KeyPair = any
    const KeyPair: any

    type SerialBuffer = any
    const SerialBuffer: any

    /*type Signature = {
        create() : Signature
    }*/
    type Signature = any
    const Signature : any

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

    class Observable {
        on: (type: string, callback: Function) => number
        off: (type: string, id: number) => void
        fire: (type: string, ...args: any[]) => (Promise<any>|null)
    }

    type WasmHelper = any
    const WasmHelper: any

    type GenesisConfig = any
    const GenesisConfig: any
}
