/** @param {Function} RequestApiClass - Class object of the API which is to be exposed via postMessage RPC */
async function runKeyguard(RequestApiClass) {

    // expose KeyStore to mockup overwrites
    self.KeyStore = KeyStore;

    await Nimiq.WasmHelper.doImportBrowser();

    // close window if user navigates back to loading screen
    self.onhashchange = _ => {
        if (location.hash === '') {
            self.close();
        }
    };

    //if (window.opener.location.origin !== '')

    Nimiq.GenesisConfig.test();

    window.rpcServer = RpcServer.create(RequestApiClass, '*'); // FIXME Set correct allowedOrigin
}
