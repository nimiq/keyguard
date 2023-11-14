/* global PasswordBox */
/* global KeyStore */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */

/**
 * @callback DeriveAddress.resolve
 * @param {KeyguardRequest.DerivedAddress[]} result
 */

class DeriveAddress {
    /**
     * @param {Parsed<KeyguardRequest.DeriveAddressRequest>} request
     * @param {DeriveAddress.resolve} resolve
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
        const masterKey = /** @type {Nimiq.Entropy} */ (key.secret).toExtendedPrivateKey();
        const pathsToDerive = this._request.indicesToDerive.map(index => `${this._request.baseKeyPath}/${index}`);

        /** @type {KeyguardRequest.DerivedAddress[]} */
        const derivedAddresses = pathsToDerive.map(path => ({
            address: masterKey.derivePath(path).toAddress().serialize(),
            keyPath: path,
        }));

        this._resolve(derivedAddresses);
    }

    async run() {
        window.location.hash = DeriveAddress.Pages.UNLOCK;
    }
}

DeriveAddress.Pages = {
    UNLOCK: 'unlock',
};
