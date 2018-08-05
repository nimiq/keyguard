declare namespace Keyguard {
    interface KeyInfo {
        id: string,
        type: KeyType,
        encrypted: boolean,
        userFriendlyId: string,
        _id: string,
        _type: KeyType,
        _encrypted: boolean,
    }

    interface KeyRecord {
        id: string;
        type: KeyType;
        encrypted: boolean;
        secret: Uint8Array;
    }

    enum KeyType {
        LEGACY = 0,
        BIP39 = 1
    }

    // Deprecated, only used for migrating databases
    interface AccountInfo {
        userFriendlyAddress: string;
        type: string;
        label: string;
    }

    // Deprecated, only used for migrating databases
    type AccountRecord = AccountInfo & {
        encryptedKeyPair: Uint8Array;
    };

    type SignTransactionRequest = {
        keyId: string
        keyPath: string
        keyLabel?: string

        sender: string
        senderType: Nimiq.Account.Type
        senderLabel?: string
        recipient: string
        recipientType: Nimiq.Account.Type
        recipientLabel?: string
        value: number
        fee: number
        validityStartHeight: number
        data: string
        flags: number
        network: string
    }

    type CreateRequest = {}

    type SignMessageRequest = {
        keyId: string
        keyPath: string
        keyLabel?: string

        message: string
    }

    type Request = CreateRequest | SignTransactionRequest | SignMessageRequest

    type SignTransactionResult = {
        publicKey: string,
        signature: string
    }

    type SignMessageResult = {
        message: string
        publicKey: string,
        signature: string
    }

    // todo remove after moving after moving rpc client to own package
    interface RpcClientInstance {
        call(command: string, args?: any[]): Promise<any>;

        close(): void;
    }
}

