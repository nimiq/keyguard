/* global Constants */

// We want to only allow this config file in dev environments. Supporting IPs as hostname is nice for debugging e.g.
// on mobile devices, though. We assume that any keyguard instance hosted in production would be accessed by DNS.
const ipRegEx = /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/;
if (window.location.hostname !== 'localhost' && !ipRegEx.test(window.location.hostname)) {
    throw new Error('Using development config is only allowed locally');
}

// @ts-ignore
const CONFIG = { // eslint-disable-line no-unused-vars
    ALLOWED_ORIGIN: '*',
    NETWORK: Constants.NETWORK.TEST,
    BTC_NETWORK: /** @type {'MAIN' | 'TEST'} */ ('TEST'), // BitcoinConstants is not included in the common bundle
    ROOT_REDIRECT: 'https://wallet.nimiq-testnet.com',
};
