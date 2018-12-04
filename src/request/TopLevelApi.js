/* global BrowserDetection */
/* global KeyStore */
/* global CookieJar */
/* global I18n */
/* global ErrorConstants */

/**
 * A common parent class for pop-up requests.
 *
 * Usage:
 * Inherit this class in your popup request API class:
 * ```
 *  class SignTransactionApi extends TopLevelApi {
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
class TopLevelApi { // eslint-disable-line no-unused-vars
    constructor() {
        if (window.self !== window.top) {
            // TopLevelApi may not run in a frame
            throw new Error('Illegal use');
        }

        /** @type {Function} */
        this._resolve = () => { throw new Error('Method this._resolve not defined'); };

        /** @type {Function} */
        this._reject = () => { throw new Error('Method this._reject not defined'); };

        I18n.initialize(window.TRANSLATIONS, 'en');
        I18n.translateDom();

        window.addEventListener('beforeunload', () => {
            this.reject(new Error('Keyguard popup closed'));
        });
    }

    /**
     * Method to be called by the Keyguard client via RPC
     *
     * @param {Rpc.State | null} state
     * @param {KeyguardRequest.KeyguardRequest} request
     */
    async request(state, request) {
        /**
         * Detect migrate signalling set by the iframe
         *
         * @deprecated Only for database migration
         */
        if ((BrowserDetection.isIos() || BrowserDetection.isSafari()) && this._hasMigrateFlag()) {
            await KeyStore.instance.migrateAccountsToKeys();
        }

        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;

            window.addEventListener('unhandledrejection', event => {
                const error = /** @type {PromiseRejectionEvent} */(event).reason;
                error.name = error.name === 'Error' ? ErrorConstants.Types.UNCLASSIFIED : error.name;
                this.reject(error);
                return false;
            });

            window.addEventListener('error', event => {
                const error = event.error;
                error.name = event.error.name === 'Error' ? ErrorConstants.Types.UNCLASSIFIED : error.name;
                this.reject(error);
                return false;
            });

            this.onRequest(request).catch(reject);
        });
    }

    /**
     * Overwritten by each request's API class
     *
     * @param {KeyguardRequest.KeyguardRequest} request
     * @abstract
     */
    async onRequest(request) { // eslint-disable-line no-unused-vars
        throw new Error('Not implemented');
    }

    /**
     * Called by a page's API class on success
     *
     * @param {*} result
     * @returns {Promise<void>}
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
     * @returns {boolean}
     */
    _hasMigrateFlag() {
        const match = document.cookie.match(new RegExp('migrate=([^;]+)'));
        return !!match && match[1] === '1';
    }
}
