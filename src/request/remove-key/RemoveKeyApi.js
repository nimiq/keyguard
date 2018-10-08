/* global KeyStore */
/* global Nimiq */
/* global TopLevelApi */
/* global PrivacyWarning */
/* global PassphraseBox */
/* global RecoveryWords */
/* global DownloadKeyfile */
class RemoveKeyApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {RemoveKeyRequest} request
     */
    async onRequest(request) {
        /** @type {RemoveKeyRequest} */
        this.parsedRequest = await RemoveKeyApi._parseRequest(request);

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());

        // pages
        /** @type {HTMLElement} */
        const $removeKey = (document.getElementById(RemoveKeyApi.Pages.REMOVE_KEY));
        /** @type {HTMLElement} */
        const $privacy = (document.getElementById(RemoveKeyApi.Pages.PRIVACY_AGENT));
        /** @type {HTMLElement} */
        const $showWords = (document.getElementById(RemoveKeyApi.Pages.SHOW_WORDS));
        /** @type {HTMLElement} */
        this.$downloadKeyFile = (document.getElementById(RemoveKeyApi.Pages.DOWNLOAD_KEY_FILE));

        // remove key
        /** @type {HTMLButtonElement} */
        const $goToDownloadFile = ($removeKey.querySelector('#show-download-key-file'));
        /** @type {HTMLButtonElement} */
        const $goToShowRecoveryWords = ($removeKey.querySelector('#show-recovery-words'));
        /** @type {HTMLButtonElement} */
        const $goToRemoveKey = ($removeKey.querySelector('#remove-key-confirm'));
        /** @type {HTMLFormElement} */
        const $removeKeyPassphraseBox = ($removeKey.querySelector('.passphrase-box'));

        // privacy warning
        /** @type {HTMLElement} */
        const $privacyWarning = ($privacy.querySelector('.privacy-warning'));
        /** @type {HTMLFormElement} */
        const $privacyWarningPassphraseBox = ($privacy.querySelector('.passphrase-box'));

        // recovery words
        /** @type {HTMLElement} */
        const $recoveryWords = ($showWords.querySelector('.recovery-words'));
        /** @type {HTMLButtonElement} */
        const $recoveryWordsButton = ($showWords.querySelector('button'));

        // download key file
        /** @type {HTMLFormElement} */
        const $downloadKeyFilePassphraseBox = (this.$downloadKeyFile.querySelector('.passphrase-box'));
        /** @type {HTMLFormElement} */
        const $downloadKeyFileBox = (this.$downloadKeyFile.querySelector('.download-key-file'));
        /** @type {HTMLButtonElement} */
        const $downloadFileButton = (this.$downloadKeyFile.querySelector('button:not(.submit'));

        // components
        const privacyWarning = new PrivacyWarning($privacyWarning); // eslint-disable-line no-unused-vars
        this._recoveryWordsPassphraseBox = new PassphraseBox(
            $privacyWarningPassphraseBox,
            { buttonI18nTag: 'passphrasebox-continue' },
        );
        this._recoveryWords = new RecoveryWords($recoveryWords, false);
        this._downloadKeyFilePassphraseBox = new PassphraseBox(
            $downloadKeyFilePassphraseBox,
            { buttonI18nTag: 'passphrasebox-continue' },
        );
        this._downloadKeyfile = new DownloadKeyfile($downloadKeyFileBox);
        this._removeKeyPassphraseBox = new PassphraseBox(
            $removeKeyPassphraseBox,
            { buttonI18nTag: 'passphrasebox-log-out', bgColor: 'red' },
        );

        // events
        $goToShowRecoveryWords.addEventListener('click', this._goToPrivacyAgent.bind(this));
        $goToDownloadFile.addEventListener('click', this._goToDownloadFile.bind(this));
        $goToRemoveKey.addEventListener('click', () => {
            $removeKey.classList.toggle('state', true);
            /** @type {PassphraseBox} */ (this._removeKeyPassphraseBox).reset();
            /** @type {PassphraseBox} */ (this._removeKeyPassphraseBox).focus();
        });
        this._removeKeyPassphraseBox.on(PassphraseBox.Events.SUBMIT, async p => {
            if (await this._keyphraseEntered(p, /** @type {PassphraseBox} */ (this._removeKeyPassphraseBox))) {
                if (!this.parsedRequest) throw new Error('No Request');
                await KeyStore.instance.remove(this.parsedRequest.keyId);
                document.body.classList.add('loading');

                /** @type {RemoveKeyResult} */
                const result = {
                    success: true,
                };
                this.resolve(result);
            }
        });
        this._removeKeyPassphraseBox.on(PassphraseBox.Events.CANCEL, () => {
            $removeKey.classList.toggle('state', false);
        });

        this._recoveryWordsPassphraseBox.on(PassphraseBox.Events.SUBMIT, async p => {
            if (await this._keyphraseEntered(p, /** @type {PassphraseBox} */ (this._recoveryWordsPassphraseBox))) {
                window.location.hash = RemoveKeyApi.Pages.SHOW_WORDS;
            }
        });
        this._recoveryWordsPassphraseBox.on(PassphraseBox.Events.CANCEL, () => this._goToRemoveKey());
        $recoveryWordsButton.addEventListener('click', this._goToRemoveKey.bind(this));

        this._downloadKeyFilePassphraseBox.on(PassphraseBox.Events.SUBMIT, async p => {
            if (await this._keyphraseEntered(p, /** @type {PassphraseBox} */ (this._downloadKeyFilePassphraseBox))) {
                /** @type {HTMLElement} */ (this.$downloadKeyFile).classList.toggle('state', true);
            }
        });
        this._downloadKeyFilePassphraseBox.on(PassphraseBox.Events.CANCEL, () => this._goToRemoveKey());
        $downloadFileButton.addEventListener('click', this._goToRemoveKey.bind(this));

        window.location.hash = RemoveKeyApi.Pages.REMOVE_KEY;
    }

    /**
     * @private
     * @param {string} phrase - entered passphrase
     * @param {PassphraseBox} box - box the phrase was entered into
     * @returns {Promise<boolean>}
     */
    async _keyphraseEntered(phrase, box) {
        try {
            const passphraseBuffer = Nimiq.BufferUtils.fromAscii(phrase);
            const key = await KeyStore.instance.get(
                /** @type {RemoveKeyRequest} */ (this.parsedRequest).keyId,
                passphraseBuffer,
            );
            if (!key) {
                throw new Error('No key');
            }
            this._setKey(key, phrase.length > 0); // possibly start timer to reset entered passphrase here.
            return true;
        } catch (e) {
            box.onPassphraseIncorrect();
            return false;
        }
    }

    /**
     * @param {RemoveKeyRequest} request
     * @returns {Promise<RemoveKeyRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        // Check that keyId is given.
        if (typeof request.keyId !== 'string' || !request.keyId) {
            throw new Error('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Error('Unknown keyId');
        }

        // Validate labels.
        if (request.keyLabel !== undefined && (typeof request.keyLabel !== 'string' || request.keyLabel.length > 64)) {
            throw new Error('Invalid label');
        }

        return request;
    }

    _goToPrivacyAgent() {
        if (this._getKey() !== null) {
            window.location.hash = RemoveKeyApi.Pages.SHOW_WORDS;
        } else {
            window.location.hash = RemoveKeyApi.Pages.PRIVACY_AGENT;
            /** @type {PassphraseBox} */ (this._recoveryWordsPassphraseBox).reset();
            /** @type {PassphraseBox} */ (this._recoveryWordsPassphraseBox).focus();
        }
    }

    _goToDownloadFile() {
        window.location.hash = RemoveKeyApi.Pages.DOWNLOAD_KEY_FILE;
        if (this._getKey() !== null) {
            /** @type {HTMLElement} */ (this.$downloadKeyFile).classList.add('state');
        } else {
            /** @type {PassphraseBox} */ (this._downloadKeyFilePassphraseBox).reset();
            /** @type {PassphraseBox} */ (this._downloadKeyFilePassphraseBox).focus();
        }
    }

    _goToRemoveKey() {
        window.location.hash = RemoveKeyApi.Pages.REMOVE_KEY;
        /** @type {PassphraseBox} */ (this._removeKeyPassphraseBox).reset();
        /** @type {PassphraseBox} */ (this._removeKeyPassphraseBox).focus();
    }

    /**
     * @param {Key | null} key
     * @param {boolean} isProtected
     */
    _setKey(key, isProtected) {
        this._key = key;
        /** @type {DownloadKeyfile} */ (this._downloadKeyfile).setSecret(new Uint8Array(0), isProtected); // TODO
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
                throw new Error('Unknown mnemonic type');
            }
        }
        /** @type {RecoveryWords} */(this._recoveryWords).setWords(words);
    }

    /**
     * @returns {Key | null}
     */
    _getKey() {
        return (this._key) ? this._key : null;
    }
}

RemoveKeyApi.Pages = {
    REMOVE_KEY: 'remove-key',
    PRIVACY_AGENT: 'privacy',
    SHOW_WORDS: 'recovery-words',
    DOWNLOAD_KEY_FILE: 'download-key-file',
};
