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
    BTC_NETWORK: /** @type {'MAIN' | 'TEST'} */ ('TEST'), // BitcoinConstants is not included in the common bundle
    ROOT_REDIRECT: 'https://wallet.nimiq-testnet.com',

    POLYGON_CHAIN_ID: 80002, // Amoy testnet
    BRIDGED_USDC_CONTRACT_ADDRESS: '',
    /** @deprecated */
    BRIDGED_USDC_HTLC_CONTRACT_ADDRESS: '',

    NATIVE_USDC_CONTRACT_ADDRESS: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
    NATIVE_USDC_TRANSFER_CONTRACT_ADDRESS: '',
    NATIVE_USDC_HTLC_CONTRACT_ADDRESS: '',

    USDC_SWAP_CONTRACT_ADDRESS: '',

    BRIDGED_USDT_CONTRACT_ADDRESS: '0x1616d425Cd540B256475cBfb604586C8598eC0FB',
    BRIDGED_USDT_TRANSFER_CONTRACT_ADDRESS: '',
    BRIDGED_USDT_HTLC_CONTRACT_ADDRESS: '',
};
