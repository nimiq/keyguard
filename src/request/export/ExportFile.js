/* global Nimiq */
/* global PassphraseBox */
/* global KeyStore */
/* global DownloadKeyfile */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */

class ExportFile extends Nimiq.Observable {
    /**
     * if a complete page is missing it will be created.
     * However these pages wil be the default pages which usually don't match the applications requirements.
     * Refer to the corresponsing _build(Privcy | RecoveryWords | ValidateWords) to see the general Structure.
     * @param {ParsedSimpleRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        super();

        this._resolve = resolve;
        this._request = request;
        this._reject = reject;
        /** @type {Key | null} */
        this._key = null;

        /** @type {HTMLElement} */
        const $exportFilePage = document.getElementById(ExportFile.Pages.EXPORT_FILE)
                             || this._buildExportFile();

        /** @type {HTMLFormElement} */
        const $downloadKeyFilePassphraseBox = ($exportFilePage.querySelector('.passphrase-box'));
        /** @type {HTMLFormElement} */
        const $downloadKeyFile = ($exportFilePage.querySelector('.download-key-file'));

        this._downloadKeyFilePassphraseBox = new PassphraseBox(
            $downloadKeyFilePassphraseBox, {
                buttonI18nTag: 'passphrasebox-download',
                hideInput: !this._request.keyInfo.encrypted,
                minLength: this._request.keyInfo.hasPin ? 6 : undefined,
                hideCancel: true,
            },
        );
        this._downloadKeyfile = new DownloadKeyfile($downloadKeyFile);

        this._downloadKeyFilePassphraseBox.on(PassphraseBox.Events.SUBMIT, this._passphraseSubmitted.bind(this));
        this._downloadKeyfile.on(DownloadKeyfile.Events.DOWNLOADED, () => {
            alert('Wallet Files are not yet implemented.');
            this._finish();
        });
    }

    run() {
        this._downloadKeyFilePassphraseBox.reset();
        window.location.hash = ExportFile.Pages.EXPORT_FILE;
        this._downloadKeyFilePassphraseBox.focus();
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
                this._downloadKeyFilePassphraseBox.onPassphraseIncorrect();
                return;
            }
            this._reject(new Errors.CoreError(e.message));
            return;
        }
        if (!key) {
            this._reject(new Errors.KeyNotFoundError());
            return;
        }

        this.setKey(key, this._request.keyInfo.encrypted);
        this.fire(ExportFile.Events.KEY_CHANGED, {
            key,
            isProtected: this._request.keyInfo.encrypted,
        });
        TopLevelApi.setLoading(false);
    }

    /**
     * used to set the key if already decrypted elsewhere. This will disable the passphrase requirement.
     * Set to null to reenable passphrase requirement.
     * @param {Key | null} key
     * @param {boolean} isProtected
     */
    setKey(key, isProtected) {
        this._key = key;
        this._downloadKeyfile.setSecret(new Uint8Array(0), isProtected); // TODO
        /** @type {HTMLElement} */(document.getElementById(ExportFile.Pages.EXPORT_FILE))
            .classList.toggle('show-download', this._key !== null);
    }

    _finish() {
        const result = {
            success: true,
        };
        this._resolve(result);
    }

    _buildExportFile() {
        const $el = document.createElement('div');
        $el.id = ExportFile.Pages.EXPORT_FILE;
        $el.classList.add('page', 'nq-card');
        $el.innerHTML = `
            <div class="page-header nq-card-header">
                <h1 data-i18n="export-file-heading" class="nq-h1">Download Key File</h1>
            </div>

            <div class="page-body nq-card-body">
                <div class="flex-grow"></div>
                <div class="download-icon hide-for-download">
                    <div class="nq-icon walletfile"></div>
                    <div class="nq-icon arrow-down"></div>
                </div>
                <div class="download-key-file"></div>
                <button class="go-to-words hide-for-download nq-button-s" data-i18n="export-button-words">
                    Show Recovery Words
                </button>
                <div class="flex-grow"></div>
            </div>

            <div class="page-footer hide-for-download">
                <form class="passphrase-box"></form>
            </div>
        `;
        /** @type {HTMLElement} */
        const $app = (document.getElementById('app'));
        $app.insertBefore($el, $app.children[1]);
        return $el;
    }
}

ExportFile.Pages = {
    EXPORT_FILE: 'download-key-file',
};

ExportFile.Events = {
    KEY_CHANGED: 'key-changed',
};
