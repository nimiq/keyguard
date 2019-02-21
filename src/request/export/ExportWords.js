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
        this._$noRecovery = (document.getElementById(ExportWords.Pages.NO_RECOVERY));
        /** @type {HTMLElement} */
        const $recoveryWordsPage = document.getElementById(ExportWords.Pages.SHOW_WORDS)
                                || this._buildRecoveryWords();
        /** @type {HTMLElement} */
        const $validateWordsPage = document.getElementById(ExportWords.Pages.VALIDATE_WORDS)
                                || this._buildValidateWords();


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
        // this._validateWords.on(ValidateWords.Events.BACK, this._goToShowWords.bind(this));
        this._validateWords.on(ValidateWords.Events.SKIP, () => this._resolve({ success: true }));
    }

    run() {
        window.location.hash = ExportWords.Pages.NO_RECOVERY;
    }

    /**
     * @param {string} phrase
     */
    async _passphraseSubmitted(phrase) {
        TopLevelApi.setLoading(true);

        const passphraseBuffer = phrase ? Utf8Tools.stringToUtf8ByteArray(phrase) : undefined;

        /** @type {Key?} */
        let key = null;

        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, passphraseBuffer);
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

        this.setKey(key);
        this.fire(ExportWords.Events.KEY_CHANGED, {
            key,
            isProtected: this._request.keyInfo.encrypted,
        });
        window.location.hash = ExportWords.Pages.SHOW_WORDS;
        TopLevelApi.setLoading(false);
    }

    /**
     * Used to set the key if already decrypted elsewhere. This will disable the passphrase requirement.
     * Set to null to re-enable passphrase requirement.
     * @param {Key | null} key
     */
    setKey(key) {
        this._key = key;
        let words = [''];
        if (this._key !== null) {
            if (this._key.secret instanceof Nimiq.PrivateKey) {
                words = Nimiq.MnemonicUtils.entropyToLegacyMnemonic(this._key.secret.serialize());
            } else if (this._key.secret instanceof Nimiq.Entropy) {
                words = Nimiq.MnemonicUtils.entropyToMnemonic(this._key.secret);
            } else {
                this._reject(new Errors.KeyguardError('Unknown mnemonic type'));
            }
        }
        this._recoveryWords.setWords(words);
        this._validateWords.setWords(words);
        this._$noRecovery.classList.toggle('key-active', this._key !== null);
    }

    _buildRecoveryWords() {
        const $el = document.createElement('div');
        $el.id = ExportWords.Pages.SHOW_WORDS;
        $el.classList.add('page', 'nq-card', 'flipped', 'nq-blue-bg');
        $el.innerHTML = `
        <div class="page-header nq-card-header">
            <div class="progress-indicator"></div>
            <a tabindex="0" class="page-header-back-button nq-icon arrow-left"></a>
            <h1 data-i18n="recovery-words-title" class="nq-h1">Write these 24 words on a piece of paper.</h1>
        </div>

        <div class="page-body nq-card-body">
            <p class="nq-orange">Anyone with these words can access your wallet! Keep them save.</p>
            <div class="recovery-words"></div>
        </div>

        <div class="page-footer">
            <button class="to-validate-words nq-button light-blue" data-i18n="continue">Continue</button>
            <a href="#" class="skip-words nq-link nq-text-s nq-blue">
                <span data-i18n="passphrasebox-password-skip">Skip for now</span>
                <i class="nq-icon chevron-right"></i>
            </a>
        </div>
        `;
        /** @type {HTMLElement} */
        const $app = (document.getElementById('rotation-container'));
        $app.insertBefore($el, $app.children[1]);
        return $el;
    }

    _buildValidateWords() {
        const $el = document.createElement('div');
        $el.id = ExportWords.Pages.VALIDATE_WORDS;
        $el.classList.add('page', 'nq-card', 'flipped', 'nq-blue-bg');
        $el.innerHTML = `
        <div class="page-header nq-card-header">
            <div class="progress-indicator"></div>
            <a tabindex="0" class="page-header-back-button nq-icon arrow-left"></a>
            <h1 data-i18n="create-heading-validate-backup" class="nq-h1">Validate your backup</h1>
        </div>

        <div class="page-body nq-card-body">
            <div class="validate-words"></div>
        </div>
        `;
        /** @type {HTMLElement} */
        const $app = (document.getElementById('rotation-container'));
        $app.insertBefore($el, $app.children[1]);
        return $el;
    }
}

ExportWords.Pages = {
    NO_RECOVERY: 'no-recovery',
    SHOW_WORDS: 'recovery-words',
    VALIDATE_WORDS: 'validate-words',
};

ExportWords.Events = {
    KEY_CHANGED: 'key-changed',
};
