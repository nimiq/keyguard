/* global Constants */

// @ts-expect-error (ts thinks CONFIG is redeclared in other config files as it doesn't know that only one is active)
const CONFIG = { // eslint-disable-line no-unused-vars
    ALLOWED_ORIGIN: 'https://hub.nimiq.com',
    NETWORK: Constants.NETWORK.MAIN,
    NIMIQ_NETWORK_ID: 24,
    BTC_NETWORK: 'MAIN', // BitcoinConstants is not included in the common bundle
    ROOT_REDIRECT: 'https://wallet.nimiq.com',

    POLYGON_CHAIN_ID: 137,
    NATIVE_USDC_CONTRACT_ADDRESS: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    NATIVE_USDC_DOMAIN_NAME: 'USD Coin',
    BRIDGED_USDT_CONTRACT_ADDRESS: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',

    // Gasless USDC/USDT0 transfers, see https://github.com/NimiqToolbox/gas-abstraction
    POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS: '0x5A3a650fCf35639153aA6bA9aa3e870DAED56199', // v3
    /** @type {string[]} Relay addresses the user may sign for. More than one allows a relay key rotation. */
    POLYGON_GASLESS_RELAY_ADDRESSES: ['0x6465e47837DB340D8Ac465E2F58cD6c08b275965'],
    // The highest relay fee the user is asked to sign: 0.50 USDC/USDT. The contract does not cap the fee.
    POLYGON_GASLESS_MAX_ACCEPTABLE_FEE: '500000',
    /** @type {string[]} Contracts that cannot move tokens sent to them, in addition to the ones in this config. */
    POLYGON_GASLESS_DENIED_RECIPIENTS: [
        // Still known to some as "USDC on Polygon", and tokens sent to it are lost
        '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC.e (bridged USDC) token
        '0x98E69a6927747339d5E543586FC0262112eBe4BD', // OpenGSN USDT transfer
        '0xF615bD7EA00C4Cc7F39Faad0895dB5f40891359f', // OpenGSN USDT and USDC.e HTLC
        '0x3157d422cd1be13AC4a7cb00957ed717e648DFf2', // OpenGSN USDC transfer
        '0x0cFD862bE942846Cebad797d7c1BC6e47714959b', // OpenGSN USDC HTLC
        '0xfAbBed813017bF535b40013c13b8702638aC25CD', // OpenGSN USDC.e swap
        '0x3c870b039BF82D2F883b6E89D41d06d26b9F4486', // Legacy Nimiq contract
        '0xbfbE31E6c57B09A8130d427B9E3E23ed5aB6cd1D', // GaslessTransfer v2
        '0xA0df3CdF124d7101a67ebE5b1b97D222505De9D6', // GaslessTransfer v1
    ],

    RSA_KEY_BITS: 2048, // Possible values are 1024 (fast, but unsafe), 2048 (good compromise), 4096 (slow, but safe)
    RSA_KDF_FUNCTION: 'PBKDF2-SHA512',
    RSA_KDF_ITERATIONS: 1024,

    RSA_SUPPORTED_KEY_BITS: [2048],
    RSA_SUPPORTED_KDF_FUNCTIONS: ['PBKDF2-SHA512'],
    /** @type {Record<string, number[]>} */
    RSA_SUPPORTED_KDF_ITERATIONS: {
        'PBKDF2-SHA512': [1024],
    },
};
