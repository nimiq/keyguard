/* global Constants */
/* global IqonHash */
/* global Key */
/* global LoginFileIcon */
/* global LoginFile */
/* global Nimiq */
/* global PasswordBox */
/* global PasswordSetterBox */
/* global ProgressIndicator */
/* global KeyStore */
/* global DownloadLoginFile */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */

/**
 * @callback ExportFile.resolve
 * @param {KeyguardRequest.SimpleResult} result
 */

class ExportFile extends Nimiq.Observable {
    /**
     * if a complete page is missing it will be created.
     * However these pages wil be the default pages which usually don't match the applications requirements.
     * Refer to the corresponsing _build(Privcy | RecoveryWords | ValidateWords) to see the general Structure.
     * @param {Parsed<KeyguardRequest.ExportRequest>} request
     * @param {ExportFile.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        super();

        this._request = request;
        this._resolve = resolve;
        this._reject = reject;

        /** @type {Key?} */
        this._key = null;

        /** @type {HTMLElement} */
        this.$exportFileIntroPage = (document.getElementById(ExportFile.Pages.LOGIN_FILE_INTRO));
        /** @type {HTMLElement} */
        const $unlockFilePage = (document.getElementById(ExportFile.Pages.LOGIN_FILE_UNLOCK));
        /** @type {HTMLElement} */
        const $setPasswordPage = (document.getElementById(ExportFile.Pages.LOGIN_FILE_SET_PASSWORD));
        /** @type {HTMLElement} */
        this.$downloadFilePage = (document.getElementById(ExportFile.Pages.LOGIN_FILE_DOWNLOAD));

        /** @type {HTMLButtonElement} */
        const $fileButton = (this.$exportFileIntroPage.querySelector('.login-file'));
        /** @type {HTMLDivElement} */
        const $loginFileIcon = ($setPasswordPage.querySelector('.login-file-icon'));
        /** @type {HTMLFormElement} */
        const $passwordBox = ($unlockFilePage.querySelector('.password-box'));
        /** @type {HTMLFormElement} */
        const $passwordSetterBox = ($setPasswordPage.querySelector('.password-setter-box'));
        /** @type {HTMLAnchorElement} */
        const $downloadLoginFile = (this.$downloadFilePage.querySelector('.download-loginfile'));

        this._passwordBox = new PasswordBox(
            $passwordBox, {
                buttonI18nTag: 'passwordbox-download',
                hideInput: !this._request.keyInfo.encrypted,
                minLength: this._request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
                hideCancel: true,
            },
        );
        this._passwordSetterBox = new PasswordSetterBox(
            $passwordSetterBox, {
                hideSkip: true,
            },
        );
        this._loginFileIcon = new LoginFileIcon($loginFileIcon);
        this._downloadLoginFile = new DownloadLoginFile($downloadLoginFile);
        this._downloadLoginFile.createDummyFile(this._request.keyInfo.defaultAddress);

        /* eslint-disable no-new */
        new ProgressIndicator(this.$exportFileIntroPage.querySelector('.progress-indicator'), 3, 1);
        new ProgressIndicator($unlockFilePage.querySelector('.progress-indicator'), 3, 2);
        new ProgressIndicator($setPasswordPage.querySelector('.progress-indicator'), 3, 2);
        new ProgressIndicator(this.$downloadFilePage.querySelector('.progress-indicator'), 3, 3);
        /* eslint-enable no-new */

