/* global JsonUtils */

/**
 * This file was generated from the @nimiq/rpc package source, with `RpcServer` being the only target.
 *
 * HOWTO:
 * - Remove `export * from './RpcClient';` from @nimiq/rpc/src/main.ts
 * - Run `yarn build` in the @nimiq/rpc directory
 * - @nimiq/rpc/dist/rpc.es.js is the wanted module file
 * - The following changes where made to this file afterwards:
 *   https://github.com/nimiq/keyguard-next/commits/master/src/lib/RpcServer.es.js
 */

/**
 * @typedef {'ok' | 'error'} ResponseStatus
 * @typedef {{origin: string, data: object}} Message
 * @typedef {{data: {id: number, status: ResponseStatus, result: any}}} ResponseMessage extends Message
 * @typedef {{source: string}} PostMessage extends Message
 * @typedef {{origin: string, data: {id: number, command: string, args: any[]}, returnURL: string}} RedirectRequest
 */

const ResponseStatus = {
    OK: /** @type {'ok'} */ ('ok'),
    ERROR: /** @type {'error'} */ ('error'),
};

class UrlRpcEncoder {
    /**
     * @param {Location} url
     * @returns {RedirectRequest?}
     */
    static receiveRedirectCommand(url) {
        // Need referrer for origin check
        if (!document.referrer) return null;
        // Parse query
        const params = new URLSearchParams(url.search);
        const referrer = new URL(document.referrer);
        // Ignore messages without a command
        if (!params.has('command')) return null;
        // Ignore messages without an ID
        if (!params.has('id')) return null;
        // Ignore messages without a valid return path
        if (!params.has('returnURL')) return null;
        // Only allow returning to same origin
        const returnURL = new URL(/** @type {string} */ (params.get('returnURL')));
        if (returnURL.origin !== referrer.origin) return null;
        // Parse args
        let args = [];
        if (params.has('args')) {
            try {
                args = JsonUtils.parse(/** @type {string} */ (params.get('args')));
            } catch (e) {
                // Do nothing
            }
        }
        args = Array.isArray(args) ? args : [];

        return {
            origin: referrer.origin,
            data: {
                id: parseInt(/** @type {string} */ (params.get('id')), 10),
                command: /** @type {string} */ (params.get('command')),
                args,
            },
            returnURL: /** @type {string} */ (params.get('returnURL')),
        };
    }

    /**
     * @param {RpcState} state
     * @param {string} status
     * @param {any} result
     * @returns {string}
     */
    static prepareRedirectReply(state, status, result) {
        const params = new URLSearchParams();
        params.set('status', status);
        params.set('result', JsonUtils.stringify(result));
        params.set('id', state.id.toString());
        // TODO: what if it already includes a query string
        return `${state.returnURL}?${params.toString()}`;
    }
}

class RpcState {
    /** @type {number} */
    get id() {
        return this._id;
    }

    /** @type {string} */
    get origin() {
        return this._origin;
    }

    /** @type {any} */
    get data() {
        return this._data;
    }

    /** @type {string?} */
    get returnURL() {
        return this._returnURL;
    }

    /** @type {Window | MessagePort | ServiceWorker | null} */
    get source() {
        return this._source;
    }

    /**
     * @param {MessageEvent | RedirectRequest } message
     */
    constructor(message) {
        if (!message.data.id) throw Error('Missing id');
        this._origin = message.origin;
        this._id = message.data.id;
        this._postMessage = 'source' in message && !('returnURL' in message);
        this._returnURL = 'returnURL' in message ? message.returnURL : null;
        this._data = message.data;
        this._source = 'source' in message ? message.source : null;
    }

    /**
     * @param {ResponseStatus} status
     * @param {any} result
     */
    reply(status, result) {
        console.debug('RpcServer REPLY', result);
        if (status === ResponseStatus.ERROR) {
            // serialize error objects
            result = typeof result === 'object'
                ? { message: result.message, stack: result.stack, name: result.name }
                : { message: result };
        }
        if (this._postMessage) {
            // Send via postMessage (e.g., popup)
            let target;
            // If source is given, use it
            if (this._source) {
                target = this._source;
            } else {
                // Else guess
                target = window.opener || window.parent;
            }
            target.postMessage({
                status,
                result,
                id: this.id,
            }, this.origin);
        } else if (this._returnURL) {
            // Send via top-level navigation
            window.location.href = UrlRpcEncoder.prepareRedirectReply(this, status, result);
        }
    }
}

class RpcServer { // eslint-disable-line no-unused-vars
    /**
     * @param {RpcState} state
     * @param {any} result
     */
    static _ok(state, result) {
        state.reply(ResponseStatus.OK, result);
    }

    /**
     * @param {RpcState} state
     * @param {Error} error
     */
    static _error(state, error) {
        state.reply(ResponseStatus.ERROR, error);
    }

    /**
     * @param {string} allowedOrigin
     */
    constructor(allowedOrigin) {
        this._allowedOrigin = allowedOrigin;
        this._responseHandlers = new Map();
        this._responseHandlers.set('ping', () => 'pong');
        this._receiveListener = this._receive.bind(this);
    }

    /**
     * @param {string} command
     * @param {Function} fn
     */
    onRequest(command, fn) {
        this._responseHandlers.set(command, fn);
    }

    init() {
        window.addEventListener('message', this._receiveListener);
        this._receiveRedirect();
    }

    close() {
        window.removeEventListener('message', this._receiveListener);
    }

    _receiveRedirect() {
        const message = UrlRpcEncoder.receiveRedirectCommand(window.location);
        if (message) {
            this._receive(message);
        }
    }

    /**
     * @param {MessageEvent | RedirectRequest} message
     */
    _receive(message) {
        let _state = null;
        try {
            _state = new RpcState(message);
            const state = _state;

            // Cannot reply to a message that has no source window or return URL
            if (!('source' in message) && !('returnURL' in message)) return;
            // Ignore messages without a command
            if (!('command' in state.data)) return;
            if (this._allowedOrigin !== '*' && message.origin !== this._allowedOrigin) {
                throw new Error('Unauthorized');
            }
            const args = message.data.args && Array.isArray(message.data.args) ? message.data.args : [];
            // Test if request calls a valid handler with the correct number of arguments
            if (!this._responseHandlers.has(state.data.command)) {
                throw new Error(`Unknown command: ${state.data.command}`);
            }
            const requestedMethod = this._responseHandlers.get(state.data.command);
            // Do not include state argument
            if (Math.max(requestedMethod.length - 1, 0) < args.length) {
                throw new Error(`Too many arguments passed: ${JSON.stringify(message)}`);
            }
            console.debug('RpcServer ACCEPT', state.data);
            // Call method
            const result = requestedMethod(state, ...args);
            // If a value is returned, we take care of the reply,
            // otherwise we assume the handler to do the reply when appropriate.
            if (result instanceof Promise) {
                result
                    .then(finalResult => {
                        if (finalResult !== undefined) {
                            RpcServer._ok(state, finalResult);
                        }
                    })
                    .catch(error => RpcServer._error(state, error));
            } else if (result !== undefined) {
                RpcServer._ok(state, result);
            }
        } catch (error) {
            if (_state) {
                RpcServer._error(_state, error);
            }
        }
    }
}
