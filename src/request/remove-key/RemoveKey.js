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
     * @param {ParsedSimpleRequest} request
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
        const $removeKey = (document.getElementById(RemoveKey.Pages.REMOVE_KEY));

        // remove key
        /** @type {HTMLButtonElement} */
        const $goToDownloadFile = ($removeKey.querySelector('#show-download-login-file'));
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
}

RemoveKey.Pages = {
    REMOVE_KEY: 'remove-key',
};
