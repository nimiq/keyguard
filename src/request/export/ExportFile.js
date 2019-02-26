/* global Constants */
/* global Iqons */
/* global LoginFileIcon */
/* global LoginFile */
/* global Nimiq */
/* global PassphraseBox */
/* global PassphraseSetterBox */
/* global ProgressIndicator */
/* global KeyStore */
/* global DownloadLoginFile */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */

class ExportFile extends Nimiq.Observable {
    /**
     * if a complete page is missing it will be created.
     * However these pages wil be the default pages which usually don't match the applications requirements.
     * Refer to the corresponsing _build(Privcy | RecoveryWords | ValidateWords) to see the general Structure.
     * @param {Parsed<KeyguardRequest.SimpleRequest>} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        super();

        this._request = request;
        this._resolve = resolve;
        this._reject = reject;

        /** @type {Key | null} */
        this._key = null;

        /** @type {HTMLElement} */
        const $exportFileIntroPage = (document.getElementById(ExportFile.Pages.LOGIN_FILE_INTRO));
        /** @type {HTMLElement} */
        const $unlockFilePage = (document.getElementById(ExportFile.Pages.LOGIN_FILE_UNLOCK));
        /** @type {HTMLElement} */
        const $setPasswordPage = (document.getElementById(ExportFile.Pages.LOGIN_FILE_SET_PASSWORD));
        /** @type {HTMLElement} */
        const $downloadFilePage = (document.getElementById(ExportFile.Pages.LOGIN_FILE_DOWNLOAD));

        /** @type {HTMLButtonElement} */
        const $fileButton = ($exportFileIntroPage.querySelector('.login-file'));
        const $goToRecoveryWords = ($exportFileIntroPage.querySelector('.go-to-words'));
        /** @type {HTMLDivElement} */
        const $loginFileIcon = ($setPasswordPage.querySelector('.login-file-icon'));
        /** @type {HTMLFormElement} */
        const $passwordBox = ($unlockFilePage.querySelector('.password-box'));
        /** @type {HTMLFormElement} */
        const $passwordSetterBox = ($setPasswordPage.querySelector('.password-setter-box'));
        /** @type {HTMLAnchorElement} */
        const $downloadLoginFile = ($downloadFilePage.querySelector('.download-loginfile'));

        this._passwordBox = new PassphraseBox(
            $passwordBox, {
                buttonI18nTag: 'passphrasebox-download',
                hideInput: !this._request.keyInfo.encrypted,
                minLength: this._request.keyInfo.hasPin ? 6 : undefined,
                hideCancel: true,
            },
        );
        this._passwordSetterBox = new PassphraseSetterBox($passwordSetterBox);
        this._loginFileIcon = new LoginFileIcon($loginFileIcon);
        this._downloadLoginFile = new DownloadLoginFile($downloadLoginFile);

        /* eslint-disable no-new */
        new ProgressIndicator($exportFileIntroPage.querySelector('.progress-indicator'), 3, 1);
        new ProgressIndicator($unlockFilePage.querySelector('.progress-indicator'), 3, 2);
        new ProgressIndicator($setPasswordPage.querySelector('.progress-indicator'), 3, 2);
        new ProgressIndicator($downloadFilePage.querySelector('.progress-indicator'), 3, 3);
        /* eslint-enable no-new */

        if ($goToRecoveryWords) {
            $goToRecoveryWords.addEventListener('click', () => this._resolve({ success: false }));
        }

        $fileButton.addEventListener('click', async () => {
            if (this._request.keyInfo.encrypted) {
                if (this._key && this._password) {
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

        this._passwordBox.on(PassphraseBox.Events.SUBMIT, async password => {
            if (this._key && this._password) {
                await this._passwordSubmitted(this._password);
            } else {
                await this._passwordSubmitted(password);
            }
        });

        this._passwordSetterBox.on(PassphraseSetterBox.Events.ENTERED, async () => {
            $setPasswordPage.classList.add('repeat-password');

            let colorClass = '';
            const color = Iqons.getBackgroundColorIndex(
                this._request.keyInfo.defaultAddress.toUserFriendlyAddress(),
            );
            const colorString = LoginFile.CONFIG[color].name;
            colorClass = `nq-${colorString}-bg`;
            this._loginFileIcon.lock(colorClass);
        });
        this._passwordSetterBox.on(PassphraseSetterBox.Events.NOT_EQUAL, () => {
            $setPasswordPage.classList.remove('repeat-password');
            this._loginFileIcon.unlock();
        });
        this._passwordSetterBox.on(PassphraseSetterBox.Events.SUBMIT, async password => {
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

        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, passwordBuffer);
        } catch (e) {
            if (e.message === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPassphraseIncorrect();
                return;
            }
            this._reject(new Errors.CoreError(e));
            return;
        }
        if (!key) {
            this._reject(new Errors.KeyNotFoundError());
            return;
        }

        this.setKey(key, password);
        this.fire(ExportFile.Events.KEY_CHANGED, key, password);
        await this._goToLoginFileDownload();

        TopLevelApi.setLoading(false);
    }

    /**
     *
     * @param {string} password
     */
    async _setPassword(password) {
        if (!this._key || !this._key.id) {
            // this should never happen
            this._reject(new Errors.KeyguardError('KeyId not set'));
            return;
        }

        const passwordBuffer = password ? Utf8Tools.stringToUtf8ByteArray(password) : undefined;
        await KeyStore.instance.put(this._key, passwordBuffer);

        this._request.keyInfo.encrypted = true;

        this.fire(ExportFile.Events.KEY_CHANGED, this._key, password);
        await this._goToLoginFileDownload();
    }

    async _goToLoginFileDownload() {
        if (this._password && this._key && this._key.secret instanceof Nimiq.Entropy) {
            const passwordBuffer = Utf8Tools.stringToUtf8ByteArray(this._password);
            const encryptedSecret = await this._key.secret.exportEncrypted(passwordBuffer);

            this._downloadLoginFile.setEncryptedEntropy(
                /** @type {Nimiq.SerialBuffer} */ (encryptedSecret),
                this._key.defaultAddress,
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
     * Used to set the key if already decrypted elsewhere. This will disable the password requirement
     * for use cases where the unencrypted key is needed. In case the encrypted key is needed, the password
     * must also be provided to bypass its requirement.
     * Set to null to reenable password requirement.
     * @param {Key?} key
     * @param {string} [password]
     */
    setKey(key, password) {
        this._key = key;
        if (password) {
            this._passwordBox.hideInput(true);
            this._password = password;
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
