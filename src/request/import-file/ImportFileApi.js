/* global TopLevelApi */
/* global FileImport */
/* global PassphraseBox */
/* global Nimiq */
/* global Key */
/* global KeyInfo */
/* global KeyStore */

class ImportFileApi extends TopLevelApi {
    constructor() {
        super();

        this._encryptedKey = new Nimiq.SerialBuffer(0);

        // Start UI
        const dom = this._makeView();
        this._passphraseBox = dom.passphraseBox;

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
     * @returns {{passphraseBox: PassphraseBox}}
     */
    _makeView() {
        // Containers
        /** @type {HTMLDivElement} */
        const $fileImport = (document.querySelector('.file-import'));
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('.passphrase-box'));

        // Components
        const fileImport = new FileImport($fileImport);
        const passphraseBox = new PassphraseBox($passphraseBox);

        // Events
        fileImport.on(FileImport.Events.IMPORT, this._onFileImported.bind(this));
        passphraseBox.on(PassphraseBox.Events.SUBMIT, this._onPassphraseEntered.bind(this));

        return {
            passphraseBox,
        };
    }

    /**
     * Determine key type and forward user to Passphrase input
     *
     * @param {string} encryptedKeyBase64 - Encrypted KeyPair in base64 format
     */
    _onFileImported(encryptedKeyBase64) {
        if (encryptedKeyBase64.substr(0, 2) === '#2') {
            // PIN-encoded
            this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64.substr(2));
            window.location.hash = ImportFileApi.Pages.ENTER_PASSPHRASE;
            this._passphraseBox.focus();
        } else {
            // Passphrase-encoded
            this._encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKeyBase64);
            window.location.hash = ImportFileApi.Pages.ENTER_PASSPHRASE;
            this._passphraseBox.focus();
        }
    }

    /**
     * @param {string} passphrase
     */
    async _onPassphraseEntered(passphrase) {
        const keyInfo = await this._decryptAndStoreKey(passphrase);

        if (!keyInfo) this._passphraseBox.onPassphraseIncorrect();
        else this.resolve(keyInfo);
    }

    /**
     * @param {string} passphrase
     * @returns {Promise<?KeyInfo>}
     */
    async _decryptAndStoreKey(passphrase) {
        this.$loading.style.display = 'flex';
        try {
            // TODO Support for UTF-8 passwords
            const encryptionKey = Nimiq.BufferUtils.fromAscii(passphrase);
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
};
