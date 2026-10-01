type Address = `0x${string}`;
type Hex = `0x${string}`;
/** A uint256 as a canonical decimal string ("0", "10000"; no sign, no leading zeros, no exponent). */
type DecimalString = string;
/** Token authorization mode. Numeric values match the Solidity `enum AuthMode`. */
type AuthModeName = 'none' | 'permit' | 'metaTxApprove';
declare const AUTH_MODE_ID: Readonly<{
    readonly none: 0;
    readonly permit: 1;
    readonly metaTxApprove: 2;
}>;
/** Mirrors Solidity `TransferRequest`, i.e. the signed EIP-712 `GaslessTransfer` message. */
interface TransferRequest {
    token: Address;
    from: Address;
    to: Address;
    amount: DecimalString;
    fee: DecimalString;
    relay: Address;
    nonce: Hex;
    deadline: DecimalString;
}
/** Mirrors Solidity `TokenAuth`. v, r and s are omitted for mode "none". */
interface TokenAuthorization {
    mode: AuthModeName;
    v?: number;
    r?: Hex;
    s?: Hex;
}
interface TypedDataField {
    readonly name: string;
    readonly type: string;
}
/**
 * EIP-712 domain. Only the fields that are present become part of `EIP712Domain`, in the order
 * name, version, chainId, verifyingContract, salt (the rule used by viem and ethers v5/v6).
 */
interface TypedDataDomain {
    readonly name: string;
    readonly version: string;
    readonly chainId?: number;
    readonly verifyingContract: Address;
    readonly salt?: Hex;
}
/** Signable payload for viem `signTypedData`, ethers v5 `_signTypedData` and ethers v6 `signTypedData`. */
interface TypedDataPayload<Types extends Record<string, readonly TypedDataField[]>, PrimaryType extends keyof Types & string, Message> {
    domain: TypedDataDomain;
    /** Does not contain `EIP712Domain`. */
    types: Types;
    primaryType: PrimaryType;
    message: Message;
}

interface PinnedToken {
    readonly symbol: string;
    /** Checksummed. */
    readonly address: Address;
    readonly decimals: number;
    readonly authModes: readonly AuthModeName[];
    /** EIP-712 domain of the token's permit / meta-tx signatures. */
    readonly domain: TypedDataDomain;
    /** `hashDomain(domain)`: the value the token's `DOMAIN_SEPARATOR()` must return (see `checkTokenDomain`). */
    readonly domainSeparator: Hex;
}
interface ChainPins {
    readonly chainId: number;
    /** The GaslessTransfer contract and its EIP-712 domain ("Nimiq Gasless Transfer", "1", chainId, address). */
    readonly transfer: {
        readonly address: Address;
        readonly domain: TypedDataDomain;
    };
    /** Relay addresses clients may sign for (`request.relay`). Several allow a key rotation (D5). */
    readonly relays: readonly Address[];
    readonly tokens: readonly PinnedToken[];
    /** The contract's MAX_FEE, in token units. */
    readonly maxFee: DecimalString;
    /** Block of the contract deployment, the lower bound for event searches; null if unknown. */
    readonly deployBlock: number | null;
    /** Further recipients to reject besides the built-in denylist. */
    readonly extraDeniedRecipients: readonly Address[];
}
interface TokenPinInput {
    readonly symbol: string;
    readonly address: string;
    readonly decimals: number;
    readonly authModes: readonly AuthModeName[];
    readonly domain: TypedDataDomain;
    /** Optional expected separator; if given it must equal `hashDomain(domain)`. */
    readonly domainSeparator?: string;
}
interface ChainPinsInput {
    readonly chainId: number;
    /** Address of the GaslessTransfer contract. */
    readonly transfer: string;
    readonly relays: readonly string[];
    readonly tokens: readonly TokenPinInput[];
    readonly maxFee: bigint | DecimalString | number;
    readonly deployBlock?: number | null;
    readonly extraDeniedRecipients?: readonly string[];
}
/** bytes32(chainId), the salt of salt-based token domains such as USDT0's. */
declare function chainIdSalt(chainId: number): Hex;
/**
 * Field-by-field domain equality: same fields present, addresses and salts compared
 * case-insensitively. Malformed values (e.g. from plain JS) compare unequal instead of throwing.
 */
