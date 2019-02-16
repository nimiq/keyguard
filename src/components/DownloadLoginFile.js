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

        // this.$el.addEventListener('click', this._onDownloadClick.bind(this));

        if (secret && firstAddress) {
            this.setSecret(secret, firstAddress);
        }

        /** @type {SVGElement} */
        this.$longTouchIndicator = (this.$el.querySelector('.long-touch-indicator'));

        this._longTouchStart = 0;
        this._longTouchTimeout = undefined;
        this._blurTimeout = undefined;

        this._onWindowBlur = this._onWindowBlur.bind(this);
        this.$el.addEventListener('mousedown', e => this._onMouseDown(e)); // also gets triggered after touchstart
        this.$el.addEventListener('touchstart', () => this._onTouchStart());
        this.$el.addEventListener('touchend', () => this._onTouchEnd());
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

            <button class="nq-button light-blue">
                <i class="nq-icon download"></i>
                <span data-i18n="download-loginfile-download">Download LoginFile</span>
            </button>
            <span class="nq-label tap-and-hold" data-i18n="download-loginfile-tap-and-hold">Tap and hold image to download</span>
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

    // _onDownloadClick() {
    //     if (this._supportsNativeDownload()) {
    //         this.fire(DownloadLoginFile.Events.DOWNLOADED);
    //     }
    // }

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
        return typeof this.$el.download !== 'undefined';
    }

    /**
     * @param {string} href
     * @param {string} filename
     * @returns {void}
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

    _onTouchStart() {
        if (this._supportsNativeDownload()) return;
        // if no native download is supported, show a hint to download by long tap
        this._showLongTouchIndicator();
        this._longTouchStart = Date.now();
        window.clearTimeout(this._longTouchTimeout);
        this._longTouchTimeout = window.setTimeout(() => this._onLongTouch(), DownloadLoginFile.LONG_TOUCH_DURATION);
    }

    _onTouchEnd() {
        if (this._supportsNativeDownload()) return;
        this._hideLongTouchIndicator();
        window.clearTimeout(this._longTouchTimeout);
        // if (Date.now() - this._longTouchStart > DownloadLoginFile.LONG_TOUCH_DURATION) return;
        // this._onLongTouchCancel();
    }

    _onLongTouch() {
        this._hideLongTouchIndicator();
        this._onDownloadStart();
    }

    _onDownloadStart() {
        // some browsers open a download dialog and blur the window focus, which we use as a hint for a download
        window.addEventListener('blur', this._onWindowBlur);
        // otherwise consider the download as successful after some time
        this._blurTimeout = window.setTimeout(() => this._onDownloadEnd(), 500);
    }

    _onDownloadEnd() {
        this.fire(DownloadLoginFile.Events.DOWNLOADED);
        window.removeEventListener('blur', this._onWindowBlur);
        window.clearTimeout(this._blurTimeout);
    }

    _onWindowBlur() {
        // wait for the window to refocus when the browser download dialog closes
        this._listenOnce('focus', () => this._onDownloadEnd(), window);
        window.clearTimeout(this._blurTimeout);
    }

    _showLongTouchIndicator() {
        this.$longTouchIndicator.style.display = 'block';
        this.$longTouchIndicator.classList.remove('animate');
        window.setTimeout(() => this.$longTouchIndicator.classList.add('animate'));
    }

    _hideLongTouchIndicator() {
        this.$longTouchIndicator.style.display = 'none';
    }

    /**
     * @param {string} eventName
     * @param {Function} callback
     * @param {EventTarget} target
     */
    _listenOnce(eventName, callback, target) {
        /**
         * @param {Event} event
         */
        const listener = event => {
            target.removeEventListener(eventName, listener);
            callback.call(target, event);
        };
        target.addEventListener(eventName, listener, false);
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
