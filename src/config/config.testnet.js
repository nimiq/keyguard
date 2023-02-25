/* global Constants */

// @ts-ignore
const CONFIG = { // eslint-disable-line no-unused-vars
    ALLOWED_ORIGIN: 'https://hub.nimiq-testnet.com',
    NETWORK: Constants.NETWORK.TEST,
    BTC_NETWORK: 'TEST', // BitcoinConstants is not included in the common bundle
    ROOT_REDIRECT: 'https://wallet.nimiq-testnet.com',

    POLYGON_CHAIN_ID: 80001,
    USDC_CONTRACT_ADDRESS: '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23',
    USDC_TRANSFER_CONTRACT_ADDRESS: '0x2805f3187dcDfa424EFA8c55Db6012Cf08Fa6eEc',
    USDC_HTLC_CONTRACT_ADDRESS: '0x573aA448cC6e28AF0EeC7E93037B5A592a83d936',
};
