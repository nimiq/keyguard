import { l as TypedDataPayload, D as DecimalString, A as Address, H as Hex, c as TransferRequest, T as TypedDataDomain, b as TokenAuthorization, S as SubmitTransferBody, a as AuthModeName, C as ChainPins, m as ValidationResult } from './types-ivuIPWYl.js';

declare const TRANSFER_DOMAIN_NAME = "Nimiq Gasless Transfer";
/**
 * Version 3: no per-token maxFee, so only the signed fee bounds what the relay is paid. The types are those of
 * version 2 (sequential nonces, the signed token authorization). Version 1 and 2 signatures are not valid.
 */
declare const TRANSFER_DOMAIN_VERSION = "3";
declare const TOKEN_AUTH_TYPE = "TokenAuth(uint8 mode,uint8 v,bytes32 r,bytes32 s)";
/** The EIP-712 type string: the primary type, then the referenced TokenAuth. */
declare const TRANSFER_TYPE: string;
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
        readonly type: "uint256";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
    }, {
        readonly name: "auth";
        readonly type: "TokenAuth";
    }];
    readonly TokenAuth: readonly [{
        readonly name: "mode";
        readonly type: "uint8";
    }, {
        readonly name: "v";
        readonly type: "uint8";
    }, {
        readonly name: "r";
        readonly type: "bytes32";
    }, {
        readonly name: "s";
        readonly type: "bytes32";
    }];
};
/** The `auth` member of the signed message: Solidity `TokenAuth` with the numeric `AuthMode`. */
interface TokenAuthMessage {
    readonly mode: 0 | 1 | 2;
    readonly v: number;
    readonly r: Hex;
    readonly s: Hex;
}
/** The signed `GaslessTransfer` message: the request fields and the token authorization. */
interface TransferMessage extends TransferRequest {
    auth: TokenAuthMessage;
}
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
type TransferTypedData = TypedDataPayload<typeof TRANSFER_TYPES, 'GaslessTransfer', TransferMessage>;
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
/**
 * The `auth` member of the signed message for a token authorization: the mode as its enum value, v (any uint8)
 * and r, s as given. Checks the format only; which values a client signs and a relay accepts is checked by
 * `normalizeTokenAuthorization`. Throws TypeError otherwise.
 */
declare function tokenAuthMessage(authorization: TokenAuthorization, field?: string): TokenAuthMessage;
declare function transferDomain(chainId: number, verifyingContract: Address): TypedDataDomain;
/**
 * The `GaslessTransfer` payload the sender signs: exactly the 8 request fields and the token authorization,
 * which the sender has signed before (the permit or meta-tx; zeros for mode "none").
 */
declare function buildTransferTypedData(chainId: number, verifyingContract: Address, request: TransferRequest, authorization: TokenAuthorization): TransferTypedData;
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
    /** The intent nonce, `nonces(from)` when the request executes. */
    readonly nonce: bigint | DecimalString | number;
    readonly deadline: bigint | DecimalString | number;
}
/**
 * The canonical wire form of the 8 signed request fields. Accepts bigint / safe-integer / decimal-string
 * integers; rejects unknown fields, malformed values and wrong EIP-55 checksums.
 */
declare function normalizeTransferRequest(input: TransferRequestInput): TransferRequest;
interface SubmitTransferParams {
    readonly request: TransferRequestInput;
    /** The owner's 65-byte signature over the GaslessTransfer typed data. */
    readonly signature: string;
    /** The token authorization the intent signed (`toTokenAuthorization(mode, tokenSignature)`). */
    readonly authorization: TokenAuthorization;
    /** From the fee quote; optional. */
    readonly quoteId?: string;
}
/**
 * The POST /v1/transfer body in canonical wire form. The authorization is taken as it is (`normalizeTokenAuthorization`
 * only checks it): the intent signs it, and the relay must submit exactly these values. The body contains the token
 * signature; for META_TX approvals it never expires, so do not persist or log the body (§5).
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
    /**
     * The signed token authorization (mode, v, r, s) the intent will sign, once the token authorization is signed.
     * If present it must be of `authMode` and in the form `toTokenAuthorization` builds (`checkSignedAuthorization`).
     */
    readonly authorization?: TokenAuthorization;
}
/** Throws TypeError unless `now` is unix time in seconds. Values >= 2^32 are almost surely milliseconds. */
declare function assertUnixSeconds(now: number): void;
/**
 * Structure of the 8 signed request fields: exactly these keys, addresses (valid EIP-55 checksum if
 * mixed case) and canonical uint256 decimal strings (also the intent nonce).
 */
declare function checkTransferRequestShape(request: unknown, field?: string): ValidationResult;
/**
 * The signed token authorization of an intent in mode `authMode`: in the form `normalizeTokenAuthorization`
 * accepts (zeros for "none"; v 27 or 28 and a low-s r, s otherwise) and of that mode (`auth_type_mismatch`).
 */
