/* global Observable */
/* global Nimiq */
/* global NimiqPoW */
/* global Key */
/* global FileImporter */
/* global PasswordBox */
/* global TopLevelApi */
/* global Utf8Tools */
/* global KeyStore */
/* global QrVideoScanner */

class ImportFile extends Observable {
    /**
     * @param {Parsed<KeyguardRequest.ImportRequest>} request
     */
    constructor(request) {
        super();

        this._encryptedKey = new Nimiq.SerialBuffer(0);
        /** @type {string?} */
        this._label = null;
        this._flags = {
            hasPin: false,
        };

        this.$importFilePage = /** @type {HTMLElement} */ (document.getElementById(ImportFile.Pages.IMPORT_FILE));
        this.$unlockAccountPage = /** @type {HTMLElement} */ (document.getElementById(ImportFile.Pages.UNLOCK_ACCOUNT));

        if (request.isKeyLost) {
            const $link = /** @type {HTMLElement} */ (
                this.$importFilePage.querySelector('.login-to-continue'));
            $link.classList.remove('display-none');
        }

        const $fileImport = /** @type {HTMLLabelElement} */ (
            this.$importFilePage.querySelector('.file-import'));
        const fileImport = new FileImporter($fileImport, false);

        this.$qrVideoButton = /** @type {HTMLButtonElement} */ (this.$importFilePage.querySelector('.qr-video-button'));
        this.$qrVideoScanner = /** @type {HTMLDivElement} */ (this.$importFilePage.querySelector('.qr-video-scanner'));
        this.qrVideoScanner = new QrVideoScanner(this.$qrVideoScanner, FileImporter.isLoginFileData);

        const $goToOtherImportOption = /** @type {HTMLElement} */ (
            this.$importFilePage.querySelector('#go-to-other-import-option'));
        $goToOtherImportOption.addEventListener('click', () => this.fire(ImportFile.Events.GO_TO_OTHER_IMPORT_OPTION));

        const $goToCreate = /** @type {HTMLElement} */ (this.$importFilePage.querySelector('#go-to-create'));
        $goToCreate.addEventListener('click', event => {
            event.preventDefault();
            this.fire(ImportFile.Events.GO_TO_CREATE);
        });

        this.$loginFileImage = /** @type {HTMLImageElement} */ (
            this.$unlockAccountPage.querySelector('.loginfile-image'));

        const $passwordBox = /** @type {HTMLFormElement} */ (
            this.$unlockAccountPage.querySelector('.password-box'));
        this.passwordBox = new PasswordBox(
            $passwordBox,
            { buttonI18nTag: 'passwordbox-log-in' },
        );
        fileImport.on(FileImporter.Events.IMPORT, this._onFileImported.bind(this));
        this.passwordBox.on(PasswordBox.Events.SUBMIT, this._onPasswordEntered.bind(this));

        this.qrVideoScanner.on(QrVideoScanner.Events.RESULT, result => {
            this._onFileImported(result);
            this._stopQrVideo();
        });
        this.qrVideoScanner.on(QrVideoScanner.Events.CANCEL, this._stopQrVideo.bind(this));

        this.$qrVideoButton.addEventListener('click', this._startQrVideo.bind(this));

        if (request.enableBackArrow) {
            /** @type {HTMLElement} */
            (this.$importFilePage.querySelector('.page-header-back-button')).classList.remove('display-none');
        }
    }

    run() {
        window.location.hash = ImportFile.Pages.IMPORT_FILE;
    }

    /**
     * @param {string} decoded
     * @param {string} [src]
     */
    _onFileImported(decoded, src) {
        this.fire(ImportFile.Events.RESET);
        if (decoded.substr(0, 2) === '#2') {
            // Imported file is a PIN-encrypted account Access File
            decoded = decoded.substr(2);
            this._flags.hasPin = true;
        }

        const buffer = Nimiq.BufferUtils.fromBase64(decoded);
        if (buffer.byteLength > KeyStore.ENCRYPTED_SECRET_SIZE) {
            this._encryptedKey = new Nimiq.SerialBuffer(buffer.read(KeyStore.ENCRYPTED_SECRET_SIZE));
            const labelLength = buffer.readUint8();
            const labelBytes = buffer.read(labelLength);
            if (Utf8Tools.isValidUtf8(labelBytes)) {
                this._label = Utf8Tools.utf8ByteArrayToString(labelBytes);
            }
        } else {
            this._encryptedKey = buffer;
        }

        // Prepare next page
        if (src) {
            this.$loginFileImage.src = src;
        }
        const version = this._encryptedKey.readUint8();
        this.passwordBox.setMinLength(this._flags.hasPin ? Key.PIN_LENGTH : version < 3 ? 10 : undefined);
        this.passwordBox.reset();
        this.$unlockAccountPage.classList.remove('animate');

        // Go to next page
        window.location.hash = ImportFile.Pages.UNLOCK_ACCOUNT;
        setTimeout(() => this.$unlockAccountPage.classList.add('animate'), 0);

        TopLevelApi.focusPasswordBox();
    }

