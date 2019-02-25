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

/**
 * @callback ChangePassword.resolve
 * @param {KeyguardRequest.SimpleResult} result
 */

class ChangePassword {
    /**
     * @param {Parsed<KeyguardRequest.SimpleRequest>} request
     * @param {ChangePassword.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        this._resolve = resolve;
        this._reject = reject;

        /** @type {Key?} */
        this._key = null;

        // Pages
        /** @type {HTMLFormElement} */
        const $enterPassword = (document.getElementById(ChangePassword.Pages.ENTER_PASSWORD));
        /** @type {HTMLFormElement} */
        const $setPassword = (document.getElementById(ChangePassword.Pages.SET_PASSWORD));
        /** @type {HTMLFormElement} */
        const $downloadFile = (document.getElementById(ChangePassword.Pages.DOWNLOAD_FILE));

        // Elements
        /** @type {HTMLFormElement} */
        const $passwordGetter = ($enterPassword.querySelector('.password-box'));
        /** @type {HTMLFormElement} */
        const $passwordSetter = ($setPassword.querySelector('.password-setter-box'));
        /** @type {HTMLDivElement} */
        const $loginFileIcon = ($setPassword.querySelector('.login-file-icon'));
        /** @type {HTMLAnchorElement} */
        const $downloadLoginFile = ($downloadFile.querySelector('.download-login-file'));

        // Components
        this._passwordSetter = new PassphraseSetterBox($passwordSetter, { hideSkip: true });
        this._loginFileIcon = new LoginFileIcon($loginFileIcon);
        this._downloadLoginFile = new DownloadLoginFile($downloadLoginFile);

        this._passwordGetter = new PassphraseBox($passwordGetter, {
            buttonI18nTag: 'passphrasebox-continue',
            minLength: this._request.keyInfo.hasPin ? 6 : undefined,
            hideCancel: true,
            hideInput: !this._request.keyInfo.encrypted,
        });

        // Adapt to type of secret
        if (this._request.keyInfo.type === Nimiq.Secret.Type.PRIVATE_KEY) {
            this._loginFileIcon.setFileUnavailable(true);
            /** @type {HTMLDivElement} */ ($enterPassword.querySelector('.nq-text')).classList.add('display-none');
            /** @type {HTMLDivElement} */ ($setPassword.querySelector('.nq-text')).classList.add('hidden');
        }

        // Progress Indicators
        // eslint-disable-next-line no-new
        new ProgressIndicator(
            document.querySelector(`#${ChangePassword.Pages.ENTER_PASSWORD} .progress-indicator`),
            4,
            1,
        );
        // For this one we save the reference and set it to step 3 later
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
        this._passwordSetter.on(PassphraseSetterBox.Events.ENTERED, this._prepare.bind(this));
        this._passwordSetter.on( PassphraseSetterBox.Events.SUBMIT, this._finish.bind(this));
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
     * @param {string} oldPassword
     */
    async _unlock(oldPassword) {
        TopLevelApi.setLoading(true);
        const oldPasswordBytes = oldPassword ? Utf8Tools.stringToUtf8ByteArray(oldPassword) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, oldPasswordBytes);
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

    async _prepare() {
        let colorClass = '';
        if (this.key.secret instanceof Nimiq.Entropy) {
            const color = Iqons.getBackgroundColorIndex(
                new Nimiq.Address(
                    // use color of first address as loginFile color
                    this.key.deriveAddress(Constants.DEFAULT_DERIVATION_PATH).serialize(),
                ).toUserFriendlyAddress(),
            );
            const colorString = LoginFile.CONFIG[color].name;
            colorClass = `nq-${colorString}-bg`;
        }
        this._loginFileIcon.lock(colorClass);
        this._progressIndicator.setStep(3);
    }

    /**
     * @param {string} newPassword
     */
    async _finish(newPassword) {
        const passwordBytes = Utf8Tools.stringToUtf8ByteArray(newPassword);

            await KeyStore.instance.put(this.key, passwordBytes);

            if (this.key.secret instanceof Nimiq.PrivateKey) {
                this._resolve({ success: true });
                return;
            }

            // Prepare Login File for download

            const firstAddress = new Nimiq.Address(
                this.key.deriveAddress(Constants.DEFAULT_DERIVATION_PATH).serialize(),
            );

            const encryptedEntropy = await this.key.secret.exportEncrypted(passwordBytes);

            this._downloadLoginFile.setEncryptedEntropy(
                /** @type {Nimiq.SerialBuffer} */ (encryptedEntropy),
                firstAddress,
            );

            this._downloadLoginFile.on(DownloadLoginFile.Events.DOWNLOADED, () => {
                this._resolve({ success: true });
            });
            window.location.hash = ChangePassword.Pages.DOWNLOAD_FILE;
    }

    /** 
     * @returns {Key}
     */

    get key() {
        if (!this._key) {
            throw new Error('This should never happen.');
        }
        return this._key;
    }
}

ChangePassword.Pages = {
    ENTER_PASSWORD: 'enter-password',
    SET_PASSWORD: 'set-password',
    DOWNLOAD_FILE: 'download-file',
};
