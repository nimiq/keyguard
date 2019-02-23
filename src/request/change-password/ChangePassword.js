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

class ChangePassword {
    /**
     * @param {Parsed<KeyguardRequest.SimpleRequest>} request
     * @param {(result: KeyguardRequest.SimpleResult) => void} resolve
     * @param {(error: Error) => void} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._request = request;
        this._reject = reject;

        /** @type {Key | null} */
        this._key = null;
        this._passphrase = '';

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
        const $passwordSetter = (this.$setPassword.querySelector('.passphrase-setter-box'));
        /** @type {HTMLDivElement} */
        const $loginFileIcon = (this.$setPassword.querySelector('.login-file-icon'));
        /** @type {HTMLAnchorElement} */
        const $downloadLoginFile = ($downloadFile.querySelector('.download-login-file'));

        // Components
        this._passwordSetter = new PassphraseSetterBox($passwordSetter);
        this._loginFileIcon = new LoginFileIcon($loginFileIcon);
        const downloadLoginFile = new DownloadLoginFile($downloadLoginFile);

        this._passwordGetter = new PassphraseBox($passwordGetter, {
            buttonI18nTag: 'passphrasebox-continue',
            minLength: this._request.keyInfo.hasPin ? 6 : undefined,
            hideCancel: true,
        });

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

        // Events

        this._passwordGetter.on(PassphraseBox.Events.SUBMIT, this._passphraseSubmitted.bind(this));
    }

    run() {
        this._passwordGetter.reset();
        window.location.hash = ChangePassword.Pages.ENTER_PASSWORD;
        if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
            this._passwordGetter.focus();
        }
    }

    /**
     * @param {string} phrase
     */
    async _passphraseSubmitted(phrase) {
        TopLevelApi.setLoading(true);
        const passphrase = phrase ? Utf8Tools.stringToUtf8ByteArray(phrase) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, passphrase);
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
