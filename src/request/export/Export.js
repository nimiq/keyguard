/* global ExportFile */
/* global ExportWords */
/* global Nimiq */

/**
 * @callback Export.resolve
 * @param {KeyguardRequest.ExportResult} result
 */

class Export { // eslint-disable-line no-unused-vars
    /**
     * If a complete page is missing it will be created.
     * However these pages wil be the default pages which usually don't match the applications requirements.
     * Refer to the corresponsing _buildMoreExportOptions as well as
     * the Build functions of ExportWords and ExportFile to see the general Structure.
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
        };

        this._exportWordsHandler = new ExportWords(request,
            this._wordsExportSuccessful.bind(this),
            this._reject.bind(this));
        this._exportFileHandler = new ExportFile(request,
            this._fileExportSuccessful.bind(this),
            this._reject.bind(this));

        this._exportFileHandler.on(ExportFile.Events.KEY_CHANGED,
            (key, password) => this._exportWordsHandler.setKey(key, password));
        this._exportWordsHandler.on(ExportWords.Events.KEY_CHANGED,
            (key, password) => this._exportFileHandler.setKey(key, password));
    }

    run() {
        if (this._request.skipFile || this._request.keyInfo.type === Nimiq.Secret.Type.PRIVATE_KEY) {
            this._exportWordsHandler.run();
        } else {
            this._exportFileHandler.run();
        }
    }

    /**
     *
     * @param {KeyguardRequest.SimpleResult} fileResult
     */
    _fileExportSuccessful(fileResult) {
        this.exported.fileExported = fileResult.success;
        this._exportWordsHandler.run();
    }

    /**
     *
     * @param {KeyguardRequest.SimpleResult} wordsResult
     */
    _wordsExportSuccessful(wordsResult) {
        this.exported.wordsExported = wordsResult.success;
        this._resolve(this.exported);
    }
}
