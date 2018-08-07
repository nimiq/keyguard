/* global Nimiq */
/* global Rpc */

/**
 * @param {Newable} RequestApiClass - Class object of the API which is to be exposed via postMessage RPC
 * @param {object} [options]
 */
async function runKeyguard(RequestApiClass, options) { // eslint-disable-line no-unused-vars
    const defaultOptions = {
        loadNimiq: true,
        whitelist: ['request'],
    };

    options = Object.assign(defaultOptions, options);

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

    // Instantiate handler.
    const api = new RequestApiClass();

    // FIXME Set correct allowedOrigin
    window.rpcServer = new Rpc.RpcServer('*');
    window.rpcServer.onRequest('request', (state, request) => api.request(request));
    window.rpcServer.init();
}
