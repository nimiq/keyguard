declare namespace KeyguardRequests {
    type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

    type Transform<T, K extends keyof T, E> = Omit<T, K> & E

    namespace Key {
        type Type = 0 | 1;
    }

    type KeyInfoObject = {
        id: string;
        type: Key.Type;
        encrypted: boolean;
        userFriendlyId?: string;
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

    type TransactionInfo = {
        sender: Uint8Array
        senderType: Nimiq.Account.Type
        recipient: Uint8Array
        recipientType: Nimiq.Account.Type
        value: number
        fee: number
        validityStartHeight: number
        data?: Uint8Array
        flags?: number
        networkId?: number
    }

    type ConstructTransaction<T extends TransactionInfo> = Transform<T,
        'sender' | 'senderType' | 'recipient' | 'recipientType' | 'value' | 'fee' |
        'validityStartHeight' | 'data' | 'flags' | 'networkId',
        { transaction: Nimiq.ExtendedTransaction }>

    type SignTransactionRequestLayout = 'standard' | 'checkout' | 'cashlink'

    type SignTransactionRequest = SimpleRequest & TransactionInfo & {
        layout?: SignTransactionRequestLayout
        shopOrigin?: string

        keyPath: string

        senderLabel?: string
        recipientLabel?: string
    }

    type ParsedSignTransactionRequest = ConstructTransaction<KeyId2KeyInfo<SignTransactionRequest>>
        & { layout: SignTransactionRequestLayout }

    type SignTransactionResult = {
        publicKey: Uint8Array
        signature: Uint8Array
    }

    type SignMessageRequest = SimpleRequest & {
        keyPath: string

        addressLabel?: string
        message: string | Uint8Array
    }

    type ParsedSignMessageRequest = Transform<KeyId2KeyInfo<SignMessageRequest>, 'message', { message: Uint8Array }>

    type SignMessageResult = {
        publicKey: Uint8Array
        signature: Uint8Array
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
}