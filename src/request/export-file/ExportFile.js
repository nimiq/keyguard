/* global Nimiq */
/* global PassphraseBox */
/* global KeyStore */
/* global DownloadKeyfile */
class ExportFile extends Nimiq.Observable {
    /**
     * @param {ExportFileRequest} request
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

        this._create();
    }

    run() {
        window.location.hash = ExportFile.Pages.EXPORT_FILE;
    }

    /**
     * use this if key was set/unset from elsewhere
     * @param {Key | null} key
     * @param {boolean} isProtected
     */
    setKey(key, isProtected) {
        this._key = key;
        /** @type {DownloadKeyfile} */(this._downloadKeyfile).setSecret(new Uint8Array(0), isProtected); // TODO
        /** @type {HTMLElement} */(document.getElementById(ExportFile.Pages.EXPORT_FILE))
            .classList.toggle('state', this._key !== null);
    }

    _create() {
        /** @type {HTMLElement} */
        const $exportFilePage = (
            document.getElementById(ExportFile.Pages.EXPORT_FILE)
                ? document.getElementById(ExportFile.Pages.EXPORT_FILE)
                : this._buildExportFile()
        );

        /** @type {HTMLFormElement} */
        const $downloadKeyFilePassphraseBox = ($exportFilePage.querySelector('.passphrase-box'));
        /** @type {HTMLFormElement} */
        const $downloadKeyFile = ($exportFilePage.querySelector('.download-key-file'));
        /** @type {HTMLButtonElement} */
        const $downloadFileButton = ($exportFilePage.querySelector('button:not(.submit'));

        this._downloadKeyFilePassphraseBox = new PassphraseBox(
            $downloadKeyFilePassphraseBox,
            { buttonI18nTag: 'passphrasebox-continue' },
        );
        this._downloadKeyfile = new DownloadKeyfile($downloadKeyFile);

        this._downloadKeyFilePassphraseBox.on(PassphraseBox.Events.CANCEL, this._reject.bind(this));
        $downloadFileButton.addEventListener('click', this._finish.bind(this));
        this._downloadKeyFilePassphraseBox.on(PassphraseBox.Events.SUBMIT, async phrase => {
            try {
                const passphrase = Nimiq.BufferUtils.fromAscii(phrase);
                const key = await KeyStore.instance.get(this._request.keyId, passphrase);
                if (!key) {
                    throw new Error('No key');
                }
                this.setKey(key, passphrase.length > 0);
                this.fire(ExportFile.Events.EXPORT_FILE_KEY_CHANGED, { key, isProtected: passphrase.length > 0 });
            } catch (e) {
                console.log(e);
                /** @type {PassphraseBox} */(this._downloadKeyFilePassphraseBox).onPassphraseIncorrect();
            }
        });
    }

    _finish() {
        const result = {
            success: true,
        };
        this._resolve(result);
    }

    _buildExportFile() {
        const $el = document.createElement('div');
        $el.id = 'privacy';
        $el.classList.add('page');
        $el.innerHTML = `
        <div class="page-header">
            <h1 data-i18n="recovery-words-title">Recovery Words</h1>
        </div>

        <div class="page-body">
            <div class="privacy-warning"></div>
            <div class="flex-grow"></div>
        </div>

        <div class="page-footer">
            <form class="passphrase-box"></form>
        </div>
        `;
        /** @type {HTMLElement} */
        const $app = (document.getElementById('app'));
        $app.insertBefore($el, $app.firstChild);
        return $el;
    }
}

ExportFile.Pages = {
    EXPORT_FILE: 'download-key-file',
};

ExportFile.Events = {
    EXPORT_FILE_KEY_CHANGED: 'export_file_key_changed',
};
