interface Newable {
    new(...args: any[]): any
}

interface Event {
    readonly data: any
}

interface Window {
    rpcServer: RpcServer
    KeyStore: any
    TRANSLATIONS: dict
    NIMIQ_IQONS_SVG_PATH?: string
}

type AccountType = string

declare namespace AccountType {
    type HIGH = 'high'
    type LOW = 'low'
}

// Deprecated, only used for migrating databases
type AccountInfo = {
    userFriendlyAddress: string
    type: AccountType
    label: string
}

// Deprecated, only used for migrating databases
type AccountRecord = AccountInfo & {
    encryptedKeyPair: Uint8Array
}

type EncryptionKeyParams = {
    kdf: string
    iterations: number
    keySize: number
}

type RsaKeyPairExport = {
    privateKey: Uint8Array
    publicKey: Uint8Array
    keyParams: EncryptionKeyParams
}

type KeyRecord = {
    id: string
    type: Nimiq.Secret.Type
    hasPin: boolean
    secret: Uint8Array
    defaultAddress: Uint8Array
    rsaKeyPair?: RsaKeyPairExport
}

type MultisigConfig = {
    publicKeys: Nimiq.PublicKey[]
    numberOfSigners: number
    signerPublicKeys: Nimiq.PublicKey[]
    secret: {
        aggregatedSecret: Nimiq.RandomSecret
    } | {
        encryptedSecrets: Uint8Array[]
        bScalar: Uint8Array
        keyParams: EncryptionKeyParams
    }
    aggregatedCommitment: Nimiq.Commitment
    userName?: string
}

type ParsedBitcoinTransactionInput = {
    hash: string,
    index: number,
    witnessUtxo: {
        script: Uint8Array,
        value: number,
    },
    redeemScript?: Uint8Array,
    witnessScript?: Uint8Array,
    sequence?: number,
    type: 'standard' | 'htlc-redeem' | 'htlc-refund',
    keyPath: string,
    address: string,
};

interface PolygonUsdcApproval {
    readonly approval: ethers.BigNumber, // amount to be approved
    readonly sigR: string,
    readonly sigS: string,
    readonly sigV: ethers.BigNumber,
}

interface PolygonTransferArgs extends ReadonlyArray<any> {
    readonly token: string,
    readonly amount: ethers.BigNumber,
    readonly target: string,
    readonly fee: ethers.BigNumber,
}

type PolygonTransferDescription = ethers.utils.TransactionDescription & {
    readonly name: 'transfer',
    readonly args: PolygonTransferArgs,
};

interface PolygonTransferWithApprovalArgs extends PolygonTransferArgs, PolygonUsdcApproval {}

type PolygonTransferWithApprovalDescription = ethers.utils.TransactionDescription & {
    readonly name: 'transferWithApproval',
    readonly args: PolygonTransferWithApprovalArgs,
};

interface PolygonOpenArgs extends ReadonlyArray<any> {
    readonly id: string,
    readonly token: string,
    readonly amount: ethers.BigNumber,
    readonly refundAddress: string,
    readonly recipientAddress: string,
    readonly hash: string,
    readonly timeout: ethers.BigNumber,
    readonly fee: ethers.BigNumber,
}

type PolygonOpenDescription = ethers.utils.TransactionDescription & {
    readonly name: 'open',
    readonly args: PolygonOpenArgs,
};

interface PolygonOpenWithApprovalArgs extends PolygonOpenArgs, PolygonUsdcApproval {}

type PolygonOpenWithApprovalDescription = ethers.utils.TransactionDescription & {
    readonly name: 'openWithApproval',
    readonly args: PolygonOpenWithApprovalArgs,
};

interface PolygonRedeemArgs extends ReadonlyArray<any> {
    readonly id: string,
    readonly target: string,
    readonly secret: string,
    readonly fee: ethers.BigNumber,
}

type PolygonRedeemDescription = ethers.utils.TransactionDescription & {
    readonly name: 'redeem',
    readonly args: PolygonRedeemArgs,
};

interface PolygonRedeemWithSecretInDataArgs extends ReadonlyArray<any> {
    readonly id: string,
    readonly target: string,
    readonly fee: ethers.BigNumber,
}

type PolygonRedeemWithSecretInDataDescription = ethers.utils.TransactionDescription & {
    readonly name: 'redeemWithSecretInData',
    readonly args: PolygonRedeemWithSecretInDataArgs,
};

interface PolygonRefundArgs extends ReadonlyArray<any> {
    readonly id: string,
    readonly target: string,
    readonly fee: ethers.BigNumber,
}

type PolygonRefundDescription = ethers.utils.TransactionDescription & {
    readonly name: 'refund',
    readonly args: PolygonRefundArgs,
};

