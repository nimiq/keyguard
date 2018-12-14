/* global QrEncoder */

class LoginFile {
    /**
     * @param {string} encodedPrivKey
     * @param {number} [color]
     */
    constructor(encodedPrivKey, color = 0) {
        this._width = LoginFile.WIDTH;
        this._height = LoginFile.HEIGHT;
        const $canvas = document.createElement('canvas');
        $canvas.width = this._width;
        $canvas.height = this._height;
        this.$canvas = $canvas;
        this._config = LoginFile.CONFIG[color];
        if (!this._config) throw new Error(`Invalid color index: ${color}`);
        /** @type {CanvasRenderingContext2D} */
        this._ctx = ($canvas.getContext('2d'));
        this._drawPromise = this._draw(encodedPrivKey);
    }

    static calculateQrPosition() {
        return {
            x: 69,
            y: 287,
            size: LoginFile.QR_SIZE,
            padding: LoginFile.QR_PADDING,
            width: LoginFile.QR_BOX_SIZE,
            height: LoginFile.QR_BOX_SIZE,
        };
    }

    filename() {
        const walletName = 'Nimiq Login File '
                         + `${this._config.name[0].toUpperCase()}${this._config.name.substr(1)} Wallet`;
        return `${walletName.replace(/ /g, '-')}.png`;
    }

