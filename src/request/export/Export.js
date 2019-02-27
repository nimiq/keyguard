/* global ExportFile */
/* global ExportWords */
/* global Nimiq */

class Export { // eslint-disable-line no-unused-vars
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

        this._exportFileHandler.on(ExportFile.Events.KEY_CHANGED,
            (key, password) => this._exportWordsHandler.setKey(key, password));
        this._exportWordsHandler.on(ExportWords.Events.KEY_CHANGED,
            (key, password) => this._exportFileHandler.setKey(key, password));
    }

    run() {
        if (this._request.keyInfo.type === Nimiq.Secret.Type.ENTROPY) {
            this._exportFileHandler.run();
        } else {
            this._exportWordsHandler.run();
        }
    }

    /**
     *
     * @param {{success: boolean}} fileResult
     */
    _fileExportSuccessful(fileResult) {
        this.exported.file = fileResult.success;
        this._exportWordsHandler.run();
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
