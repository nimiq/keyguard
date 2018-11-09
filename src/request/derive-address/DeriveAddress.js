/* global Nimiq */
/* global DerivedIdenticonSelector */
/* global PassphraseBox */
/* global KeyStore */

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
        });
        this._identiconSelector = new DerivedIdenticonSelector($identiconSelector);

        // Wire up logic

        this._passphraseBox.on(
            PassphraseBox.Events.SUBMIT,
            async /** @param {string|undefined} passphrase */ passphrase => {
                await this._initIdenticonSelector(passphrase);
                window.location.hash = DeriveAddress.Pages.CHOOSE_IDENTICON;
            },
        );

        this._passphraseBox.on(PassphraseBox.Events.CANCEL, () => {
            this._reject(new Error('CANCEL'));
        });

        this._identiconSelector.on(
            DerivedIdenticonSelector.Events.IDENTICON_SELECTED,
            /** @param {{address: Nimiq.Address, keyPath: string}} selectedAddress */
            selectedAddress => {
                /** @type {DeriveAddressResult} */
                const result = {
                    address: selectedAddress.address.serialize(),
                    keyPath: selectedAddress.keyPath,
                };

                this._resolve(result);
            },
        );

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => reject(new Error('CANCEL')));
    } // constructor

    /**
     * @param {string} [passphrase]
     */
    async _initIdenticonSelector(passphrase) {
        const passphraseBuffer = passphrase && passphrase.length > 0
            ? Nimiq.BufferUtils.fromAscii(passphrase)
            : undefined;

        /** @type {Key|null} */
        let key = null;
        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, passphraseBuffer);
        } catch (e) {
            console.error(e);
            this._passphraseBox.onPassphraseIncorrect();
            return;
        }

        if (!key) return; // Key existence is already checked during request parsing in DeriveAddressApi class

        const masterKey = new Nimiq.Entropy(key.secret).toExtendedPrivateKey();
        const pathsToDerive = this._request.indicesToDerive.map(index => `${this._request.baseKeyPath}/${index}`);

        this._identiconSelector.init(masterKey, pathsToDerive);
    }

    async run() {
        if (this._request.keyInfo.encrypted) {
            window.location.hash = DeriveAddress.Pages.PASSPHRASE;
            this._passphraseBox.focus();

            // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
            Nimiq.CryptoWorker.getInstanceAsync();
        } else {
            await this._initIdenticonSelector();
            window.location.hash = DeriveAddress.Pages.CHOOSE_IDENTICON;
        }
    }
}

DeriveAddress.Pages = {
    PASSPHRASE: 'passphrase',
    CHOOSE_IDENTICON: 'choose-identicon',
};
