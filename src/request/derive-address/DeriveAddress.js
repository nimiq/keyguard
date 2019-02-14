/* global Constants */
/* global Nimiq */
/* global DerivedIdenticonSelector */
/* global PassphraseBox */
/* global KeyStore */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */

class DeriveAddress {
    /**
     * @param {ParsedDeriveAddressRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        this._resolve = resolve;
        this._reject = reject;

        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('.passphrase-box'));

        /** @type {HTMLDivElement} */
        const $identiconSelector = (document.querySelector('.identicon-selector'));

        // Create components

        this._passphraseBox = new PassphraseBox($passphraseBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passphrasebox-continue',
            hideCancel: true,
        });
        this._identiconSelector = new DerivedIdenticonSelector($identiconSelector);

        // Wire up logic

        this._passphraseBox.on(
            PassphraseBox.Events.SUBMIT,
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
                this._passphraseBox.onPassphraseIncorrect();
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
            if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
                this._passphraseBox.focus();
            }

            // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
            Nimiq.CryptoWorker.getInstanceAsync();
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
