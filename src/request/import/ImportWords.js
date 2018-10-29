/* global Nimiq */
/* global Key */
/* global PrivacyAgent */
/* global RecoveryWords */
/* global Identicon */

class ImportWords {
    /**
     * @param {ImportRequest} request
     * @param {Function} resolve
     */
    constructor(request, resolve) {
        this._resolve = resolve;
        this._defaultKeyPath = request.defaultKeyPath;

        // Pages
        /** @type {HTMLElement} */
        const $privacy = (document.getElementById(ImportWords.Pages.PRIVACY_AGENT));
        /** @type {HTMLElement} */
        const $privacyAgent = ($privacy.querySelector('.agent'));

        /** @type {HTMLFormElement} */
        const $words = (document.getElementById(ImportWords.Pages.ENTER_WORDS));
        /** @type {HTMLFormElement} */
        const $recoveryWords = ($words.querySelector('.recovery-words'));
        /** @type {HTMLButtonElement} */
        const $wordsConfirm = ($words.querySelector('button'));

        /** @type {HTMLFormElement} */
        this.$chooseKeyType = (document.getElementById(ImportWords.Pages.CHOOSE_KEY_TYPE));
        /** @type {HTMLInputElement} */
        const $radioLegacy = (this.$chooseKeyType.querySelector('input#key-type-legacy'));
        /** @type {HTMLInputElement} */
        const $radioBip39 = (this.$chooseKeyType.querySelector('input#key-type-bip39'));
        /** @type {HTMLDivElement} */
        const $identiconLegacy = (this.$chooseKeyType.querySelector('.identicon-legacy'));
        /** @type {HTMLDivElement} */
        const $identiconBip39 = (this.$chooseKeyType.querySelector('.identicon-bip39'));
        /** @type {HTMLDivElement} */
        this.$addressLegacy = (this.$chooseKeyType.querySelector('.address-legacy'));
        /** @type {HTMLDivElement} */
        this.$addressBip39 = (this.$chooseKeyType.querySelector('.address-bip39'));
        /** @type {HTMLButtonElement} */
        this.$confirmButton = (this.$chooseKeyType.querySelector('button'));

        // Components
        const privacyAgent = new PrivacyAgent($privacyAgent);
        const recoveryWords = new RecoveryWords($recoveryWords, true);
        this._identiconLegacy = new Identicon(undefined, $identiconLegacy);
        this._identiconBip39 = new Identicon(undefined, $identiconBip39);

        // Events
        privacyAgent.on(PrivacyAgent.Events.CONFIRM, () => {
            window.location.hash = ImportWords.Pages.ENTER_WORDS;
            recoveryWords.focus();
        });

        recoveryWords.on(RecoveryWords.Events.COMPLETE, () => { $wordsConfirm.disabled = false; });
        recoveryWords.on(RecoveryWords.Events.INCOMPLETE, () => { $wordsConfirm.disabled = true; });
        recoveryWords.on(RecoveryWords.Events.INVALID, () => { $wordsConfirm.disabled = true; });
        $wordsConfirm.disabled = true;
        $words.addEventListener('submit', event => {
            event.preventDefault();
            if (recoveryWords.mnemonic) {
                this._onRecoveryWordsComplete(recoveryWords.mnemonic, recoveryWords.mnemonicType);
            }
        });

        $radioBip39.addEventListener('change', this._onChooseKeyTypeChange.bind(this));
        $radioLegacy.addEventListener('change', this._onChooseKeyTypeChange.bind(this));
        this.$chooseKeyType.addEventListener('submit', event => {
            event.preventDefault();
            if (this.keyTypeValue !== null && this._entropy) {
                this._onKeyTypeChosen(/** @type {Key.Type} */ (this.keyTypeValue), this._entropy);
            }
        });

        // @ts-ignore
        window.test = () => {
            const testPassphrase = [
                'curtain', 'cancel', 'tackle', 'always',
                'draft', 'fade', 'alarm', 'flip',
                'earth', 'sketch', 'motor', 'short',
                'make', 'exact', 'diary', 'broccoli',
                'frost', 'disorder', 'pave', 'wrestle',
                'broken', 'mercy', 'crime', 'dismiss',
            ];
            // @ts-ignore
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
        this._key = null;
        this._entropy = null;
        window.location.hash = ImportWords.Pages.PRIVACY_AGENT;
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
            this._key = new Key(entropy.serialize(), Key.Type.BIP39);
            this._resolve(entropy.serialize(), Key.Type.BIP39);
            break;
        }
        case Nimiq.MnemonicUtils.MnemonicType.LEGACY: {
            const entropy = Nimiq.MnemonicUtils.legacyMnemonicToEntropy(mnemonic);
            this._key = new Key(entropy.serialize(), Key.Type.LEGACY);
            this._resolve(entropy.serialize(), Key.Type.LEGACY);
            break;
        }
        case Nimiq.MnemonicUtils.MnemonicType.UNKNOWN: {
            this.entropy = Nimiq.MnemonicUtils.mnemonicToEntropy(mnemonic);
            window.location.hash = ImportWords.Pages.CHOOSE_KEY_TYPE;
            break;
        }
        default:
            throw new Error('Invalid mnemonic type');
        }
    }

    _onChooseKeyTypeChange() {
        this.$confirmButton.disabled = this.keyTypeValue === null;
    }

    /**
     * @param {Key.Type} keyType
     * @param {Nimiq.Entropy} entropy
     * @private
     */
    _onKeyTypeChosen(keyType, entropy) {
        this._key = new Key(entropy.serialize(), keyType);
        this._resolve(entropy.serialize(), keyType);
    }

    _onEntropyChanged() {
        // Reset choice.
        /** @type {HTMLInputElement} */
        const selected = (this.$chooseKeyType.querySelector('input[name="key-type"]:checked'));
        if (selected) {
            selected.checked = false;
        }
        this._onChooseKeyTypeChange();

        if (!this._entropy) {
            return;
        }

        const legacyAddress = Nimiq.PublicKey.derive(new Nimiq.PrivateKey(this._entropy.serialize()))
            .toAddress().toUserFriendlyAddress();
        this._identiconLegacy.address = legacyAddress;
        this.$addressLegacy.textContent = legacyAddress;

        const bip39Address = this._entropy.toExtendedPrivateKey().derivePath(this._defaultKeyPath)
            .toAddress().toUserFriendlyAddress();
        this._identiconBip39.address = bip39Address;
        this.$addressBip39.textContent = bip39Address;
    }

    get keyTypeValue() {
        /** @type {HTMLInputElement} */
        const selected = (this.$chooseKeyType.querySelector('input[name="key-type"]:checked'));
        return selected ? parseInt(selected.value, 10) : null;
    }

    /**
     * @param {Nimiq.Entropy} entropy
     */
    set entropy(entropy) {
        this._entropy = entropy;
        this._onEntropyChanged();
    }
}

ImportWords.Pages = {
    PRIVACY_AGENT: 'privacy',
    ENTER_WORDS: 'recovery-words',
    CHOOSE_KEY_TYPE: 'choose-key-type',
    SET_PASSPHRASE: 'set-passphrase',
};
