/* global Nimiq */
/* global PasswordBox */
/* global PasswordSetterBox */
/* global Key */
/* global KeyStore */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global DownloadLoginFile */
/* global LoginFileIcon */
/* global ProgressIndicator */
/* global IqonHash */
/* global LoginFileConfig */

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
        const $enterPassword = /** @type {HTMLFormElement} */ (
            document.getElementById(ChangePassword.Pages.ENTER_PASSWORD));
        const $setPassword = /** @type {HTMLFormElement} */ (
            document.getElementById(ChangePassword.Pages.SET_PASSWORD));
        const $downloadFile = /** @type {HTMLFormElement} */ (
            document.getElementById(ChangePassword.Pages.DOWNLOAD_FILE));

        // Elements
        const $passwordGetter = /** @type {HTMLFormElement} */ (
            $enterPassword.querySelector('.password-box'));
        const $passwordSetter = /** @type {HTMLFormElement} */ (
            $setPassword.querySelector('.password-setter-box'));
        const $loginFileIcon = /** @type {HTMLDivElement} */ (
            $setPassword.querySelector('.login-file-icon'));
        this.$setPasswordBackButton = /** @type {HTMLLinkElement} */ (
            $setPassword.querySelector('a.page-header-back-button'));
        const $downloadLoginFile = /** @type {HTMLDivElement} */ (
            $downloadFile.querySelector('.download-login-file'));
        this.$skipDownloadButton = /** @type {HTMLLinkElement} */ (
            $downloadFile.querySelector('.skip'));

        // Components
        this._passwordSetter = new PasswordSetterBox($passwordSetter);
        this._loginFileIcon = new LoginFileIcon($loginFileIcon);
        this._downloadLoginFile = new DownloadLoginFile($downloadLoginFile);

        this._passwordGetter = new PasswordBox($passwordGetter, {
            buttonI18nTag: 'passwordbox-confirm',
            minLength: this._request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
            hideInput: !this._request.keyInfo.encrypted,
            showResetPassword: true,
        });

        // Adapt to type of secret
        if (this._request.keyInfo.type === Nimiq.Secret.Type.PRIVATE_KEY) {
            this._loginFileIcon.setFileUnavailable(true);
            /** @type {HTMLDivElement} */
            (document.getElementById('app')).classList.add('legacy-key');
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

        this._passwordGetter.on(PasswordBox.Events.SUBMIT, this._unlock.bind(this));
        this._passwordGetter.on(PasswordBox.Events.RESET_PASSWORD, () => this._reject(new Errors.GoToResetPassword()));
        this._passwordSetter.on(PasswordSetterBox.Events.ENTERED, this._prepare.bind(this));
        this._passwordSetter.on(PasswordSetterBox.Events.SUBMIT, this._commitChangeAndOfferLoginFile.bind(this));
        this._passwordSetter.on(PasswordSetterBox.Events.RESET, this.backToEnterPassword.bind(this));

        this._downloadLoginFile.on(DownloadLoginFile.Events.INITIATED, () => {
            this.$skipDownloadButton.style.display = 'none';
        });
        this._downloadLoginFile.on(DownloadLoginFile.Events.DOWNLOADED, () => {
            this._resolve({ success: true });
        });
        this.$skipDownloadButton.addEventListener('click', e => {
            e.preventDefault();
            this._resolve({ success: true });
        });
    }

    async run() {
        this._passwordGetter.reset();
        window.location.hash = ChangePassword.Pages.ENTER_PASSWORD;
    }

    backToEnterPassword() {
        this._progressIndicator.setStep(2);
        this._passwordSetter.reset();
        this._loginFileIcon.unlock();

        TopLevelApi.focusPasswordBox();
    }

    /**
     * Called when the user enters his old password (or just clicks 'continue') to unlock his account.
     * @param {string} oldPassword
     */
    async _unlock(oldPassword) {
        TopLevelApi.setLoading(true);
        const oldPasswordBytes = oldPassword ? Utf8Tools.stringToUtf8ByteArray(oldPassword) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, oldPasswordBytes);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordGetter.onPasswordIncorrect();
                return;
            }
            this._reject(new Errors.CoreError(error instanceof Error ? error : errorMessage));
            return;
        }
        if (!key) {
            this._reject(new Errors.KeyNotFoundError());
            return;
        }
        this._key = key;
        this._passwordSetter.reset();
        window.location.hash = ChangePassword.Pages.SET_PASSWORD;
        TopLevelApi.setLoading(false);

        TopLevelApi.focusPasswordBox();
    }


    /**
     * Called after new password was entered first time.
     */
    async _prepare() {
        let colorClass = '';
        if (this.key.secret instanceof Nimiq.Entropy) {
            const color = IqonHash.getBackgroundColorIndex(
                this._request.keyInfo.defaultAddress.toUserFriendlyAddress(),
            );
            colorClass = LoginFileConfig[color].className;
        }
        this._loginFileIcon.lock(colorClass);
        this._progressIndicator.setStep(3);
    }

    /**
     * Called after new password was entered second time.
     * @param {string} newPassword
     */
    async _commitChangeAndOfferLoginFile(newPassword) {
        TopLevelApi.setLoading(true);
        const passwordBytes = newPassword ? Utf8Tools.stringToUtf8ByteArray(newPassword) : undefined;

        await KeyStore.instance.put(this.key, passwordBytes);

        if (this.key.secret instanceof Nimiq.PrivateKey || !passwordBytes) {
            // Login File not available for legacy accounts or unencrypted entropies
            this._resolve({ success: true });
            return;
        }

        // Prepare Login File for download
        const encryptedEntropy = await this.key.secret.exportEncrypted(passwordBytes);
        this._downloadLoginFile.setEncryptedEntropy(
            /** @type {Nimiq.SerialBuffer} */(encryptedEntropy),
            this.key.defaultAddress,
            this._request.keyLabel,
        );

        this.$skipDownloadButton.style.display = '';
        window.location.hash = ChangePassword.Pages.DOWNLOAD_FILE;
        TopLevelApi.setLoading(false);
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
