/* global Constants */

// We want to only allow this config file in dev environments. Supporting IPs as hostname is nice for debugging e.g.
// on mobile devices, though. We assume that any keyguard instance hosted in production would be accessed by DNS.
// Additionally, we whitelist BrowserStack's localhost tunnel bs-local.com for iOS debugging in BrowserStack, see
// https://www.browserstack.com/docs/live/local-testing/ios-troubleshooting-guide
const ipRegEx = /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/;
if (!/^(?:localhost|bs-local.com)$/.test(window.location.hostname) && !ipRegEx.test(window.location.hostname)) {
    throw new Error('Using development config is only allowed locally');
}

// @ts-ignore
const CONFIG = { // eslint-disable-line no-unused-vars
    ALLOWED_ORIGIN: '*',
    NETWORK: Constants.NETWORK.TEST,
    BTC_NETWORK: /** @type {'MAIN' | 'TEST'} */ ('TEST'), // BitcoinConstants is not included in the common bundle
    ROOT_REDIRECT: 'https://wallet.nimiq-testnet.com',

    POLYGON_CHAIN_ID: 80001,
    BRIDGED_USDC_CONTRACT_ADDRESS: '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23',
    /** @deprecated */
    BRIDGED_USDC_HTLC_CONTRACT_ADDRESS: '0x2EB7cd7791b947A25d629219ead941fCd8f364BF',

    NATIVE_USDC_CONTRACT_ADDRESS: '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97',
    NATIVE_USDC_TRANSFER_CONTRACT_ADDRESS: '0x5D101A320547f8D640c44fDfe5d1f35224f00B8B', // v1
    NATIVE_USDC_HTLC_CONTRACT_ADDRESS: '0xA9fAbABE97375565e4A9Ac69A57Df33c91FCB897',

    USDC_SWAP_CONTRACT_ADDRESS: '0xf4a619F6561CeE543BDa9BBA0cAC68758B607714',
};
