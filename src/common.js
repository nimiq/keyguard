function runKeyguard(RequestApiClass) {
    //if (window.opener.location.origin !== '')

    this._rpcServer = RpcServer.create(RequestApiClass, '*'); // FIXME Set correct allowedOrigin
}
