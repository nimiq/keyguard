/* global ExportWords */
/* global ExportFile */
/* global PassphraseBox */
/* global Nimiq */
/* global KeyStore */
/* global Errors */

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
        this._removeKeyPassphraseBox.reset();
        window.location.hash = RemoveKey.Pages.REMOVE_KEY;
        this._removeKeyPassphraseBox.focus();
    }

    /**
     * @param {string} phrase
     */
    async _passphraseSubmitted(phrase) {
        document.body.classList.add('loading');
        const passphraseBuffer = phrase ? Nimiq.BufferUtils.fromAscii(phrase) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, passphraseBuffer);
        } catch (e) {
            if (e.message === 'Invalid key') {
                document.body.classList.remove('loading');
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
            <h1 data-i18n="remove-key-log-out" class="nq-h1">Log out</h1>
        </div>

        <div class="page-body nq-card-body">
            <div class="row">
                <p data-i18n="remove-key-intro-text" class="nq-text">
                    Logging out means removing your Wallet File from this browser.
                    Make sure you have it stored somewhere, or at least have your Recovery Words accessible.
                </p>
                <div class="nq-icon warning-sign"></div>
            </div>
            <p class="nq-text nq-red" data-i18n="remove-key-intro-text-red">
                If you have neither of them, there’s no chance to regain access to your wallet.
            </p>
            <div class="flex-grow"></div>
            <div class="row hide-for-passphrase">
                <button id="show-download-key-file" data-i18n="remove-key-download-key-file" class="nq-button-s">
                    Download Wallet File
                </button>
                <button id="show-recovery-words" data-i18n="remove-key-show-recovery-words" class="nq-button-s">
                    Show Recovery Words
                </button>
            </div>
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
