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

    // The local Anvil stack of https://github.com/NimiqToolbox/gas-abstraction, whose deployment addresses are
    // deterministic on a fresh chain.
    POLYGON_CHAIN_ID: 31337,
    BRIDGED_USDC_CONTRACT_ADDRESS: '',
    /** @deprecated */
    BRIDGED_USDC_HTLC_CONTRACT_ADDRESS: '',

    NATIVE_USDC_CONTRACT_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // MockUSDC
    NATIVE_USDC_HTLC_CONTRACT_ADDRESS: '',

    USDC_SWAP_CONTRACT_ADDRESS: '',

    BRIDGED_USDT_CONTRACT_ADDRESS: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // MockUSDT0
    BRIDGED_USDT_HTLC_CONTRACT_ADDRESS: '',

    // Gasless USDC/USDT0 transfers on the local Anvil stack of https://github.com/NimiqToolbox/gas-abstraction
    // (`make stack-up`), see POLYGON_CHAIN_ID and the token addresses above.
    POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    /** @type {string[]} */
    POLYGON_GASLESS_RELAY_ADDRESSES: ['0xBcd4042DE499D14e55001CcbB24a551F3b954096'], // Anvil account 10
    POLYGON_GASLESS_MAX_FEE: '5000000',
    POLYGON_GASLESS_MAX_ACCEPTABLE_FEE: '500000',

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
