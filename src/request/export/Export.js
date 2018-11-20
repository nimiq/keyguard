/* global ExportFile */
/* global ExportWords */

class Export {
    /**
     * if a complete page is missing it will be created.
     * However these pages wil be the default pages which usually don't match the applications requirements.
     * Refer to the corresponsing _build(Privcy | RecoveryWords | ValidateWords) to see the general Structure.
     * @param {ParsedSimpleRequest} request
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

        this._build();
    }

    run() {
        this._exportFileHandler.run();
    }

    /**
     *
     * @param { {success:boolean} } result
     */
    _fileSucceeded(result) {
        if (this.exported.words) this._resolve(result);
        this.exported.file = result.success;
        /** @type {HTMLElement} */(this._fileButton).classList.add('display-none');
        window.location.hash = Export.Pages.MORE_EXPORT_OPTIONS;
    }

    /**
     *
     * @param { {success:boolean} } result
     */
    _wordsSucceeded(result) {
        if (this.exported.file) this._resolve(result);
        this.exported.words = result.success;
        /** @type {HTMLElement} */(this._wordsButton).classList.add('display-none');
        window.location.hash = Export.Pages.MORE_EXPORT_OPTIONS;
    }

    _build() {
        /** @type {HTMLElement} */
        const $moreExportOptionsPage = (
            document.getElementById(Export.Pages.MORE_EXPORT_OPTIONS)
                ? document.getElementById(Export.Pages.MORE_EXPORT_OPTIONS)
                : this._buildMoreExportOptions()
        );
        /** @type {HTMLElement} */
        const $keyfilePage = (document.getElementById('download-key-file'));

        /** @type {HTMLElement} */
        const finishRequestButton = ($moreExportOptionsPage.querySelector('.finish-request'));
        /** @type {HTMLElement} */
        this._wordsButton = ($moreExportOptionsPage.querySelector('.go-to-words'));
        /** @type {HTMLElement} */
        this._fileButton = ($moreExportOptionsPage.querySelector('.go-to-file'));
        /** @type {HTMLElement} */
        const $wordsButton = ($keyfilePage.querySelector('.go-to-words'));

        finishRequestButton.addEventListener('click', () => {
            this._resolve({ success: true });
        });
        $wordsButton.addEventListener('click', () => this._exportWordsHandler.run());
        this._wordsButton.addEventListener('click', () => this._exportWordsHandler.run());
        this._fileButton.addEventListener('click', () => this._exportFileHandler.run());

        this._exportFileHandler.on(ExportFile.Events.EXPORT_FILE_KEY_CHANGED,
            e => this._exportWordsHandler.setKey(e.key));
        this._exportWordsHandler.on(ExportWords.Events.EXPORT_WORDS_KEY_CHANGED,
            e => this._exportFileHandler.setKey(e.key, e.isProtected));
    }

    _buildMoreExportOptions() {
        const $el = document.createElement('div');
        $el.id = Export.Pages.MORE_EXPORT_OPTIONS;
        $el.classList.add('page');
        $el.innerHTML = `
            <div class="page-header">
                <a tabindex="0" class="page-header-back-button icon-back-arrow"></a>
                <h1 data-i18n="create-heading-validate-backup">Validate your backup</h1>
            </div>

            <div class="page-body">
                    <button class="go-to-words" data-i18n="export-button-words">Show Recorvery Words</button>
                    <button class="go-to-file" data-i18n="export-button-file">Download Wallet File</button>
            </div>

            <div class="page-footer">
                <button class="finish-request" data-i18n="continue">Continue</button>
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