declare function sameDomain(a: TypedDataDomain, b: TypedDataDomain): boolean;
/**
 * Validates and normalizes pins (checksummed addresses, canonical maxFee, derived domains and
 * separators) and returns a deep-frozen copy. Throws `InvalidPinsError` on any inconsistency.
 */
declare function definePins(input: ChainPinsInput): ChainPins;
/** The pinned token with this address (case-insensitive), if any. */
declare function findPinnedToken(pins: ChainPins, address: string): PinnedToken | undefined;
/**
 * Deployment file written by the deploy script (contracts/deployments/<chainId>.json):
 * `{"chainId","gaslessTransfer","maxFee","deployBlock","tokens":[{"symbol","address","decimals","authModes","domain"}]}`.
 * Integers may be JSON numbers or decimal strings. `authModes` entries may be SDK names
 * ("permit"), Solidity enum names ("PERMIT") or enum values (1). Unknown keys outside the domain
 * objects are ignored; domain objects are strict.
 */
interface DeploymentFile {
    readonly chainId: number | string;
    readonly gaslessTransfer: string;
    readonly maxFee: number | string;
    readonly deployBlock: number | string;
    readonly tokens: ReadonlyArray<{
        readonly symbol: string;
        readonly address: string;
        readonly decimals: number | string;
        readonly authModes: ReadonlyArray<string | number>;
        readonly domain: {
            readonly name: string;
            readonly version: string;
            readonly chainId?: number | string | null;
            readonly verifyingContract: string;
            readonly salt?: string | null;
        };
    }>;
}
interface PinsFromDeploymentOptions {
    /** The relay address(es) clients may sign for; they are not part of the deployment file. */
    readonly relays: readonly string[];
    readonly extraDeniedRecipients?: readonly string[];
}
/** Pins from a parsed deployment file (see `DeploymentFile`) plus the relay addresses. */
declare function pinsFromDeployment(deployment: unknown, options: PinsFromDeploymentOptions): ChainPins;

/**
 * Validation failures. Codes shared with the relay (`wrong_relay` … `fee_above_max`,
 * `invalid_signature`, `invalid_request`, `nonce_used`) mean the same as the relay's ErrorCode.
 */
type ValidationErrorCode = 'invalid_request' | 'invalid_signature' | 'wrong_chain' | 'wrong_contract' | 'wrong_relay' | 'unsupported_token' | 'unsupported_auth_mode' | 'invalid_sender' | 'invalid_amount' | 'invalid_recipient' | 'deadline_out_of_range' | 'fee_above_max' | 'fee_above_limit' | 'meta_tx_approve_not_allowed' | 'auth_missing' | 'auth_unexpected' | 'auth_type_mismatch' | 'auth_domain_mismatch' | 'auth_owner_mismatch' | 'auth_spender_mismatch' | 'auth_value_mismatch' | 'auth_deadline_mismatch' | 'correction_mismatch' | 'nonce_used' | 'signer_mismatch' | 'sender_is_contract' | 'eip7702_permit_unsupported';
type ValidationResult = {
    readonly ok: true;
} | {
    readonly ok: false;
    readonly code: ValidationErrorCode;
    readonly field: string;
    readonly message: string;
};
declare class GaslessError extends Error {
    readonly code: string;
    constructor(code: string, message: string, options?: {
        cause?: unknown;
    });
}
declare class GaslessValidationError extends GaslessError {
    readonly code: ValidationErrorCode;
    /** Dotted path of the offending input field, e.g. `request.to` or `tokenAuth.message.value`. */
    readonly field: string;
    constructor(code: ValidationErrorCode, field: string, message: string);
    static fromResult(result: Extract<ValidationResult, {
        ok: false;
    }>): GaslessValidationError;
}
/** Thrown by `definePins` / `pinsFromDeployment` for inconsistent or malformed pins. */
declare class InvalidPinsError extends GaslessError {
    readonly code: 'invalid_pins';
    readonly field: string;
    constructor(field: string, message: string);
}

