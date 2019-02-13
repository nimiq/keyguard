/* global Constants */
/* global DownloadKeyfile */
/* global FlippableHandler */
/* global ImportApi */
/* global Iqons */
/* global Key */
/* global KeyStore */
/* global LoginFile */
/* global LoginFileIcon */
/* global Nimiq */
/* global PassphraseSetterBox */
/* global RecoveryWords */
/* global TopLevelApi */
/* global Utf8Tools */

class ImportWords extends FlippableHandler {
    /**
     * @param {KeyguardRequest.ImportRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        super();
        this._request = request;
        this._resolve = resolve;
        this._reject = reject;

        /** @type {{entropy: Nimiq.Entropy?, privateKey: Nimiq.PrivateKey?}} */
        this._secret = { entropy: null, privateKey: null };
        /** @type {KeyguardRequest.KeyResult[]} */
        this._keys = [];

        // Pages
        /** @type {HTMLFormElement} */
        this.$words = (document.getElementById(ImportWords.Pages.ENTER_WORDS));
        /** @type {HTMLFormElement} */
        this.$setPassword = (document.getElementById(ImportWords.Pages.SET_PASSWORD));
        /** @type {HTMLFormElement} */
        const $downloadFile = (document.getElementById(ImportWords.Pages.DOWNLOAD_LOGINFILE));

        // Elements
        /** @type {HTMLFormElement} */
        this.$recoveryWords = (this.$words.querySelector('.recovery-words'));
        /** @type {HTMLFormElement} */
        const $passwordSetter = (this.$setPassword.querySelector('.passphrase-setter-box'));
        /** @type {HTMLDivElement} */
        this.$loginFileIcon = (this.$setPassword.querySelector('.login-file-icon'));
        /** @type {HTMLButtonElement} */
        this.$downloadFileButton = ($downloadFile.querySelector('#download-login-file'));
        /** @type {HTMLDivElement} */
        const $file = ($downloadFile.querySelector('.file'));

        // Components
        this._recoveryWords = new RecoveryWords(this.$recoveryWords, true);
        this._passwordSetter = new PassphraseSetterBox($passwordSetter);
        this._loginFileIcon = new LoginFileIcon(this.$loginFileIcon);
        const downloadKeyFile = new DownloadKeyfile($file); // TODO LoginFile

        // Events
        this._recoveryWords.on(RecoveryWords.Events.COMPLETE, (mnemonic, mnemonicType) => {
            if (this._recoveryWords.mnemonic) {
                this._onRecoveryWordsComplete(mnemonic, mnemonicType);
            }
        });
        this._recoveryWords.on(RecoveryWords.Events.INCOMPLETE, () => {
            this._secret = { entropy: null, privateKey: null };
            this._keys = [];
        });
        this._recoveryWords.on(RecoveryWords.Events.INVALID, this._onRecoveryWordsInvalid.bind(this));
        this.$words.addEventListener('submit', event => {
            event.preventDefault();
            if (this._recoveryWords.mnemonic) {
                this._onRecoveryWordsComplete(this._recoveryWords.mnemonic, this._recoveryWords.mnemonicType);
            }
        });
        this.$words.querySelectorAll('input').forEach(
            el => el.addEventListener('focus', this._onRecoveryWordsFocused.bind(this)),
        );

