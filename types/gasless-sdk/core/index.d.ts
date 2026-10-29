import { A as Address, D as DecimalString, a as AuthModeName, T as TypedDataDomain, H as Hex, C as ChainPins, b as TokenAuthorization, c as TransferRequest, d as TypedDataField } from '../types-ivuIPWYl.js';
export { e as AUTH_MODE_ID, f as ChainPinsInput, g as DeploymentFile, G as GaslessError, h as GaslessValidationError, I as InvalidPinsError, P as PinnedToken, i as PinsFromDeploymentOptions, j as TokenPinInput, k as TransferVersion, l as TypedDataPayload, V as ValidationErrorCode, m as ValidationResult, n as chainIdSalt, o as definePins, p as findPinnedToken, q as pinsFromDeployment, s as sameDomain } from '../types-ivuIPWYl.js';
export { A as APPROVE_SELECTOR, M as META_TRANSACTION_TYPES, a as MetaTxApproveTypedData, P as PERMIT_TYPES, b as PermitTypedData, S as SubmitBodyValidationOptions, c as SubmitTransferParams, T as TOKEN_AUTH_TYPE, d as TRANSFER_DOMAIN_NAME, e as TRANSFER_DOMAIN_VERSION, f as TRANSFER_TYPE, g as TRANSFER_TYPES, h as TokenAuthMessage, i as TokenAuthTypedData, j as TransferIntent, k as TransferIntentOptions, l as TransferIntentParams, m as TransferMessage, n as TransferRequestInput, o as TransferTypedData, p as TransferValidationInput, q as TransferValidationOptions, r as assertUnixSeconds, s as assertValidTransferRequest, t as buildMetaTxApproveTypedData, u as buildPermitTypedData, v as buildSubmitTransferBody, w as buildTokenAuthTypedData, x as buildTransferTypedData, y as checkAcceptableFee, z as checkCorrection, B as checkSignedAuthorization, C as checkTokenAuthorization, D as checkTransferPolicy, E as checkTransferRequestShape, F as createTransferIntent, G as encodeApproveCalldata, H as normalizeTransferRequest, I as parseMaxAcceptableFee, J as toUint256String, K as tokenAuthMessage, L as tokenAuthSigningPayload, N as transferDomain, O as transferSigningPayload, Q as validateSubmitTransferBody, R as validateTransferRequest } from '../intent-CqMn1SR4.js';

declare const POLYGON_CHAIN_ID = 137;
declare const AMOY_CHAIN_ID = 80002;
interface TokenInfo {
    readonly symbol: 'USDC' | 'USDT0';
    readonly address: Address;
    readonly decimals: 6;
    readonly authModes: readonly AuthModeName[];
    /** EIP-712 domain of the token's own permit / meta-tx signatures. */
    readonly domain: TypedDataDomain;
    /**
     * On-chain `DOMAIN_SEPARATOR()` as of 2026-09-25. USDT0 stores its separator and an admin
     * `changeName()` replaces it, so clients must compare with the live value before signing.
     */
    readonly domainSeparator: Hex;
}
/** Native USDC (FiatTokenV2_2 behind FiatTokenProxy). */
declare const POLYGON_USDC: TokenInfo;
/** USDT0 (UChildUSDT0 behind UChildERC20Proxy). Salt domain: no chainId field, salt = bytes32(chainId). */
declare const POLYGON_USDT0: TokenInfo;
declare const POLYGON_TOKENS: readonly TokenInfo[];
/** Relay policy defaults (§6.2, §6.4, §11). */
declare const MIN_DEADLINE_SECONDS = 60;
declare const MAX_DEADLINE_SECONDS = 7200;
declare const QUOTE_TTL_SECONDS = 120;
/** Fees are multiples of 0.01 token. */
declare const FEE_GRANULARITY: DecimalString;
declare const MIN_FEE: DecimalString;
/** Chainlink POL/USD ("MATIC / USD", 8 decimals) on Polygon mainnet. */
declare const CHAINLINK_POL_USD_POLYGON: Address;
/**
 * Blocked recipient contracts on Polygon mainnet.
 * Recipients on this list are rejected by the relay and the SDK, together with the zero
 * address, the pinned tokens and the gasless transfer contract.
 */
declare const LEGACY_NIMIQ_CONTRACTS_POLYGON: readonly Address[];

