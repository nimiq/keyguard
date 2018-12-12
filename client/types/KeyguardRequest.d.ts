declare namespace KeyguardRequest {
    type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

    type Transform<T, K extends keyof T, E> = Omit<T, K> & E

    namespace Key {
        type Type = 0 | 1;
    }

    type KeyInfoObject = {
        id: string;
        type: Key.Type;
        encrypted: boolean;
        hasPin: boolean;
    }

    type LegacyKeyInfoObject = KeyInfoObject & {
        legacyAccount: { label: string, address: Uint8Array };
    }

    type KeyId2KeyInfo<T extends { keyId: string }> = Transform<T, 'keyId', { keyInfo: KeyInfoObject }>

    type BasicRequest = {
        appName: string
    }

    type SimpleRequest = BasicRequest & {
        keyId: string
        keyLabel?: string
    }

    type ParsedSimpleRequest = KeyId2KeyInfo<SimpleRequest>

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

    type ConstructTransaction<T extends TransactionInfo> = Transform<T,
        'sender' | 'senderType' | 'recipient' | 'recipientType' | 'value' | 'fee' |
        'validityStartHeight' | 'data' | 'flags',
        { transaction: Nimiq.ExtendedTransaction }>

    type SignTransactionRequestLayout = 'standard' | 'checkout' | 'cashlink'

    type SignTransactionRequest = SimpleRequest & TransactionInfo & {
        layout?: SignTransactionRequestLayout
        shopOrigin?: string
        shopLogoUrl?: string

        keyPath: string

        senderLabel?: string
        accountBalance?: number
        recipientLabel?: string
    }

    type ParsedSignTransactionRequest = ConstructTransaction<Transform<KeyId2KeyInfo<SignTransactionRequest>, 'shopLogoUrl',{ shopLogoUrl?: URL }>>
        & { layout: SignTransactionRequestLayout }

    type SignTransactionResult = SignatureResult;

    type SignMessageRequest = SimpleRequest & {
        keyPath: string
        message: Uint8Array
        signer: Uint8Array
        signerLabel?: string
    }

    type ParsedSignMessageRequest = Transform<KeyId2KeyInfo<SignMessageRequest>, 'signer', { signer: Nimiq.Address }>

    type SignMessageResult = SignatureResult & {
        data: Uint8Array
    }

    type CreateRequest = BasicRequest & {
        defaultKeyPath: string;
    }

    type CreateResult = {
        keyId: string
        keyPath: string
        address: Uint8Array
    }

    type ImportRequest = BasicRequest & {
        defaultKeyPath: string;
        requestedKeyPaths: string[];
    }

    type ImportResult = {
        keyId: string;
        keyType: Key.Type;
        addresses: { keyPath: string, address: Uint8Array }[];
    }

    type DeriveAddressRequest = SimpleRequest & {
        baseKeyPath: string
        indicesToDerive: string[]
    }

    type ParsedDeriveAddressRequest = KeyId2KeyInfo<DeriveAddressRequest>

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
