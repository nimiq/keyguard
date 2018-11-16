/* global Nimiq */
/* global PassphraseBox */
/* global KeyStore */
/* global DownloadKeyfile */
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

        this._create();
    }

    run() {
        /** @type {PassphraseBox} */ (this._downloadKeyFilePassphraseBox).reset();
        window.location.hash = ExportFile.Pages.EXPORT_FILE;
        /** @type {PassphraseBox} */ (this._downloadKeyFilePassphraseBox).focus();
    }

    /**
     * used to set the key if already decrypted elsewhere. This will disable the passphrase requirement.
     * Set to null to reenable passphrase requirement.
     * @param {Key | null} key
     * @param {boolean} isProtected
     */
    setKey(key, isProtected) {
        this._key = key;
        /** @type {DownloadKeyfile} */(this._downloadKeyfile).setSecret(new Uint8Array(0), isProtected); // TODO
        /** @type {HTMLElement} */(document.getElementById(ExportFile.Pages.EXPORT_FILE))
            .classList.toggle('show-download', this._key !== null);
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

        this._downloadKeyFilePassphraseBox = new PassphraseBox(
            $downloadKeyFilePassphraseBox, {
                buttonI18nTag: 'passphrasebox-download',
                hideInput: !this._request.keyInfo.encrypted,
            },
        );
        this._downloadKeyfile = new DownloadKeyfile($downloadKeyFile);

        this._downloadKeyFilePassphraseBox.on(PassphraseBox.Events.CANCEL, this._reject.bind(this));
        this._downloadKeyFilePassphraseBox.on(PassphraseBox.Events.SUBMIT, async phrase => {
            document.body.classList.add('loading');
            try {
                const passphrase = phrase ? Nimiq.BufferUtils.fromAscii(phrase) : undefined;
                const key = await KeyStore.instance.get(this._request.keyInfo.id, passphrase);
                if (!key) {
                    this._reject(new Error('No key'));
                }
                this.setKey(key, this._request.keyInfo.encrypted);
                this.fire(ExportFile.Events.EXPORT_FILE_KEY_CHANGED, {
                    key,
                    isProtected: this._request.keyInfo.encrypted,
                });
            } catch (e) {
                console.log(e); // TODO: Assume Passphrase was incorrect
                /** @type {PassphraseBox} */(this._downloadKeyFilePassphraseBox).onPassphraseIncorrect();
            } finally {
                document.body.classList.remove('loading');
            }
        });
        this._downloadKeyfile.on(DownloadKeyfile.Events.DOWNLOADED, this._finish.bind(this));
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
                <h1 data-i18n="export-file-heading">Download Key File</h1>
            </div>

            <div class="page-body">
                <div class="flex-grow"></div>
                <div class="download-icon hide-for-download">
                    <svg width="66" height="128" viewBox="0 0 66 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M40.333 25.6665V3.6665L62.333
                            25.6665H40.333ZM65.4647 22.5353L43.4647 0.535333C43.12 0.194333 42.6543 0
                            42.1667 0H1.83333C0.825 0 0 0.821333 0 1.83333V86.1667C0 87.1787 0.825 88
                            1.83333 88H64.1667C65.1787 88 66 87.1787 66 86.1667V23.8333C66 23.3457 65.8057
                            22.88 65.4647 22.5353Z" fill="#B2B2B2"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M33.4813 34.1939C33.232 33.9354
                            32.7667 33.9354 32.5173 34.1939C29.36 37.459 19.5907 40.2056 19.4933 40.2331C19.2013
                            40.3142 19 40.5865 19 40.8973C19 52.6827 20.0147 62.0859 32.768 66.9574C32.844
                            66.9862 32.9227 67 33 67C33.0787 67 33.156 66.9862 33.232 66.9574C45.9853 62.0859
                            47 52.6827 47 40.8973C47 40.5865 46.7987 40.3142 46.5067 40.2331C46.4093 40.2056
                            36.644 37.4604 33.4813 34.1939Z" fill="white"/>
                        <g opacity="0.3">
                            <path d="M43 114.861L34.25 123.345V104H31.75V123.345L23 114.861V118.303L33 128L43
                                118.303V114.861Z" fill="black"/>
                        </g>
                    </svg>
                </div>
                <div class="download-key-file"></div>
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
    EXPORT_FILE_KEY_CHANGED: 'export_file_key_changed',
};