declare const gaslessTransferAbi: readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "initialOwner";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "tokens";
        readonly type: "tuple[]";
        readonly internalType: "struct TokenInit[]";
        readonly components: readonly [{
            readonly name: "token";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "config";
            readonly type: "tuple";
            readonly internalType: "struct TokenConfig";
            readonly components: readonly [{
                readonly name: "permit";
                readonly type: "bool";
                readonly internalType: "bool";
            }, {
                readonly name: "metaTxApprove";
                readonly type: "bool";
                readonly internalType: "bool";
            }, {
                readonly name: "allowance";
                readonly type: "bool";
                readonly internalType: "bool";
            }];
        }];
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "DOMAIN_SEPARATOR";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "TOKEN_AUTH_TYPE";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
        readonly internalType: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "TOKEN_AUTH_TYPEHASH";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "TRANSFER_TYPE";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
        readonly internalType: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "TRANSFER_TYPEHASH";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "acceptOwnership";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "eip712Domain";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "fields";
        readonly type: "bytes1";
        readonly internalType: "bytes1";
    }, {
        readonly name: "name";
        readonly type: "string";
        readonly internalType: "string";
    }, {
        readonly name: "version";
        readonly type: "string";
        readonly internalType: "string";
    }, {
        readonly name: "chainId";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "verifyingContract";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "salt";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "extensions";
        readonly type: "uint256[]";
        readonly internalType: "uint256[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "hashTransfer";
    readonly inputs: readonly [{
        readonly name: "r";
        readonly type: "tuple";
        readonly internalType: "struct TransferRequest";
        readonly components: readonly [{
            readonly name: "token";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "from";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "to";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "fee";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "relay";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "deadline";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }];
    }, {
        readonly name: "nonce";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "auth";
        readonly type: "tuple";
        readonly internalType: "struct TokenAuth";
        readonly components: readonly [{
            readonly name: "mode";
            readonly type: "uint8";
            readonly internalType: "enum AuthMode";
        }, {
            readonly name: "v";
            readonly type: "uint8";
            readonly internalType: "uint8";
        }, {
            readonly name: "r";
            readonly type: "bytes32";
            readonly internalType: "bytes32";
        }, {
            readonly name: "s";
            readonly type: "bytes32";
            readonly internalType: "bytes32";
        }];
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "invalidateNonces";
    readonly inputs: readonly [{
        readonly name: "newNonce";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "nonces";
    readonly inputs: readonly [{
        readonly name: "signer";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "owner";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "pendingOwner";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "relayTransfer";
    readonly inputs: readonly [{
        readonly name: "r";
        readonly type: "tuple";
        readonly internalType: "struct TransferRequest";
        readonly components: readonly [{
            readonly name: "token";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "from";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "to";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "fee";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "relay";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "deadline";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }];
    }, {
        readonly name: "signature";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }, {
        readonly name: "auth";
        readonly type: "tuple";
        readonly internalType: "struct TokenAuth";
        readonly components: readonly [{
            readonly name: "mode";
            readonly type: "uint8";
            readonly internalType: "enum AuthMode";
        }, {
            readonly name: "v";
            readonly type: "uint8";
            readonly internalType: "uint8";
        }, {
            readonly name: "r";
            readonly type: "bytes32";
            readonly internalType: "bytes32";
        }, {
            readonly name: "s";
            readonly type: "bytes32";
            readonly internalType: "bytes32";
        }];
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "renounceOwnership";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setTokenConfig";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "config";
        readonly type: "tuple";
        readonly internalType: "struct TokenConfig";
        readonly components: readonly [{
            readonly name: "permit";
            readonly type: "bool";
            readonly internalType: "bool";
        }, {
            readonly name: "metaTxApprove";
            readonly type: "bool";
            readonly internalType: "bool";
        }, {
            readonly name: "allowance";
            readonly type: "bool";
            readonly internalType: "bool";
        }];
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "tokenConfig";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple";
        readonly internalType: "struct TokenConfig";
        readonly components: readonly [{
            readonly name: "permit";
            readonly type: "bool";
            readonly internalType: "bool";
        }, {
            readonly name: "metaTxApprove";
            readonly type: "bool";
            readonly internalType: "bool";
        }, {
            readonly name: "allowance";
            readonly type: "bool";
            readonly internalType: "bool";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "transferOwnership";
    readonly inputs: readonly [{
        readonly name: "newOwner";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "event";
    readonly name: "EIP712DomainChanged";
    readonly inputs: readonly [];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "NonceInvalidated";
    readonly inputs: readonly [{
        readonly name: "signer";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "previousNonce";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }, {
        readonly name: "newNonce";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "OwnershipTransferStarted";
    readonly inputs: readonly [{
        readonly name: "previousOwner";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "newOwner";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "OwnershipTransferred";
    readonly inputs: readonly [{
        readonly name: "previousOwner";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "newOwner";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "TokenConfigSet";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "config";
        readonly type: "tuple";
        readonly indexed: false;
        readonly internalType: "struct TokenConfig";
        readonly components: readonly [{
            readonly name: "permit";
            readonly type: "bool";
            readonly internalType: "bool";
        }, {
            readonly name: "metaTxApprove";
            readonly type: "bool";
            readonly internalType: "bool";
        }, {
            readonly name: "allowance";
            readonly type: "bool";
            readonly internalType: "bool";
        }];
    }];
    readonly anonymous: false;
}, {
    readonly type: "error";
    readonly name: "AuthModeNotSupported";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "mode";
        readonly type: "uint8";
        readonly internalType: "enum AuthMode";
    }];
}, {
    readonly type: "error";
    readonly name: "DeadlineExpired";
    readonly inputs: readonly [{
        readonly name: "deadline";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
}, {
    readonly type: "error";
    readonly name: "InsufficientAllowance";
    readonly inputs: readonly [{
        readonly name: "allowance";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "required";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
}, {
    readonly type: "error";
    readonly name: "InvalidConfig";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "InvalidNonceIncrease";
    readonly inputs: readonly [{
        readonly name: "currentNonce";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "newNonce";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
}, {
    readonly type: "error";
    readonly name: "InvalidRecipient";
    readonly inputs: readonly [{
        readonly name: "to";
        readonly type: "address";
        readonly internalType: "address";
    }];
}, {
    readonly type: "error";
    readonly name: "InvalidShortString";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "InvalidSignature";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "InvalidSigner";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "NotRelay";
    readonly inputs: readonly [{
        readonly name: "caller";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "relay";
        readonly type: "address";
        readonly internalType: "address";
    }];
}, {
    readonly type: "error";
    readonly name: "OwnableInvalidOwner";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
        readonly internalType: "address";
    }];
}, {
    readonly type: "error";
    readonly name: "OwnableUnauthorizedAccount";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
        readonly internalType: "address";
    }];
}, {
    readonly type: "error";
    readonly name: "ReentrancyGuardReentrantCall";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "SafeERC20FailedOperation";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
        readonly internalType: "address";
    }];
}, {
    readonly type: "error";
    readonly name: "StringTooLong";
    readonly inputs: readonly [{
        readonly name: "str";
        readonly type: "string";
        readonly internalType: "string";
    }];
}, {
    readonly type: "error";
    readonly name: "TokenNotSupported";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
        readonly internalType: "address";
    }];
}, {
    readonly type: "error";
    readonly name: "ZeroAmount";
    readonly inputs: readonly [];
}];
declare const usdcAbi: readonly [{
    readonly name: "Approval";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "spender";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "value";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }];
    readonly anonymous: false;
}, {
    readonly name: "Transfer";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly name: "from";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "to";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "value";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }];
    readonly anonymous: false;
}, {
    readonly name: "DOMAIN_SEPARATOR";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "allowance";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "spender";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "approve";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "value";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
        readonly internalType: "bool";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly name: "balanceOf";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "decimals";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint8";
        readonly internalType: "uint8";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "isBlacklisted";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_account";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
        readonly internalType: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "name";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
        readonly internalType: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "nonces";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "paused";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
        readonly internalType: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "permit";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "spender";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "value";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "v";
        readonly type: "uint8";
        readonly internalType: "uint8";
    }, {
        readonly name: "r";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "s";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly name: "version";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
        readonly internalType: "string";
    }];
    readonly stateMutability: "pure";
}];
declare const usdt0Abi: readonly [{
    readonly name: "Approval";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "spender";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "value";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }];
    readonly anonymous: false;
}, {
    readonly name: "MetaTransactionExecuted";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly name: "userAddress";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "relayerAddress";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address payable";
    }, {
        readonly name: "functionSignature";
        readonly type: "bytes";
        readonly indexed: false;
        readonly internalType: "bytes";
    }];
    readonly anonymous: false;
}, {
    readonly name: "Transfer";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly name: "from";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "to";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "value";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }];
    readonly anonymous: false;
}, {
    readonly name: "DOMAIN_SEPARATOR";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "allowance";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "spender";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "approve";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
        readonly internalType: "bool";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly name: "balanceOf";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "decimals";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint8";
        readonly internalType: "uint8";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "executeMetaTransaction";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "userAddress";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "functionSignature";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }, {
        readonly name: "sigR";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "sigS";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "sigV";
        readonly type: "uint8";
        readonly internalType: "uint8";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }];
    readonly stateMutability: "payable";
}, {
    readonly name: "getNonce";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "nonce";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "isBlocked";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
        readonly internalType: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "name";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
        readonly internalType: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "nonces";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly name: "permit";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "spender";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "value";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "v";
        readonly type: "uint8";
        readonly internalType: "uint8";
    }, {
        readonly name: "r";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "s";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}];