        $fileButton.addEventListener('click', async () => {
            if (this._request.keyInfo.encrypted) {
                if (this._password) {
                    await this._passwordSubmitted(this._password);
                } else {
                    this._passwordBox.reset();
                    window.location.hash = ExportFile.Pages.LOGIN_FILE_UNLOCK;
                    if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
                        this._passwordBox.focus();
                    }
                }
            } else {
                this._passwordSetterBox.reset();
                this._loginFileIcon.unlock();
                window.location.hash = ExportFile.Pages.LOGIN_FILE_SET_PASSWORD;
                if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
                    this._passwordSetterBox.focus();
                }
            }
        });

        this._passwordBox.on(PasswordBox.Events.SUBMIT, async password => {
            await this._passwordSubmitted(password);
        });

        this._passwordSetterBox.on(PasswordSetterBox.Events.ENTERED, async () => {
            $setPasswordPage.classList.add('repeat-password');

            let colorClass = '';
            const color = IqonHash.getBackgroundColorIndex(
                this._request.keyInfo.defaultAddress.toUserFriendlyAddress(),
            );
            const colorString = LoginFile.CONFIG[color].name;
            colorClass = `nq-${colorString}-bg`;
            this._loginFileIcon.lock(colorClass);
        });
        this._passwordSetterBox.on(PasswordSetterBox.Events.NOT_EQUAL, () => {
            $setPasswordPage.classList.remove('repeat-password');
            this._loginFileIcon.unlock();
        });
        this._passwordSetterBox.on(PasswordSetterBox.Events.SUBMIT, async password => {
            await this._setPassword(password);
        });
    }

    run() {
        window.location.hash = ExportFile.Pages.LOGIN_FILE_INTRO;
    }

    /**
     * @param {string} password
     */
    async _passwordSubmitted(password) {
        TopLevelApi.setLoading(true);

        const passwordBuffer = password ? Utf8Tools.stringToUtf8ByteArray(password) : undefined;

        let key = this._key;
        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, passwordBuffer);
        } catch (e) {
            if (e.message === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPasswordIncorrect();
                return;
            }
            this._reject(new Errors.CoreError(e));
            return;
        }
        if (!key) {
            this._reject(new Errors.KeyNotFoundError());
            return;
        }

        this.fire(ExportFile.Events.KEY_CHANGED, key, password);
        await this._goToLoginFileDownload(key, password);

        TopLevelApi.setLoading(false);
    }

    /**
     *
     * @param {string} password
     */
    async _setPassword(password) {
        TopLevelApi.setLoading(true);

        let key = this._key;
        if (!key || !key.id) {
            try {
                key = await KeyStore.instance.get(this._request.keyInfo.id);
            } catch (e) {
                if (e.message === 'Invalid key') {
                    TopLevelApi.setLoading(false);
                    this._passwordBox.onPasswordIncorrect();
                    return;
                }
                this._reject(new Errors.CoreError(e));
                return;
            }
        }
        if (!key) {
            this._reject(new Errors.KeyNotFoundError());
            return;
        }

        const passwordBuffer = password ? Utf8Tools.stringToUtf8ByteArray(password) : undefined;
        await KeyStore.instance.put(key, passwordBuffer);

        this._request.keyInfo.encrypted = true;

        this.fire(ExportFile.Events.KEY_CHANGED, this._key, password);
        await this._goToLoginFileDownload(key, password);

        TopLevelApi.setLoading(false);
    }

    /**
     * @param {Key} key
     * @param {string} password
     */
    async _goToLoginFileDownload(key, password) {
        if (password && key && key.secret instanceof Nimiq.Entropy) {
            const passwordBuffer = Utf8Tools.stringToUtf8ByteArray(password);
            const encryptedSecret = await key.secret.exportEncrypted(passwordBuffer);

            this._downloadLoginFile.setEncryptedEntropy(
                /** @type {Nimiq.SerialBuffer} */ (encryptedSecret),
                key.defaultAddress,
            );

            this._downloadLoginFile.on(DownloadLoginFile.Events.DOWNLOADED, () => {
                this._resolve({ success: true });
            });

            window.location.hash = ExportFile.Pages.LOGIN_FILE_DOWNLOAD;
        } else {
            this._reject(new Errors.KeyguardError('Key or password missing'));
        }
    }

    /**
     * Used to set the key and the password if already decrypted elsewhere.
     * It will disable the login-file-unlock page entirely and update the progress-indicator.
     * @param {Key?} key
     * @param {string} [password]
     */
    setKey(key, password) {
        this._key = key;
        this._password = password;
        if (password) {
            /* eslint-disable no-new */
            new ProgressIndicator(this.$exportFileIntroPage.querySelector('.progress-indicator'), 2, 1);
            new ProgressIndicator(this.$downloadFilePage.querySelector('.progress-indicator'), 2, 2);
            /* eslint-enable no-new */
        } else {
            /* eslint-disable no-new */
            new ProgressIndicator(this.$exportFileIntroPage.querySelector('.progress-indicator'), 3, 1);
            new ProgressIndicator(this.$downloadFilePage.querySelector('.progress-indicator'), 3, 3);
            /* eslint-enable no-new */
        }
    }
}

ExportFile.Pages = {
    LOGIN_FILE_INTRO: 'login-file-intro',
    LOGIN_FILE_SET_PASSWORD: 'login-file-set-password',
    LOGIN_FILE_UNLOCK: 'login-file-unlock',
    LOGIN_FILE_DOWNLOAD: 'login-file-download',
};

ExportFile.Events = {
    KEY_CHANGED: 'key-changed',
};
