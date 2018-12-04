/* global Nimiq */
/* global PrivacyWarning */
/* global RecoveryWords */
/* global PassphraseBox */
/* global ValidateWords */
/* global KeyStore */
/* global Errors */
/* global Utf8Tools */

class ExportWords extends Nimiq.Observable {
    /**
     * if a complete page is missing it will be created.
     * However these pages wil be the default pages which usually don't match the applications requirements.
     * Refer to the corresponsing _build(Privcy | RecoveryWords | ValidateWords) to see the general Structure.
     * @param {KeyguardRequest.ParsedSimpleRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        super();

        this._resolve = resolve;
        this._request = request;
        this._reject = reject;
        /** @type {Key | null} */
        this._key = null;

        /** @type {HTMLElement} */
        const $privacyPage = document.getElementById(ExportWords.Pages.PRIVACY)
                          || this._buildPrivacy();

        /** @type {HTMLElement} */
        const $recoveryWordsPage = document.getElementById(ExportWords.Pages.SHOW_WORDS)
                                || this._buildRecoveryWords();
        /** @type {HTMLElement} */
        const $validateWordsPage = document.getElementById(ExportWords.Pages.VALIDATE_WORDS)
                                || this._buildValidateWords();

        /** @type {HTMLElement} */
        const $privacyWarning = ($privacyPage.querySelector('.privacy-warning'));
        /** @type {HTMLFormElement} */
        const $privacyWarningPassphraseBox = ($privacyPage.querySelector('.passphrase-box'));
        /** @type {HTMLButtonElement} */
        const $privacyWarningButton = ($privacyPage.querySelector('button'));

        /** @type {HTMLElement} */
        const $recoveryWords = ($recoveryWordsPage.querySelector('.recovery-words'));
        /** @type {HTMLButtonElement} */
        const $recoveryWordsButton = ($recoveryWordsPage.querySelector('button'));
        /** @type {HTMLElement} */
        const $validateWords = ($validateWordsPage.querySelector('.validate-words'));

        new PrivacyWarning($privacyWarning); // eslint-disable-line no-new
        this._privacyWarningPassphraseBox = new PassphraseBox(
            $privacyWarningPassphraseBox, {
                buttonI18nTag: 'passphrasebox-continue',
                hideInput: !this._request.keyInfo.encrypted,
                minLength: this._request.keyInfo.hasPin ? 6 : undefined,
                hideCancel: true,
            },
        );
        this._recoveryWords = new RecoveryWords($recoveryWords, false);
        this._validateWords = new ValidateWords($validateWords);