declare const ZERO_ADDRESS: Address;
/**
 * True for `0x` + 40 hex digits. All-lowercase and all-uppercase digits are accepted as
 * non-checksummed; mixed case must be a valid EIP-55 checksum (a typo guard, as in ethers).
 */
declare function isAddress(value: unknown): value is Address;
/** EIP-55 checksummed form. Throws TypeError on malformed input or on a wrong mixed-case checksum. */
declare function toChecksumAddress(value: string, field?: string): Address;
/** Case-insensitive address equality. Does not validate the format; callers validate first. */
declare function sameAddress(a: string, b: string): boolean;

declare const MAX_UINT256: bigint;
/** A uint256 as bigint, canonical-or-padded decimal string, or safe integer number. Throws TypeError otherwise. */
declare function toUint256(value: bigint | DecimalString | number, field?: string): bigint;
/** True for the wire format of a uint256: a decimal string without sign, exponent or leading zeros. */
declare function isCanonicalUint256(value: unknown): value is DecimalString;
/**
 * The largest amount `from` can send when `fee` is paid on top (`amount + fee <= balance`), or 0n
 * when the balance does not cover the fee plus the smallest unit. For cashlinks this is the claim
 * amount (§4.5).
 */
declare function maxSendable(balance: bigint | DecimalString, fee: bigint | DecimalString): bigint;

