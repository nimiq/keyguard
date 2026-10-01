import { k as TypedDataPayload, D as DecimalString, A as Address, H as Hex, b as TransferRequest, T as TypedDataDomain, d as TokenAuthorization, S as SubmitTransferBody, a as AuthModeName, C as ChainPins, l as ValidationResult } from './types-D5tUt-yg.js';

declare const TRANSFER_DOMAIN_NAME = "Nimiq Gasless Transfer";
declare const TRANSFER_DOMAIN_VERSION = "1";
declare const TRANSFER_TYPE = "GaslessTransfer(address token,address from,address to,uint256 amount,uint256 fee,address relay,bytes32 nonce,uint256 deadline)";
declare const TRANSFER_TYPES: {
    readonly GaslessTransfer: readonly [{
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "from";
        readonly type: "address";
    }, {
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "fee";
        readonly type: "uint256";
    }, {
        readonly name: "relay";
        readonly type: "address";
    }, {
        readonly name: "nonce";
        readonly type: "bytes32";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
    }];
};
/** EIP-2612 permit, identical for USDC (FiatTokenV2_2) and USDT0 (UChildUSDT0). */
declare const PERMIT_TYPES: {
    readonly Permit: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly name: "spender";
        readonly type: "address";
    }, {
        readonly name: "value";
        readonly type: "uint256";
    }, {
        readonly name: "nonce";
        readonly type: "uint256";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
    }];
};
/** USDT0 NativeMetaTransaction. */
declare const META_TRANSACTION_TYPES: {
    readonly MetaTransaction: readonly [{
        readonly name: "nonce";
        readonly type: "uint256";
    }, {
        readonly name: "from";
        readonly type: "address";
    }, {
        readonly name: "functionSignature";
        readonly type: "bytes";
    }];
};
type TransferTypedData = TypedDataPayload<typeof TRANSFER_TYPES, 'GaslessTransfer', TransferRequest>;
type PermitTypedData = TypedDataPayload<typeof PERMIT_TYPES, 'Permit', {
    owner: Address;
    spender: Address;
    value: DecimalString;
    nonce: DecimalString;
    deadline: DecimalString;
}>;
type MetaTxApproveTypedData = TypedDataPayload<typeof META_TRANSACTION_TYPES, 'MetaTransaction', {
    nonce: DecimalString;
    from: Address;
    functionSignature: Hex;
}>;
/** Canonical decimal string of a uint256 given as bigint or decimal string; throws TypeError otherwise. */
declare function toUint256String(value: bigint | DecimalString, field?: string): DecimalString;
declare function transferDomain(chainId: number, verifyingContract: Address): TypedDataDomain;
/** The `GaslessTransfer` payload the sender signs. Copies exactly the 8 signed fields. */
declare function buildTransferTypedData(chainId: number, verifyingContract: Address, request: TransferRequest): TransferTypedData;
/** EIP-2612 permit for `spender` (always the gasless contract) over `value` (always amount + fee). */
declare function buildPermitTypedData(params: {
    tokenDomain: TypedDataDomain;
    owner: Address;
    spender: Address;
    value: bigint | DecimalString;
    nonce: bigint | DecimalString;
    deadline: bigint | DecimalString;
}): PermitTypedData;
declare const APPROVE_SELECTOR = "0x095ea7b3";
/** `approve(spender, value)` calldata, byte-identical to the contract's `abi.encodeCall(IERC20.approve, ...)`. */
declare function encodeApproveCalldata(spender: Address, value: bigint | DecimalString): Hex;
/** USDT0 meta-transaction that executes `approve(spender, value)` for `from`. Never expires once signed. */
declare function buildMetaTxApproveTypedData(params: {
    tokenDomain: TypedDataDomain;
    from: Address;
    spender: Address;
    value: bigint | DecimalString;
    nonce: bigint | DecimalString;
}): MetaTxApproveTypedData;

interface TransferRequestInput {
    readonly token: string;
    readonly from: string;
    readonly to: string;
    readonly amount: bigint | DecimalString | number;
    readonly fee: bigint | DecimalString | number;
    readonly relay: string;
    readonly nonce: string;
    readonly deadline: bigint | DecimalString | number;
}
/**
 * The canonical wire form of the 8 signed fields. Accepts bigint / safe-integer / decimal-string
 * amounts; rejects unknown fields, malformed values and wrong EIP-55 checksums.
 */
