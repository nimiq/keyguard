/* global Constants */
/* global Nimiq */
/* global Key */
/* global ImportWords */
/* global FileImporter */
/* global PasswordBox */
/* global ImportApi */
/* global Errors */
/* global TopLevelApi */
/* global Utf8Tools */
/* global KeyStore */
/* global BitcoinKey */
/* global PolygonKey */
/* global QrVideoScanner */
/* global NonPartitionedSessionStorage */

/**
 * @callback ImportFile.resolve
 * @param {KeyguardRequest.KeyResult} result
 */

class ImportFile {
    /**
     * @param {Parsed<KeyguardRequest.ImportRequest>} request
     * @param {ImportFile.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        this._resolve = resolve;
        this._reject = reject;

        this._encryptedKey = new Nimiq.SerialBuffer(0);
        /** @type {string | undefined} */
        this._label = undefined;
        this._flags = {
            hasPin: false,
        };

        this.importWordsHandler = new ImportWords(request, resolve, reject);

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

        const $gotoWords = /** @type {HTMLElement} */ (this.$importFilePage.querySelector('#goto-words'));
        $gotoWords.addEventListener('click', () => { this.importWordsHandler.run(); });

        const $gotoCreate = this.$importFilePage.querySelector('#goto-create');
        if ($gotoCreate) {
            $gotoCreate.addEventListener('click', this._goToCreate.bind(this));
        }

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
        let key;

        try {
            key = await this._decryptAndStoreKey(password);
        } catch (error) {
            this.passwordBox.onPasswordIncorrect();
            return;
        }

        if (!key) {
            this.passwordBox.onPasswordIncorrect();
            return;
        }

        /** @type {{keyPath: string, address: Uint8Array}[]} */
        const addresses = [];

        /** @type {string | undefined} */
        let bitcoinXPub;

        /** @type {Array<{ address: string, keyPath: string }> | undefined} */
        let polygonAddresses;

        /** @type {Uint8Array | undefined} */
        let tmpCookieEncryptionKey;

        try {
            if (key.secret instanceof Nimiq.PrivateKey) {
                addresses.push({
                    keyPath: Constants.LEGACY_DERIVATION_PATH,
                    address: key.deriveAddress('').serialize(),
                });
            } else if (key.secret instanceof Nimiq.Entropy) {
                /** @type {KeyguardRequest.ImportRequest} */
                (this._request).requestedKeyPaths.forEach(keyPath => {
                    addresses.push({
                        keyPath,
                        address: /** @type {Key} */(key).deriveAddress(keyPath).serialize(),
                    });
                });

                bitcoinXPub = new BitcoinKey(key).deriveExtendedPublicKey(this._request.bitcoinXPubPath);

                const polygonKeypath = `${this._request.polygonAccountPath}/0/0`;
                polygonAddresses = [{
                    address: new PolygonKey(key).deriveAddress(polygonKeypath),
                    keyPath: polygonKeypath,
                }];

                // Store entropy in NonPartitionedSessionStorage so addresses can be derived in the KeyguardIframe
                tmpCookieEncryptionKey = await NonPartitionedSessionStorage.set(
                    ImportApi.SESSION_STORAGE_KEY_PREFIX + key.id,
                    key.secret.serialize(),
                ) || undefined;
            } else {
                throw new Error(`Unknown key type ${key.type}`);
            }
        } catch (error) {
            this._reject(new Errors.KeyguardError(error instanceof Error ? error : String(error)));
            return;
        }

        /** @type {KeyguardRequest.KeyResult} */
        const result = [{
            keyId: key.id,
            keyType: key.type,
            ...(this._label ? { keyLabel: this._label } : {}),
            addresses,

            // Backup warnings should not be shown for imported accounts, only for newly created accounts.
            // Therefore we set both flags to true.
            fileExported: true,
            wordsExported: true,
            bitcoinXPub,
            polygonAddresses,

            // The Hub will get access to the encryption key, but not the encrypted cookie. The server can potentially
            // get access to the encrypted cookie, but not the encryption key (the result including the encryption key
            // will be set as url fragment and thus not be sent to the server), as long as the Hub is not compromised.
            // An attacker would need to get access to the Keyguard and Hub servers.
            tmpCookieEncryptionKey,
        }];

        this._resolve(result);
    }

    /**
     * @param {string} password
     * @returns {Promise<Key?>}
     */
    async _decryptAndStoreKey(password) {
        TopLevelApi.setLoading(true);
        try {
            const encryptionKey = Utf8Tools.stringToUtf8ByteArray(password);

            // Make sure read position is at 0 even after a wrong password
            this._encryptedKey.reset();

            const secret = await Nimiq.Secret.fromEncrypted(this._encryptedKey, encryptionKey);

            // If this code runs, the password was correct and the request returns
            /** @type {HTMLElement} */
            (this.$unlockAccountPage.querySelector('.lock')).classList.add('unlocked');

            // TODO expectedKeyId check if it gets used in the future.
            const key = new Key(secret, this._flags.hasPin);
            await KeyStore.instance.put(key, encryptionKey);
            return key;
        } catch (event) {
            console.error(event);
            TopLevelApi.setLoading(false);
            return null; // Triggers onPasswordIncorrect above
        }
    }

    /**
     * @param {Event} event
     */
    _goToCreate(event) {
        event.preventDefault();
        this._reject(new Errors.GoToCreate());
    }
}

ImportFile.Pages = {
    IMPORT_FILE: 'import-file',
    UNLOCK_ACCOUNT: 'unlock-account',
};