    async toDataUrl() {
        await this._drawPromise;
        return this.$canvas.toDataURL().replace(/#/g, '%23');
    }

    async toObjectUrl() {
        await this._drawPromise;
        return this._toObjectUrl();
    }

    _toObjectUrl() {
        return new Promise(resolve => {
            this.$canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                resolve(url);
            });
        });
    }

    /**
     * @param {string} encodedPrivKey
     * @returns {Promise<void>}
     */
    async _draw(encodedPrivKey) {
        this._drawBackground();
        await this._drawDecorations();
        await this._drawNimiqLogo();

        this._setFont();
        this._drawDateText();
        this._drawWarningText();

        await this._drawIWLogo();

        this._drawQrCode(encodedPrivKey);
    }

    async _drawNimiqLogo() {
        const img = new Image();
        const loaded = new Promise(resolve => {
            img.onload = () => resolve();
        });
        // eslint-disable-next-line max-len
        img.src = 'data:image/svg+xml,<svg width="198.6" height="24" viewBox="58 43 198.6 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M84.7,53.9l-5.6-9.8c-0.4-0.7-1.2-1.1-2-1.1H65.9c-0.8,0-1.5,0.4-2,1.1l-5.6,9.8c-0.4,0.7-0.4,1.5,0,2.2,l5.6,9.8c0.4,0.7,1.2,1.1,2,1.1h11.2c0.8,0,1.5-0.4,2-1.1l5.6-9.8C85.1,55.4,85.1,54.6,84.7,53.9z"/><path d="M104.7,47.7h2.4v14.4h-1.9L97.5,52v10.1h-2.4V47.7H97l7.8,10.1L104.7,47.7L104.7,47.7z"/><path d="M112,62.1V47.7h2.6v14.4H112z"/><path d="M131.3,47.7h2.1v14.4H131v-9l-3.8,9h-1.7l-3.9-8.8v8.8h-2.3V47.7h2.1l4.9,11.3L131.3,47.7z"/><path d="M138.1,62.1V47.7h2.6v14.4H138.1z"/><path d="M156.1,63.2c0.4,0.5,0.9,0.9,1.5,1.4l-1.8,1.4c-0.6-0.4-1.3-1-1.8-1.7c-0.6-0.6-1.1-1.3-1.5-2.1,c-0.1,0-0.3,0-0.6,0c-1.4,0-2.6-0.3-3.6-0.9c-1.1-0.6-1.8-1.5-2.4-2.6c-0.6-1.1-0.8-2.4-0.8-3.9s0.3-2.8,0.8-3.9,c0.6-1.1,1.4-1.9,2.4-2.5c1.1-0.6,2.2-0.9,3.6-0.9c1.4,0,2.6,0.3,3.6,0.9c1,0.6,1.8,1.5,2.4,2.5c0.6,1.1,0.8,2.4,0.8,3.9,c0,1.7-0.3,3.1-1,4.2c-0.6,1.2-1.6,2-2.8,2.6C155.3,62.2,155.6,62.7,156.1,63.2z M148.8,58.9c0.8,0.9,1.8,1.4,3.1,1.4,c1.3,0,2.4-0.5,3.1-1.4c0.8-0.9,1.1-2.2,1.1-3.9s-0.4-3-1.1-3.9c-0.8-0.9-1.8-1.4-3.1-1.4c-1.3,0-2.4,0.5-3.1,1.4,c-0.8,0.9-1.1,2.2-1.1,3.9C147.7,56.6,148,57.9,148.8,58.9z"/><path d="M170.4,62.1V47.7h1.6v13h7.2v1.4H170.4z"/><path d="M182.9,61.6c-0.7-0.5-1.3-1-1.7-1.8c-0.4-0.8-0.6-1.7-0.6-2.8c0-1.1,0.2-2,0.6-2.8c0.4-0.8,1-1.4,1.7-1.8,c0.7-0.5,1.6-0.6,2.5-0.6c1,0,1.8,0.2,2.5,0.6c0.7,0.5,1.3,1,1.7,1.8c0.4,0.8,0.6,1.7,0.6,2.8c0,1-0.2,2-0.6,2.8,c-0.4,0.8-1,1.4-1.7,1.8c-0.7,0.5-1.6,0.6-2.5,0.6C184.5,62.3,183.6,62.1,182.9,61.6z M187.8,59.9c0.5-0.7,0.8-1.7,0.8-2.9,c0-1.2-0.3-2.2-0.8-2.9c-0.6-0.7-1.3-1-2.3-1c-1,0-1.8,0.3-2.3,1c-0.6,0.7-0.8,1.6-0.8,2.9c0,1.3,0.3,2.2,0.8,2.9,c0.6,0.7,1.3,1,2.3,1C186.4,60.9,187.2,60.6,187.8,59.9z"/><path d="M201.9,51.9V62c0,1.5-0.4,2.7-1.2,3.5c-0.8,0.8-1.9,1.2-3.5,1.2c-1.5,0-2.9-0.3-4-1.1l0.3-1.3,c0.6,0.4,1.3,0.6,1.8,0.8c0.6,0.2,1.2,0.2,1.9,0.2c1,0,1.7-0.3,2.2-0.8c0.5-0.5,0.8-1.3,0.8-2.3v-2.4c-0.3,0.6-0.8,1.2-1.4,1.5,c-0.6,0.4-1.3,0.5-2.1,0.5c-0.9,0-1.7-0.2-2.4-0.6c-0.7-0.4-1.2-1-1.6-1.8c-0.4-0.8-0.6-1.7-0.6-2.7s0.2-1.9,0.6-2.7,c0.4-0.8,0.9-1.4,1.6-1.8c0.7-0.4,1.5-0.6,2.4-0.6c0.8,0,1.5,0.2,2.1,0.5c0.6,0.3,1,0.8,1.3,1.5v-1.8h1.7V51.9z M199.4,59.5,c0.6-0.6,0.8-1.5,0.8-2.7c0-1.2-0.3-2.1-0.8-2.7c-0.6-0.6-1.3-1-2.3-1c-1,0-1.8,0.3-2.4,1c-0.6,0.6-0.9,1.5-0.9,2.7,c0,1.2,0.3,2.1,0.9,2.7c0.6,0.6,1.3,1,2.4,1C198.1,60.4,198.9,60.1,199.4,59.5z"/><path d="M204.9,47.6h2v1.9h-2V47.6z M205,62.1V51.9h1.7v10.2H205z"/><path d="M218.6,55.7v6.4H217v-6.3c0-0.9-0.2-1.7-0.6-2.1c-0.4-0.5-1-0.7-1.8-0.7c-0.9,0-1.7,0.3-2.2,0.9,c-0.6,0.6-0.9,1.3-0.9,2.4v5.8h-1.6v-7.3c0-1,0-2-0.2-2.8h1.6l0.2,1.8c0.3-0.7,0.8-1.2,1.4-1.5c0.6-0.4,1.3-0.5,2.1-0.5,C217.4,51.7,218.6,53,218.6,55.7z"/><path d="M227.2,62.1V47.7h8.9v1.4h-7.3v5h6.9v1.4h-6.9v6.6H227.2z"/><path d="M238.2,47.6h2v1.9h-2V47.6z M238.4,62.1V51.9h1.6v10.2H238.4z"/><path d="M243.2,62.1V47.2h1.7v14.9H243.2z"/><path d="M256.6,57h-7.5c0,1.3,0.3,2.3,0.9,2.9c0.6,0.7,1.4,1,2.5,1c1.2,0,2.3-0.4,3.3-1.2l0.6,1.2,c-0.5,0.4-1,0.8-1.7,1c-0.7,0.2-1.4,0.4-2.1,0.4c-1.6,0-2.9-0.5-3.8-1.4s-1.4-2.2-1.4-3.9c0-1,0.2-2,0.6-2.8c0.4-0.8,1-1.4,1.7-1.9,c0.7-0.5,1.6-0.7,2.5-0.7c1.4,0,2.4,0.5,3.2,1.3c0.8,0.9,1.2,2.1,1.2,3.6L256.6,57L256.6,57z M250.2,53.7c-0.5,0.5-0.9,1.2-1,2.2,h5.9c-0.1-1-0.4-1.7-0.8-2.2c-0.5-0.5-1.2-0.8-2-0.8C251.4,53,250.7,53.2,250.2,53.7z"/></svg>';
        await loaded;
        this._ctx.drawImage(img, 58, 43, 198.6, 24);
    }

    _setFont() {
        const ctx = this._ctx;
        ctx.font = `600 14px ${LoginFile.FONT_FAMILY}`;
        ctx.textAlign = 'center';
    }

    _drawDateText() {
        const ctx = this._ctx;
        const x = LoginFile.WIDTH / 2;
        const y = 97;
        const date = new Date();
        const datestring = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(datestring, x, y);
    }

    _drawWarningText() {
        const ctx = this._ctx;
        const x = LoginFile.WIDTH / 2;
        const y = LoginFile.HEIGHT - 32;
        ctx.fillStyle = 'white';
        ctx.fillText('Do not share this file.', x, y);
    }

    /**
     * @param {string} encodedPrivKey
     */
    _drawQrCode(encodedPrivKey) {
        // FIXME: Remove QRCode background, when QRScanner supports inverting images
        this._ctx.fillStyle = 'white';
        const qrPosition = LoginFile.calculateQrPosition();
        this._roundRect(
            qrPosition.x,
            qrPosition.y,
            LoginFile.QR_BOX_SIZE,
            LoginFile.QR_BOX_SIZE,
            LoginFile.RADIUS, true,
        );

        const $el = document.createElement('div');
        /* eslint-disable no-multi-spaces */
        const $canvas = QrEncoder.render({
            text: encodedPrivKey,
            radius: 0.7,                // We encode 56 bytes. To keep within a smaller QR base size, we need to reduce
            ecLevel: 'M',               // the error-correction level to M. Thus we reduce the radius from .8 to .7
            fill: this._config.corner,  // to reduce scanning issues.
            background: 'transparent',
            size: Math.min(240, (window.innerWidth - 64)),
        });
        /* eslint-enable no-multi-spaces */
        if (!$canvas) throw new Error('Cannot draw QR code');
        $el.appendChild($canvas);

        // const qrPosition = LoginFile.calculateQrPosition();
        const padding = qrPosition.padding;

        this._ctx.drawImage($canvas,
            qrPosition.x + padding,
            qrPosition.y + padding,
            qrPosition.size,
            qrPosition.size);
    }

    _drawBackground() {
        const ctx = this._ctx;

        ctx.fillStyle = 'white';
        this._roundRect(0, 0, this._width, this._height, LoginFile.OUTER_RADIUS, true);

        const gradient = ctx.createRadialGradient(
            this._width - LoginFile.BORDER_WIDTH,
            this._height - LoginFile.BORDER_WIDTH,
            0,
            this._width - LoginFile.BORDER_WIDTH,
            this._height - LoginFile.BORDER_WIDTH,
            Math.sqrt(
                ((this._width - 2 * LoginFile.BORDER_WIDTH) ** 2)
              + ((this._height - 2 * LoginFile.BORDER_WIDTH) ** 2),
            ),
        );
        // const gradient = ctx.createLinearGradient(this._width, this._height, 0, 0);
        gradient.addColorStop(0, this._config.corner);
        gradient.addColorStop(1, this._config.color);
        ctx.fillStyle = gradient;
        this._roundRect(
            LoginFile.BORDER_WIDTH,
            LoginFile.BORDER_WIDTH,
            this._width - LoginFile.BORDER_WIDTH * 2,
            this._height - LoginFile.BORDER_WIDTH * 2,
            LoginFile.RADIUS,
            true, false, true,
        );
    }

    async _drawDecorations() {
        const img1 = new Image();
        const loaded1 = new Promise(resolve => {
            img1.onload = () => resolve();
        });
        // eslint-disable-next-line max-len
        img1.src = `data:image/svg+xml,<svg width="303" height="288" viewBox="6 6 303 288" fill="none" stroke="white" stroke-miterlimit="10" xmlns="http://www.w3.org/2000/svg" opacity="${this._config.opacityLines}"><path d="M0,214.4c8.1-5.4,17-12.6,27.8-23.4c43-43,28.9-57.1,71.8-100.1c43-43,57.1-28.8,100.1-71.8,c7.1-7.1,12.6-13.4,17.1-19.1"/><path d="M0,204.3c6.7-4.7,13.9-10.7,22.1-18.9c43-43,26-60,69-103c43-43,60-26,103-69c4.8-4.8,8.8-9.3,12.3-13.5"/><path d="M0,194.2c5.1-3.9,10.6-8.6,16.5-14.5c43-43,23.2-62.8,66.2-105.8c43-43,62.8-23.2,105.8-66.2,c2.7-2.7,5.1-5.3,7.4-7.8"/><path d="M0,184c3.5-2.8,7.1-6.1,10.8-9.8c43-43,20.4-65.6,63.4-108.6c43-43,65.6-20.4,108.6-63.4,c0.7-0.7,1.4-1.4,2.1-2.2"/><path d="M173.5,0c-40.8,38.1-66,15.3-107.8,57c-43,43-17.5,68.4-60.5,111.4c-1.8,1.8-3.5,3.4-5.2,4.9"/><path d="M161.3,0c-37.5,29.7-64.5,9-104,48.5C14.4,91.4,42.3,119.6,0,162.3"/><path d="M147.2,0c-34,20.5-61.9,3.5-98.5,40.1C8,80.8,33.8,110.9,0,150.5"/><path d="M128.6,0C99.2,10.2,72.2-0.4,40.2,31.6C2.1,69.7,24.5,100.8,0,137.3"/><path d="M77.8,0C62.9,2.1,47.8,7.1,31.8,23.1C-2.7,57.5,14,87.9,0,120.8"/><path d="M0,79.4c0.9-21.3,1.1-42.6,23.3-64.8C29.9,8,36.5,3.3,42.9,0"/></svg>`;
        await loaded1;
        this._ctx.drawImage(img1, 6, 6, 303, 288);

        const img2 = new Image();
        const loaded2 = new Promise(resolve => {
            img2.onload = () => resolve();
        });
        // eslint-disable-next-line max-len
        img2.src = `data:image/svg+xml,<svg width="99" height="104" viewBox="110 146 99 104" fill="white" xmlns="http://www.w3.org/2000/svg" opacity="${this._config.opacityWallet}"><path opacity=".8" d="M176,160l-7.2-12.6c-0.5-0.9-1.5-1.4-2.5-1.4h-14.5c-1,0-2,0.6-2.5,1.4L142,160c-0.5,0.9-0.5,2,0,2.9l7.2,12.6,c0.5,0.9,1.5,1.4,2.5,1.4h14.5c1,0,2-0.6,2.5-1.4l7.2-12.6C176.5,162,176.5,160.9,176,160z"/><path opacity=".78" d="M176,233.1l-7.2-12.6c-0.5-0.9-1.5-1.4-2.5-1.4h-14.5c-1,0-2,0.6-2.5,1.4l-7.2,12.6c-0.5,0.9-0.5,2,0,2.9,l7.2,12.6c0.5,0.9,1.5,1.4,2.5,1.4h14.5c1,0,2-0.6,2.5-1.4L176,236C176.5,235.1,176.5,234,176,233.1z"/><path opacity=".5" d="M144.4,178.3l-7.2-12.6c-0.5-0.9-1.5-1.4-2.5-1.4h-14.5c-1,0-2,0.6-2.5,1.4l-7.2,12.6c-0.5,0.9-0.5,2,0,2.9,l7.2,12.6c0.5,0.9,1.5,1.4,2.5,1.4h14.5c1,0,2-0.6,2.5-1.4l7.2-12.6C144.9,180.3,144.9,179.2,144.4,178.3z"/><path opacity=".6" d="M144.4,214.8l-7.2-12.6c-0.5-0.9-1.5-1.4-2.5-1.4h-14.5c-1,0-2,0.6-2.5,1.4l-7.2,12.6c-0.5,0.9-0.5,2,0,2.9,l7.2,12.6c0.5,0.9,1.5,1.4,2.5,1.4h14.5c1,0,2-0.6,2.5-1.4l7.2-12.6C144.9,216.8,144.9,215.7,144.4,214.8z"/><path opacity=".8" d="M207.6,178.3l-7.2-12.6c-0.5-0.9-1.5-1.4-2.5-1.4h-14.5c-1,0-2,0.6-2.5,1.4l-7.2,12.6c-0.5,0.9-0.5,2,0,2.9,l7.2,12.6c0.5,0.9,1.5,1.4,2.5,1.4h14.5c1,0,2-0.6,2.5-1.4l7.2-12.6C208.1,180.3,208.1,179.2,207.6,178.3z"/><path opacity=".6" d="M207.6,214.8l-7.2-12.6c-0.5-0.9-1.5-1.4-2.5-1.4h-14.5c-1,0-2,0.6-2.5,1.4l-7.2,12.6c-0.5,0.9-0.5,2,0,2.9,l7.2,12.6c0.5,0.9,1.5,1.4,2.5,1.4h14.5c1,0,2-0.6,2.5-1.4l7.2-12.6C208.1,216.8,208.1,215.7,207.6,214.8z"/></svg>`;
        await loaded2;
        this._ctx.drawImage(img2, 110, 146, 99, 104);
    }

    async _drawIWLogo() {
        const img = new Image();
        const loaded = new Promise(resolve => {
            img.onload = () => resolve();
        });
        // eslint-disable-next-line max-len
        img.src = 'data:image/svg+xml,<svg width="19.33" height="12" viewBox="285 507 19.33 12" fill="%231F2348" opacity=".7" xmlns="http://www.w3.org/2000/svg"><path d="M287.3,507.1c1.6,3.7,3.1,7.3,4.5,10.9c0.2,0.6,0.4,1,1.2,1c0.8,0,1-0.4,1.2-1c0.5-1.1,1-2.2,1.5-3.6,c0.6,1.4,1.1,2.5,1.6,3.6c0.2,0.5,0.4,0.9,1.2,0.9c0.8,0,1-0.3,1.3-0.9c1.2-3,2.5-6,3.8-9c0.3-0.6,0.5-1.2,0.8-1.8,c-2.1-0.4-2.1-0.4-2.8,1.4c-0.8,1.8-1.5,3.7-2.3,5.6c-0.2,0.5-0.4,1-0.8,1.7c-0.3-0.7-0.4-1.2-0.7-1.6c-0.8-1.3-0.8-2.5,0-3.8,c0.5-1,0.9-2.1,1.2-3.1c-2.6-1-2.4,1.4-3.2,2.6c-0.8-1.2-0.6-3.6-3.2-2.6c0.6,1.4,1.2,2.8,1.7,4.2c0.1,0.3,0.3,0.8,0.1,1.1,c-0.4,1-0.8,2-1.3,3.2c-1-2.5-2-4.8-2.9-7.1C289.5,506.9,289.5,506.9,287.3,507.1z"/><rect x="285" y="507" class="st9" width="2" height="12"/></svg>';
        await loaded;
        this._ctx.drawImage(img, 285, 507, 19.33, 12);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} radius
     * @param {boolean} [fill]
     * @param {boolean} [stroke]
     * @param {boolean} [withIWCorner]
     */
    _roundRect(x, y, width, height, radius = 5, fill = false, stroke = false, withIWCorner = false) {
        const ctx = this._ctx;

        ctx.beginPath();
        ctx.moveTo(x + radius, y); // Top left
        ctx.lineTo(x + width - radius, y); // Top right
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        if (!withIWCorner) {
            ctx.lineTo(x + width, y + height - radius); // Bottom right
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        } else {
            const cornerWidth = 32;
            const cornerHeight = 24;
            ctx.lineTo(x + width, y + height - cornerHeight - radius); // Bottom right corner entry corner
            ctx.quadraticCurveTo(x + width, y + height - cornerHeight, x + width - radius, y + height - cornerHeight);
            ctx.lineTo(x + width - cornerWidth + radius, y + height - cornerHeight); // Inner corner corner
            ctx.quadraticCurveTo(x + width - cornerWidth, y + height - cornerHeight,
                x + width - cornerWidth, y + height - cornerHeight + radius);
            ctx.lineTo(x + width - cornerWidth, y + height - radius); // Corner exit corner
            ctx.quadraticCurveTo(x + width - cornerWidth, y + height, x + width - cornerWidth - radius, y + height);
        }
        ctx.lineTo(x + radius, y + height); // Bottom left
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius); // Top left
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (fill) {
            ctx.fill();
        }
        if (stroke) {
            ctx.stroke();
        }
    }
}

