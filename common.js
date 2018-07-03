function runKeyguard(RequestApiClass) {
    //if (window.opener.location.origin !== '')

    this._rpcServer = new RPCServer(RequestApiClass);
}
