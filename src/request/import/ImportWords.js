/* global Nimiq */
/* global Key */
/* global PrivacyAgent */
/* global EnterRecoveryWords */
/* global ChooseKeyType */

class ImportWords {
    /**
     * @param {ImportRequest} request
     * @param {Function} resolve
     */
    constructor(request, resolve) {
        this._resolve = resolve;
        // Pages
        /** @type {HTMLElement} */
        const $privacy = (document.getElementById(ImportWords.Pages.PRIVACY_AGENT));
        /** @type {HTMLFormElement} */
        const $words = (document.getElementById(ImportWords.Pages.ENTER_WORDS));
        /** @type {HTMLFormElement} */
        const $chooseKeyType = (document.getElementById(ImportWords.Pages.CHOOSE_KEY_TYPE));
        /* @type {HTMLFormElement} */
        // const $setPassphrase = (document.getElementById(ImportWords.Pages.SET_PASSPHRASE));

        /** @type {HTMLElement} */
        const $privacyAgent = ($privacy.querySelector('.agent'));

        // Components
        const privacyAgent = new PrivacyAgent($privacyAgent);
        const recoveryWords = new EnterRecoveryWords($words);
        const chooseKeyType = new ChooseKeyType($chooseKeyType);
        // const setPassphrase = new PassphraseSetterBox($setPassphrase);

        // Events
        privacyAgent.on(PrivacyAgent.Events.CONFIRM, () => {
            window.location.hash = ImportWords.Pages.ENTER_WORDS;
            recoveryWords.focus();
        });

        recoveryWords.on(EnterRecoveryWords.Events.COMPLETE, this._onRecoveryWordsComplete.bind(this));

        chooseKeyType.on(ChooseKeyType.Events.CHOOSE, this._onKeyTypeChosen.bind(this));

        // setPassphrase.on(PassphraseSetterBox.Events.SUBMIT, /** @param {string} passphrase */ async passphrase => {
        //     document.body.classList.add('loading');
        //     if (this._key) {
        //         resolve(await KeyStore.instance.put(this._key, Nimiq.BufferUtils.fromAscii(passphrase)));
        //     }
        // });

        this._chooseKeyType = chooseKeyType;
    }

    run() {
        this._key = null;
        window.location.hash = ImportWords.Pages.PRIVACY_AGENT;
    }

    /**
     * Store key and request passphrase
     *
     * @param {Array<string>} mnemonic
     * @param {number} mnemonicType
     */
    _onRecoveryWordsComplete(mnemonic, mnemonicType) {
        switch (mnemonicType) {
        case Nimiq.MnemonicUtils.MnemonicType.BIP39: {
            const entropy = Nimiq.MnemonicUtils.mnemonicToEntropy(mnemonic);
            this._key = new Key(entropy.serialize(), Key.Type.BIP39);
            this._resolve(entropy.serialize(), Key.Type.BIP39);
            break;
        }
        case Nimiq.MnemonicUtils.MnemonicType.LEGACY: {
            const entropy = Nimiq.MnemonicUtils.legacyMnemonicToEntropy(mnemonic);
            this._key = new Key(entropy.serialize(), Key.Type.LEGACY);
            this._resolve(entropy.serialize(), Key.Type.LEGACY);
            break;
        }
        case Nimiq.MnemonicUtils.MnemonicType.UNKNOWN: {
            this._chooseKeyType.entropy = Nimiq.MnemonicUtils.mnemonicToEntropy(mnemonic);
            window.location.hash = ImportWords.Pages.CHOOSE_KEY_TYPE;
            break;
        }
        default:
            throw new Error('Invalid mnemonic type');
        }

        // window.location.hash = mnemonicType === Nimiq.MnemonicUtils.MnemonicType.UNKNOWN
        //     ? ImportWords.Pages.CHOOSE_KEY_TYPE
        //     : ImportWords.Pages.SET_PASSPHRASE;
    }

    /**
     * @param {Key.Type} keyType
     * @param {Nimiq.Entropy} entropy
     * @private
     */
    _onKeyTypeChosen(keyType, entropy) {
        this._key = new Key(entropy.serialize(), keyType);
        this._resolve(entropy.serialize(), keyType);
        // window.location.hash = ImportWords.Pages.SET_PASSPHRASE;
    }
}

ImportWords.Pages = {
    PRIVACY_AGENT: 'privacy',
    ENTER_WORDS: 'words',
    CHOOSE_KEY_TYPE: 'choose-key-type',
    SET_PASSPHRASE: 'set-passphrase',
};
