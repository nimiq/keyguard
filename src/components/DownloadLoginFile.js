/* global BrowserDetection */
/* global Nimiq */
/* global I18n */
/* global LoginFile */
/* global KeyStore */
/* global Errors */
/* global IqonHash */
/* global TemplateTags */
/* global Utf8Tools */

class DownloadLoginFile extends Nimiq.Observable {
    /**
     * @param {HTMLDivElement} [$el]
     * @param {string} [description]
     */
    constructor($el, description) {
        super();

        this.$el = DownloadLoginFile._createElement($el, description);

        /** @type {LoginFile | null} */
        this._file = null;

        /** @type {HTMLImageElement} */
        this.$loginfile = (this.$el.querySelector('.loginfile'));

        /** @type {HTMLAnchorElement} */
        this.$loginfileLink = (this.$el.querySelector('.loginfile-link'));

        /** @type {HTMLAnchorElement} */
        this.$downloadButton = (this.$el.querySelector('.download-button'));

        /** @type {HTMLButtonElement} */
        this.$continueButton = (this.$el.querySelector('.continue'));

        /** @type {SVGElement} */
        this.$longTouchIndicator = (this.$el.querySelector('.long-touch-indicator'));

        this.$loginfile.addEventListener('mousedown', e => this._onMouseDown(e));
        this.$loginfile.addEventListener('touchstart', () => this._onTouchStart());
        this.$downloadButton.addEventListener('click', () => this._onDownloadStart());
        this.$continueButton.addEventListener('click', () => {
            this._onDownloadEnd();
            // Remove previously added classes after a short delay to restore the initial state.
            window.setTimeout(this._reset.bind(this), 300);
        });
    }

    /**
     * @param {?HTMLDivElement} [$el]
     * @param {?string} [description]
     * @returns {HTMLDivElement}
     */
    static _createElement($el, description) {
        $el = $el || document.createElement('div');
        $el.classList.add('download-loginfile');

        /* eslint-disable max-len */
        $el.innerHTML = TemplateTags.noVars`
            <a class="loginfile-link"><img class="loginfile" src=""></img></a>

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

            <p class="loginfile-description"></p>

            <div class="actions">
                <span class="nq-label tap-and-hold" data-i18n="download-loginfile-tap-and-hold">
                    Tap and hold image
                    to download
                </span>
                <a class="nq-button light-blue download-button">
                    <svg class="nq-icon"><use xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-download"/></svg>
                    <span data-i18n="download-loginfile-download">Download</span>
                </a>
                <button class="nq-button light-blue continue" disabled>
                    <span data-i18n="download-loginfile-continue">Continue</span>
                    <svg class="nq-icon"><use xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-caret-right-small"/></svg>
                </button>
            </div>
        `;
        /* eslint-enable max-len */

        if (description) {
            /** @type {HTMLParagraphElement} */
            const $description = ($el.querySelector('.loginfile-description'));
            $description.textContent = description;
            $description.classList.add('visible');
        }

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @param {Uint8Array} encryptedEntropy
     * @param {Nimiq.Address} firstAddress
     * @param {string} [label = '']
     */
    setEncryptedEntropy(encryptedEntropy, firstAddress, label = '') {
        if (encryptedEntropy.byteLength !== KeyStore.ENCRYPTED_SECRET_SIZE) {
            throw new Errors.KeyguardError('Can only export encrypted Entropies');
        }
        // Remove previously added classes to restore the initial state.
        this._reset();

        if (label) {
            // Add label bytes to the end of the encrypted entropy
            const labelBytes = Utf8Tools.stringToUtf8ByteArray(label.trim());
            if (labelBytes.byteLength > 255) {
                // Should not happen for labels parsed via RequestParser.parseLabel as these are restricted to 63 bytes.
                throw new Errors.KeyguardError('Account label too long.');
            }
            const newData = new Nimiq.SerialBuffer(encryptedEntropy.byteLength + 1 + labelBytes.byteLength);
            newData.write(encryptedEntropy);
            newData.writeUint8(labelBytes.byteLength);
            newData.write(labelBytes);
            encryptedEntropy = newData;
        }

        const color = IqonHash.getBackgroundColorIndex(firstAddress.toUserFriendlyAddress());
        this.file = new LoginFile(Nimiq.BufferUtils.toBase64(encryptedEntropy), color, label);
    }

    /**
     * @param {Nimiq.Address} firstAddress
     */
    createDummyFile(firstAddress) {
        const color = IqonHash.getBackgroundColorIndex(firstAddress.toUserFriendlyAddress());
        this.file = new LoginFile(Nimiq.BufferUtils.toBase64(new Uint8Array(0)), color);
    }

    /**
     * @param {string} href
     * @param {string} filename
     */
    _setupDownload(href, filename) {
        if (this._supportsNativeDownload()) {
            // Setup native download
            this.$downloadButton.href = href;
            this.$downloadButton.download = filename;
        } else {
            // Setup fallback download
            // Hack to make image downloadable on iOS via long tap.
            this.$loginfileLink.href = 'javascript:void(0);'; // eslint-disable-line no-script-url
            this.$el.classList.add('fallback-download');
        }
    }

    /**
     * Detect if browser supports native `download` attribute
     *
     * @returns {boolean}
     */
    _supportsNativeDownload() {
        return typeof this.$downloadButton.download !== 'undefined';
    }

    /**
     * Also gets triggered after touchstart.
     *
     * @param {MouseEvent} event
     */
    _onMouseDown(event) {
        /** @type {HTMLElement} */
        const target = (event.target);
        // Clicks on the continue or download buttons are already covered by a 'click' handler.
        if (target.matches('.continue') || target.matches('.download-button')) return;

        if (event.button === 2) { // secondary button
            this._onDownloadStart(true);
        }
    }

    async _onDownloadStart(fromContextMenu = false) {
        // Cancel previous download listeners
        if (this._cancelDownload) {
            this._cancelDownload();
        }
        try {
            await new Promise((resolve, reject) => {
                if (!fromContextMenu) {
                    // Add delay timeout if not initiated from context menu.
                    // ("Save as" always opens a dialog.)

                    // If no download dialog opens, consider the download successful after a delay. On Macs it takes a
                    // bit longer until the dialog gets focused and the window blurred, therefore waiting 1s.
                    window.setTimeout(resolve, 1000);
                }
                window.addEventListener('blur', resolve, { once: true });
                this._cancelDownload = reject;
            });

            this.fire(DownloadLoginFile.Events.INITIATED);

            this._maybeDownloaded();
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
            event.preventDefault();
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

            this._maybeDownloaded();
        } catch (e) {
            // do nothing
        } finally {
            this.$longTouchIndicator.style.display = 'none';
            this.$longTouchIndicator.classList.remove('animate');
        }
    }

    _maybeDownloaded() {
        this.$el.classList.add('maybe-downloaded');
        this.$continueButton.disabled = false;
    }

    _reset() {
        this.$el.classList.remove('maybe-downloaded');
        this.$continueButton.disabled = true;
        this.fire(DownloadLoginFile.Events.RESET);
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
    INITIATED: 'loginfile-download-initiated',
    RESET: 'loginfile-download-reset',
};

DownloadLoginFile.LONG_TOUCH_DURATION = 800; // iOS Safari long-touch duration
