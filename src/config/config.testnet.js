/* global Constants */

// @ts-expect-error (ts thinks CONFIG is redeclared in other config files as it doesn't know that only one is active)
const CONFIG = { // eslint-disable-line no-unused-vars
    ALLOWED_ORIGIN: 'https://hub.nimiq-testnet.com',
    NETWORK: Constants.NETWORK.TEST,
    BTC_NETWORK: 'TEST', // BitcoinConstants is not included in the common bundle
    ROOT_REDIRECT: 'https://wallet.nimiq-testnet.com',

    POLYGON_CHAIN_ID: 80002,
    BRIDGED_USDC_CONTRACT_ADDRESS: '',
    BRIDGED_USDC_HTLC_CONTRACT_ADDRESS: '',

    NATIVE_USDC_CONTRACT_ADDRESS: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
    NATIVE_USDC_TRANSFER_CONTRACT_ADDRESS: '',
    NATIVE_USDC_HTLC_CONTRACT_ADDRESS: '',

    USDC_SWAP_CONTRACT_ADDRESS: '',

    BRIDGED_USDT_CONTRACT_ADDRESS: '0x1616d425Cd540B256475cBfb604586C8598eC0FB',
    BRIDGED_USDT_TRANSFER_CONTRACT_ADDRESS: '',
    BRIDGED_USDT_HTLC_CONTRACT_ADDRESS: '',
};
