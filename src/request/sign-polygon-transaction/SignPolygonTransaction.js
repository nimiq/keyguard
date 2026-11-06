/* global Key */
/* global KeyStore */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */

/**
 * @callback SignPolygonTransaction.resolve
 * @param {KeyguardRequest.SignedPolygonTransaction} result
 */

class SignPolygonTransaction {
    /**
     * @param {Parsed<KeyguardRequest.SignPolygonTransactionRequest>} request
     * @param {SignPolygonTransaction.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this.$el = /** @type {HTMLElement} */ (
            document.getElementById(SignPolygonTransaction.Pages.CONFIRM_TRANSACTION));

        // Set up password box.
        const $passwordBox = /** @type {HTMLFormElement} */ (document.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passwordbox-confirm-tx',
            minLength: request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
        });

        this._passwordBox.on(
            PasswordBox.Events.SUBMIT,
            /** @param {string} [password] */ password => {
                this._onConfirm(request, resolve, reject, password);
            },
        );
    }

    /**
     * @param {Parsed<KeyguardRequest.SignPolygonTransactionRequest>} request
     * @param {SignPolygonTransaction.resolve} resolve
     * @param {reject} reject
     * @param {string} [password]
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, password) {
        TopLevelApi.setLoading(true);
        const passwordBuf = password ? Utf8Tools.stringToUtf8ByteArray(password) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(request.keyInfo.id, passwordBuf);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPasswordIncorrect();
                return;
            }
            reject(new Errors.CoreError(error instanceof Error ? error : errorMessage));
            return;
        }
        if (!key) {
            reject(new Errors.KeyNotFoundError());
            return;
        }

        reject(new Errors.KeyguardError('Signing Polygon transactions is not supported'));
    }

    run() {
        // Go to start page
        window.location.hash = SignPolygonTransaction.Pages.CONFIRM_TRANSACTION;
    }
}

SignPolygonTransaction.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
