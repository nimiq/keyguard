/* global Nimiq */
/* global Key */
/* global ImportWords */
/* global FileImport */
/* global PassphraseBox */
/* global PassphraseSetterBox */
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

        this.importWordsHandler = new ImportWords(request, this._onRecoveryWordsComplete.bind(this), reject);

        /** @type {HTMLElement} */
        this.$importFilePage = document.getElementById(ImportFile.Pages.IMPORT_FILE)
                             || this._buildImportFile();

        /** @type {HTMLDivElement} */
        const $fileImport = (this.$importFilePage.querySelector('.file-import'));

        console.log(this.$importFilePage, $fileImport);

        const fileImport = new FileImport($fileImport);

        /** @type {HTMLElement} */
        const $gotoWords = (this.$importFilePage.querySelector('#goto-words'));
        $gotoWords.addEventListener('click', this._goToImportWords.bind(this));

        /** @type {HTMLElement} */
        const $gotoCreate = (this.$importFilePage.querySelector('#goto-create'));
        $gotoCreate.addEventListener('click', this._goToCreate.bind(this));

        /** @type {HTMLFormElement} */
        const $passphraseBox = (this.$importFilePage.querySelector('.passphrase-box'));
        const passphraseBox = new PassphraseBox(
            $passphraseBox,
            {
                buttonI18nTag: 'passphrasebox-log-in',
                hideCancel: true,
            },
        );
        fileImport.on(FileImport.Events.IMPORT, this._onFileImported.bind(this));
        passphraseBox.on(PassphraseBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back()); // Go back to import type selection


        /** @type {HTMLFormElement} */
        const $passphraseSetterBox = (document.querySelector('.passphrase-setter-box'));

        this._passphraseSetterBox = new PassphraseSetterBox($passphraseSetterBox);

        this._passphraseSetterBox.on(PassphraseSetterBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        this._passphraseSetterBox.on(PassphraseSetterBox.Events.SKIP, () => this._onPassphraseEntered(null));
    }

    run() {
        this.importWordsHandler.run();
        // window.location.hash = ImportFile.Pages.IMPORT_FILE;
    }

    _onFileImported() {
        this.$importFilePage.classList.add('enter-password');
    }

    /**
     * @param {string?} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        const key = await this._decryptAndStoreKey(passphrase);
        if (!key) {
            // this._passphraseBox.onPassphraseIncorrect();
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
            keyId: key.id,
            keyType: key.type,
            addresses,
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

    _goToImportWords() {
        // flip and display Words.
        this.importWordsHandler.run();
    }

    /**
     * @param { Nimiq.SerialBuffer } entropy
     * @param { Key.Type } keyType
     */
    _onRecoveryWordsComplete(entropy, keyType) {
        this._hasPin = false;
        this._keyType = keyType;
        this._encryptedKey = entropy;

        this._passphraseSetterBox.reset();
        window.location.hash = ImportApi.Pages.SET_PASSPHRASE;
        this._passphraseSetterBox.focus();
    }

    /**
     * @param {Event} e
     */
    _goToCreate(e) {
        e.preventDefault();
        this._reject(new Errors.GoToCreate());
    }

    /**
     * @returns {HTMLElement}
     */
    _buildImportFile() {
        const $el = document.createElement('div');
        $el.id = ImportFile.Pages.IMPORT_FILE;
        $el.classList.add('page', 'nq-card');
        $el.innerHTML = `
        <div class="page-header nq-card-header">
            <a tabindex="0" class="page-header-back-button nq-icon arrow-left"></a>
            <h1 class="nq-h1">Upload your Login File</h1>
        </div>

        <div class="page-body nq-card-body">
            <div class="file-import"></div>
        </div>

        <div class="page-footer">
            <button data-i18n="login-goto-words" class="nq-button-s hide-for-password-input" id="goto-words">
                Use Recovery Words
            </button>
            <a class="nq-text-s nq-blue hide-for-password-input" id="goto-create" href="#">
                Create new Wallet<i class="nq-icon chevron-right"></i>
            </a>
            <form class="passphrase-box hide-if-key-active"></form>
        </div>
        `;
        /** @type {HTMLElement} */
        const $app = (document.getElementById('app'));
        $app.insertBefore($el, $app.children[1]);
        return $el;
    }
}

ImportFile.Pages = {
    IMPORT_FILE: 'import-file',
};
