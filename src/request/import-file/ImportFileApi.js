/* global TopLevelApi */
/* global FileImport */
/* global PassphraseBox */
/* global PassphraseSetterBox */
/* global Nimiq */
/* global Key */
/* global KeyInfo */
/* global KeyStore */

class ImportFileApi extends TopLevelApi {
    constructor() {
        super();

        this._encryptedKey = new Nimiq.SerialBuffer(0);
        this._keyType = Key.Type.BIP39;

        // Start UI
        const dom = this._makeView();
        this._passphraseBox = dom.passphraseBox;
        this._passphraseSetterBox = dom.passphraseSetterBox;

        this.$loading = /** @type {HTMLDivElement} */ (document.querySelector('#loading'));
    }

    /**
     * @param {ImportRequest} request
     */
    async onRequest(request) {
        // Global cancel link
        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());

        // show UI
        window.location.hash = ImportFileApi.Pages.FILE_IMPORT;

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
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
        /** @type {HTMLElement} */
        const backArrow = (document.querySelector(`#${ImportFileApi.Pages.ENTER_PASSPHRASE} .page-header-back-button`));

        // Components
        const fileImport = new FileImport($fileImport);
        const passphraseBox = new PassphraseBox($passphraseBox, { buttonI18nTag: 'passphrasebox-log-in' });
        const passphraseSetterBox = new PassphraseSetterBox($passphraseSetterBox);

        // Events
        fileImport.on(FileImport.Events.IMPORT, this._onFileImported.bind(this));
        passphraseBox.on(PassphraseBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseBox.on(PassphraseBox.Events.CANCEL, () => this._goToImportPage());
        passphraseSetterBox.on(PassphraseSetterBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));
        passphraseSetterBox.on(PassphraseSetterBox.Events.SKIP, () => this._onPassphraseEntered(null));
        backArrow.addEventListener('click', () => this._goToImportPage());

        return {
            passphraseBox,
            passphraseSetterBox,
        };
    }

    /**
     * Determine key type and forward user to Passphrase input
     *
     * @param {string} encryptedKeyBase64 - Encrypted KeyPair in base64 format
     */
    _onFileImported(encryptedKeyBase64) {
        if (encryptedKeyBase64.substr(0, 2) === '#3') {
            this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
            this._keyType = Key.Type.BIP39;

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) this._goToEnterPassphrase();
            else this._goToSetPassphrase();
        } else {
            if (encryptedKeyBase64.substr(0, 2) === '#2') {
                // PIN-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
            } else {
                // Passphrase-encoded
                this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64);
            }
            this._keyType = Key.Type.LEGACY;

            this._goToEnterPassphrase();
        }
    }

    /**
     * @param {string?} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        const keyInfo = await this._decryptAndStoreKey(passphrase);
        if (!keyInfo) {
            this._passphraseBox.onPassphraseIncorrect();
            return;
        }

        // TODO Generate first 20 addresses
        this.resolve(keyInfo);
    }

    /**
     * @param {string?} passphrase
     * @returns {Promise<?KeyInfo>}
     */
    async _decryptAndStoreKey(passphrase) {
        this.$loading.style.display = 'flex';
        try {
            // Separating the processing of the encryptionKey (password) and the secret (key) is necessary
            // to cover these scenarios:
            //     1. Encrypted key file with password
            //     2. Unencrypted key file and no new password set
            //     3. Unencrypted key file and new password set

            let secret = new Uint8Array(0);
            let encryptionKey = null;

            if (passphrase !== null) {
                // TODO Support for UTF-8 passwords
                encryptionKey = Nimiq.BufferUtils.fromAscii(passphrase);
            }

            if (this._encryptedKey.length === Nimiq.CryptoUtils.ENCRYPTION_SIZE) {
                secret = await Nimiq.CryptoUtils.decryptOtpKdf(
                    this._encryptedKey,
                    /** @type {Uint8Array} */ (encryptionKey),
                );
            } else {
                secret = this._encryptedKey;
            }

            const key = new Key(secret, this._keyType);
            await KeyStore.instance.put(key, encryptionKey || undefined);

            return new KeyInfo(key.id, key.type, passphrase !== null);
        } catch (e) {
            this.$loading.style.display = 'none';
            return null;
        }
    }

    _goToEnterPassphrase() {
        window.location.hash = ImportFileApi.Pages.ENTER_PASSPHRASE;
        this._passphraseBox.focus();
    }

    _goToSetPassphrase() {
        window.location.hash = ImportFileApi.Pages.SET_PASSPHRASE;
        this._passphraseSetterBox.focus();
    }

    _goToImportPage() {
        window.history.back();
        this._passphraseBox.reset();
    }
}

ImportFileApi.Pages = {
    FILE_IMPORT: 'file-import',
    ENTER_PASSPHRASE: 'enter-passphrase',
    SET_PASSPHRASE: 'set-passphrase',
};
