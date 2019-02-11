/* global ExportWords */
/* global ExportFile */
/* global KeyStore */
/* global TopLevelApi */

class RemoveKey {
    /**
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
        /** @type {HTMLButtonElement} */
        const $firstConfirmButton = ($removeKey.querySelector('#remove-key-first-confirm'));
        /** @type {HTMLElement} */
        const $checkmark = ($removeKey.querySelector('#checkmark'));

        // events
        $goToShowRecoveryWords.addEventListener('click', () => this._exportWordsHandler.run());
        $goToDownloadFile.addEventListener('click', () => this._exportFileHandler.run());
        $firstConfirmButton.addEventListener('click', () => {
            $checkmark.classList.add('checked');
            window.setTimeout(() => $removeKey.classList.add('show-final-confirm'), 800);
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
