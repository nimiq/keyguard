/* global Nimiq */
/* global I18n */
/* global LoginFile */
/* global KeyStore */
/* global Errors */
/* global Iqons */

class DownloadLoginFile extends Nimiq.Observable {
    /**
     * @param {HTMLAnchorElement} [$el]
     * @param {Uint8Array} [encryptedEntropy]
     * @param {Nimiq.Address} [firstAddress]
     */
    constructor($el, encryptedEntropy, firstAddress) {
        super();

        this.$el = DownloadLoginFile._createElement($el);

        /** @type {LoginFile | null} */
        this._file = null;

        /** @type {HTMLImageElement} */
        this.$loginfile = (this.$el.querySelector('.loginfile'));

        /** @type {HTMLButtonElement} */
        const $continueButton = (this.$el.querySelector('.continue'));

        if (encryptedEntropy && firstAddress) {
            this.setEncryptedEntropy(encryptedEntropy, firstAddress);
        }

        /** @type {SVGElement} */
        this.$longTouchIndicator = (this.$el.querySelector('.long-touch-indicator'));

        this.$el.addEventListener('mousedown', e => this._onMouseDown(e));
        this.$loginfile.addEventListener('touchstart', () => this._onTouchStart());
        $continueButton.addEventListener('click', this._onDownloadEnd.bind(this));
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
     * @param {Uint8Array} encryptedEntropy
     * @param {Nimiq.Address} firstAddress
     */
    setEncryptedEntropy(encryptedEntropy, firstAddress) {
        if (encryptedEntropy.byteLength !== KeyStore.ENCRYPTED_SECRET_SIZE) {
            throw new Errors.KeyguardError('Can only export encrypted Entropies');
        }

        const color = Iqons.getBackgroundColorIndex(firstAddress.toUserFriendlyAddress());
        this.file = new LoginFile(Nimiq.BufferUtils.toBase64(encryptedEntropy), color);
    }

    /**
     * @param {string} href
     * @param {string} filename
     */
    _setupDownload(href, filename) {
        if (this._supportsNativeDownload()) {
            // Setup native download
            this.$el.href = href;
            this.$el.download = filename;
        } else {
            // Setup fallback download
            // Hack to make image downloadable on iOS via long tap.
            this.$el.href = 'javascript:void(0);'; // eslint-disable-line no-script-url
            this.$el.classList.add('fallback-download');
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
     * Also gets triggered after touchstart.
     *
     * @param {MouseEvent} event
     */
    _onMouseDown(event) {
        /** @type {HTMLElement} */
        const target = (event.target);
        if (target.matches('.continue')) {
            this._onDownloadEnd();
            return;
        }

        if (event.button === 0) { // primary button
            if (!this._supportsNativeDownload()) return;
            this._onDownloadStart();
        } else if (event.button === 2) { // secondary button
            this._onDownloadStart(true);
        }
    }

    async _onDownloadStart(fromContextMenu = false) {
        // Cancel previous download listeners
        if (this._cancelDownload) {
            this._cancelDownload();
        }
        try {
            // If the window gets blurred from opening a download dialog, consider the download finished when
            // the window get's focused again. If no download dialog opens, consider the download successful
            // after a short delay.
            await new Promise((resolve, reject) => {
                if (!fromContextMenu) {
                    // Add delay timeout if not initiated from context menu.
                    // ("Save as" always opens a dialog.)
                    window.setTimeout(resolve, 500);
                }
                window.addEventListener('blur', resolve, { once: true });
                this._cancelDownload = reject;
            });

            // If window gets blurred, wait for it to get focused again
            if (!document.hasFocus()) {
                this.$el.classList.add('maybe-downloaded');
                return;
            }

            this._onDownloadEnd();
        } catch (e) {
            // do nothing
        } finally {
            this._cancelDownload = null;
        }
    }

    /**
     * @param {MouseEvent} [event]
     */
    _onDownloadEnd(event) {
        if (event) {
            event.stopPropagation();
        }
        this.fire(DownloadLoginFile.Events.DOWNLOADED);
    }

    async _onTouchStart() {
        if (this._supportsNativeDownload()) return;

        // If no native download is supported, show the long-tap-indicator
        // and restart the animation
        this.$longTouchIndicator.style.display = 'block';
        this.$longTouchIndicator.classList.add('animate');

        try {
            await new Promise((resolve, reject) => {
                // Consider the long-touch successfull after LONG_TOUCH_DURATION
                window.setTimeout(resolve, DownloadLoginFile.LONG_TOUCH_DURATION);
                this.$loginfile.addEventListener('touchstart', reject, { once: true }); // Second finger cancels overlay
                this.$loginfile.addEventListener('touchend', reject, { once: true });
            });

            this.$el.classList.add('maybe-downloaded');
        } catch (e) {
            // do nothing
        } finally {
            this.$longTouchIndicator.style.display = 'none';
            this.$longTouchIndicator.classList.remove('animate');
        }
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

DownloadLoginFile.LONG_TOUCH_DURATION = 800; // iOS Safari long-touch duration
