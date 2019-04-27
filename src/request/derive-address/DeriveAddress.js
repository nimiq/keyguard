/* global DerivedIdenticonSelector */
/* global PasswordBox */
/* global KeyStore */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */

/**
 * @callback DeriveAddress.resolve
 * @param {KeyguardRequest.DeriveAddressResult} result
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

        /** @type {HTMLFormElement} */
        const $passwordBox = (document.querySelector('.password-box'));

        /** @type {HTMLDivElement} */
        const $identiconSelector = (document.querySelector('.identicon-selector'));

        // Create components

        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passwordbox-continue',
            hideCancel: true,
        });
        this._identiconSelector = new DerivedIdenticonSelector($identiconSelector);

        // Wire up logic

        this._passwordBox.on(
            PasswordBox.Events.SUBMIT,
            async /** @param {string|undefined} password */ password => {
                if (!(await this._onPasswordEntered(password))) return;
                window.location.hash = DeriveAddress.Pages.CHOOSE_IDENTICON;
            },
        );

        this._identiconSelector.on(
            DerivedIdenticonSelector.Events.IDENTICON_SELECTED,
            /** @param {{address: Nimiq.Address, keyPath: string}} selectedAddress */
            selectedAddress => {
                /** @type {KeyguardRequest.DeriveAddressResult} */
                const result = {
                    address: selectedAddress.address.serialize(),
                    keyPath: selectedAddress.keyPath,
                };

                this._resolve(result);
            },
        );

        this._identiconSelector.on(
            DerivedIdenticonSelector.Events.MASTER_KEY_NOT_SET,
            this._reject.bind(this),
        );
    } // constructor

    /**
     * @param {string} [password]
     * @returns {Promise<boolean>}
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
        } catch (e) {
            if (e.message === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPasswordIncorrect();
                return false;
            }
            this._reject(new Errors.CoreError(e));
            return false;
        }

        if (!key) {
            this._reject(new Errors.KeyNotFoundError());
            return false;
        }
        const masterKey = /** @type {Nimiq.Entropy} */ (key.secret).toExtendedPrivateKey();
        const pathsToDerive = this._request.indicesToDerive.map(index => `${this._request.baseKeyPath}/${index}`);

        this._identiconSelector.init(masterKey, pathsToDerive);
        TopLevelApi.setLoading(false);
        return true;
    }

    async run() {
        if (this._request.keyInfo.encrypted) {
            window.location.hash = DeriveAddress.Pages.UNLOCK;
        } else {
            await this._onPasswordEntered();
            window.location.hash = DeriveAddress.Pages.CHOOSE_IDENTICON;
        }
    }
}

DeriveAddress.Pages = {
    UNLOCK: 'unlock',
    CHOOSE_IDENTICON: 'choose-identicon',
};
