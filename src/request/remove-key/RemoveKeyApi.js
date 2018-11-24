/* global KeyStore */
/* global Nimiq */
/* global TopLevelApi */
/* global PrivacyWarning */
/* global PassphraseBox */
/* global RecoveryWords */
/* global DownloadKeyfile */
class RemoveKeyApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.SimpleRequest} request
     */
    async onRequest(request) {
        /** @type {KeyguardRequest.ParsedSimpleRequest} */
        this.parsedRequest = await RemoveKeyApi._parseRequest(request);

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => this.reject(new Error('CANCEL')));

        // pages
        /** @type {HTMLElement} */
        const $removeKey = (document.getElementById(RemoveKeyApi.Pages.REMOVE_KEY));
        /** @type {HTMLElement} */
        this.$privacy = (document.getElementById(RemoveKeyApi.Pages.PRIVACY_AGENT));
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
        const $privacyWarning = (this.$privacy.querySelector('.privacy-warning'));
        /** @type {HTMLFormElement} */
        const $privacyWarningPassphraseBox = (this.$privacy.querySelector('.passphrase-box'));
        /** @type {HTMLButtonElement} */
        const $privacyWarningButton = (this.$privacy.querySelector('button:not(.submit'));

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
            $privacyWarningPassphraseBox, {
                buttonI18nTag: 'passphrasebox-continue',
                bgColor: 'purple',
                hideInput: !this.parsedRequest.keyInfo.encrypted,
                minLength: this.parsedRequest.keyInfo.hasPin ? 6 : undefined,
            },
        );
        this._recoveryWords = new RecoveryWords($recoveryWords, false);
        this._downloadKeyFilePassphraseBox = new PassphraseBox(
            $downloadKeyFilePassphraseBox, {
                buttonI18nTag: 'passphrasebox-download',
                bgColor: 'purple',
                hideInput: !this.parsedRequest.keyInfo.encrypted,
                minLength: this.parsedRequest.keyInfo.hasPin ? 6 : undefined,
            },
        );
        this._downloadKeyfile = new DownloadKeyfile($downloadKeyFileBox);
        this._removeKeyPassphraseBox = new PassphraseBox(
            $removeKeyPassphraseBox, {
                buttonI18nTag: 'passphrasebox-log-out',
                bgColor: 'red',
                hideInput: !this.parsedRequest.keyInfo.encrypted,
                minLength: this.parsedRequest.keyInfo.hasPin ? 6 : undefined,
            },
        );

        // events
        $goToShowRecoveryWords.addEventListener('click', this._goToPrivacyAgent.bind(this));
        $goToDownloadFile.addEventListener('click', this._goToDownloadFile.bind(this));
        $goToRemoveKey.addEventListener('click', () => {
            $removeKey.classList.toggle('show-passphrase-box', true);
            /** @type {PassphraseBox} */ (this._removeKeyPassphraseBox).reset();
            /** @type {PassphraseBox} */ (this._removeKeyPassphraseBox).focus();
        });
        this._removeKeyPassphraseBox.on(PassphraseBox.Events.SUBMIT, async p => {
            if (await this._tryRetrieveAndSetKey(p, /** @type {PassphraseBox} */ (this._removeKeyPassphraseBox))) {
                if (!this.parsedRequest) throw new Error('No Request');
                await KeyStore.instance.remove(this.parsedRequest.keyInfo.id);
                document.body.classList.add('loading');

                /** @type {KeyguardRequest.SimpleResult} */
                const result = {
                    success: true,
                };
                this.resolve(result);
            }
        });
        this._removeKeyPassphraseBox.on(PassphraseBox.Events.CANCEL, () => {
            $removeKey.classList.toggle('show-passphrase-box', false);
        });

        this._recoveryWordsPassphraseBox.on(PassphraseBox.Events.SUBMIT, async p => {
            if (await this._tryRetrieveAndSetKey(p, /** @type {PassphraseBox} */ (this._recoveryWordsPassphraseBox))) {
                window.location.hash = RemoveKeyApi.Pages.SHOW_WORDS;
            }
        });
        this._recoveryWordsPassphraseBox.on(PassphraseBox.Events.CANCEL, () => this._goToRemoveKey());
        $recoveryWordsButton.addEventListener('click', this._goToRemoveKey.bind(this));

        this._downloadKeyFilePassphraseBox.on(PassphraseBox.Events.SUBMIT, async p => {
            if (await this._tryRetrieveAndSetKey(
                p,
                /** @type {PassphraseBox} */ (this._downloadKeyFilePassphraseBox),
            )) {
                /** @type {HTMLElement} */ (this.$downloadKeyFile).classList.toggle('show-download', true);
            }
        });
        this._downloadKeyFilePassphraseBox.on(PassphraseBox.Events.CANCEL, () => this._goToRemoveKey());
        $downloadFileButton.addEventListener('click', this._goToRemoveKey.bind(this));

        $privacyWarningButton.addEventListener('click', () => {
            window.location.hash = RemoveKeyApi.Pages.SHOW_WORDS;
        });
        window.location.hash = RemoveKeyApi.Pages.REMOVE_KEY;
    }

    /**
     * @private
     * @param {string} phrase - entered passphrase
     * @param {PassphraseBox} box - box the phrase was entered into
     * @returns {Promise<boolean>} - success of key retrieval
     */
    async _tryRetrieveAndSetKey(phrase, box) {
        document.body.classList.add('loading');
        try {
            const passphraseBuffer = phrase ? Nimiq.BufferUtils.fromAscii(phrase) : undefined;
            const key = await KeyStore.instance.get(
                /** @type {KeyguardRequest.ParsedSimpleRequest} */ (this.parsedRequest).keyInfo.id,
                passphraseBuffer,
            );
            if (!key) {
                this.reject(new Error('Failed to retrieve key'));
                return false;
            }
            this._setKey(
                key,
                /** @type {KeyguardRequest.ParsedSimpleRequest} */ (this.parsedRequest).keyInfo.encrypted,
            ); // possibly start timer to reset entered passphrase here.
            document.body.classList.remove('loading');
            return true;
        } catch (e) {
            console.log(e);
            document.body.classList.remove('loading');
            box.onPassphraseIncorrect();
            return false;
        }
    }

    /**
     * @param {KeyguardRequest.SimpleRequest} request
     * @returns {Promise<KeyguardRequest.ParsedSimpleRequest>}
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

        return /** @type {ParsedRemoveKeyRequest} */ {
            appName: request.appName,
            keyInfo,
            keyLabel: request.keyLabel,
        };
    }

    _goToPrivacyAgent() {
        if (this._getKey() !== null) {
            /** @type {HTMLElement} */ (this.$privacy).classList.add('hide-passphrase');
            window.location.hash = RemoveKeyApi.Pages.PRIVACY_AGENT;
        } else {
            /** @type {PassphraseBox} */ (this._recoveryWordsPassphraseBox).reset();
            window.location.hash = RemoveKeyApi.Pages.PRIVACY_AGENT;
            /** @type {PassphraseBox} */ (this._recoveryWordsPassphraseBox).focus();
        }
    }

    _goToDownloadFile() {
        if (this._getKey() !== null) {
            /** @type {HTMLElement} */ (this.$downloadKeyFile).classList.add('show-download');
            window.location.hash = RemoveKeyApi.Pages.DOWNLOAD_KEY_FILE;
        } else {
            /** @type {PassphraseBox} */ (this._downloadKeyFilePassphraseBox).reset();
            window.location.hash = RemoveKeyApi.Pages.DOWNLOAD_KEY_FILE;
            /** @type {PassphraseBox} */ (this._downloadKeyFilePassphraseBox).focus();
        }
    }

    _goToRemoveKey() {
        /** @type {PassphraseBox} */ (this._removeKeyPassphraseBox).reset();
        window.location.hash = RemoveKeyApi.Pages.REMOVE_KEY;
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
                this.reject(new Error('Unknown mnemonic type'));
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
