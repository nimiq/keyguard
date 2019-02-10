/* global Constants */
/* global KeyStore */
/* global Nimiq */
/* global PassphraseSetterBox */
/* global TopLevelApi */
/* global Utf8Tools */
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

        /** @type {{entropy: Nimiq.Entropy?, privateKey: Nimiq.PrivateKey?}} */
        this._secret = { entropy: null, privateKey: null };

        // Pages
        /** @type {HTMLFormElement} */
        const $words = (document.getElementById(ImportWords.Pages.ENTER_WORDS));
        /** @type {HTMLFormElement} */
        const $setPassword = (document.getElementById(ImportWords.Pages.SET_PASSWORD));

        /** @type {HTMLFormElement} */
        const $recoveryWords = ($words.querySelector('.recovery-words'));
        /** @type {HTMLFormElement} */
        const $passwordSetter = ($setPassword.querySelector('.passphrase-setter-box'));

        // Components
        this._recoveryWords = new RecoveryWords($recoveryWords, true);
        this._passwordSetter = new PassphraseSetterBox($passwordSetter);

        // Events
        this._recoveryWords.on(RecoveryWords.Events.COMPLETE, (mnemonic, mnemonicType) => {
            if (this._recoveryWords.mnemonic) {
                this._onRecoveryWordsComplete(mnemonic, mnemonicType);
            }
        });
        this._recoveryWords.on(RecoveryWords.Events.INCOMPLETE, () => console.log('incomplete')); // todo
        this._recoveryWords.on(RecoveryWords.Events.INVALID, () => console.log('invalid')); // todo
        $words.addEventListener('submit', event => {
            event.preventDefault();
            if (this._recoveryWords.mnemonic) {
                this._onRecoveryWordsComplete(this._recoveryWords.mnemonic, this._recoveryWords.mnemonicType);
            }
        });

        this._passwordSetter.on(PassphraseSetterBox.Events.ENTERED, () => {
            // update visual
        });
        this._passwordSetter.on(PassphraseSetterBox.Events.SUBMIT, async password => {
            const keys = await this._storeKeys(password);
            console.log(keys);
        });
        this._passwordSetter.on(PassphraseSetterBox.Events.NOT_EQUAL, () => {
            // update visual
        });
        this._passwordSetter.on(PassphraseSetterBox.Events.SKIP, async () => {
            const keys = await this._storeKeys();
            console.log(keys);
        });

        window.addEventListener('hashchange', event => {
            const newHash = new URL(event.newURL).hash;
            const oldHash = new URL(event.oldURL).hash;
            if (oldHash && newHash) {
                const oldPageElement = document.querySelector(oldHash);
                const newPageElement = document.querySelector(newHash);
                if (newPageElement && oldPageElement
                    && newPageElement.classList.contains('dark') !== oldPageElement.classList.contains('dark')) {
                    /** @type {HTMLElement} */
                    const $rotationContainer = (document.getElementById('rotation-container'));
                    $rotationContainer.classList.toggle('flipped');
                }
            }
        });

        // TODO remove test words
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
            this._recoveryWords.$fields.forEach((field, index) => {
                putWord(field, testPassphrase[index], index);
            });
        };
    }

    run() {
        this._secret = { entropy: null, privateKey: null };
        this._recoveryWords.setWords(new Array(24));
        window.location.hash = ImportWords.Pages.ENTER_WORDS;
    }

    /**
     *
     * @param {string?} [password='']
     */
    async _storeKeys(password = '') {
        TopLevelApi.setLoading(true);
        let encryptionKey = null;
        if (password && password.length > 7) {
            encryptionKey = Utf8Tools.stringToUtf8ByteArray(password);
        }
        try {
            /** @type {{entropy: Key?, privateKey: Key?}} */
            const keys = { entropy: null, privateKey: null };
            if (this._secret.entropy) {
                const key = new Key(this._secret.entropy.serialize(), Key.Type.BIP39, false);
                await KeyStore.instance.put(key, encryptionKey || undefined);
                keys.entropy = key;
            }
            if (this._secret.privateKey) {
                const key = new Key(this._secret.privateKey.serialize(), Key.Type.LEGACY, false);
                await KeyStore.instance.put(key, encryptionKey || undefined);
                keys.privateKey = key;
            }
            return keys;
        } catch (e) {
            console.log(e);
            TopLevelApi.setLoading(false);
            return null;
        }
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
            this._secret.entropy = Nimiq.MnemonicUtils.mnemonicToEntropy(mnemonic);
            break;
        }
        case Nimiq.MnemonicUtils.MnemonicType.LEGACY: {
            const entropy = Nimiq.MnemonicUtils.legacyMnemonicToEntropy(mnemonic);
            this._secret.privateKey = new Nimiq.PrivateKey(entropy.serialize());
            break;
        }
        case Nimiq.MnemonicUtils.MnemonicType.UNKNOWN: {
            this._secret.entropy = Nimiq.MnemonicUtils.mnemonicToEntropy(mnemonic);
            const entropy = Nimiq.MnemonicUtils.legacyMnemonicToEntropy(mnemonic);
            this._secret.privateKey = new Nimiq.PrivateKey(entropy.serialize());
            break;
        }
        default:
            this._reject(new Errors.KeyguardError('Invalid mnemonic type'));
        }
        this._passwordSetter.reset();
        window.location.hash = ImportWords.Pages.SET_PASSWORD;
        if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
            this._passwordSetter.focus();
        }
    }
}

ImportWords.Pages = {
    ENTER_WORDS: 'recovery-words',
    SET_PASSWORD: 'set-password',
};
