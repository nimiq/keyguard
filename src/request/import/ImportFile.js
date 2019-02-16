/* global Constants */
/* global Nimiq */
/* global Key */
/* global ImportWords */
/* global FileImport */
/* global PassphraseBox */
/* global ImportApi */
/* global Errors */
/* global TopLevelApi */
/* global Utf8Tools */
/* global KeyStore */

class ImportFile {
    /**
     * @param {KeyguardRequest.ImportRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        this._resolve = resolve;
        this._reject = reject;

        this._encryptedKey = new Nimiq.SerialBuffer(0);

        this.importWordsHandler = new ImportWords(request, resolve, reject);

        /** @type {HTMLElement} */
        this.$importFilePage = (document.getElementById(ImportFile.Pages.IMPORT_FILE));
        /** @type {HTMLElement} */
        this.$unlockAccountPage = (document.getElementById(ImportFile.Pages.UNLOCK_ACCOUNT));

        /** @type {HTMLDivElement} */
        const $fileImport = (this.$importFilePage.querySelector('.file-import'));
        const fileImport = new FileImport($fileImport, false);

        /** @type {HTMLElement} */
        const $gotoWords = (this.$importFilePage.querySelector('#goto-words'));
        $gotoWords.addEventListener('click', () => { this.importWordsHandler.run(); });

        const $gotoCreate = this.$importFilePage.querySelector('#goto-create');
        if ($gotoCreate) {
            $gotoCreate.addEventListener('click', this._goToCreate.bind(this));
        }

        /** @type {HTMLImageElement} */
        this.$loginFileImage = (this.$unlockAccountPage.querySelector('.loginfile-image'));

        /** @type {HTMLFormElement} */
        const $passphraseBox = (this.$unlockAccountPage.querySelector('.passphrase-box'));
        this.passphraseBox = new PassphraseBox(
            $passphraseBox,
            {
                buttonI18nTag: 'passphrasebox-log-in',
                hideCancel: true,
            },
        );
        fileImport.on(FileImport.Events.IMPORT, this._onFileImported.bind(this));
        this.passphraseBox.on(PassphraseBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
    }

    run() {
        window.location.hash = ImportFile.Pages.IMPORT_FILE;
    }

    /**
     * @param {string} decoded
     * @param {string} src
     */
    _onFileImported(decoded, src) {
        // TODO: Handle legacy Account Access Files (both the 1st and #2 versions)

        this._encryptedKey = Nimiq.BufferUtils.fromBase64(decoded);
        this.$loginFileImage.src = src;
        this.passphraseBox.reset();
        this.$unlockAccountPage.classList.remove('animate');
        window.location.hash = ImportFile.Pages.UNLOCK_ACCOUNT;
        setTimeout(() => this.$unlockAccountPage.classList.add('animate'), 0);
        if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
            this.passphraseBox.focus();
        }
    }

    /**
     * @param {string} passphrase
     * @returns {Promise<void>}
     */
    async _onPassphraseEntered(passphrase) {
        const key = await this._decryptAndStoreKey(passphrase);
        if (!key) {
            this.passphraseBox.onPassphraseIncorrect();
            return;
        }

        /** @type {{keyPath: string, address: Uint8Array}[]} */
        const addresses = [];

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
                    address: key.deriveAddress(keyPath).serialize(),
                });
            });

            // Store entropy in SessionStorage so addresses can be derived in the KeyguardIframe
            const secretString = Nimiq.BufferUtils.toBase64(key.secret.serialize());
            sessionStorage.setItem(ImportApi.SESSION_STORAGE_KEY_PREFIX + key.id, secretString);
        } else {
            this._reject(new Errors.KeyguardError(`Unkown key type ${key.type}`));
            return;
        }

        /** @type {KeyguardRequest.KeyResult[]} */
        const result = [{
            keyId: key.id,
            keyType: key.type,
            addresses,
        }];

        this._resolve(result);
    }

    /**
     * @param {string} passphrase
     * @returns {Promise<Key?>}
     */
    async _decryptAndStoreKey(passphrase) {
        TopLevelApi.setLoading(true);
        try {
            const encryptionKey = Utf8Tools.stringToUtf8ByteArray(passphrase);

            // Make sure read position is at 0 even after a wrong passphrase
            this._encryptedKey.reset();

            const secret = await Nimiq.Secret.fromEncrypted(this._encryptedKey, encryptionKey);
            const key = new Key(secret, false);
            await KeyStore.instance.put(key, encryptionKey);
            return key;
        } catch (event) {
            console.error(event);
            TopLevelApi.setLoading(false);
            return null; // Triggers onPassphraseIncorrect above
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
