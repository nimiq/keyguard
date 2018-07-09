/**
 * RPC (Remote Procedure Call) Server, also called COP Server (Cross-Origin-Procedure)
 *
 * Usage:
 * <script src="lib/rpc-server.js"></script>
 *
 * const rpcServer = RpcServer.create(ProviderClass, 'https://allowed.origin.com');
 */
class RpcServer { // eslint-disable-line no-unused-vars
    /**
     * @param {object} clazz - The class whose methods will be made available via postMessage RPC
     * @param {string} allowedOrigin - The origin that is allowed to call this server
     * @param {string[]} whitelist
     * @returns {object}
     */
    static create(clazz, allowedOrigin, whitelist) {
        return new (RpcServer._generateServerClass(clazz, allowedOrigin, whitelist))();
    }

    /**
     * @param {Newable} clazz - The class whose methods will be made available via postMessage RPC
     * @param {string} allowedOrigin - The origin that is allowed to call this server
     * @param {string[]} whitelist
     * @returns {Newable}
     */
    static _generateServerClass(clazz, allowedOrigin, whitelist) {
        const Server = class extends clazz {
            constructor() {
                super();
                this._allowedOrigin = allowedOrigin;
                this._whitelist = whitelist;
                this._receive = this._receive.bind(this);
                window.addEventListener('message', this._receive);
            }

            close() {
                window.removeEventListener('message', this._receive);
            }

            /**
             * @param {MessageEvent} message
             * @param {string} status
             * @param {any} result
             */
            _replyTo(message, status, result) {
                return message.source && message.source.postMessage({
                    status,
                    result,
                    id: message.data.id,
                }, message.origin);
            }

            /**
             * @param {MessageEvent} message
             */
            _receive(message) {
                try {
                    // Cannot reply to a message that has no source window
                    if (!message.source) return;

                    // Ignore messages without a command
                    if (!message.data.command) return;

                    // Ignore messages without an ID
                    if (!message.data.id) return;

                    // FIXME Remove '*' option for release
                    if (this._allowedOrigin !== '*' && message.origin !== this._allowedOrigin) {
                        throw new Error('Unauthorized');
                    }

                    const args = message.data.args && Array.isArray(message.data.args) ? message.data.args : [];

                    // Test if request calls an existing/whitelisted method with the right number of arguments
                    const requestedMethod = this[message.data.command];
                    if (this._whitelist.indexOf(message.data.command) < 0 || !requestedMethod) {
                        throw new Error('Unknown command');
                    }
                    if (requestedMethod.length < args.length) {
                        throw new Error(`Too many arguments passed: ${message}`);
                    }

                    const result = this._invoke(message.data.command, args);

                    if (result instanceof Promise) {
                        result
                            .then(finalResult => this._ok(message, finalResult))
                            .catch(error => this._error(message, error));
                    } else {
                        this._ok(message, result);
                    }
                } catch (error) {
                    this._error(message, error);
                }
            }

            /**
             * @param {MessageEvent} message
             * @param {any} result
             */
            _ok(message, result) {
                this._replyTo(message, 'ok', result);
            }

            /**
             * @param {MessageEvent} message
             * @param {CustomError} error
             */
            _error(message, error) {
                this._replyTo(message, 'error',
                    error.message
                        ? { message: error.message, stack: error.stack, code: error.code }
                        : { message: error });
            }

            /**
             * @param {string} command
             * @param {any[]} args
             */
            _invoke(command, args) {
                return this[command](...args);
            }
        };

        Server.prototype.ping = function ping() { return 'pong'; };

        return Server;
    }
}
