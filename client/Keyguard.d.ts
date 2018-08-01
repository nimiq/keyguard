declare namespace Keyguard {
    interface KeyInfo {
        id: string;
        type: Key.Type;
        encrypted: boolean;
        userFriendlyId: string;
    }

    interface KeyRecord {
        id: string;
        type: Key.Type;
        encrypted: boolean;
        secret: Uint8Array;
    }

    namespace Key {
        enum Type {
            // todo replace by meaningful names
            'ONE',
            'TWO',
        }
    }

    // Deprecated, only used for migrating databases
    interface AccountInfo {
        userFriendlyAddress: string;
        type: string;
        label: string;
    }

    // Deprecated, only used for migrating databases
    type AccountEntry = AccountInfo & {
        encryptedKeyPair: Uint8Array;
    };

    type BASIC_TX = 'basic';
    type EXTENDED_TX = 'extended';

    interface BasicTransactionRequest {
        type: BASIC_TX;
        sender: string;
        senderLabel?: string;
        recipient: string;
        value: number;
        fee: number;
        network: string;
        validityStartHeight: number;
    }

    interface ExtendedTransactionRequest {
        type: EXTENDED_TX;
        sender: string;
        senderType?: Nimiq.Account.Type;
        senderLabel?: string;
        recipient: string;
        recipientType?: Nimiq.Account.Type;
        signer: string;
        signerLabel?: string;
        value: number;
        fee: number;
        network: string;
        validityStartHeight: number;
        extraData: string;
    }

    type TransactionRequest = BasicTransactionRequest | ExtendedTransactionRequest

    interface SignedTransactionResult {
        type: BASIC_TX | EXTENDED_TX;
        sender: string;
        senderType?: Nimiq.Account.Type;
        recipient: string;
        recipientType?: Nimiq.Account.Type;
        signerPubKey: Nimiq.SerialBuffer;
        value: number;
        fee: number;
        network: string;
        validityStartHeight: number;
        signature: Nimiq.SerialBuffer;
        extraData?: string;
        hash: string;
    }

    interface CreateRequest {}

    interface MessageRequest {
        message: string | Uint8Array;
        signer: string;
    }

    type Request = TransactionRequest | CreateRequest | MessageRequest;

    interface SignedMessageResult {
        message: string | Uint8Array;
        proof: Nimiq.SignatureProof;
    }

    interface RpcClientInstance {
        call(command: string, args?: any[]): Promise<any>;

        close(): void;
    }
}
