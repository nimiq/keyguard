/**
 * @param {Function} RequestApiClass - Class object of the API which is to be exposed via postMessage RPC
 * @param {object} [options]
 */
async function runKeyguard(RequestApiClass, options) {

    const defaultOptions = {
        loadNimiq: true,
        rpcWhitelist: ['request'],
    };

    options = Object.assign(defaultOptions, options);

    // Expose KeyStore to mockup overwrites
    self.KeyStore = KeyStore;

    if (options.loadNimiq) {
        await Nimiq.WasmHelper.doImportBrowser();
        Nimiq.GenesisConfig.test();
    }

    // Close window if user navigates back to loading screen
    self.addEventListener('hashchange', () => {
        if (location.hash === '') {
            self.close();
        }
    });

    self.rpcServer = RpcServer.create(RequestApiClass, '*', options.rpcWhitelist); // FIXME Set correct allowedOrigin
}
