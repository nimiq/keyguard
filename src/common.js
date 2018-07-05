/** @param {Function} RequestApiClass - Class object of the API which is to be exposed via postMessage RPC */
async function runKeyguard(RequestApiClass) {

    // Expose KeyStore to mockup overwrites
    self.KeyStore = KeyStore;

    await Nimiq.WasmHelper.doImportBrowser();
    Nimiq.GenesisConfig.test();

    // Close window if user navigates back to loading screen
    self.onhashchange = () => {
        if (location.hash === '') {
            self.close();
        }
    };

    window.rpcServer = RpcServer.create(RequestApiClass, '*'); // FIXME Set correct allowedOrigin
}
