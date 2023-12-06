/* global PasswordBox */
/* global KeyStore */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global BitcoinKey */

/**
 * @callback DeriveBtcXPub.resolve
 * @param {KeyguardRequest.DeriveBtcXPubResult} result
 */

class DeriveBtcXPub {
    /**
     * @param {Parsed<KeyguardRequest.DeriveBtcXPubRequest>} request
     * @param {DeriveBtcXPub.resolve} resolve
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
        const passwordBuffer = password && password.length > 0
            ? Utf8Tools.stringToUtf8ByteArray(password)
            : undefined;

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

        const bitcoinXPub = new BitcoinKey(key).deriveExtendedPublicKey(this._request.bitcoinXPubPath);

        /** @type {KeyguardRequest.DeriveBtcXPubResult} */
        const result = {
            bitcoinXPub,
        };

        this._resolve(result);
    }

    async run() {
        window.location.hash = DeriveBtcXPub.Pages.UNLOCK;
    }
}

DeriveBtcXPub.Pages = {
    UNLOCK: 'unlock',
};
