/* global Constants */

// @ts-ignore
const CONFIG = { // eslint-disable-line no-unused-vars
    ALLOWED_ORIGIN: 'https://hub.nimiq-testnet.com',
    NETWORK: Constants.NETWORK.TEST,
    BTC_NETWORK: 'TEST', // BitcoinConstants is not included in the common bundle
    ROOT_REDIRECT: 'https://wallet.nimiq-testnet.com',

    RSA_KEY_BITS: 2048, // Possible values are 1024 (fast, but unsafe), 2048 (good compromise), 4096 (slow, but safe)
};
