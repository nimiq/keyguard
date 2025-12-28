/* global ExportFile */
/* global ExportWords */
/* global ExportBackupCodes */
/* global Nimiq */

/**
 * @callback Export.resolve
 * @param {KeyguardRequest.ExportResult} result
 */

class Export {
    /**
     * @param {Parsed<KeyguardRequest.ExportRequest>} request
     * @param {Export.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._request = request;
        this._reject = reject;

        this.exported = {
            wordsExported: false,
            fileExported: false,
            backupCodesExported: false,
        };

        this._exportWordsHandler = new ExportWords(request,
            this._wordsExportSuccessful.bind(this),
            this._reject.bind(this));
        this._exportFileHandler = new ExportFile(request,
            this._fileExportSuccessful.bind(this),
            this._reject.bind(this));
        this._exportBackupCodesHandler = new ExportBackupCodes(request,
            this._backupCodesExportSuccessful.bind(this),
            this._reject.bind(this));

        /** @type {HTMLElement} */
        (document.querySelector(`#${ExportFile.Pages.LOGIN_FILE_INTRO} .page-header-back-button`))
            .classList.add('display-none');

        if ((this._request.wordsOnly || this._request.keyInfo.type === Nimiq.Secret.Type.PRIVATE_KEY)
            && !this._request.keyInfo.useLegacyStore
        ) {
            /** @type {HTMLElement} */
            (document.querySelector(`#${ExportWords.Pages.RECOVERY_WORDS_INTRO} .page-header-back-button`))
                .classList.add('display-none');
        }

        // Note: the Export flow supports exporting the Login File followed by the Recovery Words in a combined flow for
        // historical reasons. This is however not actually used anymore in Nimiq's apps, and also not in third-party
        // apps, as the Hub Export request is only whitelisted for Nimiq domains. Support for this combined flow could
        // thus be removed. The newer export of backup codes is only supported individually anymore.

        this._fileSuccessPage = /** @type {HTMLDivElement} */ (
            document.getElementById(Export.Pages.LOGIN_FILE_SUCCESS));

        const skipWordsButton = /** @type {HTMLLinkElement} */ (
            this._fileSuccessPage.querySelector('.skip'));
        skipWordsButton.addEventListener('click', e => {
            e.preventDefault();
            this._resolve(this.exported);
        });

        const goToWordsButton = /** @type {HTMLButtonElement} */ (
            this._fileSuccessPage.querySelector('.page-footer > button'));
        goToWordsButton.addEventListener('click', () => {
            this._exportWordsHandler.run();
        });

        // For a combined Login File + Recovery Words export, set the key on the other handler, if it has been unlocked.
        this._exportFileHandler.on(ExportFile.Events.KEY_CHANGED,
            key => this._exportWordsHandler.setKey(key));
        this._exportWordsHandler.on(ExportWords.Events.KEY_CHANGED,
            (key, password) => this._exportFileHandler.setKey(key, password));
    }

    run() {
        if (this._request.backupCodesOnly) {
            this._exportBackupCodesHandler.run();
        } else if (this._request.wordsOnly
            // Legacy private keys do not support Login Files. Let them export to Recovery Words by instead.
            || this._request.keyInfo.type === Nimiq.Secret.Type.PRIVATE_KEY) {
            this._exportWordsHandler.run();
        } else {
            // In general, by default, start the flow with the Login File export, potentially to be followed by the
            // Recovery Words export.
            this._exportFileHandler.run();
        }
    }

    /**
     * @param {KeyguardRequest.SimpleResult} fileResult
     */
    _fileExportSuccessful(fileResult) {
        this.exported.fileExported = fileResult.success;
        if (this._request.fileOnly) {
            this._resolve(this.exported);
        } else {
            this._fileSuccessPage.classList.add('display-flex');
            this._fileSuccessPage.offsetHeight; // eslint-disable-line no-unused-expressions
            window.location.hash = Export.Pages.LOGIN_FILE_SUCCESS;
            window.requestAnimationFrame(() => this._fileSuccessPage.classList.remove('display-flex'));
        }
    }

    /**
     * @param {KeyguardRequest.SimpleResult} wordsResult
     */
    _wordsExportSuccessful(wordsResult) {
        this.exported.wordsExported = wordsResult.success;
        this._resolve(this.exported);
    }

    /**
     * @param {KeyguardRequest.SimpleResult} backupCodesResult
     */
    _backupCodesExportSuccessful(backupCodesResult) {
        this.exported.backupCodesExported = backupCodesResult.success;
        this._resolve(this.exported);
    }
}

Export.Pages = {
    LOGIN_FILE_SUCCESS: 'login-file-success',
};
