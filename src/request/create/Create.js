/* global IdenticonSelector */
/* global PasswordSetterBox */
/* global Key */
/* global KeyStore */
/* global ProgressIndicator */
/* global Utf8Tools */
/* global TopLevelApi */
/* global Identicon */
/* global BitcoinKey */
/* global IqonHash */
/* global LoginfileAnimation */
/* global DownloadLoginFile */
/* global I18n */

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

        /** @type {HTMLDivElement} */
        this.$overlayContainer = (document.querySelector('.overlay-container'));

        /** @type {HTMLButtonElement} */
        this.$overlayCloseButton = (document.querySelector('.overlay-container .overlay .close-overlay'));

        /** @type {HTMLButtonElement} */
        this.$confirmAddressButton = (document.querySelector('.confirm-address'));

        /** @type {HTMLDivElement} */
        this.$loginfileAnimation = (document.querySelector('.loginfile-animation'));

        /** @type {HTMLFormElement} */
        const $setPassword = (document.querySelector('.password-box'));

        /** @type {HTMLFormElement} */
        this.$setPasswordPage = (document.getElementById('set-password'));

        /** @type {HTMLElement} */
        this.$downloadFilePage = (document.getElementById(Create.Pages.LOGIN_FILE_DOWNLOAD));
        /** @type {HTMLDivElement} */
        const $downloadLoginFile = (document.querySelector('.download-loginfile'));

        // Create components

        this._identiconSelector = new IdenticonSelector(this.$identiconSelector, request.defaultKeyPath);
        this._loginfileAnimation = new LoginfileAnimation(this.$loginfileAnimation);
        this._passwordSetter = new PasswordSetterBox($setPassword, { buttonI18nTag: 'passwordbox-confirm-create' });
        this._downloadLoginFile = new DownloadLoginFile(
            $downloadLoginFile,
            undefined,
            undefined,
            I18n.translatePhrase('create-loginfile-any-device'),
        );
        // Set up progress indicators
        /* eslint-disable no-new */
        new ProgressIndicator(document.querySelector(`#${Create.Pages.CHOOSE_IDENTICON} .progress-indicator`), 3, 1);
        new ProgressIndicator(document.querySelector(`#${Create.Pages.SET_PASSWORD} .progress-indicator`), 3, 2);
        new ProgressIndicator(document.querySelector(`#${Create.Pages.LOGIN_FILE_DOWNLOAD} .progress-indicator`), 3, 3);
        /* eslint-enable no-new */

        // Wire up logic

        this._identiconSelector.on(
            IdenticonSelector.Events.IDENTICON_SELECTED,
            /**
             * @param {Nimiq.Entropy} entropy
             * @param {string} address
            */
            (entropy, address) => {
                this._selectedEntropy = entropy;
                this._selectedAddress = address;

                // eslint-disable-next-line no-new
                new Identicon(
                    address,
                    /** @type {HTMLDivElement} */(this.$overlayContainer.querySelector('#identicon')),
                );

                /** @type {HTMLDivElement} */
                const $address = (this.$overlayContainer.querySelector('#address'));
                // last space is necessary for the rendering to work properly with white-space: pre-wrap.
                $address.textContent = `${address} `;

                this.$overlayContainer.classList.add('show-overlay');
            },
        );

        this.$overlayCloseButton.addEventListener('click', () => {
            this.$overlayContainer.classList.remove('show-overlay');
        });

        this.$confirmAddressButton.addEventListener('click', () => {
            window.location.hash = Create.Pages.SET_PASSWORD;
            this._passwordSetter.reset();
            TopLevelApi.focusPasswordBox();
        });

        this._passwordSetter.on(PasswordSetterBox.Events.SUBMIT, /** @param {string} password */ async password => {
            // TODO: Save key to disk here?
            this._password = password;

            // Set up LoginFile
            const key = new Key(this._selectedEntropy);
            const passwordBuffer = Utf8Tools.stringToUtf8ByteArray(password);
            const encryptedSecret = await key.secret.exportEncrypted(passwordBuffer);

            this._downloadLoginFile.setEncryptedEntropy(encryptedSecret, key.defaultAddress);
            // reset initial state
            this.$downloadFilePage.classList.remove(DownloadLoginFile.Events.INITIATED);
            // add Events
            this._downloadLoginFile.on(DownloadLoginFile.Events.INITIATED, () => {
                this.$downloadFilePage.classList.add(DownloadLoginFile.Events.INITIATED);
            });
            this._downloadLoginFile.on(DownloadLoginFile.Events.RESET, () => {
                this.$downloadFilePage.classList.remove(DownloadLoginFile.Events.INITIATED);
            });
            this._downloadLoginFile.on(DownloadLoginFile.Events.DOWNLOADED, () => {
                this.finish(request);
            });

            window.location.hash = Create.Pages.LOGIN_FILE_DOWNLOAD;
        });

        this._passwordSetter.on(PasswordSetterBox.Events.ENTERED, () => {
            this.$setPasswordPage.classList.add('repeat-password');
            this._loginfileAnimation.setColor(IqonHash.getBackgroundColorIndex(this._selectedAddress));
        });

        this._passwordSetter.on(PasswordSetterBox.Events.RESET, this.backToEnterPassword.bind(this));

        this._passwordSetter.on(PasswordSetterBox.Events.LENGTH, length => this._loginfileAnimation.setStep(length));

        if (request.enableBackArrow) {
            /** @type {HTMLElement} */
            (document.querySelector('#choose-identicon .page-header-back-button')).classList.remove('display-none');
        }
    } // constructor

    backToEnterPassword() {
        this.$setPasswordPage.classList.remove('repeat-password');
        this._loginfileAnimation.reset();
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
            fileExported: true,
            wordsExported: false,
            bitcoinXPub: new BitcoinKey(key).deriveExtendedPublicKey(request.bitcoinXPubPath),
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
    LOGIN_FILE_DOWNLOAD: 'login-file-download',
};
