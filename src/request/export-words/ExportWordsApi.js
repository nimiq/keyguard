/* global BackupRecoveryWords */
/* global TopLevelApi */
/* global Nimiq */
/* global KeyPrivacy */
/* global KeyStore */
/* global ValidateWords */
class ExportWordsApi extends TopLevelApi {
    constructor() {
        super();

        // Pages
        /** @type {HTMLElement} */
        const $keyPrivacy = (document.getElementById(ExportWordsApi.Pages.ENTER_PASSPHRASE));
        /** @type {HTMLElement} */
        const $recoveryWords = (document.getElementById(ExportWordsApi.Pages.RECOVERY_WORDS));
        /** @type {HTMLElement} */
        const $validateWords = (document.getElementById(ExportWordsApi.Pages.VALIDATE_WORDS));

        // Components
        this._keyPrivacy = new KeyPrivacy($keyPrivacy);
        this._recoveryWords = new BackupRecoveryWords($recoveryWords);
        this._validateWords = new ValidateWords($validateWords);

        /** @type {HTMLDivElement} */
        this.$loading = (document.querySelector('#loading'));
    }

    /**
     * @param {ExportWordsRequest} request
     */
    async onRequest(request) {
        window.location.hash = ExportWordsApi.Pages.ENTER_PASSPHRASE;

        this._keyPrivacy.setFriendlyKey(request.keyId, request.keyLabel);

        // Events
        this._keyPrivacy.on(KeyPrivacy.Events.PASSWORD_SUBMIT, /** @param {string} passphrase */ async passphrase => {
            try {
                const passphraseBuffer = Nimiq.BufferUtils.fromAscii(passphrase);
                const key = await KeyStore.instance.get(request.keyId, passphraseBuffer);
                if (!key) {
                    throw new Error('No key');
                }
                let words = [''];
                switch (key.type) {
                case Nimiq.MnemonicUtils.MnemonicType.LEGACY:
                    words = Nimiq.MnemonicUtils.entropyToLegacyMnemonic(key.secret);
                    break;
                case Nimiq.MnemonicUtils.MnemonicType.BIP39:
                    words = Nimiq.MnemonicUtils.entropyToMnemonic(key.secret);
                    break;
                default:
                    throw new Error('Unknown mnemonic type');
                }
                this._recoveryWords.setWords(words);
                this._validateWords.setWords(words);
                window.location.hash = ExportWordsApi.Pages.RECOVERY_WORDS;
            } catch (e) {
                this._keyPrivacy.onPassphraseIncorrect();
            }
        });

        this._recoveryWords.on(BackupRecoveryWords.Events.CONTINUE, () => {
            window.location.hash = ExportWordsApi.Pages.VALIDATE_WORDS;
        });

        this._validateWords.on(ValidateWords.Events.BACK, () => {
            window.location.hash = ExportWordsApi.Pages.RECOVERY_WORDS;
        });

        this._validateWords.on(ValidateWords.Events.VALIDATED, async () => {
            document.body.classList.add('loading');
            this.resolve(true);
        });

        this._validateWords.on(ValidateWords.Events.SKIPPED, async () => {
            document.body.classList.add('loading');
            this.resolve(true);
        });
    }
}

ExportWordsApi.Pages = {
    ENTER_PASSPHRASE: 'passphrase-privacy-agent',
    RECOVERY_WORDS: 'recovery-words',
    VALIDATE_WORDS: 'validate-words',
};
