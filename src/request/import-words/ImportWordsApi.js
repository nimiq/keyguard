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
        this.dom = this._makeView();
    }

    async onRequest() {
        // show UI
        window.location.hash = ImportWordsApi.Pages.PRIVACY_AGENT;
    }

    /**
     * @returns {{passphrase: PassphraseInput, passphraseConfirm: PassphraseInput}}
     */
    _makeView() {
        const $app = /** @type {HTMLElement} */ (document.getElementById('app'));
        const $privacyAgent = /** @type {HTMLElement} */ (document.getElementById(ImportWordsApi.Pages.PRIVACY_AGENT));
        const $enterWords = /** @type {HTMLElement} */ (document.getElementById(ImportWordsApi.Pages.ENTER_WORDS));
        const $enterPassphrase = /** @type {HTMLElement} */ (document.getElementById(ImportWordsApi.Pages.ENTER_PASSPHRASE));
        const $confirmPassphrase = /** @type {HTMLElement} */ (document.getElementById(ImportWordsApi.Pages.CONFIRM_PASSPHRASE));

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
        // window.recoveryWordsInput.$fields.forEach((field, index) => {
        //     setTimeout(() => {
        //         field._value = field.dom.input.value = words[index];
        //         field._onBlur();
        //     }, index * 50);
        // });
        // /debugging

        const $passphrase = /** @type {HTMLFormElement} */ ($enterPassphrase.querySelector('.passphrase'));
        const passphrase = new PassphraseInput(true, $passphrase);
        passphrase.on(PassphraseInput.Events.PASSPHRASE_ENTERED, this._handlePassphrase.bind(this));

        const $passphraseConfirm = /** @type {HTMLFormElement} */ ($confirmPassphrase.querySelector('.passphrase-confirm'));
        const passphraseConfirm = new PassphraseInput(false, $passphraseConfirm);
        passphraseConfirm.on(PassphraseInput.Events.PASSPHRASE_ENTERED, this._handlePassphraseConfirmation.bind(this));

        return { passphrase, passphraseConfirm };
    }

    /**
     * Store key and request passphrase
     *
     * @param {Nimiq.PrivateKey} privateKey
     */
    _onRecoveryWordsEntered(privateKey) {
        this._privateKey = privateKey;
        window.location.hash = ImportWordsApi.Pages.ENTER_PASSPHRASE;
        this.dom.passphrase.focus();
    }

    /**
     * Store passphrase and ask for user confirmation
     *
     * @param {string} passphrase
     */
    async _handlePassphrase(passphrase) {
        this._passphrase = passphrase;
        this.dom.passphrase.reset();
        window.location.hash = ImportWordsApi.Pages.CONFIRM_PASSPHRASE;
        this.dom.passphraseConfirm.focus();
    }

    /**
     * Encrypt key with passphrase and store
     *
     * @param {string} passphrase
     */
    async _handlePassphraseConfirmation(passphrase) {
        if (!this._passphrase) throw new Error('Passphrase not set!');
        if (!this._privateKey) throw new Error('Private key not set!');

        if (this._passphrase !== passphrase) {
            await this.dom.passphraseConfirm.onPassphraseIncorrect();
            this.dom.passphraseConfirm.reset();
            window.location.hash = ImportWordsApi.Pages.ENTER_PASSPHRASE;
            this.dom.passphrase.focus();
            return;
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
    CONFIRM_PASSPHRASE: 'confirm',
};
