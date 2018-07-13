/* global PopupApi */
/* global RecoveryWordsInput */
/* global PassphraseInput */
/* global MnemonicPhrase */
/* global PrivacyAgent */
/* global Nimiq */
/* global Key */
/* global EncryptionType */
/* global KeyStore */
class ImportWordsApi extends PopupApi {
    constructor() {
        super();

        // start UI
        this._makeView();
    }

    async onRequest() {
        // show UI
        window.location.hash = ImportWordsApi.Pages.PRIVACY_AGENT;
    }

    _makeView() {
        const $rootElement = /** @type {HTMLElement} */ (document.getElementById('app'));
        const $privacyAgent = /** @type {HTMLElement} */ ($rootElement.querySelector('#privacy'));
        const $enterWords = /** @type {HTMLElement} */ ($rootElement.querySelector('#words'));
        const $enterPassphrase = /** @type {HTMLElement} */ ($rootElement.querySelector('#passphrase'));

        const privacyAgent = new PrivacyAgent();
        privacyAgent.on(PrivacyAgent.Events.CONFIRM, () => {
            window.location.hash = ImportWordsApi.Pages.ENTER_WORDS;
            recoveryWordsInput.focus();
        });
        $privacyAgent.appendChild(privacyAgent.getElement());

        const recoveryWordsInput = new RecoveryWordsInput();
        recoveryWordsInput.on(RecoveryWordsInput.Events.COMPLETE, this._onRecoveryWordsEntered.bind(this));
        $enterWords.appendChild(recoveryWordsInput.getElement());

        // for debugging: enable next line and c&p following lines in terminal to fill in correct words automatically
        // window.recoveryWordsInput = recoveryWordsInput;
        //
        // randomKey = window.crypto.getRandomValues(new Uint8Array(32));
        // words = MnemonicPhrase.keyToMnemonic(randomKey).split(' ');
        // input.$fields.forEach((field, index) => {
        //     setTimeout(() => {
        //         field._value = field.dom.input.value = words[index];
        //         field._onBlur();
        //     }, index * 50);
        // });
        // /debugging

        const passphraseInput = new PassphraseInput(true);
        passphraseInput.on(PassphraseInput.Events.PASSPHRASE_ENTERED, this._handlePassphraseInput.bind(this));
        $enterPassphrase.appendChild(passphraseInput.getElement());
    }

    /**
     * Store key and request passphrase
     *
     * @param {Nimiq.PrivateKey} privateKey
     */
    _onRecoveryWordsEntered(privateKey) {
        this._privateKey = privateKey;
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
        const key = new Key(keyPair, EncryptionType.HIGH);
        this._resolve(await KeyStore.instance.put(key, passphrase));
    }
}

ImportWordsApi.Pages = {
    PRIVACY_AGENT: 'privacy',
    ENTER_WORDS: 'words',
    ENTER_PASSPHRASE: 'passphrase',
};
