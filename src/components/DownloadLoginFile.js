/* global Nimiq */
/* global I18n */
/* global LoginFile */
/* global KeyStore */
/* global Errors */
/* global Iqons */

class DownloadLoginFile extends Nimiq.Observable {
    /**
     * @param {HTMLAnchorElement} [$el]
     * @param {Uint8Array} [secret]
     * @param {Nimiq.Address} [firstAddress]
     */
    constructor($el, secret, firstAddress) {
        super();

        this.$el = DownloadLoginFile._createElement($el);

        /** @type {LoginFile | null} */
        this._file = null;

        /** @type {HTMLImageElement} */
        this.$loginfile = (this.$el.querySelector('.loginfile'));

        /** @type {HTMLButtonElement} */
        const $continueButton = (this.$el.querySelector('.continue'));

        if (secret && firstAddress) {
            this.setSecret(secret, firstAddress);
        }

        /** @type {SVGElement} */
        this.$longTouchIndicator = (this.$el.querySelector('.long-touch-indicator'));

        this._longTouchTimeout = undefined;
        this._blurTimeout = undefined;

        this._onWindowBlur = this._onWindowBlur.bind(this);
        this._onDownloadEnd = this._onDownloadEnd.bind(this);

        this.$el.addEventListener('mousedown', e => this._onMouseDown(e)); // also gets triggered after touchstart
        this.$loginfile.addEventListener('touchstart', () => this._onTouchStart());
        this.$loginfile.addEventListener('touchend', () => this._onTouchEnd());
        $continueButton.addEventListener('click', this._onDownloadEnd);
    }

    /**
     * @param {?HTMLAnchorElement} [$el]
     * @returns {HTMLAnchorElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('a');
        $el.classList.add('download-loginfile');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <img class="loginfile" src=""></img>

            <svg class="long-touch-indicator" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
                <defs>
                    <clipPath id="hexClip-download-loginfile">
                        <path clip-rule="evenodd" d="M16 4.29h32l16 27.71l-16 27.71h-32l-16 -27.71zM20.62 12.29h22.76l11.38 19.71l-11.38 19.71h-22.76l-11.38 -19.71z"/>
                    </clipPath>
                </defs>
                <path fill-rule="evenodd" d="M16 4.29h32l16 27.71l-16 27.71h-32l-16 -27.71zM20.62 12.29h22.76l11.38 19.71l-11.38 19.71h-22.76l-11.38 -19.71z" fill="white" opacity="0.2"/>
                <g clip-path="url(#hexClip-download-loginfile)">
                    <circle id="circle" cx="32" cy="32" r="16" fill="none" stroke-width="32" stroke-dasharray="100.53 100.53" transform="rotate(-120 32 32)"/>
                </g>
            </svg>

            <button class="nq-button light-blue download-button">
                <i class="nq-icon download"></i>
                <span data-i18n="download-loginfile-download">Download Login File</span>
            </button>
            <span class="nq-label tap-and-hold" data-i18n="download-loginfile-tap-and-hold">Tap and hold image to download</span>
            <button class="nq-button light-blue continue" data-i18n="download-loginfile-continue">Continue</button>
        `;
        /* eslint-enable max-len */

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
     * @param {string} href
     * @param {string} filename
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
        return typeof this.$el.download !== 'undefined';
    }

    /**
     * @param {string} href
     * @param {string} filename
     */
    _setupNativeDownload(href, filename) {
        this.$el.href = href;
        this.$el.download = filename;

        this.$el.classList.remove('fallback-download');
    }

    _setupFallbackDownload() {
        // Hack to make image downloadable on iOS via long tap.
        this.$el.href = 'javascript:void(0);'; // eslint-disable-line no-script-url

        this.$el.classList.add('fallback-download');
    }

    /**
     * @param {MouseEvent} event
     */
    _onMouseDown(event) {
        if (event.button === 0) { // primary button
            if (!this._supportsNativeDownload()) return;
            this._onDownloadStart();
        } else if (event.button === 2) { // secondary button
            window.addEventListener('blur', this._onWindowBlur);
        }
    }

    _onDownloadStart() {
        // some browsers open a download dialog and blur the window focus, which we use as a hint for a download
        window.addEventListener('blur', this._onWindowBlur);
        // otherwise consider the download as successful after some time
        this._blurTimeout = window.setTimeout(this._onDownloadEnd, 500);
    }

    _onDownloadEnd() {
        this.fire(DownloadLoginFile.Events.DOWNLOADED);
        window.removeEventListener('blur', this._onWindowBlur);
        window.removeEventListener('focus', this._onDownloadEnd);
        window.clearTimeout(this._blurTimeout);
    }

    _onWindowBlur() {
        // wait for the window to refocus when the browser download dialog closes
        window.addEventListener('focus', this._onDownloadEnd);
        window.clearTimeout(this._blurTimeout);
    }

    _onTouchStart() {
        if (this._supportsNativeDownload()) return;

        // If no native download is supported, show a hint to download by long tap
        // and restart the animation
        this.$longTouchIndicator.style.display = 'block';
        this.$longTouchIndicator.classList.remove('animate');
        window.setTimeout(() => this.$longTouchIndicator.classList.add('animate'), 0);

        window.clearTimeout(this._longTouchTimeout);
        this._longTouchTimeout = window.setTimeout(
            () => this._onLongTouchComplete(),
            DownloadLoginFile.LONG_TOUCH_DURATION,
        );
    }

    _onTouchEnd() {
        this._hideLongTouchIndicator();
        window.clearTimeout(this._longTouchTimeout);
    }

    _onLongTouchComplete() {
        this._hideLongTouchIndicator();
        this.$el.classList.add('long-touch-downloaded');
    }

    _hideLongTouchIndicator() {
        this.$longTouchIndicator.style.display = 'none';
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

DownloadLoginFile.LONG_TOUCH_DURATION = 800;
