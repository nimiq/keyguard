/* global ExportWords */
/* global ExportFile */
/* global KeyStore */
/* global TopLevelApi */

class RemoveKey {
    /**
     * if a complete page is missing it will be created.
     * However these pages wil be the default pages which usually don't match the applications requirements.
     * Refer to the corresponsing _buildRemoveKey as well as
     * the Build functions of ExportWords and ExportFile to see the general Structure.
     * @param {KeyguardRequest.ParsedSimpleRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._request = request;
        this._reject = reject;

        // reject cases are actual errors so will be reject cases for the entire request.
        this._exportWordsHandler = new ExportWords(request, this.run.bind(this), this._reject.bind(this));
        this._exportFileHandler = new ExportFile(request, this.run.bind(this), this._reject.bind(this));

        /** @type {HTMLElement} */
        const $removeKey = document.getElementById(RemoveKey.Pages.REMOVE_KEY)
                        || this._buildRemoveKey();

        // remove key
        /** @type {HTMLButtonElement} */
        const $goToDownloadFile = ($removeKey.querySelector('#show-download-key-file'));
        /** @type {HTMLButtonElement} */
        const $goToShowRecoveryWords = ($removeKey.querySelector('#show-recovery-words'));
        /** @type {HTMLButtonElement} */
        const $finalConfirmButton = ($removeKey.querySelector('#remove-key-final-confirm'));
        /** @type {HTMLFormElement} */
        const $firstConfirmButton = ($removeKey.querySelector('#remove-key-first-confirm'));

        // events
        $goToShowRecoveryWords.addEventListener('click', () => this._exportWordsHandler.run());
        $goToDownloadFile.addEventListener('click', () => this._exportFileHandler.run());
        $firstConfirmButton.addEventListener('click', () => {
            $removeKey.classList.toggle('show-final-confirm', true);
        });
        $finalConfirmButton.addEventListener('click', this._finalConfirm.bind(this));

        this._exportFileHandler.on(ExportFile.Events.KEY_CHANGED,
            e => this._exportWordsHandler.setKey(e.key));
        this._exportWordsHandler.on(ExportWords.Events.KEY_CHANGED,
            e => this._exportFileHandler.setKey(e.key, e.isProtected));
    }

    run() {
        window.location.hash = RemoveKey.Pages.REMOVE_KEY;
    }

    async _finalConfirm() {
        TopLevelApi.setLoading(true);
        await KeyStore.instance.remove(this._request.keyInfo.id);

        /** @type {KeyguardRequest.SimpleResult} */
        const result = {
            success: true,
        };
        this._resolve(result);
    }

    _buildRemoveKey() {
        const $el = document.createElement('div');
        $el.id = RemoveKey.Pages.REMOVE_KEY;
        $el.classList.add('page', 'nq-card');
        $el.innerHTML = `
        <div class="page-header nq-card-header">
            <h1 data-i18n="remove-key-log-out" class="nq-h1">Don't lose access</h1>
        </div>

        <div class="page-body nq-card-body">
            <div class="row">
                <p data-i18n="remove-key-intro-text" class="nq-text nq-red">
                    If you log out without saving your account, you will irretrievably lose access to it!
                </p>
            </div>
            <div class="flex-grow"></div>
            <div>
                <button id="show-download-key-file" data-i18n="remove-key-download-key-file" class="nq-button-s">
                    Download Wallet File
                </button>
                <button id="show-recovery-words" data-i18n="remove-key-show-recovery-words" class="nq-button-s">
                    Show Recovery Words
                </button>
            </div>
            <div class="flex-grow"></div>
        </div>

        <div class="page-footer nq-card-footer">
            <button id="remove-key-first-confirm" class="hide-for-final-confirm nq-button red" data-i18n="remove-key-first-confirm">
                I can log in again
            </button>
            <button id="remove-key-final-confirm" class="final-confirm nq-button red" 
                data-i18n="remove-key-final-confirm">
                Log out of your account
            </button>
        </div>
        `;
        /** @type {HTMLElement} */
        const $app = (document.getElementById('app'));
        $app.insertBefore($el, $app.children[1]);
        return $el;
    }
}

RemoveKey.Pages = {
    REMOVE_KEY: 'remove-key',
};
