/* global Constants */

// @ts-expect-error (ts thinks CONFIG is redeclared in other config files as it doesn't know that only one is active)
const CONFIG = { // eslint-disable-line no-unused-vars
    ALLOWED_ORIGIN: 'https://hub.nimiq.com',
    NETWORK: Constants.NETWORK.MAIN,
    BTC_NETWORK: 'MAIN', // BitcoinConstants is not included in the common bundle
    ROOT_REDIRECT: 'https://wallet.nimiq.com',

    POLYGON_CHAIN_ID: 137,
    BRIDGED_USDC_CONTRACT_ADDRESS: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    BRIDGED_USDC_HTLC_CONTRACT_ADDRESS: '0xF615bD7EA00C4Cc7F39Faad0895dB5f40891359f',

    NATIVE_USDC_CONTRACT_ADDRESS: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    NATIVE_USDC_TRANSFER_CONTRACT_ADDRESS: '0x3157d422cd1be13AC4a7cb00957ed717e648DFf2', // v1
    NATIVE_USDC_HTLC_CONTRACT_ADDRESS: '0x0cFD862bE942846Cebad797d7c1BC6e47714959b',

    USDC_SWAP_CONTRACT_ADDRESS: '0xfAbBed813017bF535b40013c13b8702638aC25CD',
};
