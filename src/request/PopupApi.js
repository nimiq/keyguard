/**
 * # PopupApi
 * A common parent class for pop-up requests.
 *
 * ## Usage:
 * Inherit this class in your popup request API class:
 * ```
 *  class SignTransactionApi extends PopupApi {
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
class PopupApi { // eslint-disable-line no-unused-vars
    constructor() {
        /** @type {Function} */
        this._resolve = () => { throw new Error('Method not defined'); };

        /** @type {Function} */
        this._reject = () => { throw new Error('Method not defined'); };
    }

    /**
     * Method to be called by the Keyguard client via RPC
     *
     * @param {KeyguardRequest} request
     */
    async request(request) {
        /**
         * Detect migrate signalling set by the iframe
         *
         * @deprecated Only for database migration
         */
        if ((BrowserDetection.isIos() || BrowserDetection.isSafari()) && this._hasMigrateFlag()) {
            await KeyStore.instance.doMigrateAccountsToKeys();
        }

        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;

            this.onRequest(request);
        });
    }

    /**
     * Overwritten by each request's API class
     *
     * @param {KeyguardRequest} request
     * @abstract
     */
    onRequest(request) { // eslint-disable-line no-unused-vars
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

    /**
     * @deprecated Only for database migration
     */
    _hasMigrateFlag() {
        const match = document.cookie.match(new RegExp('migrate=([^;]+)'));
        return match && match[1] === '1';
    }
}
