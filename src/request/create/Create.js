/* global IdenticonSelector */
/* global PassphraseSetterBox */
/* global Key */
/* global KeyStore */
/* global ProgressIndicator */
/* global Utf8Tools */
/* global TopLevelApi */
/* global Identicon */

class Create {
    /**
     * @param {KeyguardRequest.CreateRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._reject = reject;

        this._passphrase = '';

        /** @type {HTMLDivElement} */
        this.$identiconSelector = (document.querySelector('.identicon-selector'));

        /** @type {HTMLFormElement} */
        const $setPassphrase = (document.querySelector('.passphrase-box'));

        /** @type {HTMLFormElement} */
        this.$setPassphrasePage = (document.getElementById('set-passphrase'));

        /** @type {HTMLFormElement} */
        this.$walletIdentifier = (document.querySelector('.wallet-identifier'));

        // Create components

        this._identiconSelector = new IdenticonSelector(this.$identiconSelector, request.defaultKeyPath);
        this._passphraseSetter = new PassphraseSetterBox($setPassphrase);
        // Set up progress indicators
        /* eslint-disable-next-line no-new */
        new ProgressIndicator(document.querySelector(`#${Create.Pages.CHOOSE_IDENTICON} .progress-indicator`), 3, 1);
        this.progressIndicator = new ProgressIndicator(
            document.querySelector(`#${Create.Pages.SET_PASSPHRASE} .progress-indicator`),
            3,
            2,
        );

        // Wire up logic

        this._identiconSelector.on(
            IdenticonSelector.Events.IDENTICON_SELECTED,
            /**
             * @param {Nimiq.Entropy} entropy
             * @param {string} address
            */
            (entropy, address) => {
                this._selectedEntropy = entropy;
                window.location.hash = Create.Pages.SET_PASSPHRASE;
                // eslint-disable-next-line no-new
                new Identicon(
                    address,
                    /** @type {HTMLDivElement} */(this.$walletIdentifier.querySelector('.identicon')),
                );
                this.progressIndicator.setStep(2);
                this._passphraseSetter.reset();
                this._passphraseSetter.focus();
            },
        );

        this._passphraseSetter.on(PassphraseSetterBox.Events.SUBMIT, /** @param {string} password */ password => {
            this._password = password;
            this.finish(request);
        });

        this._passphraseSetter.on(PassphraseSetterBox.Events.SKIP, () => {
            this.progressIndicator.setStep(3);
            this.finish(request);
        });

        this._passphraseSetter.on(PassphraseSetterBox.Events.ENTERED, () => {
            this.$setPassphrasePage.classList.add('repeat-password');
            this.progressIndicator.setStep(3);
        });

        this._passphraseSetter.on(PassphraseSetterBox.Events.NOT_EQUAL, () => {
            this.$setPassphrasePage.classList.remove('repeat-password');
            this.progressIndicator.setStep(2);
        });
    } // constructor

    /**
     * @param {KeyguardRequest.CreateRequest} request
     */
    async finish(request) {
        TopLevelApi.setLoading(true);
        const key = new Key(this._selectedEntropy.serialize());
        const password = this._password.length > 0 ? Utf8Tools.stringToUtf8ByteArray(this._password) : undefined;
        await KeyStore.instance.put(key, password);

        const keyPath = request.defaultKeyPath;

        /** @type {KeyguardRequest.CreateResult} */
        const result = {
            keyId: key.id,
            keyPath,
            address: key.deriveAddress(keyPath).serialize(),
        };

        this._resolve(result);
    }

    run() {
        // go to start page
        window.location.hash = Create.Pages.CHOOSE_IDENTICON;
        this._identiconSelector.generateIdenticons();

        // XXX: Is the following necessary, or is the CryptoWorker already
        // instanced when generating addresses for identicons?

        // Async pre-load the crypto worker to reduce wait time when encrypting
        // Nimiq.CryptoWorker.getInstanceAsync();
    }
}

Create.Pages = {
    CHOOSE_IDENTICON: 'choose-identicon',
    SET_PASSPHRASE: 'set-passphrase',
};
