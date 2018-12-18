/* global Constants */
/* global Nimiq */
/* global TopLevelApi */
/* global Key */
/* global RecoveryWords */
/* global Errors */

class ImportWords {
    /**
     * @param {KeyguardRequest.ImportRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._reject = reject;
        this._defaultKeyPath = request.defaultKeyPath;
        /** @type {Nimiq.Entropy?} */
        this._entropy = null;

        // Pages

        /** @type {HTMLFormElement} */
        const $words = (document.getElementById(ImportWords.Pages.ENTER_WORDS));
        /** @type {HTMLFormElement} */
        const $recoveryWords = ($words.querySelector('.recovery-words'));

        // Components
        const recoveryWords = new RecoveryWords($recoveryWords, true);

        // Events

        recoveryWords.on(RecoveryWords.Events.COMPLETE, (m, mt) => {
            console.log(m, mt);
            if (recoveryWords.mnemonic) {
                this._onRecoveryWordsComplete(m, mt);
            }
        });
        recoveryWords.on(RecoveryWords.Events.INCOMPLETE, () => console.log('incomplete'));
        recoveryWords.on(RecoveryWords.Events.INVALID, () => console.log('invalid'));

        $words.addEventListener('submit', event => {
            event.preventDefault();
            if (recoveryWords.mnemonic) {
                this._onRecoveryWordsComplete(recoveryWords.mnemonic, recoveryWords.mnemonicType);
            }
        });

        // @ts-ignore (Property 'test' does not exist on type 'Window'.)
        window.test = () => {
            const testPassphrase = [
                'curtain', 'cancel', 'tackle', 'always',
                'draft', 'fade', 'alarm', 'flip',
                'earth', 'sketch', 'motor', 'short',
                'make', 'exact', 'diary', 'broccoli',
                'frost', 'disorder', 'pave', 'wrestle',
                'broken', 'mercy', 'crime', 'dismiss',
            ];
            // @ts-ignore (Parameter 'field', 'word', 'index' implicitly have an 'any' type.)
            function putWord(field, word, index) { // eslint-disable-line require-jsdoc-except/require-jsdoc
                setTimeout(() => {
                    field.value = word;
                    field._onBlur();
                }, index * 50);
            }
            recoveryWords.$fields.forEach((field, index) => {
                putWord(field, testPassphrase[index], index);
            });
        };
    }

    run() {
        this._entropy = null;
        window.location.hash = ImportWords.Pages.ENTER_WORDS;
    }

    /**
     * Store key and request passphrase
     *
     * @param {Array<string>} mnemonic
     * @param {number | null} mnemonicType
     */
    _onRecoveryWordsComplete(mnemonic, mnemonicType) {
        switch (mnemonicType) {
        case Nimiq.MnemonicUtils.MnemonicType.BIP39: {
            const entropy = Nimiq.MnemonicUtils.mnemonicToEntropy(mnemonic);
            this._resolve(entropy);
            break;
        }
        case Nimiq.MnemonicUtils.MnemonicType.LEGACY: {
            const entropy = Nimiq.MnemonicUtils.legacyMnemonicToEntropy(mnemonic);
            const privateKey = new Nimiq.PrivateKey(entropy.serialize());
            this._resolve(privateKey);
            break;
        }
        case Nimiq.MnemonicUtils.MnemonicType.UNKNOWN: {
            // const legacyEntropy = Nimiq.MnemonicUtils.legacyMnemonicToEntropy(mnemonic);
            const entropy = Nimiq.MnemonicUtils.mnemonicToEntropy(mnemonic);
            this._resolve(entropy.serialize(), Key.Type.UNKNOWN);
            break;
        }
        default:
            this._reject(new Errors.KeyguardError('Invalid mnemonic type'));
        }
    }
}

ImportWords.Pages = {
    ENTER_WORDS: 'recovery-words',
    SET_PASSPHRASE: 'set-passphrase',
};
