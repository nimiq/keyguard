/* global IdenticonSelector */
/* global PasswordSetterBox */
/* global Key */
/* global KeyStore */
/* global ProgressIndicator */
/* global Utf8Tools */
/* global TopLevelApi */
/* global Identicon */

/**
 * @callback Create.resolve
 * @param {KeyguardRequest.KeyResult} result
 */

class Create {
    /**
     * @param {KeyguardRequest.CreateRequest} request
     * @param {Create.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._reject = reject;

        this._password = '';

        /** @type {HTMLDivElement} */
        this.$identiconSelector = (document.querySelector('.identicon-selector'));

        /** @type {HTMLFormElement} */
        const $setPassword = (document.querySelector('.password-box'));

        /** @type {HTMLFormElement} */
        this.$setPasswordPage = (document.getElementById('set-password'));

        /** @type {HTMLFormElement} */
        this.$walletIdentifier = (document.querySelector('.wallet-identifier'));

        /** @type {HTMLLinkElement} */
        this.$setPasswordBackButton = (this.$setPasswordPage.querySelector('a.page-header-back-button'));

        // Create components

        this._identiconSelector = new IdenticonSelector(this.$identiconSelector, request.defaultKeyPath);
        this._passwordSetter = new PasswordSetterBox($setPassword);
        // Set up progress indicators
        /* eslint-disable-next-line no-new */
        new ProgressIndicator(document.querySelector(`#${Create.Pages.CHOOSE_IDENTICON} .progress-indicator`), 3, 1);
        this.progressIndicator = new ProgressIndicator(
            document.querySelector(`#${Create.Pages.SET_PASSWORD} .progress-indicator`),
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
                window.location.hash = Create.Pages.SET_PASSWORD;
                // eslint-disable-next-line no-new
                new Identicon(
                    address,
                    /** @type {HTMLDivElement} */(this.$walletIdentifier.querySelector('.identicon')),
                );
                this.progressIndicator.setStep(2);
                this._passwordSetter.reset();

                TopLevelApi.focusPasswordBox();
            },
        );

        this._passwordSetter.on(PasswordSetterBox.Events.SUBMIT, /** @param {string} password */ password => {
            this._password = password;
            this.finish(request);
        });

        this._passwordSetter.on(PasswordSetterBox.Events.ENTERED, () => {
            this.$setPasswordPage.classList.add('repeat-password');
            this.progressIndicator.setStep(3);
        });

        this._passwordSetter.on(PasswordSetterBox.Events.RESET, this.backToEnterPassword.bind(this));
    } // constructor

    backToEnterPassword() {
        this.progressIndicator.setStep(2);
        this.$setPasswordPage.classList.remove('repeat-password');
        this._passwordSetter.reset();

        TopLevelApi.focusPasswordBox();
    }

    /**
     * @param {KeyguardRequest.CreateRequest} request
     */
    async finish(request) {
        TopLevelApi.setLoading(true);
        const key = new Key(this._selectedEntropy);
        const password = this._password.length > 0 ? Utf8Tools.stringToUtf8ByteArray(this._password) : undefined;
        await KeyStore.instance.put(key, password);

        const keyPath = request.defaultKeyPath;

        /** @type {KeyguardRequest.KeyResult} */
        const result = [{
            keyId: key.id,
            keyType: key.type,
            addresses: [{
                address: key.deriveAddress(keyPath).serialize(),
                keyPath,
            }],
            fileExported: false,
            wordsExported: false,
        }];

        this._resolve(result);
    }

    run() {
        // go to start page
        window.location.hash = Create.Pages.CHOOSE_IDENTICON;
        this._identiconSelector.generateIdenticons();
    }
}

Create.Pages = {
    CHOOSE_IDENTICON: 'choose-identicon',
    SET_PASSWORD: 'set-password',
};
