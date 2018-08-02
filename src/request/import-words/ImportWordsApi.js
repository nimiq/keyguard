/* global PopupApi */
/* global RecoveryWords */
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

        /** @type {?Key} */
        this._key = null;
    }

    async onRequest() {
        // show UI
        window.location.hash = ImportWordsApi.Pages.PRIVACY_AGENT;
    }

    /**
     * @returns {{setPassphrase: SetPassphrase}}
     */
    _makeView() {
        // Pages
        /** @type {HTMLElement} */
        const $privacy = (document.getElementById(ImportWordsApi.Pages.PRIVACY_AGENT));
        /** @type {HTMLElement} */
        const $words = (document.getElementById(ImportWordsApi.Pages.ENTER_WORDS));
        /** @type {HTMLFormElement} */
        const $setPassphrase = (document.getElementById(ImportWordsApi.Pages.SET_PASSPHRASE));

        // Containers
        /** @type {HTMLElement} */
        const $privacyAgent = ($privacy.querySelector('.agent'));
        /** @type {HTMLElement} */
        const $wordsInput = ($words.querySelector('.input'));

        // Components
        const privacyAgent = new PrivacyAgent($privacyAgent);
        const recoveryWordsInput = new RecoveryWords($wordsInput, true);
        const setPassphrase = new SetPassphrase($setPassphrase);

        // Events
        privacyAgent.on(PrivacyAgent.Events.CONFIRM, () => {
            window.location.hash = ImportWordsApi.Pages.ENTER_WORDS;
            recoveryWordsInput.focus();
        });

        recoveryWordsInput.on(RecoveryWords.Events.COMPLETE, this._onRecoveryWordsEntered.bind(this));

        setPassphrase.on(SetPassphrase.Events.CHOOSE, /** @param {string} passphrase */ async (passphrase) => {
            document.body.classList.add('loading');

            if (this._key) {
                this._resolve(await KeyStore.instance.put(this._key, Nimiq.BufferUtils.fromAscii(passphrase)));
            }
        });

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

        return { setPassphrase };
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

        window.location.hash = ImportWordsApi.Pages.SET_PASSPHRASE;
    }
}

ImportWordsApi.Pages = {
    PRIVACY_AGENT: 'privacy',
    ENTER_WORDS: 'words',
    SET_PASSPHRASE: 'set-passphrase'
};
