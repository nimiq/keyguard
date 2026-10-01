/* global Constants */

// @ts-expect-error (ts thinks CONFIG is redeclared in other config files as it doesn't know that only one is active)
const CONFIG = { // eslint-disable-line no-unused-vars
    ALLOWED_ORIGIN: 'https://hub.nimiq.com',
    NETWORK: Constants.NETWORK.MAIN,
    NIMIQ_NETWORK_ID: 24,
    BTC_NETWORK: 'MAIN', // BitcoinConstants is not included in the common bundle
    ROOT_REDIRECT: 'https://wallet.nimiq.com',

    POLYGON_CHAIN_ID: 137,
    BRIDGED_USDC_CONTRACT_ADDRESS: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    BRIDGED_USDC_HTLC_CONTRACT_ADDRESS: '0xF615bD7EA00C4Cc7F39Faad0895dB5f40891359f',

    NATIVE_USDC_CONTRACT_ADDRESS: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    NATIVE_USDC_HTLC_CONTRACT_ADDRESS: '0x0cFD862bE942846Cebad797d7c1BC6e47714959b',

    USDC_SWAP_CONTRACT_ADDRESS: '0xfAbBed813017bF535b40013c13b8702638aC25CD',

    BRIDGED_USDT_CONTRACT_ADDRESS: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    BRIDGED_USDT_HTLC_CONTRACT_ADDRESS: '0xF615bD7EA00C4Cc7F39Faad0895dB5f40891359f',

    // Gasless USDC/USDT0 transfers, see https://github.com/NimiqToolbox/gas-abstraction
    POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS: '0xA0df3CdF124d7101a67ebE5b1b97D222505De9D6',
    /** @type {string[]} Relay addresses the user may sign for. More than one allows a relay key rotation. */
    POLYGON_GASLESS_RELAY_ADDRESSES: [], // TODO: Add the production relay address
    POLYGON_GASLESS_MAX_FEE: '5000000', // The contract's MAX_FEE: 5.00 USDC/USDT
    POLYGON_GASLESS_MAX_ACCEPTABLE_FEE: '500000', // The highest relay fee the user is asked to sign: 0.50 USDC/USDT

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
