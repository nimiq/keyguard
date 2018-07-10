class ImportWordsApi extends PopupApi {

    constructor() {
        super();

        // start UI
        if (({ interactive:1, complete:1 })[document.readyState]) {
            this._makeView();
        } else {
            document.addEventListener("DOMContentLoaded", (e) => {
                this._makeView();
            });
        }
    }

    async onRequest() {
        // show UI
        window.location.hash = ImportWordsApi.Pages.PRIVACY_AGENT;
    }

    _makeView() {
        this.$rootElement = /** @type {HTMLElement} */ (document.getElementById('app'));
        this.$privacyAgent = /** @type {HTMLElement} */ (this.$rootElement.querySelector('#privacy'));
        this.$enterWords = /** @type {HTMLElement} */ (this.$rootElement.querySelector('#words'));
        this.$enterPassphrase = /** @type {HTMLElement} */ (this.$rootElement.querySelector('#passphrase'));

        const privacyAgent = new PrivacyAgent(ImportWordsApi.Pages.ENTER_WORDS);
        this.$privacyAgent.appendChild(privacyAgent.getElement());

        const recoveryWordsInput = new RecoveryWordsInput();
        // for debugging
        // window.input = recoveryWordsInput;
        recoveryWordsInput.on(RecoveryWordsInput.Events.COMPLETE, this._onRecoveryWordsEntered.bind(this));
        this.$enterWords.appendChild(recoveryWordsInput.getElement());

        const passphraseInput = new PassphraseInput(true);
        passphraseInput.on(PassphraseInput.Events.PASSPHRASE_ENTERED, this._handlePassphraseInput.bind(this));
        this.$enterPassphrase.appendChild(passphraseInput.getElement());
    }

    /**
     * Store key and request passphrase
     *
     * @param {string} words
     */
    _onRecoveryWordsEntered(words) {
        const buffer = new Nimiq.SerialBuffer(MnemonicPhrase.mnemonicToKey(words));
        this._privateKey = Nimiq.PrivateKey.unserialize(buffer);
        window.location.hash = ImportWordsApi.Pages.ENTER_PASSPHRASE;
    }

    /**
     * Encrypt key with passphrase and store
     *
     * @param {string} passphrase
     */
    async _handlePassphraseInput(passphrase) {
        if (!this._privateKey) {
            throw new Error('Private key not set!');
        }

        document.body.classList.add('loading');

        const keyPair = Nimiq.KeyPair.derive(this._privateKey);
        // const key = await Key.loadPlain(keyPair.serialize(), EncryptionType.HIGH);
        const key = new Key(keyPair, EncryptionType.HIGH);
        this._resolve(await KeyStore.instance.put(key, passphrase));
    }
}

ImportWordsApi.Pages = {
    PRIVACY_AGENT: 'privacy',
    ENTER_WORDS: 'words',
    ENTER_PASSPHRASE: 'passphrase',
}
