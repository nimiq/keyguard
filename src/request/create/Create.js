/* global Nimiq */
/* global PasswordSetterBox */
/* global Key */
/* global KeyStore */
/* global Utf8Tools */
/* global TopLevelApi */
/* global LoginFile */
/* global BitcoinKey */
/* global PolygonKey */
/* global IqonHash */
/* global LoginFileAnimation */
/* global DownloadLoginFile */
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

        const $loginFileFan = /** @type {HTMLDivElement} */ (
            document.querySelector('.login-file-fan'));
        const $startButton = /** @type {HTMLButtonElement} */ (
            document.querySelector('.start'));

        this.$loginFileAnimation = /** @type {HTMLDivElement} */ (
            document.querySelector('.login-file-animation'));

        const $setPassword = /** @type {HTMLFormElement} */ (
            document.querySelector('.password-box'));
        this.$setPasswordPage = /** @type {HTMLFormElement} */ (
            document.getElementById('set-password'));

        const $downloadFilePage = /** @type {HTMLElement} */ (
            document.getElementById(Create.Pages.LOGIN_FILE_DOWNLOAD));
        const $downloadLoginFile = /** @type {HTMLDivElement} */ (
            document.querySelector('.download-loginfile'));

        const $loginFilePreviewImage = /** @type {HTMLImageElement} */ (
            document.getElementById('loginfile-preview'));
        const $loginFileExplainerBackButton = /** @type {HTMLButtonElement} */ (
            document.getElementById('loginfile-explainer-go-back'));

        // Create components
        Promise.all([
            new LoginFile('hello world', 2).toObjectUrl(),
            new LoginFile('hello world', 0).toObjectUrl(),
            new LoginFile('hello world', 7).toObjectUrl(),
            new LoginFile('hello world', 8).toObjectUrl(),
            new LoginFile('hello world', 6).toObjectUrl(),
        ]).then(async objectUrls => {
            /** @type {HTMLImageElement=} */
            let prevImage;
            /** @type {Promise<string>[]} */
            const loadedPromises = [];
            for (const objectUrl of objectUrls) {
                const image = new Image();
                loadedPromises.push(new Promise(res => {
                    image.addEventListener('load', () => res(objectUrl));
                }));
                image.src = objectUrl;

                // Insert elements behind each other, to not create a flicker
                // when the images are appended after each other
                if (prevImage) $loginFileFan.insertBefore(image, prevImage);
                else $loginFileFan.appendChild(image);
                prevImage = image;
            }

            (await Promise.all(loadedPromises)).forEach(objectUrl => {
                URL.revokeObjectURL(objectUrl);
            });
        });

        this._loginFileAnimation = new LoginFileAnimation(this.$loginFileAnimation);
        this._passwordSetter = new PasswordSetterBox($setPassword, { buttonI18nTag: 'passwordbox-confirm-create' });
        this._downloadLoginFile = new DownloadLoginFile($downloadLoginFile);

        // Generate key
        this._entropy = Nimiq.Entropy.generate();
        const masterKey = this._entropy.toExtendedPrivateKey();
        const extPrivKey = masterKey.derivePath(request.defaultKeyPath);
        const address = extPrivKey.toAddress().toUserFriendlyAddress();

        const colorIndex = IqonHash.getBackgroundColorIndex(address);
        $loginFilePreviewImage.classList.add(LoginFileConfig[colorIndex].className);

        // Wire up logic

        $startButton.addEventListener('click', () => {
            window.location.hash = Create.Pages.SET_PASSWORD;
            this._passwordSetter.reset();
            TopLevelApi.focusPasswordBox();
        });

        this._downloadLoginFile.on(DownloadLoginFile.Events.INITIATED, () => {
            $downloadFilePage.classList.add(DownloadLoginFile.Events.INITIATED);
        });

        this._downloadLoginFile.on(DownloadLoginFile.Events.RESET, () => {
            $downloadFilePage.classList.remove(DownloadLoginFile.Events.INITIATED);
        });

        this._downloadLoginFile.on(DownloadLoginFile.Events.DOWNLOADED, () => {
            this.finish(request);
        });

        this._passwordSetter.on(PasswordSetterBox.Events.SUBMIT, /** @param {string} password */ async password => {
            this._password = password;

            // Set up LoginFile
            const key = new Key(this._entropy);
            const passwordBuffer = Utf8Tools.stringToUtf8ByteArray(password);
            const encryptedSecret = await Nimiq.Secret.exportEncrypted(key.secret, passwordBuffer);

            this._downloadLoginFile.setEncryptedEntropy(encryptedSecret, key.defaultAddress);
            // Reset to initial state
            $downloadFilePage.classList.remove(DownloadLoginFile.Events.INITIATED);

            window.location.hash = Create.Pages.LOGIN_FILE_DOWNLOAD;
        });

        this._passwordSetter.on(PasswordSetterBox.Events.ENTERED, () => {
            this.$setPasswordPage.classList.add('repeat-password');
            this._loginFileAnimation.setColor(colorIndex);
        });

        this._passwordSetter.on(PasswordSetterBox.Events.RESET, this.backToEnterPassword.bind(this));

        this._passwordSetter.on(PasswordSetterBox.Events.LENGTH, length => this._loginFileAnimation.setStep(length));

        $loginFileExplainerBackButton.addEventListener('click', () => window.history.back());

        if (request.enableBackArrow) {
            /** @type {HTMLElement} */
            (document.querySelector('#intro .page-header-back-button')).classList.remove('display-none');
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
        const key = new Key(this._entropy);
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
            backupCodesExported: false,
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
        window.location.hash = Create.Pages.INTRO;
    }
}

Create.Pages = {
    INTRO: 'intro',
    SET_PASSWORD: 'set-password',
    LOGIN_FILE_DOWNLOAD: 'login-file-download',
    LOGIN_FILE_EXPLAINER: 'login-file-explainer',
};