declare function checkSignedAuthorization(authMode: AuthModeName, authorization: unknown, field?: string): ValidationResult;
/**
 * Policy checks of a well-formed request against the pins, in relay order: relay, token, auth mode,
 * sender, amount (amount + fee within uint256), recipient denylist, deadline window (now + 60 … now + 7200). Neither
 * the pins nor the contract cap the fee: the caller shows it to the user and may bound it (`checkAcceptableFee`).
 */
declare function checkTransferPolicy(request: TransferRequest, authMode: AuthModeName, pins: ChainPins, now: number): ValidationResult;
/**
 * A correction (a new version of a payment, spec §7) against the version it corrects.
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
 * relay does not execute; another auth mode or a new token nonce, which the relay cannot change itself because the
 * intent signs the token authorization). Fails with `correction_mismatch` (field `request.<name>`), or
 * `invalid_request` for a malformed request.
 */
declare function checkCorrection(corrected: TransferRequest, request: TransferRequest): ValidationResult;
/**
 * The caller's fee ceiling as bigint, or undefined if none is given. Neither the contract nor the pins cap the fee
 * (GaslessTransfer v3 has no maxFee) and a relay may quote any fee, so a wallet shows the fee to the user and can
 * pass the most it accepts to pay. Throws `invalid_request` for a malformed value.
 */
declare function parseMaxAcceptableFee(value: bigint | DecimalString | number | undefined): bigint | undefined;
/** `fee_above_limit` if `fee` exceeds the caller's ceiling from `parseMaxAcceptableFee`. */
declare function checkAcceptableFee(fee: bigint, maxAcceptableFee: bigint | undefined, field: string): ValidationResult;
/**
 * Options of `validateTransferRequest`, `tokenAuthSigningPayload` and `transferSigningPayload`. They come from the
 * signing app itself (its user's setting), never from another application or a relay: those could raise the ceiling
 * they check.
 */