type NimHtlcContents = {
    refundAddress: string,
    redeemAddress: string,
    hash: string,
    timeoutBlockHeight: number,
};

type BtcHtlcContents = {
    refundAddress: string,
    redeemAddress: string,
    hash: string,
    timeoutTimestamp: number,
};

type EurHtlcContents = {
    hash: string,
    timeoutTimestamp: number,
};

type Transform<T, K extends keyof T, E> = Omit<T, K> & E;

type KeyId2KeyInfo<T extends { keyId: string }> = Transform<T, 'keyId', { keyInfo: KeyInfo }>
type ConstructTransaction<T extends KeyguardRequest.TransactionInfo> = Transform<T,
    'sender' | 'senderType' | 'recipient' | 'recipientType' | 'value' | 'fee' |
    'validityStartHeight' | 'data' | 'flags',
    { transaction: Nimiq.ExtendedTransaction }>

type ConstructMultisigTransaction<T extends KeyguardRequest.TransactionInfo & {
    multisigConfig: KeyguardRequest.MultisigConfig,
}> = ConstructTransaction<Transform<T, 'multisigConfig', { multisigConfig: MultisigConfig }>>;

type ConstructSwap<T extends KeyguardRequest.SignSwapRequestCommon> = Transform<T,
    'fund' | 'redeem', {
        fund: {
            type: 'NIM',
            keyPath: string,
            transaction: Nimiq.ExtendedTransaction,
            senderLabel: string,
        } | {
            type: 'BTC',
            inputs: ParsedBitcoinTransactionInput[],
            recipientOutput: { // Cannot parse an output with most of it's required properties missing
                value: number,
            },
            changeOutput?: KeyguardRequest.BitcoinTransactionChangeOutput,
            locktime?: number;
            refundKeyPath: string,
            refundAddress: string,
        } | Transform<KeyguardRequest.PolygonTransactionInfo, 'amount', {
            type: 'USDC',
            description: PolygonOpenDescription | PolygonOpenWithApprovalDescription,
        }> | {
            type: 'EUR',
            amount: number,
            fee: number,
            bankLabel?: string,
            // bankLogoUrl?: string,
            // bankColor?: string,
        },
        redeem: {
            type: 'NIM',
            keyPath: string,
            transaction: Nimiq.ExtendedTransaction,
            recipientLabel: string,
        } | {
            type: 'BTC',
            input: { // Cannot parse an input with most of it's required properties missing
                witnessUtxo: {
                    value: number,
                },
                keyPath: string,
            },
            output: KeyguardRequest.BitcoinTransactionChangeOutput,
        } | Transform<KeyguardRequest.PolygonTransactionInfo, 'amount' | 'approval', {
            type: 'USDC',
            description: PolygonRedeemDescription | PolygonRedeemWithSecretInDataDescription,
            amount: number,
        }> | {
            type: 'EUR',
            keyPath: string,
            // A SettlementInstruction contains a `type`, so cannot be in the
            // root of the object (it conflicts with the 'EUR' type).
            settlement: Omit<KeyguardRequest.MockSettlementInstruction, 'contractId'> | Omit<KeyguardRequest.SepaSettlementInstruction, 'contractId'>,
            amount: number,
            fee: number,
            bankLabel?: string,
            // bankLogoUrl?: string,
            // bankColor?: string,
        },
    }>

type Is<T, B> = KeyguardRequest.Is<T, B>;