declare function normalizeTransferRequest(input: TransferRequestInput): TransferRequest;
interface SubmitTransferParams {
    readonly request: TransferRequestInput;
    /** The owner's 65-byte signature over the GaslessTransfer typed data. */
    readonly signature: string;
    /** From `toTokenAuthorization(mode, tokenSignature)`. */
    readonly authorization: TokenAuthorization;
    /** From the fee quote; optional. */
    readonly quoteId?: string;
}
/**
 * The POST /v1/transfer body in canonical wire form. The body contains the token signature; for
 * META_TX approvals it never expires, so do not persist or log the body (§5).
 */
declare function buildSubmitTransferBody(params: SubmitTransferParams): SubmitTransferBody;

/** What a client is about to sign: the intent, the domain it is signed for, and the token authorization. */
interface TransferValidationInput {
    /** Chain id of the GaslessTransfer domain the request will be signed for. */
    readonly chainId: number;
    /** verifyingContract of that domain. */
    readonly contract: string;
    readonly request: TransferRequest;
    readonly authMode: AuthModeName;
    /** The permit / meta-tx typed data to be signed with the request; null or absent for mode "none". */
    readonly tokenAuth?: PermitTypedData | MetaTxApproveTypedData | null;
}
/** Throws TypeError unless `now` is unix time in seconds. Values >= 2^32 are almost surely milliseconds. */
declare function assertUnixSeconds(now: number): void;
/**
 * Structure of the 8 signed fields: exactly these keys, addresses (valid EIP-55 checksum if mixed
 * case), canonical uint256 decimal strings, and a bytes32 nonce.
 */
declare function checkTransferRequestShape(request: unknown, field?: string): ValidationResult;
/**
 * Policy checks of a well-formed request against the pins, in relay order: relay, token, auth mode,
 * sender, amount, recipient denylist, deadline window (now + 60 … now + 7200), fee <= maxFee.
 */
declare function checkTransferPolicy(request: TransferRequest, authMode: AuthModeName, pins: ChainPins, now: number): ValidationResult;
/**
 * A correction (a new version of a payment, spec §7 [E21]) against the version it corrects.
 * Every version of a payment is signed with one intent nonce, so the contract executes at most one of them. The
 * correction keeps:
 * - `from` and `nonce`: the payment's one intent nonce;
 * - `token` and `to`: what is paid to whom. The outcome check reports any executed version as the outcome of the
 *   payment, so every version must pay the same token to the same recipient;
 * - a `deadline` at least as late: the latest version then has the latest deadline, and once it can no longer
 *   execute (expired), no version can.
 *
 * `amount`, `fee`, `relay` and the token authorization may change: that is what refusals are about (a higher fee, and
 * with it a lower amount for a "send all" transfer or a cashlink claim; another relay after a key rotation or when a
 * relay does not execute; another auth mode or a new token nonce). Fails with `correction_mismatch` (field
 * `request.<name>`), or `invalid_request` for a malformed request.
 */
declare function checkCorrection(corrected: TransferRequest, request: TransferRequest): ValidationResult;
/**
 * The caller's fee ceiling as bigint, or undefined if none is given. The contract and the pins only
 * cap the fee at MAX_FEE (5.00) and a relay may quote anything up to it, so a wallet can pass the
 * most it accepts to pay. Throws `invalid_request` for a malformed value.
 */
declare function parseMaxAcceptableFee(value: bigint | DecimalString | number | undefined): bigint | undefined;
/** `fee_above_limit` if `fee` exceeds the caller's ceiling from `parseMaxAcceptableFee`. */
declare function checkAcceptableFee(fee: bigint, maxAcceptableFee: bigint | undefined, field: string): ValidationResult;
/**
 * Options of `validateTransferRequest` and `transferSigningPayloads`. They come from the signing app
 * itself (its user's setting), never from another application or a relay: those could raise the ceiling they check.
 */
interface TransferValidationOptions {
    /**
     * The most the caller accepts to pay, in token units (a bigint, decimal string or safe integer). A higher
     * `request.fee` fails with `fee_above_limit`. The pins only cap the fee at MAX_FEE (5.00).
     */
    readonly maxAcceptableFee?: bigint | DecimalString | number;
}
/**
 * The permit / meta-tx typed data must be exactly what the contract will need (§5): the pinned
 * token domain, owner = from, spender = the pinned contract, value = amount + fee, and for permits
 * deadline = the intent deadline (so never 0 or max). Assumes the policy checks passed.
 */
