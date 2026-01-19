/* global Observable */
/* global Key */
/* global Nimiq */
/* global NimiqPoW */
/* global RecoveryWords */

class ImportWords extends Observable {
    /**
     * @param {Parsed<KeyguardRequest.ImportRequest | KeyguardRequest.ResetPasswordRequest>} request
     */
    constructor(request) {
        super();

        this._request = request;

        // Pages
        this.$wordsPage = /** @type {HTMLFormElement} */ (document.getElementById(ImportWords.Pages.ENTER_WORDS));

        // Elements
        const $recoveryWords = /** @type {HTMLDivElement} */ (
            this.$wordsPage.querySelector('.recovery-words'));

        // Components
        this._recoveryWords = new RecoveryWords($recoveryWords, true);

        // Events
        this._recoveryWords.on(
            RecoveryWords.Events.COMPLETE,
            (mnemonic, mnemonicType) => this._onRecoveryWordsComplete(mnemonic, mnemonicType),
        );
        this._recoveryWords.on(RecoveryWords.Events.INCOMPLETE, () => {
            if (window.location.hash.replace(/^#/, '') !== ImportWords.Pages.ENTER_WORDS) return;
            this.fire(ImportWords.Events.RESET);
        });
        this._recoveryWords.on(RecoveryWords.Events.INVALID, () => this.$wordsPage.classList.add('invalid-words'));
        this.$wordsPage.querySelectorAll('input').forEach(
            el => el.addEventListener('focus',
                () => this.$wordsPage.classList.remove('invalid-words', 'wrong-seed-phrase')),
        );
        this.$wordsPage.addEventListener('submit', event => {
            event.preventDefault();
            if (this._recoveryWords.mnemonic) {
                this._onRecoveryWordsComplete(this._recoveryWords.mnemonic, this._recoveryWords.mnemonicType);
            }
        });
    }

    run() {
        this._recoveryWords.clear();
        this.$wordsPage.classList.remove('invalid-words', 'wrong-seed-phrase');
        window.location.hash = ImportWords.Pages.ENTER_WORDS;
    }

    /**
     * @param {Array<string>} mnemonic
     * @param {number?} mnemonicType
     */
    async _onRecoveryWordsComplete(mnemonic, mnemonicType) {
        // Let the browser render any UI updates, e.g. pasting of words, before doing expensive computations.
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        /** @type {{entropy: Key?, privateKey: Key?}} */
        const keys = { entropy: null, privateKey: null };

        if (mnemonicType === Nimiq.MnemonicUtils.MnemonicType.BIP39
            || mnemonicType === Nimiq.MnemonicUtils.MnemonicType.UNKNOWN) {
            const entropy = Nimiq.MnemonicUtils.mnemonicToEntropy(mnemonic);
            keys.entropy = new Key(entropy);
        }

        if (mnemonicType === Nimiq.MnemonicUtils.MnemonicType.LEGACY
            || mnemonicType === Nimiq.MnemonicUtils.MnemonicType.UNKNOWN) {
            const privateKeyBytes = NimiqPoW.MnemonicUtils.legacyMnemonicToEntropy(mnemonic).serialize();
            const privateKey = new Nimiq.PrivateKey(privateKeyBytes);
            keys.privateKey = new Key(privateKey);
        }

        if ('expectedKeyId' in this._request
            && (!keys.entropy || keys.entropy.id !== this._request.expectedKeyId)
            && (!keys.privateKey || keys.privateKey.id !== this._request.expectedKeyId)) {
            this.$wordsPage.classList.add('wrong-seed-phrase');
            this._recoveryWords.wrongSeedPhrase();
            return;
        }

        this.fire(ImportWords.Events.IMPORT, keys);

        // Imported successfully. Reset view afterward. Delay the change for a small moment, to hopefully perform the
        // change unnoticed in the background, while ImportWords should not be visible anymore.
        await new Promise(resolve => setTimeout(resolve, 500));
        this._recoveryWords.clear();
    }
}

ImportWords.Pages = {
    ENTER_WORDS: 'recovery-words',
};

ImportWords.Events = {
    IMPORT: 'import',
    RESET: 'reset',
};
