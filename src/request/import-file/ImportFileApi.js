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
    }

    async onRequest() {
        // show UI
        window.location.hash = ImportFileApi.Pages.FILE_IMPORT;
    }

    /**
     * @returns {{fileImportComponent: FileImport, passphraseComponent: PassphraseInput, pinComponent: PinInput}}
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
        const $fileImportComponent = ($importPage.querySelector('.file-import-component'));
        /** @type {HTMLFormElement} */
        const $passphraseComponent = ($passphrasePage.querySelector('.passphrase-component'));
        /** @type {HTMLDivElement} */
        const $pinComponent = ($pinPage.querySelector('.pin-component'));

        // Components
        const fileImportComponent = new FileImport($fileImportComponent);
        const passphraseComponent = new PassphraseInput(false, $passphraseComponent);
        const pinComponent = new PinInput($pinComponent);

        // Events
        fileImportComponent.on(FileImport.Events.IMPORT, this._onFileImported.bind(this));
        pinComponent.on(PinInput.Events.PIN_ENTERED, this._onPassphraseEntered.bind(this));
        passphraseComponent.on(PassphraseInput.Events.PASSPHRASE_ENTERED, this._onPinEntered.bind(this));

        return {
            fileImportComponent,
            passphraseComponent,
            pinComponent,
        };
    }

    /**
     * Determine key type and forward user to either Passphrase or PIN input
     *
     * @param {string} encryptedBase64KeyPair - Encrypted KeyPair in base64 format
     */
    _onFileImported(encryptedBase64KeyPair) {
        console.log(encryptedBase64KeyPair);

        if (encryptedBase64KeyPair.substr(0, 2) === '#2') {
            // PIN encoded
            this._encryptedKeyPair = Nimiq.BufferUtils.fromBase64(encryptedBase64KeyPair.substr(2));
            window.location.hash = ImportFileApi.Pages.ENTER_PIN;
        } else {
            // Passphrase encoded
            this._encryptedKeyPair = Nimiq.BufferUtils.fromBase64(encryptedBase64KeyPair);
            window.location.hash = ImportFileApi.Pages.ENTER_PASSPHRASE;
        }
    }

    /**
     * @param {string} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        console.log(passphrase);
        const keyInfo = await this._decryptAndStoreKey(passphrase, EncryptionType.HIGH);

        if (!keyInfo) this.dom.passphraseComponent.onPassphraseIncorrect();
        else this.resolve(keyInfo);
    }

    /**
     * @param {string} pin
     */
    async _onPinEntered(pin) {
        console.log(pin);
        const keyInfo = await this._decryptAndStoreKey(pin, EncryptionType.HIGH);

        if (!keyInfo) this.dom.pinComponent.onPinIncorrect();
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
    ENTER_PIN: 'enter-pin',
    ENTER_PASSPHRASE: 'enter-passphrase',
};
