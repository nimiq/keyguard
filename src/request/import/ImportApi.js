/* global TopLevelApi */
/* global FileImport */
/* global ImportWords */
/* global PassphraseBox */
/* global PassphraseSetterBox */
/* global Nimiq */
/* global Key */
/* global KeyStore */
/* global Errors */
/* global Utf8Tools */

class ImportApi extends TopLevelApi {
    constructor() {
        super();

        this._encryptedKey = new Nimiq.SerialBuffer(0);
        this._keyType = Key.Type.BIP39;
        this._hasPin = false;

        // Start UI
        const dom = this._makeView();
        this._passphraseBox = dom.passphraseBox;
        this._passphraseSetterBox = dom.passphraseSetterBox;
    }

    /**
     * @param {KeyguardRequest.ImportRequest} request
     */
    async onRequest(request) {
        this._request = this.parseRequest(request);

        // Global cancel link
        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type {HTMLButtonElement} */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => this.reject(new Errors.RequestCanceled()));

        this.run();
    }

    /**
     * @returns {{passphraseBox: PassphraseBox, passphraseSetterBox: PassphraseSetterBox}}
     */
    _makeView() {
        // Containers
        /** @type {HTMLDivElement} */
        const $fileImport = (document.querySelector('.file-import'));
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('.passphrase-box'));
        /** @type {HTMLFormElement} */
        const $passphraseSetterBox = (document.querySelector('.passphrase-setter-box'));
        /** @type {HTMLButtonElement} */
        const $importWordsLink = (document.querySelector('.go-to-words'));
        /** @type {HTMLAnchorElement} */
        const $createWalletLink = (document.querySelector('.create-wallet'));

        // Components
        const fileImport = new FileImport($fileImport);
        const passphraseBox = new PassphraseBox(
            $passphraseBox,
            {
                buttonI18nTag: 'passphrasebox-log-in',
                hideCancel: true,
            },
        );
        const passphraseSetterBox = new PassphraseSetterBox($passphraseSetterBox);

        // Events
        fileImport.on(FileImport.Events.IMPORT, this._onFileImported.bind(this));
        passphraseBox.on(PassphraseBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back()); // Go back to import type selection
        passphraseSetterBox.on(PassphraseSetterBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseSetterBox.on(PassphraseSetterBox.Events.SKIP, () => this._onPassphraseEntered(null));
        $importWordsLink.addEventListener('click', () => {
            const handler = new ImportWords(
                /** @type {KeyguardRequest.ImportRequest} */ (this._request),
                this._onRecoveryWordsComplete.bind(this),
                this._reject.bind(this),
            );
            handler.run();
        });
        $createWalletLink.addEventListener('click', () => this.reject(new Errors.GoToCreate()));

        return {
            passphraseBox,
            passphraseSetterBox,
        };
    }


    /**
     * Determine key type and forward user to Passphrase input
     * @param {string} encryptedKeyBase64 - Encrypted KeyPair in base64 format
     */
    _onFileImported(encryptedKeyBase64) {
        if (encryptedKeyBase64.substr(0, 2) === '#3') {
            // BIP39 Key File
            this._keyType = Key.Type.BIP39;

            this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
            this._hasPin = false;
            this._passphraseBox.setMinLength();

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) this._goToEnterPassphrase();
            else this._goToSetPassphrase();
        } else {
            // Legacy Account Access File
            this._keyType = Key.Type.LEGACY;

            if (encryptedKeyBase64.substr(0, 2) === '#2') {
                // PIN-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
                this._hasPin = true;
                this._passphraseBox.setMinLength(6);
            } else {
                // Passphrase-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64);
                this._hasPin = false;
                this._passphraseBox.setMinLength(10);
            }

            this._goToEnterPassphrase();
        }
    }

    run() {
        window.location.hash = ImportApi.Pages.FILE_IMPORT;

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {string?} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        const key = await this._decryptAndStoreKey(passphrase);
        if (!key) {
            this._passphraseBox.onPassphraseIncorrect();
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
            this.reject(new Errors.KeyguardError(`Unkown key type ${key.type}`));
            return;
        }

        /** @type {KeyguardRequest.ImportResult} */
        const result = {
            keyId: key.id,
            keyType: key.type,
            addresses,
        };

        this.resolve(result);
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

    /**
     * @param { Nimiq.SerialBuffer } entropy
     * @param { Key.Type } keyType
     */
    _onRecoveryWordsComplete(entropy, keyType) {
        this._hasPin = false;
        this._passphraseBox.setMinLength();
        this._keyType = keyType;
        this._encryptedKey = entropy;
        this._goToSetPassphrase();
    }

    _goToEnterPassphrase() {
        this._passphraseBox.reset();
        window.location.hash = ImportApi.Pages.ENTER_PASSPHRASE;
        this._passphraseBox.focus();
    }

    _goToSetPassphrase() {
        this._passphraseSetterBox.reset();
        window.location.hash = ImportApi.Pages.SET_PASSPHRASE;
        this._passphraseSetterBox.focus();
    }

    /**
     *
     * @param {KeyguardRequest.ImportRequest} request
     * @returns {KeyguardRequest.ImportRequest}
     */
    parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.defaultKeyPath = this.parsePath(request.defaultKeyPath, 'defaultKeyPath');
        parsedRequest.requestedKeyPaths = this.parsePathsArray(request.requestedKeyPaths, ' requestKeyPaths');

        return parsedRequest;
    }
}

ImportApi.Pages = {
    FILE_IMPORT: 'file-import',
    ENTER_PASSPHRASE: 'enter-passphrase',
    SET_PASSPHRASE: 'set-passphrase',
    PRIVACY_AGENT: 'privacy',
    ENTER_WORDS: 'words',
    CHOOSE_KEY_TYPE: 'choose-key-type',
};

ImportApi.SESSION_STORAGE_KEY_PREFIX = 'nimiq_key_';
