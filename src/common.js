/* global TRANSLATIONS */ // eslint-disable-line no-unused-vars
/* global Nimiq */
/* global KeyStore */
/* global RpcServer */
/* global I18n */

/**
 * @param {Function} RequestApiClass - Class object of the API which is to be exposed via postMessage RPC
 * @param {object} [options]
 */
async function runKeyguard(RequestApiClass, options) { // eslint-disable-line no-unused-vars
    const defaultOptions = {
        loadNimiq: true,
        whitelist: ['request'],
    };

    options = Object.assign(defaultOptions, options);

    // Expose KeyStore to mockup overwrites
    window.KeyStore = KeyStore;

    if (options.loadNimiq) {
        // Load web assembly encryption library into browser (if supported)
        await Nimiq.WasmHelper.doImportBrowser();
        // Configure to use test net for now
        Nimiq.GenesisConfig.test();
    }

    // Close window if user navigates back to loading screen
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '') {
            window.close();
        }
    });

    // FIXME Set correct allowedOrigin
    window.rpcServer = RpcServer.create(RequestApiClass, '*', options.whitelist);
}
