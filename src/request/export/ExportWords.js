/* global Observable */
/* global FlippableHandler */
/* global Nimiq */
/* global NimiqPoW */
/* global RecoveryWords */
/* global PasswordBox */
/* global ProgressIndicator */
/* global ValidateWords */
/* global KeyStore */
/* global AccountStore */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global Key */

/**
 * @callback ExportWords.resolve
 * @param {KeyguardRequest.SimpleResult} result
 */

class ExportWords extends Observable {
    /**
     * @param {Parsed<KeyguardRequest.ExportRequest>} request
     * @param {ExportWords.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        super();

        this._request = request;
        this._resolve = resolve;
        this._reject = reject;

        FlippableHandler.init();

        /** @type {Key?} */
        this._key = null;

        // pages
        this._$noRecoveryPage = /** @type {HTMLElement} */ (
            document.getElementById(ExportWords.Pages.RECOVERY_WORDS_INTRO));
        this._$recoveryWordsUnlockPage = /** @type {HTMLElement} */ (
            document.getElementById(ExportWords.Pages.RECOVERY_WORDS_UNLOCK));
        this._$recoveryWordsPage = /** @type {HTMLElement} */ (
            document.getElementById(ExportWords.Pages.SHOW_WORDS));
        this._$validateWordsPage = /** @type {HTMLElement} */ (
            document.getElementById(ExportWords.Pages.VALIDATE_WORDS));

        // elements
        const $recoveryWordsIntroButton = /** @type {HTMLButtonElement} */ (
            this._$noRecoveryPage.querySelector('.page-footer > button'));
        const $wordsPasswordBox = /** @type {HTMLFormElement} */ (
            this._$recoveryWordsUnlockPage.querySelector('.password-box'));
        this.$recoveryWords = /** @type {HTMLElement} */ (
            this._$recoveryWordsPage.querySelector('.recovery-words'));
        this.$recoveryWordsContinue = /** @type {HTMLButtonElement} */ (
            this._$recoveryWordsPage.querySelector('button'));
        const $validateWords = /** @type {HTMLElement} */ (
            this._$validateWordsPage.querySelector('.validate-words'));

        // components
        this._wordsPasswordBox = new PasswordBox($wordsPasswordBox, {
            buttonI18nTag: 'passwordbox-show-words',
            hideInput: !request.keyInfo.encrypted || !!this._key,
            minLength: request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
        });
        this._recoveryWords = new RecoveryWords(this.$recoveryWords, false);
        this._validateWords = new ValidateWords($validateWords);
        /* eslint-disable no-new */
        new ProgressIndicator(this._$noRecoveryPage.querySelector('.progress-indicator'), 4, 1);
        new ProgressIndicator(this._$recoveryWordsUnlockPage.querySelector('.progress-indicator'), 4, 2);
        new ProgressIndicator(this._$recoveryWordsPage.querySelector('.progress-indicator'), 4, 3);
        new ProgressIndicator(this._$validateWordsPage.querySelector('.progress-indicator'), 4, 4);
        /* eslint-enable no-new */

        // events
        $recoveryWordsIntroButton.addEventListener('click', () => {
            if (!this._key) {
                this._wordsPasswordBox.reset();
                window.location.hash = ExportWords.Pages.RECOVERY_WORDS_UNLOCK;
                TopLevelApi.focusPasswordBox();
            } else {
                this._goToRecoveryWords(this._key);
            }
        });

        this._wordsPasswordBox.on(PasswordBox.Events.SUBMIT, this._passwordSubmitted.bind(this));

        this.$recoveryWordsContinue.addEventListener('click', () => {
            this._validateWords.reset();
            window.location.hash = ExportWords.Pages.VALIDATE_WORDS;
        });

