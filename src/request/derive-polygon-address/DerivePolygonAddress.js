/* global PasswordBox */
/* global KeyStore */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global PolygonKey */

/**
 * @callback DerivePolygonAddress.resolve
 * @param {KeyguardRequest.DerivePolygonAddressResult} result
 */

class DerivePolygonAddress {
    /**
     * @param {Parsed<KeyguardRequest.DerivePolygonAddressRequest>} request
     * @param {DerivePolygonAddress.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        this._resolve = resolve;
        this._reject = reject;

        const $passwordBox = /** @type {HTMLFormElement} */ (document.querySelector('.password-box'));

        // Create components

        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passwordbox-continue',
        });

        // Wire up logic

        this._passwordBox.on(PasswordBox.Events.SUBMIT, /** @param {string|undefined} password */ password => {
            this._onPasswordEntered(password);
        });
    } // constructor

    /**
     * @param {string} [password]
     * @returns {Promise<void>}
     */
    async _onPasswordEntered(password) {
        TopLevelApi.setLoading(true);
        const passwordBuffer = password ? Utf8Tools.stringToUtf8ByteArray(password) : undefined;

        /** @type {Key|null} */
        let key = null;
        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, passwordBuffer);
        } catch (err) {
            const e = /** @type {Error} */ (err);
            if (e.message === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPasswordIncorrect();
                return;
            }
            this._reject(new Errors.CoreError(e));
            return;
        }

        if (!key) {
            this._reject(new Errors.KeyNotFoundError());
            return;
        }

        const keyPath = `${this._request.polygonAccountPath}/0/0`;

        /** @type {KeyguardRequest.DerivePolygonAddressResult} */
        const result = {
            polygonAddresses: [{
                address: new PolygonKey(key).deriveAddress(keyPath),
                keyPath,
            }],
        };

        this._resolve(result);
    }

    async run() {
        window.location.hash = DerivePolygonAddress.Pages.UNLOCK;
    }
}

DerivePolygonAddress.Pages = {
    UNLOCK: 'unlock',
};
