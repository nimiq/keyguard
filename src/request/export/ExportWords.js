/* global FlippableHandler */
/* global Nimiq */
/* global RecoveryWords */
/* global PassphraseBox */
/* global ProgressIndicator */
/* global ValidateWords */
/* global KeyStore */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */

class ExportWords extends Nimiq.Observable {
    /**
     * if a complete page is missing it will be created.
     * However these pages wil be the default pages which usually don't match the applications requirements.
     * Refer to the corresponsing _build(Privcy | RecoveryWords | ValidateWords) to see the general Structure.
     * @param {Parsed<KeyguardRequest.SimpleRequest>} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        super();

        this._request = request;
        this._resolve = resolve;
        this._reject = reject;

        FlippableHandler.init();

        /** @type {Key | null} */
        this._key = null;

        // pages
        /** @type {HTMLElement} */
        this._$noRecovery = (document.getElementById(ExportWords.Pages.RECOVERY_WORDS_INTRO));
        /** @type {HTMLElement} */
        const $recoveryWordsPage = (document.getElementById(ExportWords.Pages.SHOW_WORDS));
        /** @type {HTMLElement} */
        const $validateWordsPage = (document.getElementById(ExportWords.Pages.VALIDATE_WORDS));

        // elements
        /** @type {HTMLLinkElement} */
        const $noRecoverySkip = (this._$noRecovery.querySelector('.skip-words'));
        /** @type {HTMLFormElement} */
        const $wordsPasswordBox = (this._$noRecovery.querySelector('.passphrase-box'));
        /** @type {HTMLElement} */
        const $recoveryWords = ($recoveryWordsPage.querySelector('.recovery-words'));
        /** @type {HTMLLinkElement} */
        const $recoveryWordsSkip = ($recoveryWordsPage.querySelector('.skip-words'));
        /** @type {HTMLButtonElement} */
        const $recoveryWordsContinue = ($recoveryWordsPage.querySelector('button'));
        /** @type {HTMLElement} */
        const $validateWords = ($validateWordsPage.querySelector('.validate-words'));

        // components
        this._wordsPasswordBox = new PassphraseBox($wordsPasswordBox, {
            buttonI18nTag: 'passphrasebox-show-words',
            hideInput: !request.keyInfo.encrypted || !!this._key,
            hideCancel: true,
        });
        this._recoveryWords = new RecoveryWords($recoveryWords, false);
        this._validateWords = new ValidateWords($validateWords);
        /* eslint-disable no-new */
        new ProgressIndicator(this._$noRecovery.querySelector('.progress-indicator'), 3, 1);
        new ProgressIndicator($recoveryWordsPage.querySelector('.progress-indicator'), 3, 2);
        new ProgressIndicator($validateWordsPage.querySelector('.progress-indicator'), 3, 3);
        /* eslint-enable no-new */

        // events
        $noRecoverySkip.addEventListener('click', event => {
            event.preventDefault();
            this._resolve({ success: false });
        });
        $recoveryWordsSkip.addEventListener('click', event => {
            event.preventDefault();
            this._resolve({ success: true });
        });
        this._wordsPasswordBox.on(PassphraseBox.Events.SUBMIT, this._passphraseSubmitted.bind(this));
        $recoveryWordsContinue.addEventListener('click', () => {
            this._validateWords.reset();
            window.location.hash = ExportWords.Pages.VALIDATE_WORDS;
        });
        this._validateWords.on(ValidateWords.Events.VALIDATED, () => this._resolve({ success: true }));
        this._validateWords.on(ValidateWords.Events.SKIP, () => this._resolve({ success: true }));
    }

    run() {
        window.location.hash = ExportWords.Pages.RECOVERY_WORDS_INTRO;
    }

    /**
     * @param {string} password
     */
    async _passphraseSubmitted(password) {
        TopLevelApi.setLoading(true);

        let passwordBuffer;
        if (this._password) {
            passwordBuffer = this._password;
        } else if (password) {
            passwordBuffer = Utf8Tools.stringToUtf8ByteArray(password);
        }

        /** @type {Key?} */
        let key = null;

        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, passwordBuffer);
        } catch (e) {
            if (e.message === 'Invalid key') {
                this._wordsPasswordBox.onPassphraseIncorrect();
                TopLevelApi.setLoading(false);
                return;
            }
            this._reject(new Errors.CoreError(e));
            return;
        }

        if (!key) {
            this._reject(new Errors.KeyNotFoundError());
            return;
        }

        this.setKey(key, passwordBuffer);
        this.fire(ExportWords.Events.KEY_CHANGED, key, passwordBuffer);
        window.location.hash = ExportWords.Pages.SHOW_WORDS;
        TopLevelApi.setLoading(false);
    }

    /**
     * Used to set the key if already decrypted elsewhere. This will disable the passphrase requirement.
     * Set to null to re-enable passphrase requirement.
     * @param {Key | null} key
     * @param {Uint8Array} [password]
     */
    setKey(key, password) { // eslint-disable-line no-unused-vars
        this._key = key;
        let words = [''];
        if (this._key !== null) {
            if (this._key._secret instanceof Nimiq.PrivateKey) {
                words = Nimiq.MnemonicUtils.entropyToLegacyMnemonic(this._key.secret.serialize());
            } else if (this._key.secret instanceof Nimiq.Entropy) {
                words = Nimiq.MnemonicUtils.entropyToMnemonic(this._key.secret);
            } else {
                this._reject(new Errors.KeyguardError('Unknown mnemonic type'));
                return;
            }

            if (password) {
                this._wordsPasswordBox.hideInput(true);
                this._password = password;
            }
        }

        this._recoveryWords.setWords(words);
        this._validateWords.setWords(words);
        this._$noRecovery.classList.toggle('key-active', this._key !== null);
    }
}

ExportWords.Pages = {
    RECOVERY_WORDS_INTRO: 'recovery-words-intro',
    SHOW_WORDS: 'recovery-words',
    VALIDATE_WORDS: 'validate-words',
};

ExportWords.Events = {
    KEY_CHANGED: 'key-changed',
};
