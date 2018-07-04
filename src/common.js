/** @param {Function} RequestApiClass - Class object of the API which is to be exposed via postMessage RPC */
function runKeyguard(RequestApiClass) {
    //if (window.opener.location.origin !== '')

    const rpcServer = RpcServer.create(RequestApiClass, '*'); // FIXME Set correct allowedOrigin
    // keyguard class?
}
