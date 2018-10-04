/* global KeyStore */
/* global Nimiq */
/* global TopLevelApi */
/* global PrivacyWarning */
/* global PassphraseBox */
/* global RecoveryWords */
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
        const $downloadKeyFile = (document.getElementById(RemoveKeyApi.Pages.DOWNLOAD_KEY_FILE));

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
        const $downloadKeyFilePassphraseBox = ($downloadKeyFile.querySelector('.passphrase-box'));
        /** @type {HTMLButtonElement} */
        const $downloadFileButton = ($downloadKeyFile.querySelector('button:not(.submit'));

        // components
        // eslint-disable-next-line
        const privacyWarning = new PrivacyWarning($privacyWarning);
        const recoveryWordsPassphraseBox = new PassphraseBox(
            $privacyWarningPassphraseBox,
            { buttonI18nTag: 'passphrasebox-continue' },
        );
        const recoveryWords = new RecoveryWords($recoveryWords, false);
        const downloadKeyFilePassphraseBox = new PassphraseBox(
            $downloadKeyFilePassphraseBox,
            { buttonI18nTag: 'passphrasebox-continue' },
        );
        const removeKeyPassphraseBox = new PassphraseBox(
            $removeKeyPassphraseBox,
            { buttonI18nTag: 'passphrasebox-continue', bgColor: 'red' },
        );

        // events
        $goToShowRecoveryWords.addEventListener('click', this._goToPrivacyAgent.bind(this));
        $goToDownloadFile.addEventListener('click', this._goToDownloadFile.bind(this));
        $goToRemoveKey.addEventListener('click', () => {
            $goToRemoveKey.classList.add('display-none');
            $removeKeyPassphraseBox.classList.remove('display-none');
        });

        recoveryWordsPassphraseBox.on(PassphraseBox.Events.SUBMIT, async p => {
            try {
                const passphraseBuffer = Nimiq.BufferUtils.fromAscii(p);
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
                recoveryWords.setWords(words);
                window.location.hash = RemoveKeyApi.Pages.SHOW_WORDS;
            } catch (e) {
                recoveryWordsPassphraseBox.onPassphraseIncorrect();
            }
        });
        $recoveryWordsButton.addEventListener('click', this._goToRemoveKey.bind(this));

        downloadKeyFilePassphraseBox.on(PassphraseBox.Events.SUBMIT, async p => {
            try {
                const passphraseBuffer = Nimiq.BufferUtils.fromAscii(p);
                const key = await KeyStore.instance.get(request.keyId, passphraseBuffer);
                if (!key) {
                    throw new Error('No key');
                }
                // TODO Generate file and wait for download completed
                $downloadKeyFilePassphraseBox.classList.add('display-none');
                $downloadFileButton.classList.remove('display-none');
            } catch (e) {
                downloadKeyFilePassphraseBox.onPassphraseIncorrect();
            }
        });
        $downloadFileButton.addEventListener('click', this._goToRemoveKey.bind(this));

        removeKeyPassphraseBox.on(PassphraseBox.Events.SUBMIT, async p => {
            try {
                const passphraseBuffer = Nimiq.BufferUtils.fromAscii(p);
                const key = await KeyStore.instance.get(request.keyId, passphraseBuffer);
                if (!key) {
                    throw new Error('No key');
                }
                if (!this.parsedRequest) throw new Error('No Request');
                await KeyStore.instance.remove(this.parsedRequest.keyId);
                document.body.classList.add('loading');

                /** @type {RemoveKeyResult} */
                const result = {
                    success: true,
                };
                this.resolve(result);
            } catch (e) {
                downloadKeyFilePassphraseBox.onPassphraseIncorrect();
            }
        });
        window.location.hash = 'remove-key';
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
        window.location.hash = RemoveKeyApi.Pages.PRIVACY_AGENT;
    }

    _goToDownloadFile() {
        window.location.hash = RemoveKeyApi.Pages.DOWNLOAD_KEY_FILE;
    }

    _goToRemoveKey() {
        window.location.hash = RemoveKeyApi.Pages.REMOVE_KEY;
    }
}

RemoveKeyApi.Pages = {
    REMOVE_KEY: 'remove-key',
    PRIVACY_AGENT: 'privacy',
    SHOW_WORDS: 'recovery-words',
    DOWNLOAD_KEY_FILE: 'download-key-file',
};