        $privacyWarningButton.addEventListener('click', this._goToShowWords.bind(this));
        $recoveryWordsButton.addEventListener('click', this._goToValidateWords.bind(this));
        this._privacyWarningPassphraseBox.on(PassphraseBox.Events.SUBMIT, this._passphraseSubmitted.bind(this));
        this._validateWords.on(ValidateWords.Events.VALIDATED, this._finish.bind(this));
        this._validateWords.on(ValidateWords.Events.BACK, this._goToShowWords.bind(this));
        this._validateWords.on(ValidateWords.Events.SKIP, this._finish.bind(this));
    }

    run() {
        this._privacyWarningPassphraseBox.reset();
        window.location.hash = ExportWords.Pages.PRIVACY;
        this._privacyWarningPassphraseBox.focus();
    }

    /**
     * @param {string} phrase
     */
    async _passphraseSubmitted(phrase) {
        document.body.classList.add('loading');
        const passphraseBuffer = phrase ? Utf8Tools.stringToUtf8ByteArray(phrase) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, passphraseBuffer);
        } catch (e) {
            if (e.message === 'Invalid key') {
                document.body.classList.remove('loading');
                this._privacyWarningPassphraseBox.onPassphraseIncorrect();
                return;
            }
            this._reject(new Errors.CoreError(e.message));
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
        document.body.classList.remove('loading');
    }

    /**
     * used to set the key if already decrypted elsewhere. This will disable the passphrase requirement.
     * Set to null to reenable passphrase requirement.
     * @param {Key | null} key
     */
    setKey(key) {
        this._key = key;
        let words = [''];
        if (this._key !== null) {
            switch (this._key.type) {
            case Nimiq.MnemonicUtils.MnemonicType.LEGACY:
                words = Nimiq.MnemonicUtils.entropyToLegacyMnemonic(this._key.secret);
                break;
            case Nimiq.MnemonicUtils.MnemonicType.BIP39:
                words = Nimiq.MnemonicUtils.entropyToMnemonic(this._key.secret);
                break;
            default:
                this._reject(new Errors.KeyguardError('Unknown mnemonic type'));
                return;
            }
        }
        this._recoveryWords.setWords(words);
        this._validateWords.setWords(words);
        /** @type {HTMLElement} */(document.getElementById(ExportWords.Pages.PRIVACY))
            .classList.toggle('key-active', this._key !== null);
    }

    _goToValidateWords() {
        this._validateWords.reset();
        window.location.hash = ExportWords.Pages.VALIDATE_WORDS;
    }

    _goToShowWords() {
        window.location.hash = ExportWords.Pages.SHOW_WORDS;
    }

    _finish() {
        const result = {
            success: true,
        };
        this._resolve(result);
    }

    _buildPrivacy() {
        const $el = document.createElement('div');
        $el.id = ExportWords.Pages.PRIVACY;
        $el.classList.add('page', 'nq-card');
        $el.innerHTML = `
        <div class="page-header nq-card-header">
            <a tabindex="0" class="page-header-back-button nq-icon arrow-left"></a>
            <h1 data-i18n="recovery-words-title" class="nq-h1">Recovery Words</h1>
        </div>

        <div class="page-body nq-card-body">
            <div class="privacy-agent">
                <div class="privacy-warning"></div>
            </div>
            <div class="flex-grow"></div>
        </div>

        <div class="page-footer">
            <button data-i18n="recovery-words-continue-to-words" class="nq-button">Continue to Recovery Words</button>
            <form class="passphrase-box hide-if-key-active"></form>
        </div>
        `;
        /** @type {HTMLElement} */
        const $app = (document.getElementById('app'));
        $app.insertBefore($el, $app.children[1]);
        return $el;
    }

    _buildRecoveryWords() {
        const $el = document.createElement('div');
        $el.id = ExportWords.Pages.SHOW_WORDS;
        $el.classList.add('page', 'nq-card');
        $el.innerHTML = `
        <div class="page-header nq-card-header">
            <a tabindex="0" class="page-header-back-button nq-icon arrow-left"></a>
            <h1 data-i18n="recovery-words-title" class="nq-h1">Recovery Words</h1>
        </div>

        <div class="page-body nq-card-body">
            <div class="recovery-words"></div>
        </div>

        <div class="page-footer">
            <button class="to-validate-words nq-button" data-i18n="continue">Continue</button>
        </div>
        `;
        /** @type {HTMLElement} */
        const $app = (document.getElementById('app'));
        $app.insertBefore($el, $app.children[1]);
        return $el;
    }

    _buildValidateWords() {
        const $el = document.createElement('div');
        $el.id = ExportWords.Pages.VALIDATE_WORDS;
        $el.classList.add('page', 'nq-card');
        $el.innerHTML = `
        <div class="page-header nq-card-header">
            <a tabindex="0" class="page-header-back-button nq-icon arrow-left"></a>
            <h1 data-i18n="create-heading-validate-backup" class="nq-h1">Validate your backup</h1>
        </div>

        <div class="page-body nq-card-body">
            <div class="validate-words"></div>
        </div>
        `;
        /** @type {HTMLElement} */
        const $app = (document.getElementById('app'));
        $app.insertBefore($el, $app.children[1]);
        return $el;
    }
}

ExportWords.Pages = {
    PRIVACY: 'privacy',
    SHOW_WORDS: 'recovery-words',
    VALIDATE_WORDS: 'validate-words',
};

ExportWords.Events = {
    KEY_CHANGED: 'key-changed',
};
