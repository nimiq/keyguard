/* global Nimiq */
/* global IdenticonSelector */
/* global PassphraseSetterBox */
/* global DownloadKeyfile */
/* global PrivacyAgent */
/* global BackupRecoveryWords */
/* global ValidateWords */
/* global Key */
/* global KeyStore */

class Create {
    /**
     * @param {CreateRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._reject = reject;

        this._passphrase = '';

        /** @type {HTMLDivElement} */
        const $identiconSelector = (document.querySelector('.identicon-selector'));

        /** @type {HTMLFormElement} */
        const $setPassphrase = (document.querySelector('.passphrase-box'));

        /** @type {HTMLElement} */
        this.$downloadKeyfile = (document.getElementById(Create.Pages.DOWNLOAD_KEYFILE));

        /** @type {HTMLElement} */
        this.$privacyAgent = (document.getElementById(Create.Pages.PRIVACY_AGENT));

        /** @type {HTMLElement} */
        this.$recoveryWords = (document.getElementById(Create.Pages.RECOVERY_WORDS));

        /** @type {HTMLElement} */
        this.$validateWords = (document.getElementById(Create.Pages.VALIDATE_WORDS));

        // Create components

        this._identiconSelector = new IdenticonSelector($identiconSelector, request.defaultKeyPath);
        this._downloadKeyfile = new DownloadKeyfile(this.$downloadKeyfile);
        /** @type {HTMLElement} */
        const $privacyAgentContainer = (this.$privacyAgent.querySelector('.agent'));
        this._privacyAgent = new PrivacyAgent($privacyAgentContainer);
        this._recoveryWords = new BackupRecoveryWords(this.$recoveryWords);
        this._validateWords = new ValidateWords(this.$validateWords);
        this._passphraseSetter = new PassphraseSetterBox($setPassphrase);

        // Wire up logic

        this._identiconSelector.on(
            IdenticonSelector.Events.IDENTICON_SELECTED,
            /** @param {Nimiq.Entropy} entropy */
            entropy => {
                this._selectedEntropy = entropy;
                const mnemonic = Nimiq.MnemonicUtils.entropyToMnemonic(entropy);
                this._recoveryWords.setWords(mnemonic);
                this._validateWords.setWords(mnemonic);
                window.location.hash = Create.Pages.SET_PASSPHRASE;
                this._passphraseSetter.focus();
            },
        );

        this._passphraseSetter.on(PassphraseSetterBox.Events.SUBMIT, /** @param {string} passphrase */ passphrase => {
            this._passphrase = passphrase;
            window.location.hash = Create.Pages.DOWNLOAD_KEYFILE;
            this._passphraseSetter.reset();
        });

        this._passphraseSetter.on(PassphraseSetterBox.Events.SKIP, () => {
            window.location.hash = Create.Pages.DOWNLOAD_KEYFILE;
            this._passphraseSetter.reset();
        });

        this._downloadKeyfile.on(DownloadKeyfile.Events.DOWNLOADED, () => {
            window.location.hash = Create.Pages.PRIVACY_AGENT;
        });

        this._downloadKeyfile.on(DownloadKeyfile.Events.CONTINUE, () => {
            window.location.hash = Create.Pages.PRIVACY_AGENT;
        });

        this._privacyAgent.on(PrivacyAgent.Events.CONFIRM, () => {
            window.location.hash = Create.Pages.RECOVERY_WORDS;
        });

        this._recoveryWords.on(BackupRecoveryWords.Events.CONTINUE, () => {
            window.location.hash = Create.Pages.VALIDATE_WORDS;
        });

        this._validateWords.on(ValidateWords.Events.BACK, () => {
            window.location.hash = Create.Pages.RECOVERY_WORDS;
            this._validateWords.reset();
        });

        this._validateWords.on(ValidateWords.Events.VALIDATED, () => {
            this.finish(request);
        });

        this._validateWords.on(ValidateWords.Events.SKIPPED, () => {
            this.finish(request);
        });

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());
    }

    /**
     * @param {CreateRequest} request
     */
    async finish(request) { // eslint-disable-line no-unused-vars
        document.body.classList.add('loading');
        const key = new Key(this._selectedEntropy.serialize());
        // XXX Should we use utf8 encoding here instead?
        const passphrase = Nimiq.BufferUtils.fromAscii(this._passphrase);
        this._resolve(await KeyStore.instance.put(key, passphrase));
    }

    run() {
        // go to start page
        window.location.hash = Create.Pages.CHOOSE_IDENTICON;
        this._identiconSelector.generateIdenticons();
    }
}

Create.Pages = {
    CHOOSE_IDENTICON: 'choose-identicon',
    SET_PASSPHRASE: 'set-passphrase',
    DOWNLOAD_KEYFILE: 'download-keyfile',
    PRIVACY_AGENT: 'privacy-agent',
    RECOVERY_WORDS: 'recovery-words',
    VALIDATE_WORDS: 'validate-words',
};
