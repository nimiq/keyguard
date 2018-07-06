class RequestApi {

    constructor() {
        /** @type {Function} */
        this._resolve;

        /** @type {Function} */
        this._reject;
    }

    /**
     * Method to be called by the Keyguard client via RPC
     *
     * @param {object} request
     */
    async request(request) {
        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;

            this.onRequest(request);
        });
    }

    /**
     * Overloaded by each pages' API class
     *
     * @param {any} request
     */
    onRequest(request) {
        throw new Error('Not implemented');
    }

    /**
     * Called by a page's API class on success
     *
     * @param {any} result
     */
    resolve(result) {
        this._resolve(result);
    }

    /**
     * Called by a page's API class on error
     *
     * @param {Error} error
     */
    reject(error) {
        this._reject(error);
    }
}
