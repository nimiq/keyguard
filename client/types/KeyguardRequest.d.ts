declare namespace KeyguardRequest {
    namespace Key {
        type Type = 1 | 2;
    }

    type KeyInfoObject = {
        id: number;
        type: Key.Type;
        hasPin: boolean;
    }

    type LegacyKeyInfoObject = KeyInfoObject & {
        legacyAccount: { label: string, address: Uint8Array };
    }

    type BasicRequest = {
        appName: string
    }

    type SimpleRequest = BasicRequest & {
        keyId: number
        keyLabel?: string
    }

    type SimpleResult = {
        success: boolean
    }

    type SignatureResult = {
        publicKey: Uint8Array
        signature: Uint8Array
    }

    type TransactionInfo = {
        sender: Uint8Array
        senderType: Nimiq.Account.Type
        recipient: Uint8Array
        value: number
        fee: number
        validityStartHeight: number
        recipientType?: Nimiq.Account.Type
        data?: Uint8Array
        flags?: number
    }

    type SignTransactionRequestLayout = 'standard' | 'checkout' | 'cashlink'

    type SignTransactionRequest = SimpleRequest & TransactionInfo & {
        layout?: SignTransactionRequestLayout
        shopOrigin?: string
        shopLogoUrl?: string

        keyPath: string

        senderLabel?: string
        recipientLabel?: string
    }

    type SignTransactionResult = SignatureResult;

    type SignMessageRequest = SimpleRequest & {
        keyPath: string
        message: Uint8Array
        signer: Uint8Array
        signerLabel?: string
    }

    type SignMessageResult = SignatureResult & {
        data: Uint8Array
    }

    type CreateRequest = BasicRequest & {
        defaultKeyPath: string;
    }

    type CreateResult = {
        keyId: number
        keyPath: string
        address: Uint8Array
    }

    type ImportRequest = BasicRequest & {
        defaultKeyPath: string;
        requestedKeyPaths: string[];
    }

    type ImportResult = {
        keyId: number;
        keyType: Key.Type;
        addresses: { keyPath: string, address: Uint8Array }[];
    }

    type DeriveAddressRequest = SimpleRequest & {
        baseKeyPath: string
        indicesToDerive: string[]
    }

    type DeriveAddressResult = {
        keyPath: string
        address: Uint8Array
    }

    type KeyguardRequest = CreateRequest
        | ImportRequest
        | SimpleRequest
        | SignTransactionRequest
        | DeriveAddressRequest
        | SignMessageRequest

    type KeyguardError = {
        Types: {
            // used for request parsing errors.
            INVALID_REQUEST: 'InvalidRequest',
            // used for errors thrown from core methods
            CORE: 'Core',
            // used for internal keyguard Errors.
            KEYGUARD: 'Keyguard',
            // used for the remaining Errors which are not assigned an own type just yet.
            UNCLASSIFIED: 'Unclassified',
        },
        Messages: {
            // specifically used to trigger a redirect to create after returning to caller
            GOTO_CREATE: 'GOTO_CREATE',
            // used to signal a user initiated cancelation of the request
            CANCELED: 'CANCELED',
            // used to signal that a given keyId no longer exist in KG, to be treated by caller.
            KEY_NOT_FOUND: 'keyId not found',
        },
    }
}

declare interface Window {
    __keyguardErrorContainer: {
        ErrorConstants: KeyguardRequest.KeyguardError,
    },
}
