/* global ExportWords */
/* global ExportFile */
/* global PassphraseBox */
/* global KeyStore */
/* global Errors */
/* global Utf8Tools */
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
        const $goToRemoveKey = ($removeKey.querySelector('#remove-key-confirm'));
        /** @type {HTMLFormElement} */
        const $removeKeyPassphraseBox = ($removeKey.querySelector('.passphrase-box'));

        // events
        $goToShowRecoveryWords.addEventListener('click', () => this._exportWordsHandler.run());
        $goToDownloadFile.addEventListener('click', () => this._exportFileHandler.run());
        $goToRemoveKey.addEventListener('click', () => {
            $removeKey.classList.toggle('show-final-confirmation', true);
        });
        this._finalConfirmation.on(PassphraseBox.Events.SUBMIT, this._passphraseSubmitted.bind(this));
        this._removeKeyPassphraseBox.on(PassphraseBox.Events.SUBMIT, this._passphraseSubmitted.bind(this));
        this._removeKeyPassphraseBox.on(PassphraseBox.Events.CANCEL, () => {
            $removeKey.classList.toggle('show-passphrase-box', false);
        });

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
    /**
     * @param {string} phrase
     */
    async _passphraseSubmitted(phrase) {
        TopLevelApi.setLoading(true);
        const passphraseBuffer = phrase ? Utf8Tools.stringToUtf8ByteArray(phrase) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, passphraseBuffer);
        } catch (e) {
            if (e.message === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._removeKeyPassphraseBox.onPassphraseIncorrect();
                return;
            }
            this._reject(new Errors.CoreError(e.message));
            return;
        }
        if (!key) {
            this._reject(new Errors.KeyNotFoundError());
            return;
        }
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
                    If you log out without saving your wallet, you will irretrievably lose access to it!
                </p>
            </div>
            <div class="flex-grow"></div>
            <div class="row hide-for-passphrase">
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
            <form class="passphrase-box"></form>
            <button id="remove-key-confirm" class="hide-for-passphrase nq-button red" data-i18n="remove-key-confirm">
                Log out of your wallet
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
