function runKeyguard(RequestApiClass) {
    //if (window.opener.location.origin !== '')

    const rpcServer = RpcServer.create(RequestApiClass, '*'); // FIXME Set correct allowedOrigin
    // keyguard class?
}
