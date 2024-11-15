/* global NimiqPoW */
/* global CONFIG */
/* global Constants */
/* global Errors */

/** @type {Promise<void>?} */
let __nimiqPoWLoaded = null;

/**
 * Singleton promise
 *
 * @returns {Promise<void>}
 */
async function loadNimiqPow() { // eslint-disable-line no-unused-vars
    // eslint-disable-next-line no-return-assign
    return __nimiqPoWLoaded || (__nimiqPoWLoaded = new Promise(async resolve => {
        // Load web assembly encryption library into browser (if supported)
        await NimiqPoW.WasmHelper.doImport();

        switch (CONFIG.NETWORK) {
            case Constants.NETWORK.DEV:
                NimiqPoW.GenesisConfig.dev();
                break;
            case Constants.NETWORK.TEST:
                NimiqPoW.GenesisConfig.test();
                break;
            case Constants.NETWORK.MAIN:
                NimiqPoW.GenesisConfig.main();
                break;
            default:
                throw new Errors.InvalidNetworkConfig();
        }

        resolve();
    }));
}
