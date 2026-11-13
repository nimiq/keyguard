/* global Constants */

// We want to only allow this config file in dev environments. Supporting IPs as hostname is nice for debugging e.g.
// on mobile devices, though. We assume that any keyguard instance hosted in production would be accessed by DNS.
// Additionally, we whitelist BrowserStack's localhost tunnel bs-local.com for iOS debugging in BrowserStack, see
// https://www.browserstack.com/docs/live/local-testing/ios-troubleshooting-guide
const ipRegEx = /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/;
if (!/^(?:localhost|bs-local.com)$/.test(window.location.hostname) && !ipRegEx.test(window.location.hostname)) {
    throw new Error('Using development config is only allowed locally');
}

// @ts-expect-error (ts thinks CONFIG is redeclared in other config files as it doesn't know that only one is active)
const CONFIG = { // eslint-disable-line no-unused-vars
    ALLOWED_ORIGIN: '*',
    NETWORK: Constants.NETWORK.TEST,
    NIMIQ_NETWORK_ID: 5,
    BTC_NETWORK: /** @type {'MAIN' | 'TEST'} */ ('TEST'), // BitcoinConstants is not included in the common bundle
    ROOT_REDIRECT: 'https://wallet.nimiq-testnet.com',

    POLYGON_CHAIN_ID: 80002, // Amoy testnet
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
    /** @type {string[]} Contracts that cannot move tokens sent to them, in addition to the ones in this config. */
    POLYGON_GASLESS_DENIED_RECIPIENTS: [
        '0xfA9Dabbf3C68a126a627ad48098700DFc6F27c82', // Mock USDT0 of the Amoy deployment, not supported here
    ],
    // Gasless HTLCs for swaps. PROVISIONAL: the GaslessHTLC contract is not deployed yet.
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
