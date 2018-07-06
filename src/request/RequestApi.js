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
        // Deprecated, only for database migration
        // TODO Maybe only check on iOS/Safari?
        // Would require to load the BrowserDetection class for every request.
        await this._checkForMigrationFlag();

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

    /**
     * @deprecated Only for database migration
     */
    async _checkForMigrationFlag() {
        const match = document.cookie.match(new RegExp('migrate=([^;]+)'));
        if (match && match[1] === "1") {
            await RequestApi.doMigrateAccountsToKeys();
            document.cookie = 'migrate=0;expires=0'; // Delete the migrate cookie
        }
    }

    /**
     * @deprecated Only for database migration
     */
    static async doMigrateAccountsToKeys() {
        const accountStore = AccountStore.instance;
        const keyStore = KeyStore.instance;

        const keys = await accountStore.dangerouslistPlain();

        for (const key of keys) {
            const keyEntry = {
                encryptedKeyPair: key.encryptedKeyPair,
                userFriendlyAddress: key.userFriendlyAddress,
                // Translate between old text type and new number type
                type: /** @type {EncryptionType} */ (key.type === 'high' ? EncryptionType.HIGH : EncryptionType.LOW)
            };
            await keyStore.putPlain(keyEntry);
        }

        // FIXME Uncomment after/for testing
        // await accountStore.drop();
        return true;
    }
}
