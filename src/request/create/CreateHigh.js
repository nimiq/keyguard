/* global Nimiq */
/* global RecoveryWords */
/* global ValidateWords */
/* global ChooseIdenticon */
/* global PrivacyAgent */
/* global PassphraseInput */
/* global Key */
/* global KeyStore */

class CreateHigh {
    /**
     * @param {CreateRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._reject = reject;

        // set html elements
        /** @type {HTMLElement} */
        this.$chooseIdenticon = (document.getElementById(CreateHigh.Pages.CHOOSE_IDENTICON));

        /** @type {HTMLElement} */
        this.$downloadKeyfile = (document.getElementById(CreateHigh.Pages.DOWNLOAD_KEYFILE));

        /** @type {HTMLElement} */
        this.$privacyAgent = (document.getElementById(CreateHigh.Pages.PRIVACY_AGENT));

        /** @type {HTMLElement} */
        this.$recoveryWords = (document.getElementById(CreateHigh.Pages.RECOVERY_WORDS));

        /** @type {HTMLElement} */
        this.$validateWords = (document.getElementById(CreateHigh.Pages.VALIDATE_WORDS));

        /** @type {HTMLFormElement} */
        this.$setPassphrase = (document.getElementById(CreateHigh.Pages.SET_PASSPHRASE));



        /** @type {HTMLDivElement} */
        const $passphraseConfirm = (this.$setPassphrase.querySelector('.confirm'));

        // create components
        this._chooseIdenticon = new ChooseIdenticon(this.$chooseIdenticon);
        this._downloadKeyfile = new DownloadKeyfile(this.$downloadKeyfile);
        /** @type {HTMLElement} */
        const $privacyAgentContainer = (this.$privacyAgent.querySelector('.agent'));
        this._privacyAgent = new PrivacyAgent($privacyAgentContainer);
        /** @type {HTMLElement} */
        const $wordsContainerContainer = (this.$recoveryWords.querySelector('.words-container-container'));
        this._recoveryWords = new RecoveryWords($wordsContainerContainer, false);
        this._validateWords = new ValidateWords(this.$validateWords);
        this._setPassphrase = new SetPassphrase(this.$setPassphrase);

        // wire up logic
        this._chooseIdenticon.on(
            ChooseIdenticon.Events.CHOOSE_IDENTICON,
            /** @param {Nimiq.Entropy} entropy */
            entropy => {
                this._selectedEntropy = entropy;
                this._recoveryWords.entropy = entropy;
                this._validateWords.entropy = entropy;
                this._validateWords.reset();
                window.location.hash = CreateHigh.Pages.SET_PASSPHRASE;
            },
        );

        this._setPassphrase.on(SetPassphrase.Events.CHOOSE, /** @param {string} passphrase */ (passphrase) => {
            this._passphrase = passphrase;
            this._setPassphrase.reset();
            window.location.hash = CreateHigh.Pages.DOWNLOAD_KEYFILE;
        });

        this._downloadKeyfile.on(DownloadKeyfile.Events.DOWNLOADED, () => {
            window.location.hash = CreateHigh.Pages.PRIVACY_AGENT;
        });

        this._downloadKeyfile.on(DownloadKeyfile.Events.CONTINUE, () => {
            window.location.hash = CreateHigh.Pages.PRIVACY_AGENT;
        });

        this._privacyAgent.on(PrivacyAgent.Events.CONFIRM, () => {
            window.location.hash = CreateHigh.Pages.RECOVERY_WORDS;
        });

        this._recoveryWords.on(RecoveryWords.Events.CONTINUE, () => {
            window.location.hash = CreateHigh.Pages.VALIDATE_WORDS;
        });

        this._validateWords.on(ValidateWords.Events.BACK, () => {
            window.location.hash = CreateHigh.Pages.RECOVERY_WORDS;
        });

        this._validateWords.on(ValidateWords.Events.VALIDATED, async () => {
            await this.finish(request);
        });

        this._validateWords.on(ValidateWords.Events.SKIPPED, async () => {
            this.finish(request);
        });
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
        window.location.hash = CreateHigh.Pages.CHOOSE_IDENTICON;

        this._chooseIdenticon.generateIdenticons();
    }
}

CreateHigh.Pages = {
    CHOOSE_IDENTICON: 'choose-identicon',
    DOWNLOAD_KEYFILE: 'download-keyfile',
    PRIVACY_AGENT: 'privacy-agent',
    RECOVERY_WORDS: 'recovery-words',
    VALIDATE_WORDS: 'validate-words',
    SET_PASSPHRASE: 'set-passphrase',
};
