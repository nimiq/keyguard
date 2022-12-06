/* global IdenticonSelector */
/* global PasswordSetterBox */
/* global Key */
/* global KeyStore */
/* global ProgressIndicator */
/* global Utf8Tools */
/* global TopLevelApi */
/* global Identicon */
/* global BitcoinKey */
/* global PolygonKey */
/* global IqonHash */
/* global LoginFileAnimation */
/* global DownloadLoginFile */
/* global I18n */
/* global FlippableHandler */
/* global LoginFileConfig */

/**
 * @callback Create.resolve
 * @param {KeyguardRequest.KeyResult} result
 */

class Create {
    /**
     * @param {Parsed<KeyguardRequest.CreateRequest>} request
     * @param {Create.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._reject = reject;

        this._password = '';

        FlippableHandler.init();

        /** @type {HTMLDivElement} */
        this.$identiconSelector = (document.querySelector('.identicon-selector'));

        /** @type {HTMLDivElement} */
        const $overlayContainer = (document.querySelector('.overlay-container'));

        /** @type {HTMLButtonElement} */
        const $overlayCloseButton = (document.querySelector('.overlay-container .overlay .close-overlay'));

        /** @type {HTMLButtonElement} */
        const $confirmAddressButton = (document.querySelector('.confirm-address'));

        /** @type {HTMLDivElement} */
        this.$loginFileAnimation = (document.querySelector('.login-file-animation'));

        /** @type {HTMLFormElement} */
        const $setPassword = (document.querySelector('.password-box'));

        /** @type {HTMLFormElement} */
        this.$setPasswordPage = (document.getElementById('set-password'));

        /** @type {HTMLElement} */
        const $downloadFilePage = (document.getElementById(Create.Pages.LOGIN_FILE_DOWNLOAD));
        /** @type {HTMLDivElement} */
        const $downloadLoginFile = (document.querySelector('.download-loginfile'));

        /** @type {HTMLImageElement} */
        const $loginFilePreviewImage = (document.getElementById('loginfile-preview'));

        /** @type {HTMLButtonElement} */
        const $loginFileExplainerBackButton = (document.getElementById('loginfile-explainer-go-back'));

        // Create components

        this._identiconSelector = new IdenticonSelector(this.$identiconSelector, request.defaultKeyPath);
        this._loginFileAnimation = new LoginFileAnimation(this.$loginFileAnimation);
        this._passwordSetter = new PasswordSetterBox($setPassword, { buttonI18nTag: 'passwordbox-confirm-create' });
        this._downloadLoginFile = new DownloadLoginFile(
            $downloadLoginFile,
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
                    /** @type {HTMLDivElement} */($overlayContainer.querySelector('#identicon')),
                );

                /** @type {HTMLDivElement} */
                const $address = ($overlayContainer.querySelector('#address'));
                // last space is necessary for the rendering to work properly with white-space: pre-wrap.
                $address.textContent = `${address} `;

                window.location.hash = Create.Pages.CONFIRM_IDENTICON;
            },
        );

        this._downloadLoginFile.on(DownloadLoginFile.Events.INITIATED, () => {
            $downloadFilePage.classList.add(DownloadLoginFile.Events.INITIATED);
        });

        this._downloadLoginFile.on(DownloadLoginFile.Events.RESET, () => {
            $downloadFilePage.classList.remove(DownloadLoginFile.Events.INITIATED);
        });

        this._downloadLoginFile.on(DownloadLoginFile.Events.DOWNLOADED, () => {
            this.finish(request);
        });

        $overlayCloseButton.addEventListener('click', () => window.history.back());

        $confirmAddressButton.addEventListener('click', () => {
            window.location.hash = Create.Pages.SET_PASSWORD;
            this._passwordSetter.reset();
            TopLevelApi.focusPasswordBox();
        });

        this._passwordSetter.on(PasswordSetterBox.Events.SUBMIT, /** @param {string} password */ async password => {
            this._password = password;

            // Set up LoginFile
            const key = new Key(this._selectedEntropy);
            const passwordBuffer = Utf8Tools.stringToUtf8ByteArray(password);
            const encryptedSecret = await key.secret.exportEncrypted(passwordBuffer);

            this._downloadLoginFile.setEncryptedEntropy(encryptedSecret, key.defaultAddress);
            // Reset to initial state
            $downloadFilePage.classList.remove(DownloadLoginFile.Events.INITIATED);

            window.location.hash = Create.Pages.LOGIN_FILE_DOWNLOAD;
        });

        this._passwordSetter.on(PasswordSetterBox.Events.ENTERED, () => {
            this.$setPasswordPage.classList.add('repeat-password');
            const colorIndex = IqonHash.getBackgroundColorIndex(this._selectedAddress);
            this._loginFileAnimation.setColor(colorIndex);
            $loginFilePreviewImage.classList.add(LoginFileConfig[colorIndex].className);
        });

        this._passwordSetter.on(PasswordSetterBox.Events.RESET, this.backToEnterPassword.bind(this));

        this._passwordSetter.on(PasswordSetterBox.Events.LENGTH, length => this._loginFileAnimation.setStep(length));

        $loginFileExplainerBackButton.addEventListener('click', () => window.history.back());

        if (request.enableBackArrow) {
            /** @type {HTMLElement} */
            (document.querySelector('#choose-identicon .page-header-back-button')).classList.remove('display-none');
        }
    } // constructor

    backToEnterPassword() {
        this.$setPasswordPage.classList.remove('repeat-password');
        this._loginFileAnimation.reset();
        this._passwordSetter.reset();

        TopLevelApi.focusPasswordBox();
    }

    /**
     * @param {Parsed<KeyguardRequest.CreateRequest>} request
     */
    async finish(request) {
        TopLevelApi.setLoading(true);
        const key = new Key(this._selectedEntropy);
        const password = this._password.length > 0 ? Utf8Tools.stringToUtf8ByteArray(this._password) : undefined;
        await KeyStore.instance.put(key, password);

        const keyPath = request.defaultKeyPath;
        const polygonKeypath = `${request.polygonAccountPath}/0/0`;

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
            polygonAddresses: [{
                address: new PolygonKey(key).deriveAddress(polygonKeypath),
                keyPath: polygonKeypath,
            }],
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
    CONFIRM_IDENTICON: 'confirm-identicon',
    SET_PASSWORD: 'set-password',
    LOGIN_FILE_DOWNLOAD: 'login-file-download',
    LOGIN_FILE_EXPLAINER: 'login-file-explainer',
};