interface TransferValidationOptions {
    /**
     * The most the caller accepts to pay, in token units (a bigint, decimal string or safe integer). A higher
     * `request.fee` fails with `fee_above_limit`. Optional, but nothing else caps the fee: without it, the user's review
     * of the fee is the only bound.
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
 * relay, token and auth mode, the amount (amount + fee within uint256), the recipient denylist, the deadline window,
 * the caller's own fee ceiling (`options.maxAcceptableFee`, `fee_above_limit`), for permit / meta-tx that
 * the token authorization matches (value == amount + fee, …), and the signed authorization if given
 * (`checkSignedAuthorization`). `now` is unix time in seconds.
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
 * format (65 bytes, low-s), authorization format (`normalizeTokenAuthorization`: zeros for "none"),
 * and the request policy. The token signature itself (v, r, s) cannot be checked against amount + fee
 * here; `validateTransferRequest` does that on the typed data before signing. With `options.repost`
 * the deadline window is not checked.
 */
declare function validateSubmitTransferBody(body: SubmitTransferBody, pins: ChainPins, now: number, options?: SubmitBodyValidationOptions): ValidationResult;

type TokenAuthTypedData = PermitTypedData | MetaTxApproveTypedData;
/**
 * A validated transfer: the request and the token authorization to sign first. Its id (the transfer digest) is
 * known only once the token authorization is signed, because the intent signs it (`transferSigningPayload`).
 */
interface TransferIntent {
    readonly chainId: number;
    /** The pinned GaslessTransfer contract (verifyingContract of the intent). */
    readonly contract: Address;
    readonly request: TransferRequest;
    readonly authMode: AuthModeName;
    /** Permit or meta-tx approve typed data; null for mode "none". */
    readonly tokenAuth: TokenAuthTypedData | null;
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
     * The intent nonce. A new payment takes the sender's current `nonces(from)`, read on-chain right before (never a
     * higher one: such a request cannot execute before the lower nonces are used), and only once the sender has no
     * other open payment, so that two payments never share a nonce unknowingly (sdk/README.md, "One payment, one
     * nonce"). With `corrects` it may be omitted, and the corrected version's nonce is taken over; given, it must
     * equal that. The core cannot read the chain and cannot tell an earlier version's nonce from a new one: passed
     * without `corrects`, it starts a new payment, and none of the correction rules is checked. The client passes the
     * nonce alone only for the first version of a payment, passes `corrects` (the payment's latest signed version)
     * for every later version, and reads `nonces(from)` on-chain before requesting a correction signature (once it
     * is above the payment's nonce, the payment's outcome is decided).
     */
    readonly nonce?: bigint | DecimalString | number;
    /** The token's current nonce for the owner (`nonces(owner)` for permit, `getNonce(owner)` for meta-tx). Required unless mode is "none". */
    readonly tokenNonce?: bigint | DecimalString | number;
    /**
     * The request of the payment's latest signed version, when this intent corrects it (`checkCorrection`):
     * the intent keeps its intent nonce (so at most one version executes), its `from`, `token` and `to`, and a deadline
     * at least as late. Otherwise `correction_mismatch`. Before asking for a correction, the caller checks on-chain that
     * the nonce is still unused (`nonces(from)` is not above it; `prepareTransfer` does this itself, the core cannot
     * read the chain, so the client must do it): once it is used, the payment's outcome is decided, and
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
     * on (spec §5). A permit expires with the intent. Set this only when the app itself deliberately
     * chose the META_TX approval, never because another application or a relay asked for that mode. A token without permit
     * needs no opt-in.
     */
    readonly allowMetaTxApprove?: boolean;
}
/**
 * Builds and validates a transfer intent. Throws `GaslessValidationError` (with the code of the first
 * failing check) if the fields violate the pins, if no nonce is given (`invalid_request`, field `nonce`), if a
 * correction (`params.corrects`) changes what it must keep (`correction_mismatch`), if the fee exceeds
 * `options.maxAcceptableFee` (`fee_above_limit`), or if mode "metaTxApprove" is asked for a token that supports
 * permit without `options.allowMetaTxApprove` (`meta_tx_approve_not_allowed`, spec §5). The result is deep-frozen.
 *
 * It takes `params.nonce` without `params.corrects` so that a client can supply a payment's first nonce. Therefore
 * the correction rules hold only if the caller passes `corrects` for every later version of a payment, never its
 * nonce alone (see `TransferIntentParams.nonce`).
 */
declare function createTransferIntent(pins: ChainPins, params: TransferIntentParams, now: number, options?: TransferIntentOptions): TransferIntent;
/**
 * The permit or meta-tx approve typed data to sign first, rebuilt from a re-validated intent (e.g. one kept while
 * the user confirmed, or passed between the signing app's own frames) and the pins; null for mode "none". Only the
 * token nonce is taken over from `intent.tokenAuth`; a wrong nonce only makes the token signature invalid on-chain.
 * With `options.maxAcceptableFee`, a higher fee fails with `fee_above_limit`.
 *
 * The auth mode is taken from the intent as it is: the META_TX preference (`allowMetaTxApprove`) is
 * decided when the intent is built. Build intents with `createTransferIntent` (or `prepareTransfer`)
 * in the signing app itself; never sign an intent object that another application or a relay built.
 */
declare function tokenAuthSigningPayload(pins: ChainPins, intent: TransferIntent, now: number, options?: TransferValidationOptions): TokenAuthTypedData | null;
/**
 * The `GaslessTransfer` typed data to sign second, over the signed token authorization: `toTokenAuthorization(mode,
 * tokenSignature)` with the signature of `tokenAuthSigningPayload`, or `toTokenAuthorization('none')`. Re-validates
 * the intent as `tokenAuthSigningPayload` does, and checks that the authorization is of the intent's mode and in
 * the form the relay submits (`checkSignedAuthorization`). The core cannot check the token signature itself
 * (`signPrepared` recovers it); a wrong one makes the relay refuse the request (`invalid_token_authorization`).
 */
declare function transferSigningPayload(pins: ChainPins, intent: TransferIntent, authorization: TokenAuthorization, now: number, options?: TransferValidationOptions): TransferTypedData;

export { APPROVE_SELECTOR as A, checkSignedAuthorization as B, checkTokenAuthorization as C, checkTransferPolicy as D, checkTransferRequestShape as E, createTransferIntent as F, encodeApproveCalldata as G, normalizeTransferRequest as H, parseMaxAcceptableFee as I, toUint256String as J, tokenAuthMessage as K, tokenAuthSigningPayload as L, META_TRANSACTION_TYPES as M, transferDomain as N, transferSigningPayload as O, PERMIT_TYPES as P, validateSubmitTransferBody as Q, validateTransferRequest as R, type SubmitBodyValidationOptions as S, TOKEN_AUTH_TYPE as T, type MetaTxApproveTypedData as a, type PermitTypedData as b, type SubmitTransferParams as c, TRANSFER_DOMAIN_NAME as d, TRANSFER_DOMAIN_VERSION as e, TRANSFER_TYPE as f, TRANSFER_TYPES as g, type TokenAuthMessage as h, type TokenAuthTypedData as i, type TransferIntent as j, type TransferIntentOptions as k, type TransferIntentParams as l, type TransferMessage as m, type TransferRequestInput as n, type TransferTypedData as o, type TransferValidationInput as p, type TransferValidationOptions as q, assertUnixSeconds as r, assertValidTransferRequest as s, buildMetaTxApproveTypedData as t, buildPermitTypedData as u, buildSubmitTransferBody as v, buildTokenAuthTypedData as w, buildTransferTypedData as x, checkAcceptableFee as y, checkCorrection as z };
