/** @param {Function} RequestApiClass - Class object of the API which is to be exposed via postMessage RPC */
function runKeyguard(RequestApiClass) {

    // close window if user navigates back to loading screen
    let visitedFirstPage = false;
    self.onhashchange = _ => {
        if (location.hash === '') {
            if (visitedFirstPage) {
                self.close();
            }
            visitedFirstPage = true;
        }
    };

    //if (window.opener.location.origin !== '')

    Nimiq.GenesisConfig.test();

    window.rpcServer = RpcServer.create(RequestApiClass, '*'); // FIXME Set correct allowedOrigin

    // keyguard class?
}
