/* global Constants */

// @ts-ignore
const CONFIG = { // eslint-disable-line no-unused-vars
    ALLOWED_ORIGIN: 'https://hub.nimiq.com',
    NETWORK: Constants.NETWORK.MAIN,
    BTC_NETWORK: 'MAIN', // BitcoinConstants is not included in the common bundle
    ROOT_REDIRECT: 'https://wallet.nimiq.com',

    POLYGON_CHAIN_ID: 137,
    USDC_CONTRACT_ADDRESS: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDC_TRANSFER_CONTRACT_ADDRESS: '0x98E69a6927747339d5E543586FC0262112eBe4BD',
    USDC_HTLC_CONTRACT_ADDRESS: '0xF615bD7EA00C4Cc7F39Faad0895dB5f40891359f',

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
