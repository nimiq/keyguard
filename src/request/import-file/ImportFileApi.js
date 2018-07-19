/* global PopupApi */
/* global FileImport */
/* global PassphraseInput */
/* global PinInput */
/* global Nimiq */
/* global Key */
/* global EncryptionType */
/* global KeyStore */

class ImportFileApi extends PopupApi {
    constructor() {
        super();

        this._encryptedKeyPair = new Uint8Array(0);

        // Start UI
        this.dom = this._makeView();

        window.addEventListener('hashchange', () => {
            if (window.location.hash.substr(1) !== ImportFileApi.Pages.ENTER_PIN) {
                this.dom.pinInput.close();
            }
        });
    }

    async onRequest() {
        // show UI
        window.location.hash = ImportFileApi.Pages.FILE_IMPORT;
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
        const passphraseInput = new PassphraseInput(false, $passphraseInput);
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
     * @param {string} encryptedBase64KeyPair - Encrypted KeyPair in base64 format
     */
    _onFileImported(encryptedBase64KeyPair) {
        if (encryptedBase64KeyPair.substr(0, 2) === '#2') {
            // PIN encoded
            this._encryptedKeyPair = Nimiq.BufferUtils.fromBase64(encryptedBase64KeyPair.substr(2));
            window.location.hash = ImportFileApi.Pages.ENTER_PIN;
            this.dom.pinInput.open();
        } else {
            // Passphrase encoded
            this._encryptedKeyPair = Nimiq.BufferUtils.fromBase64(encryptedBase64KeyPair);
            window.location.hash = ImportFileApi.Pages.ENTER_PASSPHRASE;
            this.dom.passphraseInput.focus();
        }
    }

    /**
     * @param {string} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        const keyInfo = await this._decryptAndStoreKey(passphrase, EncryptionType.HIGH);

        if (!keyInfo) this.dom.passphraseInput.onPassphraseIncorrect();
        else this.resolve(keyInfo);
    }

    /**
     * @param {string} pin
     */
    async _onPinEntered(pin) {
        const keyInfo = await this._decryptAndStoreKey(pin, EncryptionType.LOW);

        if (!keyInfo) this.dom.pinInput.onPinIncorrect();
        else this.resolve(keyInfo);
    }

    /**
     * @param {string} passphraseOrPin
     * @param {EncryptionType} type
     * @returns {Promise<KeyInfo | false>}
     */
    async _decryptAndStoreKey(passphraseOrPin, type) {
        try {
            const key = await Key.loadEncrypted(this._encryptedKeyPair, passphraseOrPin, type);
            KeyStore.instance.put(key, passphraseOrPin);
            return key.getPublicInfo();
        } catch (e) {
            return false;
        }
    }
}

ImportFileApi.Pages = {
    FILE_IMPORT: 'file-import',
    ENTER_PASSPHRASE: 'enter-passphrase',
    ENTER_PIN: 'enter-pin',
};
