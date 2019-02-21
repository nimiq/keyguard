/* global ExportFile */
/* global ExportWords */

class Export {
    /**
     * If a complete page is missing it will be created.
     * However these pages wil be the default pages which usually don't match the applications requirements.
     * Refer to the corresponsing _buildMoreExportOptions as well as
     * the Build functions of ExportWords and ExportFile to see the general Structure.
     * @param {Parsed<KeyguardRequest.SimpleRequest>} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._request = request;
        this._reject = reject;

        this.exported = {
            words: false,
            file: false,
        };

        this._exportWordsHandler = new ExportWords(request,
            this._wordsExportSuccessful.bind(this),
            this._reject.bind(this));
        this._exportFileHandler = new ExportFile(request,
            this._fileExportSuccessful.bind(this),
            this._reject.bind(this));

        /** @type {HTMLDivElement} */
        const $createBackup = (document.getElementById(Export.Page.CREATE_BACKUP));
        /** @type {HTMLButtonElement} */
        const $createBackupButton = ($createBackup.querySelector('.create-backup'));

        this._exportFileHandler.on(ExportFile.Events.KEY_CHANGED, key => this._exportWordsHandler.setKey(key));
        this._exportWordsHandler.on(ExportWords.Events.KEY_CHANGED, key => this._exportFileHandler.setKey(key));

        $createBackupButton.addEventListener('click', () => this._exportWordsHandler.run());
    }

    run() {
        this._fileExportSuccessful();
    }

    _fileExportSuccessful() {
        this.exported.file = true;
        window.location.hash = Export.Page.CREATE_BACKUP;
    }

    /**
     *
     * @param {{success: boolean}} wordsResult
     */
    _wordsExportSuccessful(wordsResult) {
        this.exported.words = wordsResult.success;
        this._resolve(this.exported);
    }
}
Export.Page = {
    CREATE_BACKUP: 'create-backup',
};
