declare namespace Nimiq {
    type Address = any
    const Address: any;

    const BufferUtils: any;

    type KeyPair = any
    const KeyPair: any

    type SerialBuffer = any
    const SerialBuffer: any;

    interface Signature { }

    class SignatureClass {
        create(key1: any, key2: any, msg: Uint8Array) : Signature
    }

    const Signature : SignatureClass;

    type Transaction = any
    const Transaction: any;

    type BasicTransaction = Transaction & { }
    const BasicTransaction: any;

    type ExtendedTransaction = Transaction & { }
    const ExtendedTransaction: any;

    const Account: any;

    type SignatureProof = any
    const SignatureProof: any;

    type PublicKey = any
    const PublicKey: any;

    type Observable = any
    const Observable: any;

    namespace Account  {
        type Type = 0 | 1 | 2
    }

    class PolicyClass {
        coinsToSatoshis: (coins: number) => number;
        SATOSHIS: number;
        SATOSHIS_PER_COIN: number
    }

    const Policy: PolicyClass;

    class GenesisConfigClass {
        test: () => void
        NETWORK_NAME: string
    }

    const GenesisConfig: GenesisConfigClass;
}

interface Window { rpcServer: any; }
