/* global TopLevelApi */
/* global FileImport */
/* global PassphraseInput */
/* global PinInput */
/* global Nimiq */
/* global Key */
/* global KeyInfo */
/* global KeyStore */

class ImportFileApi extends TopLevelApi {
    constructor() {
        super();

        this._encryptedKey = new Nimiq.SerialBuffer(0);

        // Start UI
        this.dom = this._makeView();

        this.$loading = /** @type {HTMLDivElement} */ (document.querySelector('#loading'));

        window.addEventListener('hashchange', () => {
            if (window.location.hash.substr(1) !== ImportFileApi.Pages.ENTER_PIN) {
                this.dom.pinInput.close();
            }
        });
    }

    async onRequest() {
        // show UI
        window.location.hash = ImportFileApi.Pages.FILE_IMPORT;

        // Async pre-load the crypto worker to reduce wait time at first decrypt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @returns {{passphraseInput: PassphraseInput, pinInput: PinInput}}
     */
    _makeView() {
        // Pages
        /** @type {HTMLElement} */
        const $importPage = (document.getElementById(ImportFileApi.Pages.FILE_IMPORT));
        /** @type {HTMLElement} */
        const $passphrasePage = (document.getElementById(ImportFileApi.Pages.ENTER_PASSPHRASE));
        /** @type {HTMLElement} */
        const $pinPage = (document.getElementById(ImportFileApi.Pages.ENTER_PIN));

        // Containers
        /** @type {HTMLDivElement} */
        const $fileImportComponent = ($importPage.querySelector('#file-import-component'));
        /** @type {HTMLFormElement} */
        const $passphraseInput = ($passphrasePage.querySelector('#passphrase-component'));
        /** @type {HTMLDivElement} */
        const $pinInput = ($pinPage.querySelector('#pin-component'));

        // Components
        const fileImportComponent = new FileImport($fileImportComponent);
        const passphraseInput = new PassphraseInput($passphraseInput);
        const pinInput = new PinInput($pinInput);

        // Events
        fileImportComponent.on(FileImport.Events.IMPORT, this._onFileImported.bind(this));
        passphraseInput.on(PassphraseInput.Events.PASSPHRASE_ENTERED, this._onPassphraseEntered.bind(this));
        pinInput.on(PinInput.Events.PIN_ENTERED, this._onPinEntered.bind(this));

        return {
            passphraseInput,
            pinInput,
        };
    }

    /**
     * Determine key type and forward user to either Passphrase or PIN input
     *
     * @param {string} encryptedKeyBase64 - Encrypted KeyPair in base64 format
     */
    _onFileImported(encryptedKeyBase64) {
        if (encryptedKeyBase64.substr(0, 2) === '#2') {
            // PIN encoded
            this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
            window.location.hash = ImportFileApi.Pages.ENTER_PIN;
            this.dom.pinInput.open();
        } else {
            // Passphrase encoded
            this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64);
            window.location.hash = ImportFileApi.Pages.ENTER_PASSPHRASE;
            this.dom.passphraseInput.focus();
        }
    }

    /**
     * @param {string} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        const keyInfo = await this._decryptAndStoreKey(passphrase);

        if (!keyInfo) this.dom.passphraseInput.onPassphraseIncorrect();
        else this.resolve(keyInfo);
    }

    /**
     * @param {string} pin
     */
    async _onPinEntered(pin) {
        const keyInfo = await this._decryptAndStoreKey(pin);

        if (!keyInfo) this.dom.pinInput.onPinIncorrect();
        else this.resolve(keyInfo);
    }

    /**
     * @param {string} passphraseOrPin
     * @returns {Promise<?KeyInfo>}
     */
    async _decryptAndStoreKey(passphraseOrPin) {
        this.$loading.style.display = 'flex';
        try {
            const encryptionKey = Nimiq.BufferUtils.fromAscii(passphraseOrPin);
            const secret = await Nimiq.CryptoUtils.decryptOtpKdf(this._encryptedKey, encryptionKey);
            // TODO add support for BIP39 key import
            const key = new Key(secret, Key.Type.LEGACY);
            await KeyStore.instance.put(key, encryptionKey);

            return new KeyInfo(key.id, key.type, /* encrypted */ true);
        } catch (e) {
            this.$loading.style.display = 'none';
            return null;
        }
    }
}

ImportFileApi.Pages = {
    FILE_IMPORT: 'file-import',
    ENTER_PASSPHRASE: 'enter-passphrase',
    ENTER_PIN: 'enter-pin',
};