/**
 * Decimals every pinned token must have: MIN_FEE, FEE_GRANULARITY (0.01) and the relay's fee engine, which counts
 * USDC and USDT0 as $1 (§6.4), are in units of a 6-decimal USD token.
 */
declare const FEE_TOKEN_DECIMALS = 6;
/**
 * Default lifetime of a transfer intent (and of its permit) when the caller gives no deadline:
 * 10 minutes, well inside the relay window of 60–7200 s (§6.3) and short enough that an unsent or
 * withheld request stops being executable soon.
 */
declare const DEFAULT_DEADLINE_SECONDS = 600;

/**
 * Every address `request.to` must not be: the zero address, the pinned tokens, the transfer
 * contract, the legacy Nimiq handlers on Polygon mainnet (chain 137), and `pins.extraDeniedRecipients`.
 */
declare function recipientDenylist(pins: ChainPins): readonly Address[];
declare function isDeniedRecipient(pins: ChainPins, address: string): boolean;

type Types = Readonly<Record<string, readonly TypedDataField[]>>;
/**
 * EIP-712 domain separator. The `EIP712Domain` type contains exactly the fields present, in the
 * order name, version, chainId, verifyingContract, salt (as in viem and ethers).
 */
declare function hashDomain(domain: TypedDataDomain): Hex;
/**
 * EIP-712 digest (`keccak256(0x1901 ‖ domainSeparator ‖ hashStruct(message))`) of a payload whose types are
 * structs of atomic fields (address, uintN, bytes32, bytes, string) and of other structs in `types`. This covers
 * every payload the SDK builds; arrays and other types are rejected.
 */
declare function typedDataDigest(payload: {
    readonly domain: TypedDataDomain;
    readonly types: Types;
    readonly primaryType: string;
    readonly message: unknown;
}): Hex;
/**
 * `hashStruct(TokenAuth)` of a token authorization: the `auth` word of the signed message. It identifies the
 * authorization without revealing its signature (`TransferVersion.authHash`, the relay's `RequestState.authHash`).
 */