// Order determined by Iqons.backgroundColors
LoginFile.CONFIG = [
    /* eslint-disable object-curly-newline */
    { name: 'orange', color: '#FC8702', corner: '#FD6216', opacityLines: 0.25, opacityWallet: 0.45 },
    { name: 'red', color: '#D94432', corner: '#CC3047', opacityLines: 0.25, opacityWallet: 0.4 },
    { name: 'yellow', color: '#E9B213', corner: '#EC991C', opacityLines: 0.25, opacityWallet: 0.5 },
    { name: 'blue', color: '#1F2348', corner: '#260133', opacityLines: 0.1, opacityWallet: 0.2 },
    { name: 'light-blue', color: '#0582CA', corner: '#265DD7', opacityLines: 0.2, opacityWallet: 0.3 },
    { name: 'purple', color: '#5F4B8B', corner: '#4D4C96', opacityLines: 0.1, opacityWallet: 0.2 },
    { name: 'green', color: '#21BCA5', corner: '#41A38E', opacityLines: 0.25, opacityWallet: 0.5 },
    { name: 'pink', color: '#FA7268', corner: '#E0516B', opacityLines: 0.25, opacityWallet: 0.4 },
    // { name: 'light-green', color: '#', corner: '#', opacityLines: .2, opacityWallet: .3 },
    { name: 'brown', color: '#795548', corner: '#724147', opacityLines: 0.1, opacityWallet: 0.2 },
    /* eslint-enable object-curly-newline */
];
LoginFile.WIDTH = 315;
LoginFile.HEIGHT = 530;
LoginFile.OUTER_RADIUS = 12;
LoginFile.RADIUS = 8;
LoginFile.QR_SIZE = 165;
LoginFile.QR_PADDING = 6;
LoginFile.QR_BOX_SIZE = LoginFile.QR_SIZE + 2 * LoginFile.QR_PADDING;
LoginFile.BORDER_WIDTH = 6;
LoginFile.FONT_FAMILY = '\'Muli\', system-ui, sans-serif';
