/* global Nimiq */
/* global Constants */
/* global PassphraseBox */
/* global PassphraseSetterBox */
/* global KeyStore */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global DownloadLoginFile */
/* global LoginFileIcon */
/* global ProgressIndicator */
/* global Iqons */
/* global LoginFile */

class ChangePassword {
    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {Parsed<KeyguardRequest.SimpleRequest>} request
     * @param {(result: KeyguardRequest.SimpleResult) => void} resolve
     * @param {(error: Error) => void} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._request = request;
        this._reject = reject;

        /** @type {Key} */
        // eslint-disable-next-line no-unused-expressions
        this._key;

        // Pages
        /** @type {HTMLFormElement} */
        this.$enterPassword = (document.getElementById(ChangePassword.Pages.ENTER_PASSWORD));
        /** @type {HTMLFormElement} */
        this.$setPassword = (document.getElementById(ChangePassword.Pages.SET_PASSWORD));
        /** @type {HTMLFormElement} */
        const $downloadFile = (document.getElementById(ChangePassword.Pages.DOWNLOAD_FILE));

        // Elements
        /** @type {HTMLFormElement} */
        const $passwordGetter = (this.$enterPassword.querySelector('.password-box'));
        /** @type {HTMLFormElement} */
        const $passwordSetter = (this.$setPassword.querySelector('.password-setter-box'));
        /** @type {HTMLDivElement} */
        const $loginFileIcon = (this.$setPassword.querySelector('.login-file-icon'));
        /** @type {HTMLAnchorElement} */
        const $downloadLoginFile = ($downloadFile.querySelector('.download-login-file'));

        // Components
        this._passwordSetter = new PassphraseSetterBox($passwordSetter, { hideSkip: true });
        this._loginFileIcon = new LoginFileIcon($loginFileIcon);
        const downloadLoginFile = new DownloadLoginFile($downloadLoginFile);

        this._passwordGetter = new PassphraseBox($passwordGetter, {
            buttonI18nTag: 'passphrasebox-continue',
            minLength: this._request.keyInfo.hasPin ? 6 : undefined,
            hideCancel: true,
            hideInput: !this._request.keyInfo.encrypted,
        });

        // Adapt to type of secret
        if (this._request.keyInfo.type === Nimiq.Secret.Type.PRIVATE_KEY) {
            this._loginFileIcon.setFileUnavailable(true);
            /** @type {HTMLDivElement} */ (this.$enterPassword.querySelector('.nq-text')).classList.add('display-none');
            /** @type {HTMLDivElement} */ (this.$setPassword.querySelector('.nq-text')).classList.add('hidden');
        }

        // Progress Indicators
        // eslint-disable-next-line no-new
        new ProgressIndicator(
            document.querySelector(`#${ChangePassword.Pages.ENTER_PASSWORD} .progress-indicator`),
            4,
            1,
        );
        this._progressIndicator = new ProgressIndicator(
            document.querySelector(`#${ChangePassword.Pages.SET_PASSWORD} .progress-indicator`),
            4,
            2,
        );
        // eslint-disable-next-line no-new
        new ProgressIndicator(
            document.querySelector(`#${ChangePassword.Pages.DOWNLOAD_FILE} .progress-indicator`),
            4,
            4,
        );

        // Events

        this._passwordGetter.on(PassphraseBox.Events.SUBMIT, this._unlock.bind(this));

        this._passwordSetter.on(PassphraseSetterBox.Events.ENTERED, () => {
            let colorClass = '';
            if (this._key.secret instanceof Nimiq.Entropy) {
                const color = Iqons.getBackgroundColorIndex(
                    new Nimiq.Address(
                        // use color of first address as loginFile color
                        this._key.deriveAddress(Constants.DEFAULT_DERIVATION_PATH).serialize(),
                    ).toUserFriendlyAddress(),
                );
                const colorString = LoginFile.CONFIG[color].name;
                colorClass = `nq-${colorString}-bg`;
            }
            this._loginFileIcon.lock(colorClass);
            this._progressIndicator.setStep(3);
        });

        this._passwordSetter.on(PassphraseSetterBox.Events.SUBMIT, /** @param {string} password */ async password => {
            const passwordBytes = Utf8Tools.stringToUtf8ByteArray(password);

            await KeyStore.instance.put(this._key, passwordBytes);

            if (this._key.secret instanceof Nimiq.PrivateKey) {
                this._resolve({ success: true });
                return;
            }

            // Prepare Login File for download

            const firstAddress = new Nimiq.Address(
                this._key.deriveAddress(Constants.DEFAULT_DERIVATION_PATH).serialize(),
            );

            const encryptedEntropy = await this._key.secret.exportEncrypted(passwordBytes);

            downloadLoginFile.setEncryptedEntropy(
                /** @type {Nimiq.SerialBuffer} */ (encryptedEntropy),
                firstAddress,
            );

            downloadLoginFile.on(DownloadLoginFile.Events.DOWNLOADED, () => {
                this._resolve({ success: true });
            });
            window.location.hash = ChangePassword.Pages.DOWNLOAD_FILE;
        });
        this._passwordSetter.on(PassphraseSetterBox.Events.NOT_EQUAL, () => this._loginFileIcon.unlock());
    }

    async run() {
        this._passwordGetter.reset();
        window.location.hash = ChangePassword.Pages.ENTER_PASSWORD;
        if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
            this._passwordGetter.focus();
        }
    }

    /**
     * @param {string} password
     */
    async _unlock(password) {
        TopLevelApi.setLoading(true);
        const passwordBytes = password ? Utf8Tools.stringToUtf8ByteArray(password) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, passwordBytes);
        } catch (e) {
            if (e.message === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordGetter.onPassphraseIncorrect();
                return;
            }
            this._reject(new Errors.CoreError(e));
            return;
        }
        if (!key) {
            this._reject(new Errors.KeyNotFoundError());
            return;
        }
        this._key = key;
        this._passwordSetter.reset();
        window.location.hash = ChangePassword.Pages.SET_PASSWORD;
        if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
            this._passwordSetter.focus();
        }
        TopLevelApi.setLoading(false);
    }

    /**
     * @param {string} phrase
     */
    async _finish(phrase) {
        TopLevelApi.setLoading(true);
        if (!this._key) {
            this._reject(new Errors.KeyguardError('Bypassed Password'));
            return;
        }

        // In this request, the user can only set a new password (min length: 8) or leave a key unencrypted.
        // In any case, the key is not encrypted with a 6-digit PIN anymore.
        this._key.hasPin = false;

        const passphrase = phrase ? Utf8Tools.stringToUtf8ByteArray(phrase) : undefined;

        await KeyStore.instance.put(this._key, passphrase);

        const result = {
            success: true,
        };
        this._resolve(result);
    }
}

ChangePassword.Pages = {
    ENTER_PASSWORD: 'enter-password',
    SET_PASSWORD: 'set-password',
    DOWNLOAD_FILE: 'download-file',
};
