class RpcClient { // eslint-disable-line no-unused-vars
    /**
     * @param {Window} targetWindow
     * @param {string} targetOrigin
     * @returns {Promise<RpcClientInstance>}
     * @throws
     */
    static async create(targetWindow, targetOrigin) {
        return new Promise((resolve, reject) => {
            let connected = false;

            /**
             * @param {MessageEvent} message
             */
            const connectedListener = ({ source, origin, data }) => {
                // Debugging printouts
                if (data.result.stack) {
                    const error = new Error(data.result.message);
                    error.stack = data.result.stack;
                    console.error(error);
                } else {
                    console.log('Received:', origin, data);
                }

                if (source !== targetWindow
                    || data.status !== 'ok'
                    || data.result !== 'pong'
                    || data.id !== 1
                    || (targetOrigin !== '*' && origin !== targetOrigin)) return;

                window.removeEventListener('message', connectedListener);

                connected = true;

                console.log('RpcClient: Connection established');
                resolve(new (RpcClient._generateClientClass(targetWindow, targetOrigin))());
            };

            window.addEventListener('message', connectedListener);

            let connectTimer = 0;
            const timeoutTimer = setTimeout(() => {
                reject(new Error('Connection timeout'));
                clearTimeout(connectTimer);
            }, 30 * 1000);

            const tryToConnect = () => {
                if (connected) {
                    clearTimeout(timeoutTimer);
                    return;
                }

                try {
                    targetWindow.postMessage({ command: 'ping', id: 1 }, targetOrigin);
                } catch (e) {
                    console.error(`postMessage failed: ${e}`);
                }

                connectTimer = setTimeout(tryToConnect, 1000);
            };

            connectTimer = setTimeout(tryToConnect, 100);
        });
    }


    /**
     * @param {Window} targetWindow
     * @param {string} targetOrigin
     * @private
     */
    static _generateClientClass(targetWindow, targetOrigin) {
        /** @type {Newable} */
        const Client = class {
            constructor() {
                // Svub: Code smell that _targetWindow and _waiting are visible outside. Todo later!
                this._targetWindow = targetWindow;
                this._targetOrigin = targetOrigin;
                /** @type {Map.<number,{resolve: Function, reject: Function}>} */
                this._waiting = new Map();
                this._receive = this._receive.bind(this);
                window.addEventListener('message', this._receive);
            }

            /**
             * @param {string} command
             * @param {any[]} [args]
             * @returns {Promise<any>}
             */
            async call(command, args) {
                return new Promise((resolve, reject) => {
                    const obj = {
                        command,
                        args,
                        id: this._generateRandomId(),
                    };

                    // Store
                    this._waiting.set(obj.id, { resolve, reject });

                    this._targetWindow.postMessage(obj, this._targetOrigin);

                    // No timeout for now, as most requests require user interactions.
                    // TODO Maybe set timeout via parameter?
                    // setTimeout(() => reject(new Error ('Request timeout')), 10 * 1000);
                });
            }

            /** */
            close() {
                window.removeEventListener('message', this._receive);
            }

            /**
             * @param {MessageEvent} message
             */
            _receive({ source, origin, data }) {
                // Discard all messages from unwanted sources
                // or which are not replies
                // or which are not from the correct origin
                if (source !== this._targetWindow
                    || !data.status
                    || !data.id
                    || (this._targetOrigin !== '*' && origin !== this._targetOrigin)) return;

                const callback = this._waiting.get(data.id);

                if (callback) {
                    this._waiting.delete(data.id);

                    if (data.status === 'ok') {
                        callback.resolve(data.result);
                    } else if (data.status === 'error') {
                        const { message, stack, code } = data.result;
                        const error = /** @type {CustomError} */ (new Error(message));
                        error.code = code;
                        error.stack = stack;
                        callback.reject(error);
                    }
                }
            }

            _generateRandomId() {
                const array = new Uint32Array(1);
                crypto.getRandomValues(array);
                return array[0];
            }
        };

        return Client;
    }
}
