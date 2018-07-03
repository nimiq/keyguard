/**
 * RPC (Remote Procedure Call) Server
 * Also called COP Server (Cross-Origin-Procedure)
 *
 * # Usage:
 * <script src="rpc-server.js"></script>
 * const rpcServer = new RpcServer.create(ProviderClass, 'https://allowed.origin.com');
 */
class RpcServer {
    /**
     * @param {Class} Clazz The class whose methods will be made available via postMessage RPC
     * @param {string} allowedOrigin The origin that is allowed to call this server
     * @return {T extends Clazz}
     */
    static create(Clazz, allowedOrigin) {
        return new (RpcServer._Server(Clazz, allowedOrigin))();
    }

    static _Server(Clazz, allowedOrigin) {
        const Server = class extends Clazz {
            constructor() {
                super();
                this._allowedOrigin = allowedOrigin;
                this._receive = this._receive.bind(this);
                window.addEventListener('message', this._receive);
            }

            close() {
                window.removeEventListener('message', this._receive);
            }

            _replyTo(message, status, result) {
                message.source.postMessage({ status, result, id: message.data.id }, message.origin);
            }

            _receive(message) {
                try {
                    if (message.origin !== this._allowedOrigin) throw new Error('Unauthorized');

                    let args = message.data.args || [];

                    // Test if request calls an existing method with the right number of arguments
                    const calledMethod = this[message.data.command];
                    if (message.data.command.startsWith('_') || !calledMethod) {
                        throw new Error('Unknown command');
                    }

                    if (calledMethod.length < args.length) {
                        // FIXME After debugging this should be changed to the "Unknown command" error
                        throw new Error(`Too many arguments passed: ${message}`);
                    }

                    const result = this._invoke(message.data.command, args);

                    if (result instanceof Promise) {
                        result
                            .then((finalResult) => this._ok(message, finalResult))
                            .catch(error => this._error(message, error));
                    } else {
                        this._ok(message, result);
                    }
                } catch (error) {
                    this._error(message, error);
                }
            }

            _ok(message, result) {
                this._replyTo(message, 'OK', result);
            }

            _error(message, error) {
                this._replyTo(message, 'error',
                    error.message ? { message: error.message, stack: error.stack, code: error.code } : { message: error } )
            }

            _invoke(command, args) {
                return this[command].apply(this, args);
            }
        };

        return Server;
    }
}
