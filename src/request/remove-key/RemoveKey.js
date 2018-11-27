/* global ExportWords */
/* global ExportFile */
/* global PassphraseBox */
/* global Nimiq */
/* global KeyStore */
class RemoveKey {
    /**
     * if a complete page is missing it will be created.
     * However these pages wil be the default pages which usually don't match the applications requirements.
     * Refer to the corresponsing _buildMoreExportOptions as well as
     * the Build functions of ExportWords and Export File to see the general Structure.
     * @param {KeyguardRequest.ParsedSimpleRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._request = request;
        this._reject = reject;

        this._exportWordsHandler = new ExportWords(request, this.run.bind(this), this._reject.bind(this));
        this._exportFileHandler = new ExportFile(request, this.run.bind(this), this._reject.bind(this));

        /** @type {HTMLElement} */
        const $removeKey = (
            document.getElementById(RemoveKey.Pages.REMOVE_KEY)
                ? document.getElementById(RemoveKey.Pages.REMOVE_KEY)
                : this._buildRemoveKey()
        );

        // remove key
        /** @type {HTMLButtonElement} */
        const $goToDownloadFile = ($removeKey.querySelector('#show-download-key-file'));
        /** @type {HTMLButtonElement} */
        const $goToShowRecoveryWords = ($removeKey.querySelector('#show-recovery-words'));
        /** @type {HTMLButtonElement} */
        const $goToRemoveKey = ($removeKey.querySelector('#remove-key-confirm'));
        /** @type {HTMLFormElement} */
        const $removeKeyPassphraseBox = ($removeKey.querySelector('.passphrase-box'));

        // Components
        this._removeKeyPassphraseBox = new PassphraseBox(
            $removeKeyPassphraseBox, {
                buttonI18nTag: 'passphrasebox-log-out',
                bgColor: 'red',
                hideInput: !this._request.keyInfo.encrypted,
                minLength: this._request.keyInfo.hasPin ? 6 : undefined,
            },
        );

        // events
        $goToShowRecoveryWords.addEventListener('click', () => this._exportWordsHandler.run());
        $goToDownloadFile.addEventListener('click', () => this._exportFileHandler.run());
        $goToRemoveKey.addEventListener('click', () => {
            $removeKey.classList.toggle('show-passphrase-box', true);
            this._removeKeyPassphraseBox.reset();
            this._removeKeyPassphraseBox.focus();
        });
        this._removeKeyPassphraseBox.on(PassphraseBox.Events.SUBMIT, async phrase => {
            document.body.classList.add('loading');
            try {
                const passphraseBuffer = phrase ? Nimiq.BufferUtils.fromAscii(phrase) : undefined;
                const key = await KeyStore.instance.get(this._request.keyInfo.id, passphraseBuffer);
                if (!key) {
                    this._reject(new Error('keyId not found'));
                }
                await KeyStore.instance.remove(this._request.keyInfo.id);

                /** @type {KeyguardRequest.SimpleResult} */
                const result = {
                    success: true,
                };
                this._resolve(result);
            } catch (e) {
                console.log(e);
                this._removeKeyPassphraseBox.onPassphraseIncorrect();
            } finally {
                document.body.classList.remove('loading');
            }
        });
        this._removeKeyPassphraseBox.on(PassphraseBox.Events.CANCEL, () => {
            $removeKey.classList.toggle('show-passphrase-box', false);
        });

        this._exportFileHandler.on(ExportFile.Events.EXPORT_FILE_KEY_CHANGED,
            e => this._exportWordsHandler.setKey(e.key));
        this._exportWordsHandler.on(ExportWords.Events.EXPORT_WORDS_KEY_CHANGED,
            e => this._exportFileHandler.setKey(e.key, e.isProtected));
    }

    run() {
        this._removeKeyPassphraseBox.reset();
        window.location.hash = RemoveKey.Pages.REMOVE_KEY;
        this._removeKeyPassphraseBox.focus();
    }

    _buildRemoveKey() {

    }
}

RemoveKey.Pages = {
    REMOVE_KEY: 'remove-key',
};