    _startQrVideo() {
        this.qrVideoScanner.start();
        this.qrVideoScanner.repositionOverlay();
        this.$qrVideoScanner.classList.add('active');
        this.$qrVideoButton.classList.add('hide-tooltip');
    }

    _stopQrVideo() {
        this.$qrVideoScanner.classList.remove('active');
        this.$qrVideoButton.classList.remove('hide-tooltip');
        window.setTimeout(() => this.qrVideoScanner.stop(), 1000);
    }

    /**
     * @param {string} password
     * @returns {Promise<void>}
     */
    async _onPasswordEntered(password) {
        /** @type {Key?} */
        const key = await this._decryptKey(password);
        if (!key) {
            this.passwordBox.onPasswordIncorrect();
            return;
        }

        /** @type {{entropy: Key?, privateKey: Key?}} */
        const keys = { entropy: null, privateKey: null };
        /** @type {{entropy: string?, privateKey: string?}} */
        const labels = { entropy: null, privateKey: null };
        if (key.secret instanceof Nimiq.Entropy) {
            keys.entropy = key;
            labels.entropy = this._label;
        } else if (key.secret instanceof Nimiq.PrivateKey) {
            keys.privateKey = key;
            labels.privateKey = this._label;
        }

        this.fire(ImportFile.Events.IMPORT, keys, labels, password);
    }

    /**
     * @param {string} password
     * @returns {Promise<Key?>}
     */
    async _decryptKey(password) {
        TopLevelApi.setLoading(true);
        try {
            const encryptionKey = Utf8Tools.stringToUtf8ByteArray(password);

            // Make sure read position is at 0 even after a wrong password
            this._encryptedKey.reset();

            /** @type {Nimiq.Entropy | Nimiq.PrivateKey} */
            let secret;

            const version = this._encryptedKey[0];
            if (version >= 3) {
                // Nimiq PoS supports encryption from version 3
                secret = await Nimiq.Secret.fromEncrypted(this._encryptedKey, encryptionKey);
            } else {
                // Use PoW module to decode old encryptions

                // When loading the CryptoWorker, the PoW library uses `Nimiq._path` as the prefix for the worker file.
                // So we need to temporarily set global `Nimiq` to the PoW library to load the worker correctly.
                // @ts-expect-error window.Nimiq is not defined
                const _Nimiq = window.Nimiq;
                // @ts-expect-error window.Nimiq is not defined
                window.Nimiq = NimiqPoW;

                await NimiqPoW.WasmHelper.doImport();
                const _secret = await NimiqPoW.Secret.fromEncrypted(this._encryptedKey, encryptionKey);

                // After the worker is done, we set the global `Nimiq` back to the PoS library
                // @ts-expect-error window.Nimiq is not defined
                window.Nimiq = _Nimiq;

                // Convert PoW Entropy/PrivateKey objects to their PoS equivalent
                if (_secret instanceof NimiqPoW.Entropy) {
                    secret = Nimiq.Entropy.deserialize(new Nimiq.SerialBuffer(_secret.serialize()));
                } else {
                    secret = Nimiq.PrivateKey.deserialize(new Nimiq.SerialBuffer(_secret.serialize()));
                }
            }

            // If this code runs, the password was correct and the request returns
            /** @type {HTMLElement} */
            (this.$unlockAccountPage.querySelector('.lock')).classList.add('unlocked');

            // TODO expectedKeyId check if it gets used in the future.
            return new Key(secret, { hasPin: this._flags.hasPin });
            // We just keep the loading spinner spinning until the request is finished.
        } catch (event) {
            console.error(event);
            TopLevelApi.setLoading(false);
            return null; // Triggers onPasswordIncorrect above
        }
    }
}

ImportFile.Pages = {
    IMPORT_FILE: 'import-file',
    UNLOCK_ACCOUNT: 'unlock-account',
};

ImportFile.Events = {
    IMPORT: 'import',
    RESET: 'reset',
    GO_TO_OTHER_IMPORT_OPTION: 'go-to-other-import-option',
    GO_TO_CREATE: 'go-to-create',
};
