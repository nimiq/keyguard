/* global AnimationUtils */
/* global ExportWords */
/* global ExportFile */
/* global KeyStore */
/* global Nimiq */
/* global TopLevelApi */
/* global Constants */
/* global IqonHash */
/* global LoginFileConfig */

/**
 * @callback RemoveKey.resolve
 * @param {KeyguardRequest.SimpleResult} result
 */

class RemoveKey {
    /**
     * @param {Parsed<KeyguardRequest.RemoveKeyRequest>} request
     * @param {RemoveKey.resolve} resolve
     * @param {reject} reject
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
        /** @type {HTMLDivElement} */
        const $loginFileContainer = ($removeKey.querySelector('.login-file-svg-container'));
        /** @type {HTMLButtonElement} */
        const $goToDownloadFile = ($removeKey.querySelector('#show-download-login-file'));
        /** @type {HTMLButtonElement} */
        const $goToShowRecoveryWords = ($removeKey.querySelector('#show-recovery-words'));
        /** @type {HTMLDivElement} */
        const $labelConfirm = ($removeKey.querySelector('#remove-key-label-confirm'));
        /** @type {HTMLSpanElement} */
        const $labelSpan = ($labelConfirm.querySelector('#label'));
        /** @type {HTMLInputElement} */
        this.$labelInput = ($labelConfirm.querySelector('input'));
        /** @type {HTMLButtonElement} */
        const $finalConfirmButton = ($removeKey.querySelector('#remove-key-final-confirm'));

        if (request.keyInfo.type === Nimiq.Secret.Type.PRIVATE_KEY) {
            /** @type {HTMLElement} */
            ($removeKey.querySelector('.option-login-file')).classList.add('display-none');
        } else {
            const color = IqonHash.getBackgroundColorIndex(
                request.keyInfo.defaultAddress.toUserFriendlyAddress(),
            );
            const colorClass = LoginFileConfig[color].className;
            $loginFileContainer.classList.add(colorClass);
        }

        $labelSpan.textContent = this._request.keyLabel;

        // events
        $goToShowRecoveryWords.addEventListener('click', () => this._exportWordsHandler.run());
        $goToDownloadFile.addEventListener('click', () => this._exportFileHandler.run());
        $finalConfirmButton.addEventListener('click', this._finalConfirm.bind(this));
        $labelConfirm.addEventListener('click', () => this.$labelInput.focus());

        this.$labelInput.addEventListener('input', () => {
            if (this.$labelInput.value === this._request.keyLabel) {
                $removeKey.classList.add('show-final-confirm');
            }
        });

        this._exportFileHandler.on(ExportFile.Events.KEY_CHANGED,
            key => this._exportWordsHandler.setKey(key));
        this._exportWordsHandler.on(ExportWords.Events.KEY_CHANGED,
            (key, password) => this._exportFileHandler.setKey(key, password));
    }

    run() {
        window.location.hash = RemoveKey.Pages.REMOVE_KEY;
        if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
            this.$labelInput.focus();
        }
    }

    async _finalConfirm() {
        if (this.$labelInput.value === this._request.keyLabel) {
            TopLevelApi.setLoading(true);
            await KeyStore.instance.remove(this._request.keyInfo.id);

            /** @type {KeyguardRequest.SimpleResult} */
            const result = {
                success: true,
            };
            this._resolve(result);
        } else {
            await AnimationUtils.animate('shake', this.$labelInput);
        }
    }
}

RemoveKey.Pages = {
    REMOVE_KEY: 'remove-key',
};
