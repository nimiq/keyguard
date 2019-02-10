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
        this._resolve = resolve;
        this._reject = reject;
        this._request = request;
        this._defaultKeyPath = request.defaultKeyPath;

        this._encryptedKey = new Nimiq.SerialBuffer(0);
        this._keyType = Key.Type.BIP39;
        this._hasPin = false;

        this.importWordsHandler = new ImportWords(request, resolve, reject);

        /** @type {HTMLElement} */
        this.$importFilePage = (document.getElementById(ImportFile.Pages.IMPORT_FILE));

        /** @type {HTMLDivElement} */
        const $fileImport = (this.$importFilePage.querySelector('.file-import'));

        const fileImport = new FileImport($fileImport);

        /** @type {HTMLElement} */
        const $gotoWords = (this.$importFilePage.querySelector('#goto-words'));
        $gotoWords.addEventListener('click', () => { this.importWordsHandler.run(); });

        /** @type {HTMLElement} */
        const $gotoCreate = (this.$importFilePage.querySelector('#goto-create'));
        $gotoCreate.addEventListener('click', this._goToCreate.bind(this));

        /** @type {HTMLFormElement} */
        const $passphraseBox = (this.$importFilePage.querySelector('.passphrase-box'));
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

    _onFileImported() {
        this.passphraseBox.reset();
        this.$importFilePage.classList.add('enter-password');
        if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
            this.passphraseBox.focus();
        }
    }

    /**
     * @param {string?} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        const key = await this._decryptAndStoreKey(passphrase);
        if (!key) {
            this.passphraseBox.onPassphraseIncorrect();
            return;
        }

        /** @type {{keyPath: string, address: Uint8Array}[]} */
        const addresses = [];

        if (key.type === Key.Type.LEGACY) {
            const address = key.deriveAddress('');
            addresses.push({
                keyPath: 'm/0\'',
                address: address.serialize(),
            });
        } else if (key.type === Key.Type.BIP39) {
            /** @type {KeyguardRequest.ImportRequest} */
            (this._request).requestedKeyPaths.forEach(keyPath => {
                addresses.push({
                    keyPath,
                    address: key.deriveAddress(keyPath).serialize(),
                });
            });

            // Store entropy in SessionStorage so addresses can be derived in the KeyguardIframe
            const secretString = Nimiq.BufferUtils.toBase64(key.secret);
            sessionStorage.setItem(ImportApi.SESSION_STORAGE_KEY_PREFIX + key.id, secretString);
        } else {
            this._reject(new Errors.KeyguardError(`Unkown key type ${key.type}`));
            return;
        }

        /** @type {KeyguardRequest.ImportResult} */
        const result = {
            keys: [
                {
                    keyId: key.id,
                    keyType: key.type,
                    addresses,
                },
            ],
        };

        this._resolve(result);
    }

    /**
     * @param {string?} passphrase
     * @returns {Promise<?Key>}
     */
    async _decryptAndStoreKey(passphrase) {
        TopLevelApi.setLoading(true);
        try {
            // Separating the processing of the encryptionKey (password) and the secret (key) is necessary
            // to cover these scenarios:
            //     1. Encrypted key file with password or PIN
            //     2. Unencrypted key file and no new password set
            //     3. Unencrypted key file and new password set

            let secret = new Uint8Array(0);
            let encryptionKey = null;

            if (passphrase !== null) {
                encryptionKey = Utf8Tools.stringToUtf8ByteArray(passphrase);
            }

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) {
                // Make sure read position is at 0 even after a wrong passphrase
                this._encryptedKey.reset();

                secret = await Nimiq.CryptoUtils.decryptOtpKdf(
                    this._encryptedKey,
                    /** @type {Uint8Array} */ (encryptionKey),
                );
            } else {
                // Key File was not encrypted and the imported Uint8Array is the plain secret
                secret = this._encryptedKey;
            }

            const key = new Key(secret, this._keyType, this._hasPin);

            await KeyStore.instance.put(key, encryptionKey || undefined);

            return key;
        } catch (e) {
            console.error(e);
            TopLevelApi.setLoading(false);
            return null;
        }
    }

    // /**
    //  * @param { Nimiq.SerialBuffer } entropy
    //  * @param { Key.Type } keyType
    //  */
    // _onRecoveryWordsComplete(entropy, keyType) {
    //     this._hasPin = false;
    //     this._keyType = keyType;
    //     this._encryptedKey = entropy;

    //     this._passphraseSetterBox.reset();
    //     window.location.hash = ImportApi.Pages.SET_PASSPHRASE;
    //     if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
    //         this._passphraseSetterBox.focus();
    //     }
    // }

    /**
     * @param {Event} e
     */
    _goToCreate(e) {
        e.preventDefault();
        this._reject(new Errors.GoToCreate());
    }
}

ImportFile.Pages = {
    IMPORT_FILE: 'import-file',
};