        this._validateWords.on(ValidateWords.Events.VALIDATED, () => this._resolve({ success: true }));
    }

    run() {
        window.location.hash = ExportWords.Pages.RECOVERY_WORDS_INTRO;
    }

    /**
     * @param {string} password
     */
    async _passwordSubmitted(password) {
        TopLevelApi.setLoading(true);

        const passwordBuffer = password ? Utf8Tools.stringToUtf8ByteArray(password) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = this._request.keyInfo.useLegacyStore
                ? await AccountStore.instance.get(
                    this._request.keyInfo.defaultAddress.toUserFriendlyAddress(),
                    /** @type {Uint8Array} */ (passwordBuffer),
                )
                : await KeyStore.instance.get(this._request.keyInfo.id, passwordBuffer);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage === 'Invalid key') {
                this._wordsPasswordBox.onPasswordIncorrect();
                TopLevelApi.setLoading(false);
                return;
            }
            this._reject(new Errors.CoreError(error instanceof Error ? error : errorMessage));
            return;
        }

        if (!key) {
            this._reject(new Errors.KeyNotFoundError());
            return;
        }
        this.fire(ExportWords.Events.KEY_CHANGED, key, password);
        this._goToRecoveryWords(key);
    }

    /**
     * @param {Key} key
     * @private
     */
    _goToRecoveryWords(key) {
        let words = [''];
        if (key.secret instanceof Nimiq.PrivateKey) {
            words = NimiqPoW.MnemonicUtils.entropyToLegacyMnemonic(key.secret.serialize());
        } else if (key.secret instanceof Nimiq.Entropy) {
            words = Nimiq.MnemonicUtils.entropyToMnemonic(key.secret);
        } else {
            this._reject(new Errors.KeyguardError('Secret not instance of any known type'));
            return;
        }

        this._recoveryWords.setWords(words);
        this._validateWords.setWords(words);

        window.location.hash = ExportWords.Pages.SHOW_WORDS;

        this.$recoveryWords.onscroll = () => {
            /*
             * 16 is half of padding-bottom: 4rem; with font-size: 8px; which is the
             * case for keyguard on desktop. On mobile it is reduced to font-size: 7px;
             * of which half would be 14 which is still good enough to not have the user
             * scroll to the last pixel of the container.
             */
            const targetScrollTop = this.$recoveryWords.scrollHeight - this.$recoveryWords.offsetHeight - 16;
            if (this.$recoveryWords.scrollTop >= targetScrollTop) {
                /** @type {HTMLElement} */
                (this._$recoveryWordsPage.querySelector('.page-footer')).classList.add('scrolled-down');
                this.$recoveryWords.onscroll = null;
            }
        };
        TopLevelApi.setLoading(false);
    }

    /**
     * Used to set the key if already decrypted elsewhere. This will disable the password requirement.
     * Set to null to re-enable password requirement.
     * @param {Key?} key
     */
    setKey(key) {
        this._key = key;
        if (key) {
            /* eslint-disable no-new */
            new ProgressIndicator(this._$noRecoveryPage.querySelector('.progress-indicator'), 3, 1);
            new ProgressIndicator(this._$recoveryWordsPage.querySelector('.progress-indicator'), 3, 2);
            new ProgressIndicator(this._$validateWordsPage.querySelector('.progress-indicator'), 3, 3);
            /* eslint-enable no-new */
        } else {
            /* eslint-disable no-new */
            new ProgressIndicator(this._$noRecoveryPage.querySelector('.progress-indicator'), 4, 1);
            new ProgressIndicator(this._$recoveryWordsPage.querySelector('.progress-indicator'), 4, 3);
            new ProgressIndicator(this._$validateWordsPage.querySelector('.progress-indicator'), 4, 4);
            /* eslint-enable no-new */
        }
    }
}

ExportWords.Pages = {
    RECOVERY_WORDS_INTRO: 'recovery-words-intro',
    RECOVERY_WORDS_UNLOCK: 'recovery-words-unlock',
    SHOW_WORDS: 'recovery-words',
    VALIDATE_WORDS: 'validate-words',
};

ExportWords.Events = {
    KEY_CHANGED: 'key-changed',
};
