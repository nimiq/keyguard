/* global PopupApi */
/* global RecoveryWordsInput */
/* global PassphraseInput */
/* global PrivacyAgent */
/* global Nimiq */
/* global Key */
/* global KeyStore */
/* global PassphraseConfirm */

class ImportWordsApi extends PopupApi {
    constructor() {
        super();

        // start UI
        this.dom = this._makeView();

        /**
         * @type {?Key}
         * @private
         */
        this._key = null;

        /**
         * @type {?string}
         * @private
         */
        this._passphrase = null;
    }

    async onRequest() {
        // show UI
        window.location.hash = ImportWordsApi.Pages.PRIVACY_AGENT;
    }

    /**
     * @returns {{passphrase: PassphraseConfirm, passphraseConfirm: PassphraseConfirm}}
     */
    _makeView() {
        // Pages
        /** @type {HTMLElement} */
        const $privacy = (document.getElementById(ImportWordsApi.Pages.PRIVACY_AGENT));
        /** @type {HTMLElement} */
        const $words = (document.getElementById(ImportWordsApi.Pages.ENTER_WORDS));
        /** @type {HTMLElement} */
        const $enterPassphrase = (document.getElementById(ImportWordsApi.Pages.ENTER_PASSPHRASE));
        /** @type {HTMLElement} */
        const $confirmPassphrase = (document.getElementById(ImportWordsApi.Pages.CONFIRM_PASSPHRASE));

        // Containers
        /** @type {HTMLElement} */
        const $privacyAgent = ($privacy.querySelector('.agent'));
        /** @type {HTMLElement} */
        const $wordsInput = ($words.querySelector('.input'));
        /** @type {HTMLFormElement} */
        const $passphrase = ($enterPassphrase.querySelector('.passphrase'));
        /** @type {HTMLFormElement} */
        const $passphraseConfirmation = ($confirmPassphrase.querySelector('.passphrase-confirm'));

        // Components
        const privacyAgent = new PrivacyAgent($privacyAgent);
        const recoveryWordsInput = new RecoveryWordsInput($wordsInput);
        const passphrase = new PassphraseConfirm(true, $passphrase);
        const passphraseConfirm = new PassphraseConfirm(false, $passphraseConfirmation);

        // Events
        privacyAgent.on(PrivacyAgent.Events.CONFIRM, () => {
            window.location.hash = ImportWordsApi.Pages.ENTER_WORDS;
            recoveryWordsInput.focus();
        });

        recoveryWordsInput.on(RecoveryWordsInput.Events.COMPLETE, this._onRecoveryWordsEntered.bind(this));
        passphrase.on(PassphraseInput.Events.PASSPHRASE_ENTERED, this._handlePassphrase.bind(this));
        passphraseConfirm.on(PassphraseInput.Events.PASSPHRASE_ENTERED, this._handlePassphraseConfirmation.bind(this));

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

        return { passphrase, passphraseConfirm };
    }

    /**
     * Store key and request passphrase
     *
     * @param {Array<string>} words
     * @param {number} mnemonicType
     */
    _onRecoveryWordsEntered(words, mnemonicType) {
        switch (mnemonicType) {
        case Nimiq.MnemonicUtils.MnemonicType.BIP39: {
            const entropy = Nimiq.MnemonicUtils.mnemonicToEntropy(words);
            this._key = new Key(entropy.serialize(), Key.Type.BIP39);
            break;
        }
        case Nimiq.MnemonicUtils.MnemonicType.LEGACY: {
            const entropy = Nimiq.MnemonicUtils.legacyMnemonicToEntropy(words);
            this._key = new Key(entropy.serialize(), Key.Type.LEGACY);
            break;
        }
        case Nimiq.MnemonicUtils.MnemonicType.UNKNOWN: {
            // TODO handle this case
            throw new Error('TODO');
        }
        default:
            throw new Error('Invalid mnemonic type');
        }

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
        if (!this._key) throw new Error('Key not set!');
        if (!this._passphrase) throw new Error('Passphrase not set!');

        if (this._passphrase !== passphrase) {
            await this.dom.passphraseConfirm.onPassphraseIncorrect();
            this.dom.passphraseConfirm.reset();
            window.location.hash = ImportWordsApi.Pages.ENTER_PASSPHRASE;
            this.dom.passphrase.focus();
            return;
        }

        document.body.classList.add('loading');

        this._resolve(await KeyStore.instance.put(this._key, Nimiq.BufferUtils.fromAscii(passphrase)));
    }
}

ImportWordsApi.Pages = {
    PRIVACY_AGENT: 'privacy',
    ENTER_WORDS: 'words',
    ENTER_PASSPHRASE: 'passphrase',
    CONFIRM_PASSPHRASE: 'confirm',
};
