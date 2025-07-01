/* global AnimationUtils */
/* global ExportWords */
/* global ExportFile */
/* global KeyStore */
/* global I18n */
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

        const $removeKey = /** @type {HTMLElement} */ (document.getElementById(RemoveKey.Pages.REMOVE_KEY));

        // remove key
        const $loginFileContainer = /** @type {HTMLDivElement} */ (
            $removeKey.querySelector('.login-file-svg-container'));
        const $goToDownloadFile = /** @type {HTMLButtonElement} */ (
            $removeKey.querySelector('#show-download-login-file'));
        const $goToShowRecoveryWords = /** @type {HTMLButtonElement} */ (
            $removeKey.querySelector('#show-recovery-words'));
        const $labelConfirm = /** @type {HTMLDivElement} */ (
            $removeKey.querySelector('#remove-key-label-confirm'));
        const $labelConfirmInstructions = /** @type {HTMLDivElement} */ (
            $labelConfirm.querySelector('#remove-key-label-confirm-instructions'));
        this.$labelInput = /** @type {HTMLInputElement} */ ($labelConfirm.querySelector('input'));
        const $finalConfirmButton = /** @type {HTMLButtonElement} */ (
            $removeKey.querySelector('#remove-key-final-confirm'));

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

        const $accountLabel = document.createElement('span');
        $accountLabel.classList.add('account-label');
        $accountLabel.textContent = this._request.keyLabel;
        I18n.translateToHtmlContent(
            $labelConfirmInstructions,
            'remove-key-label-confirm-instructions',
            { accountLabel: $accountLabel },
        );

        // events
        $goToShowRecoveryWords.addEventListener('click', () => this._exportWordsHandler.run());
        $goToDownloadFile.addEventListener('click', () => this._exportFileHandler.run());
        $finalConfirmButton.addEventListener('click', this._finalConfirm.bind(this));
        $labelConfirm.addEventListener('click', () => this.$labelInput.focus());

        this.$labelInput.addEventListener('input', () => {
            if (this.$labelInput.value === this._normalizeLabel(this._request.keyLabel)) {
                $removeKey.classList.add('show-final-confirm');
                $finalConfirmButton.focus();
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
        if (this.$labelInput.value === this._normalizeLabel(this._request.keyLabel)) {
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

    /**
     * @param {string} label
     * @returns {string}
     * @private
     */
    _normalizeLabel(label) {
        // remove potential soft-hyphens in default names
        return label.replace(/\u00ad/g, '');
    }
}

RemoveKey.Pages = {
    REMOVE_KEY: 'remove-key',
};
