/* global Nimiq */
/* global I18n */
/* global LoginFile */
/* global KeyStore */
/* global Errors */
/* global Iqons */

class DownloadLoginFile extends Nimiq.Observable {
    /**
     * @param {HTMLElement} [$el]
     * @param {Uint8Array} [secret]
     * @param {Nimiq.Address} [firstAddress]
     */
    constructor($el, secret, firstAddress) {
        super();

        this.$el = DownloadLoginFile._createElement($el);

        /** @type {LoginFile | null} */
        this._file = null;

        /** @type {HTMLAnchorElement} */
        this.$linkImage = (this.$el.querySelector('.link-image'));
        /** @type {HTMLAnchorElement} */
        this.$linkButton = (this.$el.querySelector('.link-button'));

        /** @type {HTMLImageElement} */
        this.$loginfile = (this.$el.querySelector('.loginfile'));

        this.$linkImage.addEventListener('click', this._onDownloadClick.bind(this));
        this.$linkButton.addEventListener('click', this._onDownloadClick.bind(this));

        if (secret && firstAddress) {
            this.setSecret(secret, firstAddress);
        }
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('download-loginfile');

        $el.innerHTML = `
            <a class="link-image">
                <img class="loginfile" src=""></img>
            </a>
            <a class="link-button">
                <button class="nq-button light-blue">
                    <i class="nq-icon download"></i>
                    <span data-i18n="download-loginfile-download">Download LoginFile</span>
                </button>
            </a>
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @param {Uint8Array} secret
     * @param {Nimiq.Address} firstAddress
     */
    setSecret(secret, firstAddress) {
        if (secret.byteLength !== KeyStore.ENCRYPTED_SECRET_SIZE) {
            throw new Errors.KeyguardError('Can only export encrypted Entropies');
        }

        const color = Iqons.getBackgroundColorIndex(firstAddress.toUserFriendlyAddress());
        this.file = new LoginFile(Nimiq.BufferUtils.toBase64(secret), color);
    }

    /**
     * TODO: Is this method even necessary?
     *
     * @returns {Promise<HTMLImageElement>}
     */
    async getImage() {
        if (!this.file) throw new Errors.KeyguardError('LoginFile is not set, call setSecret() first');

        const img = new Image();
        const promise = new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = reject;
        });
        img.src = await this.file.toDataUrl();
        return promise;
    }

    _onDownloadClick() {
        // TODO: Only fire if supports `download` attribute?
        this.fire(DownloadLoginFile.Events.DOWNLOADED);
    }

    /**
     * @param {string} href
     * @param {string} filename
     * @returns {void}
     */
    _setupDownload(href, filename) {
        if (this._supportsNativeDownload()) {
            this._setupNativeDownload(href, filename);
        } else {
            this._setupFallbackDownload();
        }
    }

    /**
     * Detect if browser supports native `download` attribute
     *
     * @returns {boolean}
     */
    _supportsNativeDownload() {
        return typeof this.$linkImage.download !== 'undefined';
    }

    /**
     * @param {string} href
     * @param {string} filename
     * @returns {void}
     */
    _setupNativeDownload(href, filename) {
        this.$linkImage.href = href;
        this.$linkImage.download = filename;

        this.$linkButton.href = href;
        this.$linkButton.download = filename;

        // TODO Adjust visible UI elements
    }

    _setupFallbackDownload() {
        // Hack to make image downloadable on iOS via long tap.
        this.$linkImage.href = 'javascript:void(0);'; // eslint-disable-line no-script-url

        // TODO Adjust visible UI elements
    }

    get file() {
        return this._file;
    }

    set file(file) {
        this._file = file;

        if (file) {
            file.toDataUrl().then(dataUrl => {
                this.$loginfile.src = dataUrl;
                this._setupDownload(dataUrl, file.filename());
            });
        } else {
            this.$loginfile.src = '';
        }
    }
}

DownloadLoginFile.Events = {
    DOWNLOADED: 'loginfile-downloaded',
};