declare function tokenAuthHash(authorization: TokenAuthorization): Hex;
/**
 * The EIP-712 digest of a `GaslessTransfer` request at its nonce with its token authorization: equal to the
 * contract's `hashTransfer(r, nonce, auth)` and to the relay request id.
 */
declare function transferDigest(chainId: number, verifyingContract: Address, request: TransferRequest, authorization: TokenAuthorization): Hex;
/**
 * `transferDigest` from the request and `tokenAuthHash` of its token authorization: the id of a version without
 * its token signature (`TransferVersion`).
 */
declare function transferDigestFromAuthHash(chainId: number, verifyingContract: Address, request: TransferRequest, authHash: Hex): Hex;

/** secp256k1 group order n. */
declare const SECP256K1_N = 115792089237316195423570985008687907852837564279074904382605163141518161494337n;
/** Largest accepted s (n / 2, rounded down), as in OpenZeppelin ECDSA and EIP-2. */
declare const SECP256K1_HALF_N: bigint;
interface SignatureParts {
    readonly r: Hex;
    readonly s: Hex;
    /** Always 27 or 28. */
    readonly v: 27 | 28;
    readonly yParity: 0 | 1;
}
/**
 * Splits a 65-byte signature (r ‖ s ‖ v) and normalizes v to 27/28 (0/1 are accepted, e.g. from
 * hardware wallets). Rejects other lengths (including 64-byte EIP-2098 signatures), other v values,
 * r or s out of range, and high-s signatures.
 */
declare function splitSignature(signature: string, field?: string): SignatureParts;
/** The canonical 65-byte form: lowercase hex, low-s, v in {27, 28}. */
declare function normalizeSignature(signature: string, field?: string): Hex;
/** The token authorization of mode "none" as it is signed and sent: v = 0, r = s = 0. */
declare const NO_TOKEN_AUTHORIZATION: TokenAuthorization;
/**
 * The token authorization that the intent signs and the relay submits. For `none` there is no token signature
 * (v, r and s are 0); for `permit` and `metaTxApprove` the owner's token signature is split into v (27 or 28;
 * 0 and 1 are normalized), r and s. Build it before the intent is signed: the intent signs it as it is.
 */
declare function toTokenAuthorization(mode: AuthModeName, tokenSignature?: string | null): TokenAuthorization;
/**
 * Validates a wire `TokenAuthorization` and returns it with lowercase r and s and no other change: the intent
 * signs it, so v is not normalized here. Exactly the keys mode, v, r and s (`invalid_request` otherwise). Mode
 * "none" needs v = 0 and r = s = 0 (`auth_unexpected` otherwise); "permit" and "metaTxApprove" need v 27 or 28 and
 * r, s in range with low s (`invalid_signature`), as `toTokenAuthorization` builds them.
 */
declare function normalizeTokenAuthorization(auth: TokenAuthorization, field?: string): TokenAuthorization;

export { AMOY_CHAIN_ID, Address, AuthModeName, CHAINLINK_POL_USD_POLYGON, ChainPins, DEFAULT_DEADLINE_SECONDS, DecimalString, FEE_GRANULARITY, FEE_TOKEN_DECIMALS, Hex, LEGACY_NIMIQ_CONTRACTS_POLYGON, MAX_DEADLINE_SECONDS, MAX_UINT256, MIN_DEADLINE_SECONDS, MIN_FEE, NO_TOKEN_AUTHORIZATION, POLYGON_CHAIN_ID, POLYGON_TOKENS, POLYGON_USDC, POLYGON_USDT0, QUOTE_TTL_SECONDS, SECP256K1_HALF_N, SECP256K1_N, type SignatureParts, TokenAuthorization, type TokenInfo, TransferRequest, TypedDataDomain, TypedDataField, ZERO_ADDRESS, gaslessTransferAbi, hashDomain, isAddress, isCanonicalUint256, isDeniedRecipient, maxSendable, normalizeSignature, normalizeTokenAuthorization, recipientDenylist, sameAddress, splitSignature, toChecksumAddress, toTokenAuthorization, toUint256, tokenAuthHash, transferDigest, transferDigestFromAuthHash, typedDataDigest, usdcAbi, usdt0Abi };
