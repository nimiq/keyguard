/* global Constants */

// @ts-expect-error (ts thinks CONFIG is redeclared in other config files as it doesn't know that only one is active)
const CONFIG = { // eslint-disable-line no-unused-vars
    ALLOWED_ORIGIN: 'https://hub.nimiq-testnet.com',
    NETWORK: Constants.NETWORK.TEST,
    NIMIQ_NETWORK_ID: 5,
    BTC_NETWORK: 'TEST', // BitcoinConstants is not included in the common bundle
    ROOT_REDIRECT: 'https://wallet.nimiq-testnet.com',

    POLYGON_CHAIN_ID: 80002,
    NATIVE_USDC_CONTRACT_ADDRESS: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
    NATIVE_USDC_DOMAIN_NAME: 'USDC', // Circle's test USDC on Amoy, unlike mainnet
    // Empty, as USDT is not available on this network: the official testnet token cannot be used with the gas
    // abstraction. USDT requests are rejected.
    BRIDGED_USDT_CONTRACT_ADDRESS: '',

    // Gasless USDC transfers on Amoy, see https://github.com/NimiqToolbox/gas-abstraction
    POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS: '0xe5D40efb4a89F6D3aDd07D8881F4b372f02c8075',
    /** @type {string[]} */
    POLYGON_GASLESS_RELAY_ADDRESSES: ['0x6465e47837DB340D8Ac465E2F58cD6c08b275965'],
    POLYGON_GASLESS_MAX_ACCEPTABLE_FEE: '500000',
    /** @type {string[]} */
    POLYGON_GASLESS_DENIED_RECIPIENTS: [],
    // Gasless HTLCs for swaps are not deployed on Amoy
    POLYGON_GASLESS_HTLC_CONTRACT_ADDRESS: '',

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