declare function checkTokenAuthorization(input: TransferValidationInput, pins: ChainPins): ValidationResult;
/**
 * Validates a transfer against the pins before signing (§7): the domain's chain and contract, the
 * relay, token and auth mode, the amount, the recipient denylist, the deadline window, the fee cap,
 * the caller's own fee ceiling (`options.maxAcceptableFee`, `fee_above_limit`) and, for permit /
 * meta-tx, that the token authorization matches (value == amount + fee, …). `now` is unix time in seconds.
 */
declare function validateTransferRequest(req: TransferValidationInput, pins: ChainPins, now: number, options?: TransferValidationOptions): ValidationResult;
/** `validateTransferRequest` that throws `GaslessValidationError` instead of returning a failure. */
declare function assertValidTransferRequest(req: TransferValidationInput, pins: ChainPins, now: number, options?: TransferValidationOptions): void;
/** Options of `validateSubmitTransferBody`. */
interface SubmitBodyValidationOptions {
    /**
     * The body is posted again after an unclear answer: the deadline window (now + 60 … now + 7200) is not
     * checked. A relay answers an identical body it stored with its current state before any policy check, also after
     * the deadline; a body it did not store it refuses itself. Every other check still applies.
     */
    readonly repost?: boolean;
}
/**
 * Validates a POST /v1/transfer body against the pins before it is sent: structure, signature
 * format (65 bytes, low-s), authorization format, and the request policy. The token authorization
 * itself (v, r, s) cannot be checked against amount + fee here; `validateTransferRequest` does that
 * on the typed data before signing. With `options.repost` the deadline window is not checked.
 */
declare function validateSubmitTransferBody(body: SubmitTransferBody, pins: ChainPins, now: number, options?: SubmitBodyValidationOptions): ValidationResult;

type TokenAuthTypedData = PermitTypedData | MetaTxApproveTypedData;
/** A validated transfer: the request, the token authorization to sign with it, and its id. */
interface TransferIntent {
    readonly chainId: number;
    /** The pinned GaslessTransfer contract (verifyingContract of the intent). */
    readonly contract: Address;
    readonly request: TransferRequest;
    readonly authMode: AuthModeName;
    /** Permit or meta-tx approve typed data; null for mode "none". */
    readonly tokenAuth: TokenAuthTypedData | null;
    /** EIP-712 digest of the request = contract `hashTransfer` = relay request id. */
    readonly id: Hex;
}
interface TransferIntentParams {
    readonly token: string;
    readonly from: string;
    readonly to: string;
    readonly amount: bigint | DecimalString | number;
    /** The relay's quote (`RelayClient.fee()`), in token units. */
    readonly fee: bigint | DecimalString | number;
    /** The relay address from the quote; must be pinned. */
    readonly relay: string;
    readonly authMode: AuthModeName;
    /** Unix seconds; the relay accepts now + 60 … now + 7200. A correction's deadline is not earlier than the corrected one's. */
    readonly deadline: bigint | DecimalString | number;
    /**
     * Defaults to `randomNonce()`, a new payment, or with `corrects` to the nonce of the corrected version. Unlike the
     * viem `prepareTransfer`, which refuses a nonce without `corrects`, the core takes one so that a client can
     * supply the first version's nonce. Without `corrects`, the nonce passed here starts a new payment
     * with that nonce: the core cannot tell an earlier version's nonce from a new one and checks none of the
     * correction rules. The client must pass the nonce alone only for the first version of a payment,
     * pass `corrects` (the payment's latest signed version) for every later version, never that version's nonce
     * alone, and read `nonceUsed(from, nonce)` on-chain before requesting a correction signature
     * (sdk/README.md, "Corrections").
     */
    readonly nonce?: string;
    /** The token's current nonce for the owner (`nonces(owner)` for permit, `getNonce(owner)` for meta-tx). Required unless mode is "none". */
    readonly tokenNonce?: bigint | DecimalString | number;
    /**
     * The request of the payment's latest signed version, when this intent corrects it (`checkCorrection`):
     * the intent keeps its intent nonce (so at most one version executes), its `from`, `token` and `to`, and a deadline
     * at least as late. Otherwise `correction_mismatch`. Before asking for a correction, the caller checks on-chain that
     * the nonce is still unused (`nonceUsed(from, nonce)`; `prepareTransfer` does this itself, the core cannot read the
     * chain, so the client must do it): once it is used, the payment's outcome is decided, and
     * `waitForTransferOutcome` with the latest version tells it.
     */
    readonly corrects?: TransferRequestInput;
}
/**
 * The permit or meta-tx approve typed data for a request, built from the pins only: domain = the
 * pinned token domain, spender = the pinned contract, value = amount + fee, and for permits
 * deadline = the intent deadline. Returns null for mode "none".
 */
