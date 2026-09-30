"use strict";
var NimiqGaslessCore = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/core/index.ts
  var core_exports = {};
  __export(core_exports, {
    AMOY_CHAIN_ID: () => AMOY_CHAIN_ID,
    APPROVE_SELECTOR: () => APPROVE_SELECTOR,
    AUTH_MODE_ID: () => AUTH_MODE_ID,
    CHAINLINK_POL_USD_POLYGON: () => CHAINLINK_POL_USD_POLYGON,
    DEFAULT_DEADLINE_SECONDS: () => DEFAULT_DEADLINE_SECONDS,
    DEFAULT_MAX_FEE: () => DEFAULT_MAX_FEE,
    FEE_GRANULARITY: () => FEE_GRANULARITY,
    FEE_TOKEN_DECIMALS: () => FEE_TOKEN_DECIMALS,
    GaslessError: () => GaslessError,
    GaslessValidationError: () => GaslessValidationError,
    InvalidPinsError: () => InvalidPinsError,
    LEGACY_NIMIQ_CONTRACTS_POLYGON: () => LEGACY_NIMIQ_CONTRACTS_POLYGON,
    MAX_DEADLINE_SECONDS: () => MAX_DEADLINE_SECONDS,
    MAX_FEE_CEILING: () => MAX_FEE_CEILING,
    MAX_UINT256: () => MAX_UINT2562,
    META_TRANSACTION_TYPES: () => META_TRANSACTION_TYPES,
    MIN_DEADLINE_SECONDS: () => MIN_DEADLINE_SECONDS,
    MIN_FEE: () => MIN_FEE,
    PERMIT_TYPES: () => PERMIT_TYPES,
    POLYGON_CHAIN_ID: () => POLYGON_CHAIN_ID,
    POLYGON_TOKENS: () => POLYGON_TOKENS,
    POLYGON_USDC: () => POLYGON_USDC,
    POLYGON_USDT0: () => POLYGON_USDT0,
    QUOTE_TTL_SECONDS: () => QUOTE_TTL_SECONDS,
    SECP256K1_HALF_N: () => SECP256K1_HALF_N,
    SECP256K1_N: () => SECP256K1_N,
    TRANSFER_DOMAIN_NAME: () => TRANSFER_DOMAIN_NAME,
    TRANSFER_DOMAIN_VERSION: () => TRANSFER_DOMAIN_VERSION,
    TRANSFER_TYPE: () => TRANSFER_TYPE,
    TRANSFER_TYPES: () => TRANSFER_TYPES,
    ZERO_ADDRESS: () => ZERO_ADDRESS,
    assertUnixSeconds: () => assertUnixSeconds,
    assertValidTransferRequest: () => assertValidTransferRequest,
    buildMetaTxApproveTypedData: () => buildMetaTxApproveTypedData,
    buildPermitTypedData: () => buildPermitTypedData,
    buildSubmitTransferBody: () => buildSubmitTransferBody,
    buildTokenAuthTypedData: () => buildTokenAuthTypedData,
    buildTransferTypedData: () => buildTransferTypedData,
    chainIdSalt: () => chainIdSalt,
    checkAcceptableFee: () => checkAcceptableFee,
    checkCorrection: () => checkCorrection,
    checkTokenAuthorization: () => checkTokenAuthorization,
    checkTransferPolicy: () => checkTransferPolicy,
    checkTransferRequestShape: () => checkTransferRequestShape,
    createTransferIntent: () => createTransferIntent,
    definePins: () => definePins,
    encodeApproveCalldata: () => encodeApproveCalldata,
    findPinnedToken: () => findPinnedToken,
    gaslessTransferAbi: () => gaslessTransferAbi,
    hashDomain: () => hashDomain,
    isAddress: () => isAddress,
    isCanonicalUint256: () => isCanonicalUint256,
    isDeniedRecipient: () => isDeniedRecipient,
    maxSendable: () => maxSendable,
    normalizeSignature: () => normalizeSignature,
    normalizeTokenAuthorization: () => normalizeTokenAuthorization,
    normalizeTransferRequest: () => normalizeTransferRequest,
    parseMaxAcceptableFee: () => parseMaxAcceptableFee,
    pinsFromDeployment: () => pinsFromDeployment,
    randomNonce: () => randomNonce,
    recipientDenylist: () => recipientDenylist,
    sameAddress: () => sameAddress,
    sameDomain: () => sameDomain,
    splitSignature: () => splitSignature,
    toChecksumAddress: () => toChecksumAddress,
    toTokenAuthorization: () => toTokenAuthorization,
    toUint256: () => toUint256,
    toUint256String: () => toUint256String,
    transferDigest: () => transferDigest,
    transferDomain: () => transferDomain,
    transferSigningPayloads: () => transferSigningPayloads,
    typedDataDigest: () => typedDataDigest,
    usdcAbi: () => usdcAbi,
    usdt0Abi: () => usdt0Abi,
    validateSubmitTransferBody: () => validateSubmitTransferBody,
    validateTransferRequest: () => validateTransferRequest
  });

  // src/core/types.ts
  var AUTH_MODE_ID = Object.freeze({ none: 0, permit: 1, metaTxApprove: 2 });

  // src/core/typedData.ts
  var TRANSFER_DOMAIN_NAME = "Nimiq Gasless Transfer";
  var TRANSFER_DOMAIN_VERSION = "1";
  var TRANSFER_TYPE = "GaslessTransfer(address token,address from,address to,uint256 amount,uint256 fee,address relay,bytes32 nonce,uint256 deadline)";
  var TRANSFER_TYPES = {
    GaslessTransfer: [
      { name: "token", type: "address" },
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "fee", type: "uint256" },
      { name: "relay", type: "address" },
      { name: "nonce", type: "bytes32" },
      { name: "deadline", type: "uint256" }
    ]
  };
  var PERMIT_TYPES = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ]
  };
  var META_TRANSACTION_TYPES = {
    MetaTransaction: [
      { name: "nonce", type: "uint256" },
      { name: "from", type: "address" },
      { name: "functionSignature", type: "bytes" }
    ]
  };
  var MAX_UINT256 = (1n << 256n) - 1n;
  var ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
  var BYTES32_RE = /^0x[0-9a-fA-F]{64}$/;
  function toUint256String(value, field = "value") {
    let n;
    if (typeof value === "bigint") {
      n = value;
    } else if (typeof value === "string" && /^[0-9]{1,78}$/.test(value)) {
      n = BigInt(value);
    } else {
      throw new TypeError(`${field}: expected a uint256 as bigint or decimal string`);
    }
    if (n < 0n || n > MAX_UINT256) throw new TypeError(`${field}: out of uint256 range`);
    return n.toString(10);
  }
  function assertAddress(value, field) {
    if (typeof value !== "string" || !ADDRESS_RE.test(value)) throw new TypeError(`${field}: expected a 20-byte hex address`);
    return value;
  }
  function assertBytes32(value, field) {
    if (typeof value !== "string" || !BYTES32_RE.test(value)) throw new TypeError(`${field}: expected 0x + 64 hex characters`);
    return value;
  }
  function copyDomain(domain) {
    return {
      name: domain.name,
      version: domain.version,
      ...domain.chainId !== void 0 ? { chainId: domain.chainId } : {},
      verifyingContract: domain.verifyingContract,
      ...domain.salt !== void 0 ? { salt: domain.salt } : {}
    };
  }
  function transferDomain(chainId, verifyingContract) {
    if (!Number.isSafeInteger(chainId) || chainId <= 0) throw new TypeError("chainId: expected a positive integer");
    return {
      name: TRANSFER_DOMAIN_NAME,
      version: TRANSFER_DOMAIN_VERSION,
      chainId,
      verifyingContract: assertAddress(verifyingContract, "verifyingContract")
    };
  }
  function buildTransferTypedData(chainId, verifyingContract, request) {
    return {
      domain: transferDomain(chainId, verifyingContract),
      types: TRANSFER_TYPES,
      primaryType: "GaslessTransfer",
      message: {
        token: assertAddress(request.token, "token"),
        from: assertAddress(request.from, "from"),
        to: assertAddress(request.to, "to"),
        amount: toUint256String(request.amount, "amount"),
        fee: toUint256String(request.fee, "fee"),
        relay: assertAddress(request.relay, "relay"),
        nonce: assertBytes32(request.nonce, "nonce"),
        deadline: toUint256String(request.deadline, "deadline")
      }
    };
  }
  function buildPermitTypedData(params) {
    return {
      domain: copyDomain(params.tokenDomain),
      types: PERMIT_TYPES,
      primaryType: "Permit",
      message: {
        owner: assertAddress(params.owner, "owner"),
        spender: assertAddress(params.spender, "spender"),
        value: toUint256String(params.value, "value"),
        nonce: toUint256String(params.nonce, "nonce"),
        deadline: toUint256String(params.deadline, "deadline")
      }
    };
  }
  var APPROVE_SELECTOR = "0x095ea7b3";
  function encodeApproveCalldata(spender, value) {
    const s = assertAddress(spender, "spender").slice(2).toLowerCase().padStart(64, "0");
    const v = BigInt(toUint256String(value, "value")).toString(16).padStart(64, "0");
    return `${APPROVE_SELECTOR}${s}${v}`;
  }
  function buildMetaTxApproveTypedData(params) {
    return {
      domain: copyDomain(params.tokenDomain),
      types: META_TRANSACTION_TYPES,
      primaryType: "MetaTransaction",
      message: {
        nonce: toUint256String(params.nonce, "nonce"),
        from: assertAddress(params.from, "from"),
        functionSignature: encodeApproveCalldata(params.spender, params.value)
      }
    };
  }

  // src/core/constants.ts
  var POLYGON_CHAIN_ID = 137;
  var AMOY_CHAIN_ID = 80002;
  function deepFreeze(value) {
    if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
      Object.freeze(value);
      for (const v of Object.values(value)) deepFreeze(v);
    }
    return value;
  }
  var POLYGON_USDC = deepFreeze({
    symbol: "USDC",
    address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    decimals: 6,
    authModes: ["permit", "none"],
    domain: {
      name: "USD Coin",
      version: "2",
      chainId: POLYGON_CHAIN_ID,
      verifyingContract: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
    },
    domainSeparator: "0xcaa2ce1a5703ccbe253a34eb3166df60a705c561b44b192061e28f2a985be2ca"
  });
  var POLYGON_USDT0 = deepFreeze({
    symbol: "USDT0",
    address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    decimals: 6,
    authModes: ["permit", "metaTxApprove", "none"],
    domain: {
      name: "USDT0",
      version: "1",
      verifyingContract: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      salt: "0x0000000000000000000000000000000000000000000000000000000000000089"
    },
    domainSeparator: "0x7b43b7deae87806d0ace67d6c8e9e347fc85db8ad198e756e5c17d126fef9a05"
  });
  var POLYGON_TOKENS = deepFreeze([POLYGON_USDC, POLYGON_USDT0]);
  var DEFAULT_MAX_FEE = "5000000";
  var MIN_DEADLINE_SECONDS = 60;
  var MAX_DEADLINE_SECONDS = 7200;
  var QUOTE_TTL_SECONDS = 120;
  var FEE_GRANULARITY = "10000";
  var MIN_FEE = "10000";
  var CHAINLINK_POL_USD_POLYGON = "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0";
  var LEGACY_NIMIQ_CONTRACTS_POLYGON = deepFreeze([
    "0x98E69a6927747339d5E543586FC0262112eBe4BD",
    "0xF615bD7EA00C4Cc7F39Faad0895dB5f40891359f",
    "0x3157d422cd1be13AC4a7cb00957ed717e648DFf2",
    "0x0cFD862bE942846Cebad797d7c1BC6e47714959b",
    "0xfAbBed813017bF535b40013c13b8702638aC25CD",
    "0x3c870b039BF82D2F883b6E89D41d06d26b9F4486"
  ]);

  // src/core/abi.ts
  var gaslessTransferAbi = [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "tokens",
          "type": "tuple[]",
          "internalType": "struct TokenInit[]",
          "components": [
            {
              "name": "token",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "permit",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "metaTxApprove",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "allowance",
              "type": "bool",
              "internalType": "bool"
            }
          ]
        },
        {
          "name": "maxFee",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "DOMAIN_SEPARATOR",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "MAX_FEE",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "MAX_FEE_CEILING",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "TRANSFER_TYPEHASH",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "eip712Domain",
      "inputs": [],
      "outputs": [
        {
          "name": "fields",
          "type": "bytes1",
          "internalType": "bytes1"
        },
        {
          "name": "name",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "version",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "chainId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "verifyingContract",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "salt",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "extensions",
          "type": "uint256[]",
          "internalType": "uint256[]"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "hashTransfer",
      "inputs": [
        {
          "name": "r",
          "type": "tuple",
          "internalType": "struct TransferRequest",
          "components": [
            {
              "name": "token",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "from",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "to",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "amount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "fee",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "relay",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "nonce",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "deadline",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "invalidateNonce",
      "inputs": [
        {
          "name": "nonce",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "nonceUsed",
      "inputs": [
        {
          "name": "signer",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "nonce",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "relayTransfer",
      "inputs": [
        {
          "name": "r",
          "type": "tuple",
          "internalType": "struct TransferRequest",
          "components": [
            {
              "name": "token",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "from",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "to",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "amount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "fee",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "relay",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "nonce",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "deadline",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        },
        {
          "name": "signature",
          "type": "bytes",
          "internalType": "bytes"
        },
        {
          "name": "auth",
          "type": "tuple",
          "internalType": "struct TokenAuth",
          "components": [
            {
              "name": "mode",
              "type": "uint8",
              "internalType": "enum AuthMode"
            },
            {
              "name": "v",
              "type": "uint8",
              "internalType": "uint8"
            },
            {
              "name": "r",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "s",
              "type": "bytes32",
              "internalType": "bytes32"
            }
          ]
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "tokenConfig",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "tuple",
          "internalType": "struct TokenConfig",
          "components": [
            {
              "name": "supported",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "permit",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "metaTxApprove",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "allowance",
              "type": "bool",
              "internalType": "bool"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "event",
      "name": "EIP712DomainChanged",
      "inputs": [],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "NonceInvalidated",
      "inputs": [
        {
          "name": "signer",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "nonce",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "TransferRelayed",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "from",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "to",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "fee",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "relay",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "nonce",
          "type": "bytes32",
          "indexed": false,
          "internalType": "bytes32"
        }
      ],
      "anonymous": false
    },
    {
      "type": "error",
      "name": "AuthModeNotSupported",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "mode",
          "type": "uint8",
          "internalType": "enum AuthMode"
        }
      ]
    },
    {
      "type": "error",
      "name": "DeadlineExpired",
      "inputs": [
        {
          "name": "deadline",
          "type": "uint256",
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "error",
      "name": "FeeAboveMax",
      "inputs": [
        {
          "name": "fee",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "maxFee",
          "type": "uint256",
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "error",
      "name": "InsufficientAllowance",
      "inputs": [
        {
          "name": "allowance",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "required",
          "type": "uint256",
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "error",
      "name": "InvalidConfig",
      "inputs": []
    },
    {
      "type": "error",
      "name": "InvalidRecipient",
      "inputs": [
        {
          "name": "to",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "InvalidShortString",
      "inputs": []
    },
    {
      "type": "error",
      "name": "InvalidSignature",
      "inputs": []
    },
    {
      "type": "error",
      "name": "InvalidSigner",
      "inputs": []
    },
    {
      "type": "error",
      "name": "NonceAlreadyUsed",
      "inputs": [
        {
          "name": "signer",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "nonce",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ]
    },
    {
      "type": "error",
      "name": "NotRelay",
      "inputs": [
        {
          "name": "caller",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "relay",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "ReentrancyGuardReentrantCall",
      "inputs": []
    },
    {
      "type": "error",
      "name": "SafeERC20FailedOperation",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "StringTooLong",
      "inputs": [
        {
          "name": "str",
          "type": "string",
          "internalType": "string"
        }
      ]
    },
    {
      "type": "error",
      "name": "TokenNotSupported",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "ZeroAmount",
      "inputs": []
    }
  ];
  var usdcAbi = [
    {
      "name": "Approval",
      "type": "event",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "spender",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "value",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "name": "Transfer",
      "type": "event",
      "inputs": [
        {
          "name": "from",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "to",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "value",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "name": "DOMAIN_SEPARATOR",
      "type": "function",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "view"
    },
    {
      "name": "allowance",
      "type": "function",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "spender",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "name": "approve",
      "type": "function",
      "inputs": [
        {
          "name": "spender",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "value",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "name": "balanceOf",
      "type": "function",
      "inputs": [
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "name": "decimals",
      "type": "function",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint8",
          "internalType": "uint8"
        }
      ],
      "stateMutability": "view"
    },
    {
      "name": "isBlacklisted",
      "type": "function",
      "inputs": [
        {
          "name": "_account",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "name": "name",
      "type": "function",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "string",
          "internalType": "string"
        }
      ],
      "stateMutability": "view"
    },
    {
      "name": "nonces",
      "type": "function",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "name": "paused",
      "type": "function",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "name": "permit",
      "type": "function",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "spender",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "value",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "deadline",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "v",
          "type": "uint8",
          "internalType": "uint8"
        },
        {
          "name": "r",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "s",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "name": "version",
      "type": "function",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "string",
          "internalType": "string"
        }
      ],
      "stateMutability": "pure"
    }
  ];
  var usdt0Abi = [
    {
      "name": "Approval",
      "type": "event",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "spender",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "value",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "name": "MetaTransactionExecuted",
      "type": "event",
      "inputs": [
        {
          "name": "userAddress",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "relayerAddress",
          "type": "address",
          "indexed": true,
          "internalType": "address payable"
        },
        {
          "name": "functionSignature",
          "type": "bytes",
          "indexed": false,
          "internalType": "bytes"
        }
      ],
      "anonymous": false
    },
    {
      "name": "Transfer",
      "type": "event",
      "inputs": [
        {
          "name": "from",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "to",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "value",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "name": "DOMAIN_SEPARATOR",
      "type": "function",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "view"
    },
    {
      "name": "allowance",
      "type": "function",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "spender",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "name": "approve",
      "type": "function",
      "inputs": [
        {
          "name": "spender",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "name": "balanceOf",
      "type": "function",
      "inputs": [
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "name": "decimals",
      "type": "function",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint8",
          "internalType": "uint8"
        }
      ],
      "stateMutability": "view"
    },
    {
      "name": "executeMetaTransaction",
      "type": "function",
      "inputs": [
        {
          "name": "userAddress",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "functionSignature",
          "type": "bytes",
          "internalType": "bytes"
        },
        {
          "name": "sigR",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "sigS",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "sigV",
          "type": "uint8",
          "internalType": "uint8"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bytes",
          "internalType": "bytes"
        }
      ],
      "stateMutability": "payable"
    },
    {
      "name": "getNonce",
      "type": "function",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "nonce",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "name": "isBlocked",
      "type": "function",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "name": "name",
      "type": "function",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "string",
          "internalType": "string"
        }
      ],
      "stateMutability": "view"
    },
    {
      "name": "nonces",
      "type": "function",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "name": "permit",
      "type": "function",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "spender",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "value",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "deadline",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "v",
          "type": "uint8",
          "internalType": "uint8"
        },
        {
          "name": "r",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "s",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    }
  ];

  // src/core/keccak.ts
  var MASK_64 = (1n << 64n) - 1n;
  var RATE_BYTES = 136;
  var ROUNDS = 24;
  var RHO_OFFSETS = (() => {
    const offsets = new Array(25).fill(0);
    let x = 1;
    let y = 0;
    for (let t = 0; t < 24; t++) {
      offsets[x + 5 * y] = (t + 1) * (t + 2) / 2 % 64;
      [x, y] = [y, (2 * x + 3 * y) % 5];
    }
    return offsets;
  })();
  var ROUND_CONSTANTS = (() => {
    const constants = [];
    let lfsr = 1;
    for (let round = 0; round < ROUNDS; round++) {
      let rc = 0n;
      for (let j = 0; j <= 6; j++) {
        if (lfsr & 1) rc |= 1n << BigInt((1 << j) - 1);
        lfsr = lfsr & 128 ? (lfsr << 1 ^ 113) & 255 : lfsr << 1 & 255;
      }
      constants.push(rc);
    }
    return constants;
  })();
  function rotl64(value, shift) {
    if (shift === 0) return value;
    const s = BigInt(shift);
    return (value << s | value >> 64n - s) & MASK_64;
  }
  function at(values, index) {
    const value = values[index];
    if (value === void 0) throw new RangeError("keccak: index out of range");
    return value;
  }
  function lane(values, index) {
    return at(values, index);
  }
  function keccakF1600(state) {
    const c = new Array(5).fill(0n);
    const b = new Array(25).fill(0n);
    for (let round = 0; round < ROUNDS; round++) {
      for (let x = 0; x < 5; x++) {
        c[x] = lane(state, x) ^ lane(state, x + 5) ^ lane(state, x + 10) ^ lane(state, x + 15) ^ lane(state, x + 20);
      }
      for (let x = 0; x < 5; x++) {
        const d = lane(c, (x + 4) % 5) ^ rotl64(lane(c, (x + 1) % 5), 1);
        for (let y = 0; y < 5; y++) state[x + 5 * y] = lane(state, x + 5 * y) ^ d;
      }
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          b[y + 5 * ((2 * x + 3 * y) % 5)] = rotl64(lane(state, x + 5 * y), at(RHO_OFFSETS, x + 5 * y));
        }
      }
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const notNext = ~lane(b, (x + 1) % 5 + 5 * y) & MASK_64;
          state[x + 5 * y] = lane(b, x + 5 * y) ^ notNext & lane(b, (x + 2) % 5 + 5 * y);
        }
      }
      state[0] = lane(state, 0) ^ lane(ROUND_CONSTANTS, round);
    }
  }
  function keccak256(data) {
    const padded = new Uint8Array((Math.floor(data.length / RATE_BYTES) + 1) * RATE_BYTES);
    padded.set(data);
    padded[data.length] = (padded[data.length] ?? 0) ^ 1;
    padded[padded.length - 1] = (padded[padded.length - 1] ?? 0) ^ 128;
    const state = new Array(25).fill(0n);
    for (let offset = 0; offset < padded.length; offset += RATE_BYTES) {
      for (let i = 0; i < RATE_BYTES / 8; i++) {
        let word = 0n;
        for (let k = 7; k >= 0; k--) word = word << 8n | BigInt(padded[offset + 8 * i + k] ?? 0);
        state[i] = lane(state, i) ^ word;
      }
      keccakF1600(state);
    }
    const out = new Uint8Array(32);
    for (let i = 0; i < 4; i++) {
      let word = lane(state, i);
      for (let k = 0; k < 8; k++) {
        out[8 * i + k] = Number(word & 0xffn);
        word >>= 8n;
      }
    }
    return out;
  }

  // src/core/address.ts
  var ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  var ADDRESS_FORMAT_RE = /^0x[0-9a-fA-F]{40}$/;
  function checksum(lowercaseBody) {
    const hash = keccak256(new TextEncoder().encode(lowercaseBody));
    let out = "";
    for (let i = 0; i < 40; i++) {
      const char = lowercaseBody.charAt(i);
      const byte = hash[i >> 1] ?? 0;
      const nibble = i % 2 === 0 ? byte >> 4 : byte & 15;
      out += nibble >= 8 ? char.toUpperCase() : char;
    }
    return out;
  }
  function hasMixedCase(body) {
    return body !== body.toLowerCase() && body !== body.toUpperCase();
  }
  function isAddress(value) {
    if (typeof value !== "string" || !ADDRESS_FORMAT_RE.test(value)) return false;
    const body = value.slice(2);
    return !hasMixedCase(body) || checksum(body.toLowerCase()) === body;
  }
  function toChecksumAddress(value, field = "address") {
    if (typeof value !== "string" || !ADDRESS_FORMAT_RE.test(value)) {
      throw new TypeError(`${field}: expected 0x followed by 40 hex characters`);
    }
    const body = value.slice(2);
    const checksummed = checksum(body.toLowerCase());
    if (hasMixedCase(body) && checksummed !== body) throw new TypeError(`${field}: invalid EIP-55 checksum`);
    return `0x${checksummed}`;
  }
  function sameAddress(a, b) {
    return typeof a === "string" && typeof b === "string" && a.toLowerCase() === b.toLowerCase();
  }

  // src/core/amounts.ts
  var MAX_UINT2562 = (1n << 256n) - 1n;
  var UINT_RE = /^[0-9]{1,78}$/;
  var CANONICAL_UINT_RE = /^(0|[1-9][0-9]{0,77})$/;
  function toUint256(value, field = "value") {
    let n;
    if (typeof value === "bigint") n = value;
    else if (typeof value === "number" && Number.isSafeInteger(value)) n = BigInt(value);
    else if (typeof value === "string" && UINT_RE.test(value)) n = BigInt(value);
    else throw new TypeError(`${field}: expected a uint256 as bigint, decimal string or safe integer`);
    if (n < 0n || n > MAX_UINT2562) throw new TypeError(`${field}: out of uint256 range`);
    return n;
  }
  function isCanonicalUint256(value) {
    return typeof value === "string" && CANONICAL_UINT_RE.test(value) && BigInt(value) <= MAX_UINT2562;
  }
  function maxSendable(balance, fee) {
    const b = toUint256(balance, "balance");
    const f = toUint256(fee, "fee");
    return b > f ? b - f : 0n;
  }

  // src/core/defaults.ts
  var MAX_FEE_CEILING = "50000000";
  var FEE_TOKEN_DECIMALS = 6;
  var DEFAULT_DEADLINE_SECONDS = 600;

  // src/core/denylist.ts
  function denylistEntries(pins) {
    return [
      ZERO_ADDRESS,
      ...pins.tokens.map((token) => token.address),
      pins.transfer.address,
      ...pins.chainId === POLYGON_CHAIN_ID ? LEGACY_NIMIQ_CONTRACTS_POLYGON : [],
      ...pins.extraDeniedRecipients
    ];
  }
  function recipientDenylist(pins) {
    const list = [];
    for (const entry of denylistEntries(pins)) {
      const address = toChecksumAddress(entry);
      if (!list.includes(address)) list.push(address);
    }
    return Object.freeze(list);
  }
  function isDeniedRecipient(pins, address) {
    return denylistEntries(pins).some((denied) => sameAddress(denied, address));
  }

  // src/core/bytes.ts
  var HEX_DIGITS_RE = /^[0-9a-fA-F]*$/;
  function hexToBytes(hex, field = "value") {
    if (typeof hex !== "string" || !hex.startsWith("0x") || hex.length % 2 !== 0 || !HEX_DIGITS_RE.test(hex.slice(2))) {
      throw new TypeError(`${field}: expected 0x-prefixed hex with an even number of digits`);
    }
    const out = new Uint8Array((hex.length - 2) / 2);
    for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(hex.slice(2 + 2 * i, 4 + 2 * i), 16);
    return out;
  }
  function bytesToHex(bytes) {
    let hex = "0x";
    for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
    return hex;
  }
  function concatBytes(...parts) {
    const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
    let offset = 0;
    for (const part of parts) {
      out.set(part, offset);
      offset += part.length;
    }
    return out;
  }
  function uint256Word(value) {
    if (value < 0n || value >> 256n !== 0n) throw new RangeError("uint256 out of range");
    const out = new Uint8Array(32);
    let rest = value;
    for (let i = 31; i >= 0; i--) {
      out[i] = Number(rest & 0xffn);
      rest >>= 8n;
    }
    return out;
  }
  function utf8Bytes(text) {
    return new TextEncoder().encode(text);
  }
  function deepFreeze2(value) {
    if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
      Object.freeze(value);
      for (const nested of Object.values(value)) deepFreeze2(nested);
    }
    return value;
  }
  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  // src/core/eip712.ts
  var ADDRESS_RE2 = /^0x[0-9a-fA-F]{40}$/;
  var BYTES32_RE2 = /^0x[0-9a-fA-F]{64}$/;
  var UINT_RE2 = /^[0-9]{1,78}$/;
  function keccakText(text) {
    return keccak256(utf8Bytes(text));
  }
  function addressWord(value, field) {
    if (typeof value !== "string" || !ADDRESS_RE2.test(value)) throw new TypeError(`${field}: expected an address`);
    return concatBytes(new Uint8Array(12), hexToBytes(value, field));
  }
  function uintWord(value, field) {
    let n;
    if (typeof value === "bigint") n = value;
    else if (typeof value === "number" && Number.isSafeInteger(value)) n = BigInt(value);
    else if (typeof value === "string" && UINT_RE2.test(value)) n = BigInt(value);
    else throw new TypeError(`${field}: expected a uint256`);
    if (n < 0n || n >> 256n !== 0n) throw new TypeError(`${field}: out of uint256 range`);
    return uint256Word(n);
  }
  function bytes32Word(value, field) {
    if (typeof value !== "string" || !BYTES32_RE2.test(value)) throw new TypeError(`${field}: expected bytes32`);
    return hexToBytes(value, field);
  }
  function encodeField(type, value, field) {
    switch (type) {
      case "address":
        return addressWord(value, field);
      case "uint256":
        return uintWord(value, field);
      case "bytes32":
        return bytes32Word(value, field);
      case "bytes":
        if (typeof value !== "string") throw new TypeError(`${field}: expected hex bytes`);
        return keccak256(hexToBytes(value, field));
      case "string":
        if (typeof value !== "string") throw new TypeError(`${field}: expected a string`);
        return keccakText(value);
      default:
        throw new TypeError(`${field}: unsupported EIP-712 type ${type}`);
    }
  }
  function hashDomain(domain) {
    const fields = ["string name", "string version"];
    const words = [encodeField("string", domain.name, "domain.name"), encodeField("string", domain.version, "domain.version")];
    if (domain.chainId !== void 0) {
      fields.push("uint256 chainId");
      words.push(uintWord(domain.chainId, "domain.chainId"));
    }
    fields.push("address verifyingContract");
    words.push(addressWord(domain.verifyingContract, "domain.verifyingContract"));
    if (domain.salt !== void 0) {
      fields.push("bytes32 salt");
      words.push(bytes32Word(domain.salt, "domain.salt"));
    }
    const typeHash = keccakText(`EIP712Domain(${fields.join(",")})`);
    return bytesToHex(keccak256(concatBytes(typeHash, ...words)));
  }
  function typedDataDigest(payload) {
    const typeNames = Object.keys(payload.types);
    const fields = payload.types[payload.primaryType];
    if (typeNames.length !== 1 || fields === void 0) {
      throw new TypeError("typedDataDigest: expected exactly one (flat) struct type, the primary type");
    }
    const message = payload.message;
    if (message === null || typeof message !== "object") throw new TypeError("message: expected an object");
    const typeString = `${payload.primaryType}(${fields.map((f) => `${f.type} ${f.name}`).join(",")})`;
    const structHash = keccak256(
      concatBytes(keccakText(typeString), ...fields.map((f) => encodeField(f.type, message[f.name], `message.${f.name}`)))
    );
    return bytesToHex(
      keccak256(concatBytes(new Uint8Array([25, 1]), hexToBytes(hashDomain(payload.domain)), structHash))
    );
  }
  function transferDigest(chainId, verifyingContract, request) {
    return typedDataDigest(buildTransferTypedData(chainId, verifyingContract, request));
  }

  // src/core/errors.ts
  var GaslessError = class extends Error {
    constructor(code, message, options) {
      super(message, options);
      __publicField(this, "code");
      this.name = "GaslessError";
      this.code = code;
    }
  };
  var GaslessValidationError = class _GaslessValidationError extends GaslessError {
    constructor(code, field, message) {
      super(code, message);
      /** Dotted path of the offending input field, e.g. `request.to` or `tokenAuth.message.value`. */
      __publicField(this, "field");
      this.name = "GaslessValidationError";
      this.field = field;
    }
    static fromResult(result) {
      return new _GaslessValidationError(result.code, result.field, result.message);
    }
  };
  var InvalidPinsError = class extends GaslessError {
    constructor(field, message) {
      super("invalid_pins", `${field}: ${message}`);
      __publicField(this, "field");
      this.name = "InvalidPinsError";
      this.field = field;
    }
  };
  function validationFailure(code, field, message) {
    return { ok: false, code, field, message };
  }
  var VALID = Object.freeze({ ok: true });

  // src/core/nonce.ts
  function randomNonce() {
    const source = globalThis.crypto;
    if (source === void 0 || typeof source.getRandomValues !== "function") {
      throw new Error("randomNonce: crypto.getRandomValues is not available");
    }
    const bytes = source.getRandomValues(new Uint8Array(32));
    if (bytes.every((byte) => byte === 0)) throw new Error("randomNonce: the random source returned only zeros");
    return bytesToHex(bytes);
  }

  // src/core/pins.ts
  var AUTH_MODE_NAMES = ["none", "permit", "metaTxApprove"];
  var DOMAIN_KEYS = ["name", "version", "chainId", "verifyingContract", "salt"];
  var BYTES32_RE3 = /^0x[0-9a-fA-F]{64}$/;
  var SYMBOL_RE = /^[\x21-\x7e]{1,32}$/;
  function fail(field, message) {
    throw new InvalidPinsError(field, message);
  }
  function pinAddress(value, field) {
    if (typeof value !== "string") fail(field, "expected an address string");
    let address;
    try {
      address = toChecksumAddress(value, field);
    } catch (error) {
      fail(field, error instanceof Error ? error.message : "invalid address");
    }
    if (address === ZERO_ADDRESS) fail(field, "must not be the zero address");
    return address;
  }
  function positiveSafeInteger(value, field) {
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) fail(field, "expected a positive integer");
    return value;
  }
  function chainIdSalt(chainId) {
    return `0x${chainId.toString(16).padStart(64, "0")}`;
  }
  function pinDomain(input, field, chainId, tokenAddress) {
    if (!isPlainObject(input)) fail(field, "expected an object");
    for (const key of Object.keys(input)) {
      if (!DOMAIN_KEYS.includes(key)) fail(`${field}.${key}`, "unexpected EIP-712 domain field");
    }
    const { name, version, chainId: domainChainId, verifyingContract, salt } = input;
    if (typeof name !== "string" || name.length === 0) fail(`${field}.name`, "expected a non-empty string");
    if (typeof version !== "string" || version.length === 0) fail(`${field}.version`, "expected a non-empty string");
    if (domainChainId !== void 0 && domainChainId !== chainId) fail(`${field}.chainId`, `must equal the pinned chainId ${chainId}`);
    if (!sameAddress(pinAddress(verifyingContract, `${field}.verifyingContract`), tokenAddress)) {
      fail(`${field}.verifyingContract`, "must equal the token address");
    }
    if (salt !== void 0) {
      if (typeof salt !== "string" || !BYTES32_RE3.test(salt)) fail(`${field}.salt`, "expected bytes32");
      if (salt.toLowerCase() !== chainIdSalt(chainId)) fail(`${field}.salt`, "must be bytes32(chainId)");
    }
    if (domainChainId === void 0 && salt === void 0) fail(field, "must bind the chain via chainId or salt");
    return {
      name,
      version,
      ...domainChainId !== void 0 ? { chainId } : {},
      verifyingContract: tokenAddress,
      ...salt !== void 0 ? { salt: salt.toLowerCase() } : {}
    };
  }
  function pinToken(input, field, chainId) {
    if (!isPlainObject(input)) fail(field, "expected an object");
    const { symbol, decimals, authModes, domainSeparator } = input;
    if (typeof symbol !== "string" || !SYMBOL_RE.test(symbol)) fail(`${field}.symbol`, "expected 1-32 printable characters without spaces");
    const address = pinAddress(input.address, `${field}.address`);
    if (decimals !== FEE_TOKEN_DECIMALS) fail(`${field}.decimals`, `must be ${FEE_TOKEN_DECIMALS} (MAX_FEE is in 6-decimal units)`);
    if (!Array.isArray(authModes) || authModes.length === 0) fail(`${field}.authModes`, "expected a non-empty array");
    const modes = [];
    for (const [i, mode] of authModes.entries()) {
      if (!AUTH_MODE_NAMES.includes(mode)) fail(`${field}.authModes[${i}]`, "unknown auth mode");
      if (modes.includes(mode)) fail(`${field}.authModes[${i}]`, "duplicate auth mode");
      modes.push(mode);
    }
    const domain = pinDomain(input.domain, `${field}.domain`, chainId, address);
    const separator = hashDomain(domain);
    if (domainSeparator !== void 0 && (typeof domainSeparator !== "string" || domainSeparator.toLowerCase() !== separator)) {
      fail(`${field}.domainSeparator`, "does not match the hash of the domain");
    }
    return { symbol, address, decimals, authModes: modes, domain, domainSeparator: separator };
  }
  function sameAuthModes(a, b) {
    return a.length === b.length && a.every((mode) => b.includes(mode));
  }
  function sameDomain(a, b) {
    const sameSalt = a.salt === void 0 || b.salt === void 0 ? a.salt === b.salt : typeof a.salt === "string" && typeof b.salt === "string" && a.salt.toLowerCase() === b.salt.toLowerCase();
    return a.name === b.name && a.version === b.version && a.chainId === b.chainId && sameAddress(a.verifyingContract, b.verifyingContract) && sameSalt;
  }
  function checkPolygonToken(token, field) {
    const known = POLYGON_TOKENS.find((t) => sameAddress(t.address, token.address));
    if (known === void 0) fail(`${field}.address`, "not a known Polygon token (USDC, USDT0)");
    if (token.symbol !== known.symbol) fail(`${field}.symbol`, `expected ${known.symbol}`);
    if (!sameAuthModes(token.authModes, known.authModes)) fail(`${field}.authModes`, `expected ${known.authModes.join(", ")}`);
    if (!sameDomain(token.domain, known.domain)) fail(`${field}.domain`, `does not match the ${known.symbol} domain`);
    if (token.domainSeparator !== known.domainSeparator.toLowerCase()) fail(`${field}.domain`, "separator differs from the pinned mainnet value");
  }
  function definePins(input) {
    if (!isPlainObject(input)) fail("pins", "expected an object");
    const chainId = positiveSafeInteger(input.chainId, "chainId");
    const transferAddress = pinAddress(input.transfer, "transfer");
    if (!Array.isArray(input.tokens) || input.tokens.length === 0) fail("tokens", "expected a non-empty array");
    const tokens = [];
    for (const [i, raw] of input.tokens.entries()) {
      const token = pinToken(raw, `tokens[${i}]`, chainId);
      if (tokens.some((t) => t.address === token.address)) fail(`tokens[${i}].address`, "duplicate token");
      if (tokens.some((t) => t.symbol === token.symbol)) fail(`tokens[${i}].symbol`, "duplicate symbol");
      if (token.address === transferAddress) fail(`tokens[${i}].address`, "must differ from the transfer contract");
      if (chainId === POLYGON_CHAIN_ID) checkPolygonToken(token, `tokens[${i}]`);
      tokens.push(token);
    }
    if (!Array.isArray(input.relays) || input.relays.length === 0) fail("relays", "expected a non-empty array");
    const relays = [];
    for (const [i, raw] of input.relays.entries()) {
      const relay = pinAddress(raw, `relays[${i}]`);
      if (relays.includes(relay)) fail(`relays[${i}]`, "duplicate relay");
      if (relay === transferAddress || tokens.some((t) => t.address === relay)) {
        fail(`relays[${i}]`, "must not be the transfer contract or a token");
      }
      relays.push(relay);
    }
    let maxFee;
    try {
      maxFee = toUint256(input.maxFee, "maxFee");
    } catch (error) {
      fail("maxFee", error instanceof Error ? error.message : "invalid");
    }
    if (maxFee === 0n || maxFee > BigInt(MAX_FEE_CEILING)) fail("maxFee", `must be between 1 and ${MAX_FEE_CEILING}`);
    let deployBlock = null;
    if (input.deployBlock !== void 0 && input.deployBlock !== null) {
      if (typeof input.deployBlock !== "number" || !Number.isSafeInteger(input.deployBlock) || input.deployBlock < 0) {
        fail("deployBlock", "expected a non-negative integer");
      }
      deployBlock = input.deployBlock;
    }
    const extraDeniedRecipients = [];
    if (input.extraDeniedRecipients !== void 0) {
      if (!Array.isArray(input.extraDeniedRecipients)) fail("extraDeniedRecipients", "expected an array");
      for (const [i, raw] of input.extraDeniedRecipients.entries()) {
        const address = pinAddress(raw, `extraDeniedRecipients[${i}]`);
        if (!extraDeniedRecipients.includes(address)) extraDeniedRecipients.push(address);
      }
    }
    if (chainId === POLYGON_CHAIN_ID && LEGACY_NIMIQ_CONTRACTS_POLYGON.some((a) => sameAddress(a, transferAddress))) {
      fail("transfer", "is a legacy Nimiq contract");
    }
    return deepFreeze2({
      chainId,
      transfer: { address: transferAddress, domain: transferDomain(chainId, transferAddress) },
      relays,
      tokens,
      maxFee: maxFee.toString(10),
      deployBlock,
      extraDeniedRecipients
    });
  }
  function findPinnedToken(pins, address) {
    return pins.tokens.find((token) => sameAddress(token.address, address));
  }
  var AUTH_MODE_ALIASES = {
    none: "none",
    permit: "permit",
    metaTxApprove: "metaTxApprove",
    NONE: "none",
    PERMIT: "permit",
    META_TX_APPROVE: "metaTxApprove"
  };
  function fileInteger(value, field) {
    const n = typeof value === "number" ? value : typeof value === "string" && /^[0-9]{1,16}$/.test(value) ? Number(value) : Number.NaN;
    if (!Number.isSafeInteger(n) || n < 0) fail(field, "expected a non-negative integer (number or decimal string)");
    return n;
  }
  function fileAuthMode(value, field) {
    if (typeof value === "number") {
      const byId = AUTH_MODE_NAMES.find((name) => AUTH_MODE_ID[name] === value);
      if (byId !== void 0) return byId;
    } else if (typeof value === "string" && Object.prototype.hasOwnProperty.call(AUTH_MODE_ALIASES, value)) {
      return AUTH_MODE_ALIASES[value];
    }
    return fail(field, "unknown auth mode");
  }
  function fileDomain(value, field) {
    if (!isPlainObject(value)) fail(field, "expected an object");
    const domain = { ...value };
    if (domain.chainId === null) delete domain.chainId;
    else if (domain.chainId !== void 0) domain.chainId = fileInteger(domain.chainId, `${field}.chainId`);
    if (domain.salt === null) delete domain.salt;
    return domain;
  }
  function pinsFromDeployment(deployment, options) {
    if (!isPlainObject(deployment)) fail("deployment", "expected an object");
    if (!isPlainObject(options)) fail("options", "expected { relays }");
    if (!Array.isArray(deployment.tokens)) fail("tokens", "expected an array");
    const maxFee = deployment.maxFee;
    if (typeof maxFee !== "string" && !(typeof maxFee === "number" && Number.isSafeInteger(maxFee))) {
      fail("maxFee", "expected a decimal string or an integer");
    }
    return definePins({
      chainId: fileInteger(deployment.chainId, "chainId"),
      transfer: pinAddress(deployment.gaslessTransfer, "gaslessTransfer"),
      maxFee,
      deployBlock: fileInteger(deployment.deployBlock, "deployBlock"),
      relays: options.relays,
      ...options.extraDeniedRecipients !== void 0 ? { extraDeniedRecipients: options.extraDeniedRecipients } : {},
      tokens: deployment.tokens.map((raw, i) => {
        const field = `tokens[${i}]`;
        if (!isPlainObject(raw)) fail(field, "expected an object");
        if (!Array.isArray(raw.authModes)) fail(`${field}.authModes`, "expected an array");
        return {
          symbol: raw.symbol,
          address: raw.address,
          decimals: fileInteger(raw.decimals, `${field}.decimals`),
          authModes: raw.authModes.map((mode, j) => fileAuthMode(mode, `${field}.authModes[${j}]`)),
          domain: fileDomain(raw.domain, `${field}.domain`),
          ...typeof raw.domainSeparator === "string" ? { domainSeparator: raw.domainSeparator } : {}
        };
      })
    });
  }

  // src/core/signature.ts
  var SECP256K1_N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
  var SECP256K1_HALF_N = SECP256K1_N >> 1n;
  var SIGNATURE_RE = /^0x[0-9a-fA-F]{130}$/;
  var BYTES32_RE4 = /^0x[0-9a-fA-F]{64}$/;
  function invalid(field, message) {
    return new GaslessValidationError("invalid_signature", field, message);
  }
  function checkRS(r, s, field) {
    if (r === 0n || r >= SECP256K1_N) throw invalid(field, "r is out of range");
    if (s === 0n || s >= SECP256K1_N) throw invalid(field, "s is out of range");
    if (s > SECP256K1_HALF_N) throw invalid(field, "high-s signature (malleable); expected s <= n/2");
  }
  function normalizeV(v, field) {
    if (v === 27 || v === 0) return 27;
    if (v === 28 || v === 1) return 28;
    throw invalid(field, "v must be 27, 28, 0 or 1");
  }
  function splitSignature(signature, field = "signature") {
    if (typeof signature !== "string" || !SIGNATURE_RE.test(signature)) {
      throw invalid(field, "expected a 65-byte signature: 0x followed by 130 hex characters");
    }
    const r = `0x${signature.slice(2, 66).toLowerCase()}`;
    const s = `0x${signature.slice(66, 130).toLowerCase()}`;
    checkRS(BigInt(r), BigInt(s), field);
    const v = normalizeV(Number.parseInt(signature.slice(130, 132), 16), field);
    return { r, s, v, yParity: v === 27 ? 0 : 1 };
  }
  function normalizeSignature(signature, field = "signature") {
    const { r, s, v } = splitSignature(signature, field);
    return `0x${r.slice(2)}${s.slice(2)}${v.toString(16)}`;
  }
  function toTokenAuthorization(mode, tokenSignature) {
    if (mode === "none") {
      if (tokenSignature !== void 0 && tokenSignature !== null) {
        throw new GaslessValidationError("auth_unexpected", "tokenSignature", 'auth mode "none" takes no token signature');
      }
      return { mode: "none" };
    }
    if (mode !== "permit" && mode !== "metaTxApprove") {
      throw new GaslessValidationError("invalid_request", "authorization.mode", "unknown auth mode");
    }
    if (tokenSignature === void 0 || tokenSignature === null) {
      throw new GaslessValidationError("auth_missing", "tokenSignature", `auth mode "${mode}" needs the owner's token signature`);
    }
    const { r, s, v } = splitSignature(tokenSignature, "tokenSignature");
    return { mode, v, r, s };
  }
  function normalizeTokenAuthorization(auth, field = "authorization") {
    if (auth === null || typeof auth !== "object") {
      throw new GaslessValidationError("invalid_request", field, "expected an object");
    }
    const keys = Object.keys(auth);
    if (auth.mode === "none") {
      if (keys.some((key) => key !== "mode")) {
        throw new GaslessValidationError("auth_unexpected", field, 'auth mode "none" carries no v, r or s');
      }
      return { mode: "none" };
    }
    if (auth.mode !== "permit" && auth.mode !== "metaTxApprove") {
      throw new GaslessValidationError("invalid_request", `${field}.mode`, "unknown auth mode");
    }
    if (keys.some((key) => key !== "mode" && key !== "v" && key !== "r" && key !== "s")) {
      throw new GaslessValidationError("invalid_request", field, "unexpected field");
    }
    if (auth.v === void 0 || auth.r === void 0 || auth.s === void 0) {
      throw new GaslessValidationError("auth_missing", field, `auth mode "${auth.mode}" needs v, r and s`);
    }
    if (typeof auth.v !== "number" || typeof auth.r !== "string" || typeof auth.s !== "string") {
      throw invalid(field, "v must be a number, r and s hex strings");
    }
    if (!BYTES32_RE4.test(auth.r) || !BYTES32_RE4.test(auth.s)) {
      throw invalid(field, "r and s must be 0x followed by 64 hex characters");
    }
    checkRS(BigInt(auth.r), BigInt(auth.s), field);
    return { mode: auth.mode, v: normalizeV(auth.v, `${field}.v`), r: auth.r.toLowerCase(), s: auth.s.toLowerCase() };
  }

  // src/core/submit.ts
  var REQUEST_KEYS = ["token", "from", "to", "amount", "fee", "relay", "nonce", "deadline"];
  var BYTES32_RE5 = /^0x[0-9a-fA-F]{64}$/;
  var MAX_QUOTE_ID_LENGTH = 256;
  function invalid2(field, error) {
    return new GaslessValidationError("invalid_request", field, error instanceof Error ? error.message : String(error));
  }
  function normalizeTransferRequest(input) {
    if (!isPlainObject(input)) throw new GaslessValidationError("invalid_request", "request", "expected an object");
    for (const key of Object.keys(input)) {
      if (!REQUEST_KEYS.includes(key)) throw new GaslessValidationError("invalid_request", `request.${key}`, "unexpected field");
    }
    const address = (key) => {
      try {
        return toChecksumAddress(input[key], `request.${key}`);
      } catch (error) {
        throw invalid2(`request.${key}`, error);
      }
    };
    const uint = (key) => {
      try {
        return toUint256(input[key], `request.${key}`).toString(10);
      } catch (error) {
        throw invalid2(`request.${key}`, error);
      }
    };
    if (typeof input.nonce !== "string" || !BYTES32_RE5.test(input.nonce)) {
      throw new GaslessValidationError("invalid_request", "request.nonce", "expected 0x followed by 64 hex characters");
    }
    return {
      token: address("token"),
      from: address("from"),
      to: address("to"),
      amount: uint("amount"),
      fee: uint("fee"),
      relay: address("relay"),
      nonce: input.nonce.toLowerCase(),
      deadline: uint("deadline")
    };
  }
  function buildSubmitTransferBody(params) {
    if (!isPlainObject(params)) throw new GaslessValidationError("invalid_request", "params", "expected an object");
    const request = normalizeTransferRequest(params.request);
    const signature = normalizeSignature(params.signature, "signature");
    const authorization = normalizeTokenAuthorization(params.authorization);
    const { quoteId } = params;
    if (quoteId !== void 0 && (typeof quoteId !== "string" || quoteId.length === 0 || quoteId.length > MAX_QUOTE_ID_LENGTH)) {
      throw new GaslessValidationError("invalid_request", "quoteId", `expected a non-empty string of at most ${MAX_QUOTE_ID_LENGTH} characters`);
    }
    return deepFreeze2({ request, signature, authorization, ...quoteId !== void 0 ? { quoteId } : {} });
  }

  // src/core/validate.ts
  var REQUEST_KEYS2 = ["token", "from", "to", "amount", "fee", "relay", "nonce", "deadline"];
  var ADDRESS_FIELDS = ["token", "from", "to", "relay"];
  var UINT_FIELDS = ["amount", "fee", "deadline"];
  var AUTH_MODES = ["none", "permit", "metaTxApprove"];
  var BYTES32_RE6 = /^0x[0-9a-fA-F]{64}$/;
  var APPROVE_CALLDATA_RE = /^0x[0-9a-fA-F]{136}$/;
  var MAX_QUOTE_ID_LENGTH2 = 256;
  function assertUnixSeconds(now) {
    if (typeof now !== "number" || !Number.isSafeInteger(now) || now < 0 || now >= 2 ** 32) {
      throw new TypeError("now: expected unix time in seconds (a non-negative integer below 2^32)");
    }
  }
  function checkTransferRequestShape(request, field = "request") {
    if (!isPlainObject(request)) return validationFailure("invalid_request", field, "expected an object");
    for (const key of Object.keys(request)) {
      if (!REQUEST_KEYS2.includes(key)) return validationFailure("invalid_request", `${field}.${key}`, "unexpected field");
    }
    for (const key of ADDRESS_FIELDS) {
      if (!isAddress(request[key])) {
        return validationFailure("invalid_request", `${field}.${key}`, "expected an address (0x + 40 hex, valid checksum if mixed case)");
      }
    }
    for (const key of UINT_FIELDS) {
      if (!isCanonicalUint256(request[key])) {
        return validationFailure("invalid_request", `${field}.${key}`, "expected a uint256 as canonical decimal string");
      }
    }
    if (typeof request.nonce !== "string" || !BYTES32_RE6.test(request.nonce)) {
      return validationFailure("invalid_request", `${field}.nonce`, "expected 0x followed by 64 hex characters");
    }
    return VALID;
  }
  function checkTransferPolicy(request, authMode, pins, now) {
    return checkPolicy(request, authMode, pins, now, true);
  }
  function checkPolicy(request, authMode, pins, now, deadlineWindow) {
    assertUnixSeconds(now);
    if (!pins.relays.some((relay) => sameAddress(relay, request.relay))) {
      return validationFailure("wrong_relay", "request.relay", "not a pinned relay address");
    }
    const token = findPinnedToken(pins, request.token);
    if (token === void 0) return validationFailure("unsupported_token", "request.token", "not a pinned token");
    if (!token.authModes.includes(authMode)) {
      return validationFailure("unsupported_auth_mode", "authMode", `${token.symbol} does not support auth mode "${authMode}"`);
    }
    if (sameAddress(request.from, ZERO_ADDRESS)) return validationFailure("invalid_sender", "request.from", "must not be the zero address");
    const amount = BigInt(request.amount);
    const fee = BigInt(request.fee);
    if (amount === 0n) return validationFailure("invalid_amount", "request.amount", "must be greater than zero");
    if (amount + fee > MAX_UINT2562) return validationFailure("invalid_amount", "request.amount", "amount + fee exceeds uint256");
    if (isDeniedRecipient(pins, request.to)) {
      return validationFailure("invalid_recipient", "request.to", "recipient is denied (zero address, a token or a Nimiq contract)");
    }
    const deadline = BigInt(request.deadline);
    if (deadlineWindow && (deadline < BigInt(now + MIN_DEADLINE_SECONDS) || deadline > BigInt(now + MAX_DEADLINE_SECONDS))) {
      return validationFailure(
        "deadline_out_of_range",
        "request.deadline",
        `must be between now + ${MIN_DEADLINE_SECONDS} s and now + ${MAX_DEADLINE_SECONDS} s`
      );
    }
    if (fee > BigInt(pins.maxFee)) return validationFailure("fee_above_max", "request.fee", `exceeds the pinned maximum fee ${pins.maxFee}`);
    return VALID;
  }
  function checkCorrection(corrected, request) {
    const shapes = [
      [corrected, "corrects"],
      [request, "request"]
    ];
    for (const [value, field] of shapes) {
      const shape = checkTransferRequestShape(value, field);
      if (!shape.ok) return shape;
    }
    for (const key of ["from", "token", "to"]) {
      if (!sameAddress(corrected[key], request[key])) {
        return validationFailure("correction_mismatch", `request.${key}`, `a correction keeps the ${key} of the version it corrects (${corrected[key]})`);
      }
    }
    if (corrected.nonce.toLowerCase() !== request.nonce.toLowerCase()) {
      return validationFailure("correction_mismatch", "request.nonce", "a correction keeps the intent nonce of the version it corrects");
    }
    if (BigInt(request.deadline) < BigInt(corrected.deadline)) {
      return validationFailure(
        "correction_mismatch",
        "request.deadline",
        `a correction keeps a deadline at least as late as the version it corrects (${corrected.deadline})`
      );
    }
    return VALID;
  }
  function parseMaxAcceptableFee(value) {
    if (value === void 0) return void 0;
    try {
      return toUint256(value, "maxAcceptableFee");
    } catch (error) {
      throw new GaslessValidationError("invalid_request", "maxAcceptableFee", error.message);
    }
  }
  function checkAcceptableFee(fee, maxAcceptableFee, field) {
    if (maxAcceptableFee === void 0 || fee <= maxAcceptableFee) return VALID;
    return validationFailure("fee_above_limit", field, `fee ${fee} exceeds the maximum acceptable fee ${maxAcceptableFee}`);
  }
  function hasExactKeys(value, keys) {
    if (!isPlainObject(value)) return false;
    const actual = Object.keys(value);
    return actual.length === keys.length && keys.every((key) => actual.includes(key));
  }
  function hasExactTypes(value, expected) {
    const names = Object.keys(expected);
    if (!hasExactKeys(value, names)) return false;
    return names.every((name) => {
      const actual = value[name];
      const fields = expected[name] ?? [];
      return Array.isArray(actual) && actual.length === fields.length && fields.every((f, i) => hasExactKeys(actual[i], ["name", "type"]) && actual[i].name === f.name && actual[i].type === f.type);
    });
  }
  function isDomain(value) {
    return isPlainObject(value) && Object.keys(value).every((key) => ["name", "version", "chainId", "verifyingContract", "salt"].includes(key));
  }
  function checkTokenAuthorization(input, pins) {
    const { request, authMode, tokenAuth } = input;
    if (authMode === "none") {
      return tokenAuth === void 0 || tokenAuth === null ? VALID : validationFailure("auth_unexpected", "tokenAuth", 'auth mode "none" signs no token authorization');
    }
    if (tokenAuth === void 0 || tokenAuth === null) {
      return validationFailure("auth_missing", "tokenAuth", `auth mode "${authMode}" needs the permit or meta-tx typed data`);
    }
    const token = findPinnedToken(pins, request.token);
    if (token === void 0) return validationFailure("unsupported_token", "request.token", "not a pinned token");
    const isPermit = authMode === "permit";
    const primaryType = isPermit ? "Permit" : "MetaTransaction";
    if (!isPlainObject(tokenAuth) || tokenAuth.primaryType !== primaryType || !hasExactTypes(tokenAuth.types, isPermit ? PERMIT_TYPES : META_TRANSACTION_TYPES)) {
      return validationFailure("auth_type_mismatch", "tokenAuth.types", `expected exactly the ${primaryType} type`);
    }
    if (!isDomain(tokenAuth.domain) || !sameDomain(tokenAuth.domain, token.domain)) {
      return validationFailure("auth_domain_mismatch", "tokenAuth.domain", `must equal the pinned ${token.symbol} domain`);
    }
    const value = BigInt(request.amount) + BigInt(request.fee);
    const message = tokenAuth.message;
    if (isPermit) {
      if (!hasExactKeys(message, ["owner", "spender", "value", "nonce", "deadline"])) {
        return validationFailure("auth_type_mismatch", "tokenAuth.message", "expected exactly owner, spender, value, nonce, deadline");
      }
      if (!isAddress(message.owner) || !sameAddress(message.owner, request.from)) {
        return validationFailure("auth_owner_mismatch", "tokenAuth.message.owner", "must equal request.from");
      }
      if (!isAddress(message.spender) || !sameAddress(message.spender, pins.transfer.address)) {
        return validationFailure("auth_spender_mismatch", "tokenAuth.message.spender", "must be the pinned transfer contract");
      }
      if (!isCanonicalUint256(message.value) || BigInt(message.value) !== value) {
        return validationFailure("auth_value_mismatch", "tokenAuth.message.value", "must equal amount + fee");
      }
      if (!isCanonicalUint256(message.nonce)) {
        return validationFailure("invalid_request", "tokenAuth.message.nonce", "expected a uint256 as canonical decimal string");
      }
      if (message.deadline !== request.deadline) {
        return validationFailure("auth_deadline_mismatch", "tokenAuth.message.deadline", "must equal the intent deadline");
      }
      return VALID;
    }
    if (!hasExactKeys(message, ["nonce", "from", "functionSignature"])) {
      return validationFailure("auth_type_mismatch", "tokenAuth.message", "expected exactly nonce, from, functionSignature");
    }
    if (!isAddress(message.from) || !sameAddress(message.from, request.from)) {
      return validationFailure("auth_owner_mismatch", "tokenAuth.message.from", "must equal request.from");
    }
    if (!isCanonicalUint256(message.nonce)) {
      return validationFailure("invalid_request", "tokenAuth.message.nonce", "expected a uint256 as canonical decimal string");
    }
    const call = message.functionSignature;
    if (typeof call !== "string" || !APPROVE_CALLDATA_RE.test(call) || call.slice(0, 10).toLowerCase() !== APPROVE_SELECTOR) {
      return validationFailure("auth_type_mismatch", "tokenAuth.message.functionSignature", "expected approve(address,uint256) calldata");
    }
    const spenderWord = call.slice(10, 74);
    if (!/^0{24}/.test(spenderWord) || !sameAddress(`0x${spenderWord.slice(24)}`, pins.transfer.address)) {
      return validationFailure("auth_spender_mismatch", "tokenAuth.message.functionSignature", "approve spender must be the pinned transfer contract");
    }
    if (BigInt(`0x${call.slice(74)}`) !== value) {
      return validationFailure("auth_value_mismatch", "tokenAuth.message.functionSignature", "approve value must equal amount + fee");
    }
    if (call.toLowerCase() !== encodeApproveCalldata(pins.transfer.address, value)) {
      return validationFailure("auth_type_mismatch", "tokenAuth.message.functionSignature", "non-canonical approve calldata");
    }
    return VALID;
  }
  function validateTransferRequest(req, pins, now, options = {}) {
    assertUnixSeconds(now);
    let maxAcceptableFee;
    try {
      maxAcceptableFee = parseMaxAcceptableFee(options?.maxAcceptableFee);
    } catch (error) {
      if (error instanceof GaslessValidationError) return validationFailure(error.code, error.field, error.message);
      throw error;
    }
    if (!isPlainObject(req)) return validationFailure("invalid_request", "input", "expected an object");
    if (typeof req.chainId !== "number" || !Number.isSafeInteger(req.chainId) || req.chainId <= 0) {
      return validationFailure("invalid_request", "chainId", "expected a positive integer");
    }
    if (!isAddress(req.contract)) return validationFailure("invalid_request", "contract", "expected an address");
    if (!AUTH_MODES.includes(req.authMode)) return validationFailure("invalid_request", "authMode", "unknown auth mode");
    const shape = checkTransferRequestShape(req.request);
    if (!shape.ok) return shape;
    if (req.chainId !== pins.chainId) return validationFailure("wrong_chain", "chainId", `expected chain ${pins.chainId}`);
    if (!sameAddress(req.contract, pins.transfer.address)) return validationFailure("wrong_contract", "contract", "not the pinned transfer contract");
    const policy = checkTransferPolicy(req.request, req.authMode, pins, now);
    if (!policy.ok) return policy;
    const acceptable = checkAcceptableFee(BigInt(req.request.fee), maxAcceptableFee, "request.fee");
    if (!acceptable.ok) return acceptable;
    return checkTokenAuthorization(req, pins);
  }
  function assertValidTransferRequest(req, pins, now, options = {}) {
    const result = validateTransferRequest(req, pins, now, options);
    if (!result.ok) throw GaslessValidationError.fromResult(result);
  }
  function validateSubmitTransferBody(body, pins, now, options = {}) {
    assertUnixSeconds(now);
    if (!isPlainObject(body)) return validationFailure("invalid_request", "body", "expected an object");
    for (const key of Object.keys(body)) {
      if (!["request", "signature", "authorization", "quoteId"].includes(key)) return validationFailure("invalid_request", key, "unexpected field");
    }
    const shape = checkTransferRequestShape(body.request);
    if (!shape.ok) return shape;
    let mode;
    try {
      splitSignature(body.signature, "signature");
      mode = normalizeTokenAuthorization(body.authorization).mode;
    } catch (error) {
      if (error instanceof GaslessValidationError) return validationFailure(error.code, error.field, error.message);
      throw error;
    }
    if (body.quoteId !== void 0 && (typeof body.quoteId !== "string" || body.quoteId.length === 0 || body.quoteId.length > MAX_QUOTE_ID_LENGTH2)) {
      return validationFailure("invalid_request", "quoteId", `expected a non-empty string of at most ${MAX_QUOTE_ID_LENGTH2} characters`);
    }
    return checkPolicy(body.request, mode, pins, now, options?.repost !== true);
  }

  // src/core/intent.ts
  var AUTH_MODES2 = ["none", "permit", "metaTxApprove"];
  function normalizeCorrectedRequest(input) {
    try {
      return normalizeTransferRequest(input);
    } catch (error) {
      if (error instanceof GaslessValidationError) {
        throw new GaslessValidationError(error.code, error.field.replace(/^request\b/, "corrects"), error.message);
      }
      throw error;
    }
  }
  function buildTokenAuthTypedData(pins, request, authMode, tokenNonce) {
    if (authMode === "none") return null;
    const token = findPinnedToken(pins, request.token);
    if (token === void 0) throw new GaslessValidationError("unsupported_token", "request.token", "not a pinned token");
    if (!token.authModes.includes(authMode)) {
      throw new GaslessValidationError("unsupported_auth_mode", "authMode", `${token.symbol} does not support auth mode "${authMode}"`);
    }
    if (tokenNonce === void 0) throw new GaslessValidationError("auth_missing", "tokenNonce", `auth mode "${authMode}" needs the token nonce`);
    let nonce;
    try {
      nonce = toUint256(tokenNonce, "tokenNonce");
    } catch (error) {
      throw new GaslessValidationError("invalid_request", "tokenNonce", error.message);
    }
    const value = BigInt(request.amount) + BigInt(request.fee);
    if (authMode === "permit") {
      return buildPermitTypedData({
        tokenDomain: token.domain,
        owner: request.from,
        spender: pins.transfer.address,
        value,
        nonce,
        deadline: request.deadline
      });
    }
    return buildMetaTxApproveTypedData({ tokenDomain: token.domain, from: request.from, spender: pins.transfer.address, value, nonce });
  }
  function createTransferIntent(pins, params, now, options = {}) {
    assertUnixSeconds(now);
    const maxAcceptableFee = parseMaxAcceptableFee(options?.maxAcceptableFee);
    const corrected = params.corrects === void 0 ? void 0 : normalizeCorrectedRequest(params.corrects);
    const request = normalizeTransferRequest({
      token: params.token,
      from: params.from,
      to: params.to,
      amount: params.amount,
      fee: params.fee,
      relay: params.relay,
      nonce: params.nonce ?? corrected?.nonce ?? randomNonce(),
      deadline: params.deadline
    });
    if (!AUTH_MODES2.includes(params.authMode)) throw new GaslessValidationError("invalid_request", "authMode", "unknown auth mode");
    const policy = checkTransferPolicy(request, params.authMode, pins, now);
    if (!policy.ok) throw GaslessValidationError.fromResult(policy);
    if (corrected !== void 0) {
      const correction = checkCorrection(corrected, request);
      if (!correction.ok) throw GaslessValidationError.fromResult(correction);
    }
    const acceptable = checkAcceptableFee(BigInt(request.fee), maxAcceptableFee, "request.fee");
    if (!acceptable.ok) throw GaslessValidationError.fromResult(acceptable);
    const token = findPinnedToken(pins, request.token);
    if (params.authMode === "metaTxApprove" && token?.authModes.includes("permit") === true && options?.allowMetaTxApprove !== true) {
      throw new GaslessValidationError(
        "meta_tx_approve_not_allowed",
        "authMode",
        `${token.symbol} supports permit, which expires with the intent; a META_TX approval never expires and stays executable once broadcast (spec \xA75 [E8]). Use authMode "permit", or set options.allowMetaTxApprove`
      );
    }
    const intent = {
      chainId: pins.chainId,
      contract: pins.transfer.address,
      request,
      authMode: params.authMode,
      tokenAuth: buildTokenAuthTypedData(pins, request, params.authMode, params.tokenNonce)
    };
    assertValidTransferRequest(intent, pins, now);
    return deepFreeze2({ ...intent, id: transferDigest(pins.chainId, pins.transfer.address, request) });
  }
  function transferSigningPayloads(pins, intent, now, options = {}) {
    assertValidTransferRequest(intent, pins, now, options);
    const request = normalizeTransferRequest(intent.request);
    if (intent.id !== void 0 && (typeof intent.id !== "string" || intent.id.toLowerCase() !== transferDigest(pins.chainId, pins.transfer.address, request))) {
      throw new GaslessValidationError("invalid_request", "id", "does not match the request digest");
    }
    const tokenNonce = intent.tokenAuth === null || intent.tokenAuth === void 0 ? void 0 : intent.tokenAuth.message.nonce;
    return deepFreeze2({
      transfer: buildTransferTypedData(pins.chainId, pins.transfer.address, request),
      tokenAuth: buildTokenAuthTypedData(pins, request, intent.authMode, tokenNonce)
    });
  }
  return __toCommonJS(core_exports);
})();
