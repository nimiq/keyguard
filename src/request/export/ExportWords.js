/* global FlippableHandler */
/* global Nimiq */
/* global RecoveryWords */
/* global PasswordBox */
/* global ProgressIndicator */
/* global ValidateWords */
/* global KeyStore */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */

/**
 * @callback ExportWords.resolve
 * @param {KeyguardRequest.SimpleResult} result
 */

class ExportWords extends Nimiq.Observable {
    /**
     * if a complete page is missing it will be created.
     * However these pages wil be the default pages which usually don't match the applications requirements.
     * Refer to the corresponsing _build(Privcy | RecoveryWords | ValidateWords) to see the general Structure.
     * @param {Parsed<KeyguardRequest.SimpleRequest>} request
     * @param {ExportWords.resolve} resolve
     * @param {reject} reject
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
        this._$noRecoveryPage = (document.getElementById(ExportWords.Pages.RECOVERY_WORDS_INTRO));
        /** @type {HTMLElement} */
        const $recoveryWordsPage = (document.getElementById(ExportWords.Pages.SHOW_WORDS));
        /** @type {HTMLElement} */
        const $validateWordsPage = (document.getElementById(ExportWords.Pages.VALIDATE_WORDS));

        // elements
        /** @type {HTMLFormElement} */
        const $wordsPasswordBox = (this._$noRecoveryPage.querySelector('.password-box'));
        /** @type {HTMLElement} */
        const $recoveryWords = ($recoveryWordsPage.querySelector('.recovery-words'));
        /** @type {HTMLButtonElement} */
        const $recoveryWordsContinue = ($recoveryWordsPage.querySelector('button'));
        /** @type {HTMLElement} */
        const $validateWords = ($validateWordsPage.querySelector('.validate-words'));

        // components
        this._wordsPasswordBox = new PasswordBox($wordsPasswordBox, {
            buttonI18nTag: 'passwordbox-show-words',
            hideInput: !request.keyInfo.encrypted || !!this._key,
            hideCancel: true,
        });
        this._recoveryWords = new RecoveryWords($recoveryWords, false);
        this._validateWords = new ValidateWords($validateWords);
        /* eslint-disable no-new */
        new ProgressIndicator(this._$noRecoveryPage.querySelector('.progress-indicator'), 3, 1);
        new ProgressIndicator($recoveryWordsPage.querySelector('.progress-indicator'), 3, 2);
        new ProgressIndicator($validateWordsPage.querySelector('.progress-indicator'), 3, 3);
        /* eslint-enable no-new */

        // events
        this._wordsPasswordBox.on(PasswordBox.Events.SUBMIT, this._passwordSubmitted.bind(this));
        $recoveryWordsContinue.addEventListener('click', () => {
            this._validateWords.reset();
            window.location.hash = ExportWords.Pages.VALIDATE_WORDS;
        });
        this._validateWords.on(ValidateWords.Events.VALIDATED, () => this._resolve({ success: true }));
    }

    run() {
        this._wordsPasswordBox.reset();
        window.location.hash = ExportWords.Pages.RECOVERY_WORDS_INTRO;

        TopLevelApi.focusPasswordBox();
    }

    /**
     * @param {string} [password]
     */
    async _passwordSubmitted(password) {
        TopLevelApi.setLoading(true);

        /** @type {Key?} */
        let key = null;

        if (this._key) {
            key = this._key;
            password = this._password;
        } else {
            const passwordBuffer = password ? Utf8Tools.stringToUtf8ByteArray(password) : undefined;

            try {
                key = await KeyStore.instance.get(this._request.keyInfo.id, passwordBuffer);
            } catch (e) {
                if (e.message === 'Invalid key') {
                    this._wordsPasswordBox.onPasswordIncorrect();
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
            this.fire(ExportWords.Events.KEY_CHANGED, key, password);
            this.setKey(key, password);
        }

        window.location.hash = ExportWords.Pages.SHOW_WORDS;
        TopLevelApi.setLoading(false);
    }

    /**
     * Used to set the key if already decrypted elsewhere. This will disable the password requirement.
     * Set to null to re-enable password requirement.
     * @param {Key?} key
     * @param {string} [password]
     */
    setKey(key, password) {
        this._key = key;
        let words = [''];
        if (this._key !== null) {
            if (this._key.secret instanceof Nimiq.PrivateKey) {
                words = Nimiq.MnemonicUtils.entropyToLegacyMnemonic(this._key.secret.serialize());
            } else if (this._key.secret instanceof Nimiq.Entropy) {
                words = Nimiq.MnemonicUtils.entropyToMnemonic(this._key.secret);
            } else {
                this._reject(new Errors.KeyguardError('Unknown secret type'));
                return;
            }

            if (password) {
                this._wordsPasswordBox.hideInput(true);
                this._password = password;
            }
        }

        this._recoveryWords.setWords(words);
        this._validateWords.setWords(words);
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