declare function buildTokenAuthTypedData(pins: ChainPins, request: TransferRequest, authMode: AuthModeName, tokenNonce: bigint | DecimalString | number | undefined): TokenAuthTypedData | null;
/**
 * Options of `createTransferIntent`. Like `TransferValidationOptions`, they come from the signing app itself
 * (its own code and its user), never from the fields another application or a relay passes in.
 */
interface TransferIntentOptions extends TransferValidationOptions {
    /**
     * Allows mode "metaTxApprove" for a token that also supports permit (default false: such an intent is
     * refused with `meta_tx_approve_not_allowed`). A META_TX approval has no deadline: once broadcast it stays
     * public and executable by anyone, also after the transaction reverted, until the owner's token nonce moves
     * on (spec §5 [E8]). A permit expires with the intent. Set this only when the app itself deliberately
     * chose the META_TX approval, never because another application or a relay asked for that mode. A token without permit
     * needs no opt-in.
     */
    readonly allowMetaTxApprove?: boolean;
}
/**
 * Builds and validates a transfer intent. Throws `GaslessValidationError` (with the code of the first
 * failing check) if the fields violate the pins, if a correction (`params.corrects`) changes what it must
 * keep (`correction_mismatch`), if the fee exceeds `options.maxAcceptableFee` (`fee_above_limit`), or if mode
 * "metaTxApprove" is asked for a token that supports permit without `options.allowMetaTxApprove`
 * (`meta_tx_approve_not_allowed`, spec §5 [E8]). The result is deep-frozen.
 *
 * It takes `params.nonce` without `params.corrects` so that a client can supply a payment's first nonce. Therefore
 * the correction rules hold only if the caller passes `corrects` for every later version of a payment, never its
 * nonce alone (see `TransferIntentParams.nonce`).
 */
declare function createTransferIntent(pins: ChainPins, params: TransferIntentParams, now: number, options?: TransferIntentOptions): TransferIntent;
/** The typed data to sign for a transfer, rebuilt from the validated fields right before signing. */
interface TransferSigningPayloads {
    readonly transfer: TransferTypedData;
    readonly tokenAuth: TokenAuthTypedData | null;
}
/**
 * Re-validates an intent (e.g. one kept while the user confirmed, or passed between the signing app's
 * own frames) and rebuilds the typed data from its fields and the pins. Only the token nonce is taken
 * over from `intent.tokenAuth`; a wrong nonce only makes the token signature invalid on-chain. With
 * `options.maxAcceptableFee`, a higher fee fails with `fee_above_limit`.
 *
 * The auth mode is taken from the intent as it is: the META_TX preference (`allowMetaTxApprove`) is
 * decided when the intent is built. Build intents with `createTransferIntent` (or `prepareTransfer`)
 * in the signing app itself; never sign an intent object that another application or a relay built.
 */
declare function transferSigningPayloads(pins: ChainPins, intent: Omit<TransferIntent, 'id'> & {
    readonly id?: Hex;
}, now: number, options?: TransferValidationOptions): TransferSigningPayloads;

export { APPROVE_SELECTOR as A, checkTransferRequestShape as B, createTransferIntent as C, encodeApproveCalldata as D, normalizeTransferRequest as E, parseMaxAcceptableFee as F, toUint256String as G, transferDomain as H, transferSigningPayloads as I, validateSubmitTransferBody as J, validateTransferRequest as K, META_TRANSACTION_TYPES as M, PERMIT_TYPES as P, type SubmitBodyValidationOptions as S, TRANSFER_DOMAIN_NAME as T, type MetaTxApproveTypedData as a, type PermitTypedData as b, type SubmitTransferParams as c, TRANSFER_DOMAIN_VERSION as d, TRANSFER_TYPE as e, TRANSFER_TYPES as f, type TokenAuthTypedData as g, type TransferIntent as h, type TransferIntentOptions as i, type TransferIntentParams as j, type TransferRequestInput as k, type TransferSigningPayloads as l, type TransferTypedData as m, type TransferValidationInput as n, type TransferValidationOptions as o, assertUnixSeconds as p, assertValidTransferRequest as q, buildMetaTxApproveTypedData as r, buildPermitTypedData as s, buildSubmitTransferBody as t, buildTokenAuthTypedData as u, buildTransferTypedData as v, checkAcceptableFee as w, checkCorrection as x, checkTokenAuthorization as y, checkTransferPolicy as z };