type Parsed<T extends KeyguardRequest.Request> =
    T extends Is<T, KeyguardRequest.SignTransactionRequestStandard> ?
        ConstructTransaction<KeyId2KeyInfo<KeyguardRequest.SignTransactionRequestStandard>>
        & { layout: KeyguardRequest.SignTransactionRequestLayout } :
    T extends Is<T, KeyguardRequest.SignTransactionRequestCheckout> ?
        Transform<
            ConstructTransaction<KeyId2KeyInfo<KeyguardRequest.SignTransactionRequestCheckout>>,
            'shopLogoUrl',
            { shopLogoUrl?: URL }
        > :
    T extends Is<T, KeyguardRequest.SignTransactionRequestCashlink> ?
        ConstructTransaction<KeyId2KeyInfo<KeyguardRequest.SignTransactionRequestCashlink>> :
    T extends Is<T, KeyguardRequest.SignMultisigTransactionRequestStandard> ?
        ConstructMultisigTransaction<KeyId2KeyInfo<KeyguardRequest.SignMultisigTransactionRequestStandard>>
        & { layout: KeyguardRequest.SignMultisigTransactionRequestLayout } :
    T extends Is<T, KeyguardRequest.SignMessageRequest> ?
        Transform<
            KeyId2KeyInfo<KeyguardRequest.SignMessageRequest>,
            'signer' | 'message',
            { signer: Nimiq.Address, message: Uint8Array | string }
        > :
    T extends Is<T, KeyguardRequest.ConnectRequest> ?
        Transform<
            KeyId2KeyInfo<KeyguardRequest.ConnectRequest>,
            'appLogoUrl',
            { appLogoUrl: URL }
        > :
    T extends Is<T, KeyguardRequest.SimpleRequest>
        | Is<T, KeyguardRequest.DeriveAddressRequest>
        | Is<T, KeyguardRequest.DeriveBtcXPubRequest>
        | Is<T, KeyguardRequest.DerivePolygonAddressRequest>
        | Is<T, KeyguardRequest.RemoveKeyRequest>
        | Is<T, KeyguardRequest.ExportRequest> ? KeyId2KeyInfo<T> :
    T extends Is<T, KeyguardRequest.ImportRequest> ?
        Transform<
            KeyguardRequest.ImportRequest,
            'isKeyLost' | 'wordsOnly',
            { isKeyLost: boolean, wordsOnly: boolean }
        > :
    T extends Is<T, KeyguardRequest.ResetPasswordRequest> ?
        Transform<
            KeyguardRequest.ResetPasswordRequest,
            'isKeyLost' | 'expectedKeyId' | 'wordsOnly',
            { isKeyLost: boolean, expectedKeyId: string, wordsOnly: boolean }
        > :
    T extends Is<T, KeyguardRequest.SignBtcTransactionRequestStandard> ?
        Transform<
            KeyId2KeyInfo<KeyguardRequest.SignBtcTransactionRequestStandard>,
            'inputs', { inputs: ParsedBitcoinTransactionInput[] }
        > & { layout: KeyguardRequest.SignBtcTransactionRequestLayout } :
    T extends Is<T, KeyguardRequest.SignBtcTransactionRequestCheckout> ?
        Transform<
            Transform<
                KeyId2KeyInfo<KeyguardRequest.SignBtcTransactionRequestCheckout>,
                'inputs', { inputs: ParsedBitcoinTransactionInput[] }
            >, 'shopLogoUrl', { shopLogoUrl?: URL }
        > :
    T extends Is<T, KeyguardRequest.SignPolygonTransactionRequest> ?
        KeyId2KeyInfo<KeyguardRequest.SignPolygonTransactionRequest>
        & { description: PolygonTransferDescription
            | PolygonTransferWithApprovalDescription
            | PolygonRefundDescription } :
    T extends Is<T, KeyguardRequest.SignSwapRequestStandard> ?
        KeyId2KeyInfo<ConstructSwap<KeyguardRequest.SignSwapRequestStandard>>
        & { layout: KeyguardRequest.SignSwapRequestLayout } :
    T extends Is<T, KeyguardRequest.SignSwapRequestSlider> ?
        KeyId2KeyInfo<ConstructSwap<KeyguardRequest.SignSwapRequestSlider>>
        & {
            nimiqAddresses: Array<{
                address: string,
                balance: number, // Luna
            }>,
            bitcoinAccount: {
                balance: number, // Sats
            },
            polygonAddresses: Array<{
                address: string,
                usdcBalance: number, // smallest unit of USDC (= 0.000001 USDC)
            }>
        } :
    T extends Is<T, KeyguardRequest.SignSwapTransactionsRequest> ?
        Transform<
            KeyguardRequest.SignSwapTransactionsRequest,
            'fund' | 'redeem', {
                fund: {
                    type: 'NIM',
                    htlcDetails: NimHtlcContents,
                    htlcData: Uint8Array,
                } | {
                    type: 'BTC',
                    htlcDetails: BtcHtlcContents,
                    htlcScript: Uint8Array,
                    htlcAddress: string,
                } | {
                    type: 'USDC',
                    description: PolygonOpenDescription,
                } | {
                    type: 'EUR',
                    htlcDetails: EurHtlcContents,
                    htlcId: string,
                },
                redeem: {
                    type: 'NIM',
                    htlcDetails: NimHtlcContents,
                    htlcData: Uint8Array,
                    htlcAddress: string,
                } | {
                    type: 'BTC',
                    htlcDetails: BtcHtlcContents,
                    htlcScript: Uint8Array,
                    transactionHash: string,
                    outputIndex: number,
                    outputScript: Buffer,
                } | {
                    type: 'USDC',
                    htlcId: string,
                    htlcDetails: {
                        hash: string,
                        timeoutTimestamp: number,
                    },
                } | {
                    type: 'EUR',
                    htlcDetails: EurHtlcContents,
                    htlcId: string,
                },
            }
        > :
    T;
