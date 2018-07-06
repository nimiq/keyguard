/**
 * # RequestApi
 * A common parent class for pop-up requests.
 *
 * ## Usage:
 * Inherit this class in your requests API class:
 * ```
 *  class SignTransactionApi extends RequestApi {
 *
 *      // Define the onRequest method to receive the client's request object:
 *      onRequest(request) {
 *          // do something...
 *
 *          // When done, call this.resolve() with the result object
 *          this.resolve(result);
 *
 *          // Or this.reject() with an error
 *          this.reject(error);
 *      }
 *  }
 *
 *  // Finally, start your API:
 *  runKeyguard(SignTransactionApi);
 * ```
 */
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
    async resolve(result) {
        // Keys might have changed, so update cookie for iOS and Safari users
        if (BrowserDetection.isIos() || BrowserDetection.isSafari()) {
            const keys = await KeyStore.instance.list();
            CookieJar.fill(keys);
        }

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