type OperationName = 'transfer';
type RequestStatus = 'queued' | 'submitted' | 'mined' | 'confirmed' | 'failed' | 'expired';
type ErrorCode = 'invalid_request' | 'unsupported_operation' | 'wrong_relay' | 'unsupported_token' | 'unsupported_auth_mode' | 'invalid_amount' | 'invalid_recipient' | 'deadline_out_of_range' | 'fee_above_max' | 'invalid_signature' | 'invalid_token_authorization' | 'fee_too_low' | 'not_found' | 'nonce_used' | 'conflict' | 'sender_busy' | 'insufficient_balance' | 'insufficient_allowance' | 'token_paused' | 'blocked_address' | 'simulation_failed' | 'rate_limited' | 'internal_error' | 'unavailable';
declare const ERROR_HTTP_STATUS: Readonly<Record<ErrorCode, number>>;
interface ErrorResponse {
    error: {
        code: ErrorCode;
        message: string;
    };
}
/** GET /v1/info */
interface InfoResponse {
    version: string;
    chainId: number;
    /** The address clients must put into `request.relay`. */
    relay: Address;
    contracts: {
        transfer: {
            address: Address;
            domain: TypedDataDomain;
        };
    };
    tokens: Array<{
        symbol: string;
        address: Address;
        decimals: number;
        authModes: AuthModeName[];
        tokenDomain: TypedDataDomain;
    }>;
    maxFee: DecimalString;
    policy: {
        minDeadlineSeconds: number;
        maxDeadlineSeconds: number;
        quoteTtlSeconds: number;
    };
}
/** GET /v1/fee?operation=transfer&token=<address>&authMode=<AuthModeName> */
interface FeeQuery {
    operation: OperationName;
    token: Address;
    authMode: AuthModeName;
}
interface FeeResponse {
    operation: OperationName;
    token: Address;
    authMode: AuthModeName;
    /** Fee to sign, in token units (multiple of 10000). */
    fee: DecimalString;
    relay: Address;
    gasUnits: DecimalString;
    /** Gas price used for the quote, in wei. */
    gasPrice: DecimalString;
    /** POL/USD price used, as a decimal number string, e.g. "0.1121". */
    polUsd: string;
    /** Unix seconds. The quote TTL is a hint; acceptance is re-checked at submit. */
    issuedAt: number;
    expiresAt: number;
    quoteId: string;
}
/** POST /v1/transfer. The relay never accepts calldata or target addresses from clients. */
interface SubmitTransferBody {
    request: TransferRequest;
    /** 65-byte ECDSA signature (r, s, v) over the GaslessTransfer typed data, low-s. */
    signature: Hex;
    authorization: TokenAuthorization;
    quoteId?: string;
}
/** 202 on first submit; an identical re-submit returns 200 with the current status. */
interface SubmitResponse {
    /** EIP-712 digest of the request (== contract `hashTransfer`). */
    id: Hex;
    status: RequestStatus;
}
interface RequestTransaction {
    hash: Hex;
    txNonce: number;
    maxFeePerGas: DecimalString;
    status: 'pending' | 'mined' | 'replaced' | 'failed';
}
/** GET /v1/requests/:id */
interface RequestState {
    id: Hex;
    operation: OperationName;
    status: RequestStatus;
    request: TransferRequest;
    transactions: RequestTransaction[];
    /** The final transaction hash, also after a speed-up; null until submitted. */
    txHash: Hex | null;
    blockNumber: DecimalString | null;
    error: {
        code: ErrorCode;
        message: string;
    } | null;
}

export { type Address as A, type ChainPins as C, type DecimalString as D, type ErrorCode as E, type FeeResponse as F, GaslessError as G, type Hex as H, InvalidPinsError as I, type OperationName as O, type PinnedToken as P, type RequestState as R, type SubmitTransferBody as S, type TypedDataDomain as T, type ValidationErrorCode as V, type AuthModeName as a, type TransferRequest as b, type TypedDataField as c, type TokenAuthorization as d, AUTH_MODE_ID as e, type ChainPinsInput as f, type DeploymentFile as g, GaslessValidationError as h, type PinsFromDeploymentOptions as i, type TokenPinInput as j, type TypedDataPayload as k, type ValidationResult as l, chainIdSalt as m, definePins as n, findPinnedToken as o, pinsFromDeployment as p, type InfoResponse as q, type SubmitResponse as r, sameDomain as s, ERROR_HTTP_STATUS as t, type ErrorResponse as u, type FeeQuery as v, type RequestStatus as w, type RequestTransaction as x };
