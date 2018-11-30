/* global ExportFile */
/* global ExportWords */

class Export {
    /**
     * if a complete page is missing it will be created.
     * However these pages wil be the default pages which usually don't match the applications requirements.
     * Refer to the corresponsing _buildMoreExportOptions as well as
     * the Build functions of ExportWords and ExportFile to see the general Structure.
     * @param {KeyguardRequest.ParsedSimpleRequest} request
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

        this._exportWordsHandler = new ExportWords(request, this._wordsSucceeded.bind(this), this._reject.bind(this));
        this._exportFileHandler = new ExportFile(request, this._fileSucceeded.bind(this), this._reject.bind(this));

        /** @type {HTMLElement} */
        const $moreExportOptionsPage = document.getElementById(Export.Pages.MORE_EXPORT_OPTIONS)
                                    || this._buildMoreExportOptions();
        /** @type {HTMLElement} */
        const $keyfilePage = (document.getElementById('download-key-file'));

        /** @type {HTMLElement} */
        const $finishRequestButton = ($moreExportOptionsPage.querySelector('.finish-request'));
        /** @type {HTMLElement} */
        this.$wordsButton = ($moreExportOptionsPage.querySelector('.go-to-words'));
        /** @type {HTMLElement} */
        this.$fileButton = ($moreExportOptionsPage.querySelector('.go-to-file'));
        /** @type {HTMLElement} */
        const $wordsButtonOnFilePage = ($keyfilePage.querySelector('.go-to-words'));

        $finishRequestButton.addEventListener('click', () => {
            this._resolve({ success: true });
        });
        $wordsButtonOnFilePage.addEventListener('click', () => this._exportWordsHandler.run());
        this.$wordsButton.addEventListener('click', () => this._exportWordsHandler.run());
        this.$fileButton.addEventListener('click', () => this._exportFileHandler.run());

        this._exportFileHandler.on(ExportFile.Events.EXPORT_FILE_KEY_CHANGED,
            e => this._exportWordsHandler.setKey(e.key));
        this._exportWordsHandler.on(ExportWords.Events.EXPORT_WORDS_KEY_CHANGED,
            e => this._exportFileHandler.setKey(e.key, e.isProtected));
    }

    run() {
        this._exportFileHandler.run();
    }

    /**
     *
     * @param { {success:boolean} } result
     */
    _fileSucceeded(result) {
        if (this.exported.words) {
            this._resolve(result);
        } else {
            this.exported.file = result.success;
            this.$fileButton.classList.add('display-none');
            window.location.hash = Export.Pages.MORE_EXPORT_OPTIONS;
        }
    }

    /**
     *
     * @param { {success:boolean} } result
     */
    _wordsSucceeded(result) {
        if (this.exported.file) {
            this._resolve(result);
        } else {
            this.exported.words = result.success;
            this.$wordsButton.classList.add('display-none');
            window.location.hash = Export.Pages.MORE_EXPORT_OPTIONS;
        }
    }

    _buildMoreExportOptions() {
        const $el = document.createElement('div');
        $el.id = Export.Pages.MORE_EXPORT_OPTIONS;
        $el.classList.add('page', 'nq-card');
        $el.innerHTML = `
            <div class="page-header nq-card-header">
                <a tabindex="0" class="page-header-back-button nq-icon arrow-left"></a>
                <h1 data-i18n="export-more-options-heading" class="nq-h1">More export options</h1>
            </div>

            <div class="page-body nq-card-body">
                    <button class="go-to-words nq-button-s" data-i18n="export-button-words">Show Recovery Words</button>
                    <button class="go-to-file nq-button-s" data-i18n="export-button-file">Download Wallet File</button>
            </div>

            <div class="page-footer">
                <button class="finish-request nq-button" data-i18n="export-finish">Finish Export</button>
            </div>
        `;
        /** @type {HTMLElement} */
        const $app = (document.getElementById('app'));
        $app.insertBefore($el, $app.children[1]);
        return $el;
    }
}

Export.Pages = {
    MORE_EXPORT_OPTIONS: 'more-export-options',
};