        this._passwordSetter.on(PassphraseSetterBox.Events.ENTERED, () => {
            const color = Iqons.getBackgroundColorIndex(
                new Nimiq.Address(
                    /** @type {KeyguardRequest.KeyResult[]} */(this._keys)[0].addresses[0].address,
                ).toUserFriendlyAddress(),
            );
            const colorString = LoginFile.CONFIG[color].name;
            this._loginFileIcon.lock(`nq-${colorString}-bg`);
        });
        this._passwordSetter.on(PassphraseSetterBox.Events.SUBMIT, async password => {
            const keys = await this._storeKeys(password);
            // downloadKeyFile.setSecret(  , true); // TODO set encoded secret here.
            downloadKeyFile.on(DownloadKeyfile.Events.DOWNLOADED, () => {
                this._resolve(keys);
            });
            window.location.hash = ImportWords.Pages.DOWNLOAD_LOGINFILE;
        });
        this._passwordSetter.on(PassphraseSetterBox.Events.NOT_EQUAL, () => this._loginFileIcon.unlock());
        this._passwordSetter.on(PassphraseSetterBox.Events.SKIP, async () => {
            await this._storeKeys();
            this._resolve(this._keys);
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
        this._recoveryWords.setWords(new Array(24));
        window.location.hash = ImportWords.Pages.ENTER_WORDS;
    }

    /**
     *
     * @param {string} [password = '']
     * @returns {Promise<void>}
     */
    async _storeKeys(password = '') {
        TopLevelApi.setLoading(true);
        let encryptionKey = null;
        if (password && password.length > 7) {
            encryptionKey = Utf8Tools.stringToUtf8ByteArray(password);
        }
        try {
            if (this._secret.entropy) {
                const key = new Key(this._secret.entropy, false);
                await KeyStore.instance.put(key, encryptionKey || undefined);
                const secretString = Nimiq.BufferUtils.toBase64(key.secret.serialize());
                sessionStorage.setItem(ImportApi.SESSION_STORAGE_KEY_PREFIX + key.id, secretString);
            }
            if (this._secret.privateKey) {
                const key = new Key(this._secret.privateKey, false);
                await KeyStore.instance.put(key, encryptionKey || undefined);
            }
        } catch (e) {
            console.log(e);
        } finally {
            TopLevelApi.setLoading(false);
        }
    }

    /**
     * Store key and request passphrase
     *
     * @param {Array<string>} mnemonic
     * @param {number | null} mnemonicType
     */
    _onRecoveryWordsComplete(mnemonic, mnemonicType) {
        this._secret = { entropy: null, privateKey: null };
        this._keys = [];

        if (mnemonicType === Nimiq.MnemonicUtils.MnemonicType.BIP39
            || mnemonicType === Nimiq.MnemonicUtils.MnemonicType.UNKNOWN) {
            this._secret.entropy = Nimiq.MnemonicUtils.mnemonicToEntropy(mnemonic);
            const key = new Key(this._secret.entropy, false);
            /** @type {{keyPath: string, address: Uint8Array}[]} */
            const addresses = [];
            this._request.requestedKeyPaths.forEach(keyPath => {
                addresses.push({
                    keyPath,
                    address: key.deriveAddress(keyPath).serialize(),
                });
            });
            this._keys.push({
                keyId: key.id,
                keyType: Nimiq.Secret.Type.ENTROPY,
                addresses,
            });
        }


        if (mnemonicType === Nimiq.MnemonicUtils.MnemonicType.LEGACY
            || mnemonicType === Nimiq.MnemonicUtils.MnemonicType.UNKNOWN) {
            const entropy = Nimiq.MnemonicUtils.legacyMnemonicToEntropy(mnemonic);
            this._secret.privateKey = new Nimiq.PrivateKey(entropy.serialize());
            const key = new Key(this._secret.privateKey, false);
            this._keys.push({
                keyId: key.id,
                keyType: Nimiq.Secret.Type.PRIVATE_KEY,
                addresses: [{
                    keyPath: Constants.LEGACY_DERIVATION_PATH,
                    address: key.deriveAddress('').serialize(),
                }],
            });
        }
        this._passwordSetter.reset();
        this._loginFileIcon.unlock();
        this.fileAvailable = mnemonicType === Nimiq.MnemonicUtils.MnemonicType.BIP39;
        this._loginFileIcon.setFileUnavailable(!this.fileAvailable);
        window.location.hash = ImportWords.Pages.SET_PASSWORD;
        if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
            this._passwordSetter.focus();
        }
    }

    _onRecoveryWordsInvalid() {
        this.$words.classList.add('invalid-words');
    }

    _onRecoveryWordsFocused() {
        this.$words.classList.remove('invalid-words');
    }
}

ImportWords.Pages = {
    ENTER_WORDS: 'recovery-words',
    SET_PASSWORD: 'set-password',
    DOWNLOAD_LOGINFILE: 'download-file',
};
