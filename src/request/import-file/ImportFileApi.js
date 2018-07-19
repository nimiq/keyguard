/* global PopupApi */
/* global PassphraseInput */
/* global PinInput */
// /* global Nimiq */
// /* global Key */
// /* global EncryptionType */
// /* global KeyStore */

class ImportFileApi extends PopupApi {
    constructor() {
        super();

        // Start UI
        this.dom = this._makeView();
    }

    async onRequest() {
        // show UI
        window.location.hash = ImportFileApi.Pages.FILE_IMPORT;
    }

    /**
     * @returns {{passphraseComponent: PassphraseInput, pinComponent: PinInput}}
     */
    _makeView() {
        // Pages
        // /** @type {HTMLElement} */
        // const $importPage = (document.getElementById(ImportFileApi.Pages.FILE_IMPORT));
        /** @type {HTMLElement} */
        const $passphrasePage = (document.getElementById(ImportFileApi.Pages.ENTER_PASSPHRASE));
        /** @type {HTMLElement} */
        const $pinPage = (document.getElementById(ImportFileApi.Pages.ENTER_PIN));

        // Containers
        // /** @type {HTMLElement} */
        // const $fileImportComponent = ($importPage.querySelector('.file-import-component'));
        /** @type {HTMLFormElement} */
        const $passphraseComponent = ($passphrasePage.querySelector('.passphrase-component'));
        /** @type {HTMLDivElement} */
        const $pinComponent = ($pinPage.querySelector('.pin-component'));

        // Components
        // const fileImportComponent = new FileImport($fileImportComponent);
        const passphraseComponent = new PassphraseInput(false, $passphraseComponent);
        const pinComponent = new PinInput($pinComponent);

        // Events
        pinComponent.on(PinInput.Events.PIN_ENTERED, this._onPassphraseEntered.bind(this));

        passphraseComponent.on(PassphraseInput.Events.PASSPHRASE_ENTERED, this._onPinEntered.bind(this));

        return {
            // fileImportComponent,
            passphraseComponent,
            pinComponent,
        };
    }

    /**
     * Store key and request passphrase
     *
     * @param {ImageBitmap} file
     */
    async _onFileImported(file) {
        console.log(file);
    }

    /**
     * Store passphrase and ask for user confirmation
     *
     * @param {string} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        console.log(passphrase);
        // Test Passphrase

        // Store Key

        // this.resolve(keyInfo);
    }

    /**
     * Store passphrase and ask for user confirmation
     *
     * @param {string} pin
     */
    async _onPinEntered(pin) {
        console.log(pin);
        // Test PIN

        // Store Key

        // this.resolve(keyInfo);
    }
}

ImportFileApi.Pages = {
    FILE_IMPORT: 'file-import',
    ENTER_PIN: 'enter-pin',
    ENTER_PASSPHRASE: 'enter-passphrase',
};
