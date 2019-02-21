/* global BrowserDetection */
/* global Errors */
/* global KeyStore */
/* global CookieJar */
/* global I18n */
/* global Nimiq */
/* global RequestParser */
/* global NoReferrerErrorPage */

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
 * @abstract
 */
class TopLevelApi extends RequestParser { // eslint-disable-line no-unused-vars
    constructor() {
        super();
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

        // Show error page if we cannot verify origin of request
        if (!document.referrer) {
            const errorPage = new NoReferrerErrorPage();
            /** @type {HTMLDivElement} */
            const $target = (document.querySelector('#rotation-container') || document.querySelector('#app'));
            $target.appendChild(errorPage.getElement());
            window.location.hash = 'error';
            TopLevelApi.setLoading(false);
        }
    }

    /**
     * Method to be called by the Keyguard client via RPC
     *
     * @param {RpcState?} state
     * @param {KeyguardRequest.Request} request
     */
    async request(state, request) {
        /**
         * Detect migration cookie set by the iframe
         *
         * @deprecated Only for database migration
         */
        if ((BrowserDetection.isIOS() || BrowserDetection.isSafari())) {
            if (TopLevelApi._hasMigrateFlag()) {
                await KeyStore.instance.migrateAccountsToKeys();
            }
            /*
             * There is a case using recovery words when the kind of secret, entropy or privateKey is ambiguous.
             * In that scenario both keys will be encrypted and stored.
             * After returning the AccountsManager will do an activity lookup for addresses to both of these keys.
             * In case one did not see any activity at all, it will be discarded and removed by this code.
             * The cookie is set in `IFrameAPI.releaseKey()` which requires the session to still be active.
             */
            if (TopLevelApi._hasRemoveKey()) {
                // eat
                const match = document.cookie.match(new RegExp('removeKey=([^;]+)'));
                if (match && match[1]) {
                    try {
                        /** @type {string[]} */
                        const removeKeyArray = JSON.parse(match[1]);
                        removeKeyArray.forEach(keyId => {
                            KeyStore.instance.remove(keyId);
                        });
                    } catch (e) {
                        this._reject(e);
                    }
                }
                // crumble
                document.cookie = 'removeKey=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            }
        }

        const parsedRequest = await this.parseRequest(request);

        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;

            if (!parsedRequest) { // should already be rejected here with an Errors.InvalidRequestError()
                // this really should never happen
                this.reject(new Errors.InvalidRequestError('Request was not successfully parsed'));
                return;
            }

            /**
             * Load the crypto worker only if needed. That is, requests who are either
             * Import or Create (the only ones which don't have the keyInfo property)
             * or any request which has the keyInfo property and the encrypted flag set.
             */
            if (!(/** @type {ParsedSimpleRequest} */(parsedRequest).keyInfo)
                || /** @type {ParsedSimpleRequest} */(parsedRequest).keyInfo.encrypted) {
                Nimiq.CryptoWorker.getInstanceAsync();
            }

            window.addEventListener('unhandledrejection', event => {
                const error = new Errors.UnclassifiedError(/** @type {PromiseRejectionEvent} */(event).reason);
                this.reject(error);
                return false;
            });

            window.addEventListener('error', event => {
                const error = new Errors.UnclassifiedError(event.error);
                this.reject(error);
                return false;
            });

            if (!this.Handler) {
                reject(new Errors.KeyguardError('Handler undefined'));
                return;
            }

            try {
                const handler = new this.Handler(parsedRequest, this.resolve.bind(this), reject);

                this.onBeforeRun(parsedRequest);

                this.setGlobalCloseButtonText(`${I18n.translatePhrase('back-to')} ${parsedRequest.appName}`);

                handler.run();

                TopLevelApi.setLoading(false);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Overwritten by each request's API class
     *
     * @param {KeyguardRequest.Request} request
     * @returns {Promise<ParsedRequest>}
     * @abstract
     */
    async parseRequest(request) { // eslint-disable-line no-unused-vars
        throw new Error('parseRequest not implemented');
    }

    /** @type {Newable?} */
    get Handler() {
        return null;
    }

    /**
     * Can be overwritten by a request's API class to excute code before the handler's run() is called
     *
     * @param {ParsedRequest} parsedRequest
     */
    async onBeforeRun(parsedRequest) { // eslint-disable-line no-unused-vars
        // noop
    }

    /**
     * Called by a page's API class on success
     *
     * @param {*} result
     * @returns {Promise<void>}
     */
    async resolve(result) {
        // Keys might have changed, so update cookie for iOS and Safari users
        if (BrowserDetection.isIOS() || BrowserDetection.isSafari()) {
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
     * @param {string} buttonText
     */
    setGlobalCloseButtonText(buttonText) {
        /** @type {HTMLElement} */
        const $globalCloseText = (document.querySelector('#global-close-text'));
        /** @type {HTMLSpanElement} */
        const $button = ($globalCloseText.parentNode);
        if (!$button.classList.contains('display-none')) return;
        $globalCloseText.textContent = buttonText;
        $button.addEventListener('click', () => this.reject(new Errors.RequestCanceled()));
        $button.classList.remove('display-none');
    }

    /**
     * @param {boolean} showLoading
     */
    static setLoading(showLoading) {
        document.body.classList.toggle('loading', showLoading);
    }

    /**
     * @deprecated Only for database migration
     * @returns {boolean}
     * @private
     */
    static _hasMigrateFlag() {
        const match = document.cookie.match(new RegExp('migrate=([^;]+)'));
        return !!match && match[1] === '1';
    }

    /**
     * @returns {boolean}
     * @private
     */
    static _hasRemoveKey() {
        const match = document.cookie.match(new RegExp('removeKey=([^;]+)'));
        return !!match && match[1] !== '';
    }

    /**
     * @returns {number} the current width of the document
     */
    static getDocumentWidth() {
        return window.innerWidth
            || document.documentElement.clientWidth
            || document.body.clientWidth;
    }
}
