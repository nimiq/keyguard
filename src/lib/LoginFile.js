/* global QrEncoder */

class LoginFile {
    /**
     * @param {string} encodedSecret - Base64-encoded and encrypted secret
     * @param {number} [color = 0]
     */
    constructor(encodedSecret, color = 0) {
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
        this._drawPromise = this._draw(encodedSecret);
    }

    static calculateQrPosition() {
        return {
            x: 138,
            y: 536,
            size: LoginFile.QR_SIZE,
            padding: LoginFile.QR_PADDING,
            width: LoginFile.QR_BOX_SIZE,
            height: LoginFile.QR_BOX_SIZE,
        };
    }

    filename() {
        const walletName = 'Nimiq LoginFile '
                         + `${this._config.name[0].toUpperCase()}${this._config.name.substr(1)} Wallet`;
        return `${walletName.replace(/ /g, '-')}.png`;
    }

    async toDataUrl() {
        await this._drawPromise;
        return this.$canvas.toDataURL().replace(/#/g, '%23');
    }

    async toObjectUrl() {
        await this._drawPromise;

        return new Promise(resolve => {
            this.$canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                resolve(url);
            });
        });
    }

    /**
     * @param {string} encodedSecret
     * @returns {Promise<void>}
     */
    async _draw(encodedSecret) {
        this._drawBackground();
        await this._drawDecorations();
        await this._drawNimiqLogo();

        this._setFont();
        this._drawDateText();
        this._drawWarningText();

        await this._drawIWLogo();

        this._drawQrCode(encodedSecret);
    }

    async _drawNimiqLogo() {
        const img = new Image();
        const loaded = new Promise(resolve => {
            img.onload = () => resolve();
        });
        // eslint-disable-next-line max-len
        img.src = 'data:image/svg+xml,<svg width="194" height="24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M26.7 10.88l-5.62-9.76A2.25 2.25 0 0 0 19.13 0H7.88C7.1 0 6.35.41 5.93 1.13L.31 10.88a2.2 2.2 0 0 0 0 2.24l5.62 9.76A2.25 2.25 0 0 0 7.88 24h11.25c.8 0 1.54-.41 1.95-1.13l5.63-9.75a2.2 2.2 0 0 0 0-2.24zM46.74 4.73h2.45v14.4h-1.94l-7.77-10.1v10.1h-2.42V4.72H39l7.74 10.07V4.73zM53.94 19.12V4.72h2.61v14.4h-2.6zM73.25 4.73h2.07v14.4H73v-8.94l-3.82 8.93h-1.72l-3.84-8.84v8.84h-2.3V4.72h2.06L68.34 16l4.91-11.26zM80.09 19.12V4.72h2.6v14.4h-2.6zM97.98 20.17c.43.46.94.93 1.52 1.4l-1.76 1.42c-.65-.46-1.26-1.01-1.83-1.65a13.05 13.05 0 0 1-1.5-2.05l-.6.01c-1.38 0-2.6-.3-3.62-.9a6.03 6.03 0 0 1-2.39-2.56 8.67 8.67 0 0 1-.84-3.94c0-1.5.28-2.8.83-3.9a5.9 5.9 0 0 1 2.38-2.57 7.2 7.2 0 0 1 3.65-.89c1.4 0 2.62.3 3.65.9a5.85 5.85 0 0 1 2.37 2.55c.54 1.11.82 2.42.82 3.91 0 1.65-.33 3.06-.98 4.23a5.88 5.88 0 0 1-2.78 2.57c.29.52.65 1.02 1.08 1.47zm-7.28-4.32a3.78 3.78 0 0 0 3.12 1.37c1.34 0 2.37-.45 3.11-1.37.75-.92 1.12-2.23 1.12-3.95 0-1.7-.37-3-1.12-3.9a3.8 3.8 0 0 0-3.11-1.37 3.8 3.8 0 0 0-3.12 1.35c-.74.9-1.1 2.21-1.1 3.92 0 1.72.36 3.03 1.1 3.95zM112.32 19.12V4.72h1.66v12.99h7.22v1.41h-8.88zM124.8 18.62a4.35 4.35 0 0 1-1.7-1.84c-.39-.8-.59-1.73-.59-2.8 0-1.06.2-1.99.6-2.78.4-.8.95-1.41 1.69-1.84a4.87 4.87 0 0 1 2.52-.65c.96 0 1.8.22 2.53.65.73.43 1.3 1.04 1.69 1.84.4.8.6 1.72.6 2.79 0 1.06-.2 2-.6 2.79-.4.8-.96 1.4-1.69 1.84-.73.43-1.57.64-2.53.64-.95 0-1.8-.2-2.52-.64zm4.85-1.71c.54-.67.8-1.64.8-2.92 0-1.24-.27-2.2-.82-2.89a2.8 2.8 0 0 0-2.3-1.02c-1 0-1.78.34-2.33 1.02a4.45 4.45 0 0 0-.83 2.89c0 1.28.27 2.25.82 2.92.55.67 1.33 1 2.34 1 1 0 1.78-.33 2.32-1zM143.74 8.95v10.1c0 1.5-.39 2.64-1.16 3.42-.78.77-1.92 1.16-3.43 1.16a7.4 7.4 0 0 1-4-1.05l.28-1.34a6.97 6.97 0 0 0 3.72 1.03c1 0 1.73-.25 2.23-.77s.75-1.3.75-2.32v-2.4a3.43 3.43 0 0 1-1.36 1.5 4.1 4.1 0 0 1-2.14.54c-.89 0-1.68-.21-2.37-.63a4.17 4.17 0 0 1-1.6-1.78 5.92 5.92 0 0 1-.57-2.64c0-1 .18-1.88.56-2.65.38-.77.91-1.36 1.6-1.78a4.5 4.5 0 0 1 2.38-.63c.81 0 1.52.18 2.11.53.6.35 1.06.84 1.37 1.47V8.95h1.63zm-2.47 7.51c.56-.65.84-1.55.84-2.7 0-1.14-.28-2.04-.84-2.7a2.87 2.87 0 0 0-2.32-.98c-1 0-1.78.33-2.35.98a3.96 3.96 0 0 0-.86 2.7c0 1.15.29 2.05.86 2.7.57.66 1.36.98 2.35.98s1.76-.32 2.32-.98zM146.74 4.64h2v1.87h-2V4.64zm.16 14.48V8.95h1.63v10.17h-1.63zM160.44 12.73v6.4h-1.63v-6.31c0-.95-.19-1.64-.57-2.07-.38-.44-.97-.66-1.78-.66-.94 0-1.7.28-2.26.87a3.22 3.22 0 0 0-.85 2.34v5.82h-1.64V11.8c0-1.05-.05-2-.16-2.84h1.56l.16 1.82c.31-.66.77-1.17 1.4-1.53a4.2 4.2 0 0 1 2.12-.54c2.44 0 3.65 1.34 3.65 4.02zM163.74 19.12V4.72h8.9v1.4h-7.26v5h6.85v1.4h-6.85v6.6h-1.64zM174.76 4.64h2v1.87h-2V4.64zm.17 14.48V8.95h1.63v10.17h-1.63zM179.74 19.12V4.24h1.63v14.88h-1.63zM193.06 13.99h-7.46c.01 1.3.31 2.27.9 2.93.59.66 1.44 1 2.55 1 1.2 0 2.28-.4 3.28-1.2l.55 1.2c-.45.41-1.02.74-1.71.98-.7.25-1.4.37-2.13.37-1.6 0-2.84-.47-3.75-1.4a5.32 5.32 0 0 1-1.35-3.86c0-1.04.2-1.96.6-2.76a4.49 4.49 0 0 1 4.2-2.54c1.34 0 2.4.45 3.17 1.33.77.88 1.15 2.1 1.15 3.65v.3zm-6.38-3.24a3.72 3.72 0 0 0-1.02 2.17h5.93a3.48 3.48 0 0 0-.84-2.19 2.63 2.63 0 0 0-2-.75c-.84 0-1.53.26-2.07.77z"/></svg>';
        await loaded;
        this._ctx.drawImage(img, 122, 86, 388, 48);
    }

    _setFont() {
        this._ctx.font = `600 28px ${LoginFile.FONT_FAMILY}`;
        this._ctx.textAlign = 'center';
    }

    _drawDateText() {
        const x = LoginFile.WIDTH / 2;
        const y = 194;
        const date = new Date();
        /**
         * @param {number} num
         * @returns {string}
         */
        const leftPad = num => `${num < 10 ? '0' : ''}${num}`;
        const datestring = `${date.getFullYear()}-${leftPad(date.getMonth() + 1)}-${leftPad(date.getDate())}`;
        this._ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this._ctx.fillText(datestring, x, y);
    }

    _drawWarningText() {
        const x = LoginFile.WIDTH / 2;
        const y = LoginFile.HEIGHT - 86 - 2;
        this._ctx.fillStyle = 'white';
        this._ctx.fillText('Keep safe and confidential.', x, y);
    }

    /**
     * @param {string} encodedSecret
     */
    _drawQrCode(encodedSecret) {
        const $el = document.createElement('div');
        /* eslint-disable no-multi-spaces */
        const $canvas = QrEncoder.render({
            text: encodedSecret,
            radius: 0.5,    // We encode 56 bytes. To keep within a smaller QR base size, we need to reduce
            ecLevel: 'M',   // the error-correction level to M. Thus we reduce the radius from .8 to .7
            fill: 'white',  // to reduce scanning issues.
            background: 'transparent',
            size: LoginFile.QR_SIZE,
        });
        /* eslint-enable no-multi-spaces */
        if (!$canvas) throw new Error('Cannot draw QR code');
        $el.appendChild($canvas);

        const qrPosition = LoginFile.calculateQrPosition();
        const padding = qrPosition.padding;

        this._ctx.drawImage($canvas,
            qrPosition.x + padding,
            qrPosition.y + padding,
            qrPosition.size,
            qrPosition.size);
    }

    _drawBackground() {
        this._ctx.fillStyle = 'white';
        this._roundRect(0, 0, this._width, this._height, LoginFile.OUTER_RADIUS, true);

        const gradient = this._ctx.createRadialGradient(
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
        gradient.addColorStop(0, this._config.corner);
        gradient.addColorStop(1, this._config.color);
        this._ctx.fillStyle = gradient;
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
        // Security waves
        await this._drawDataUrlImage(
            // eslint-disable-next-line max-len
            `data:image/svg+xml,<svg width="303" height="288" viewBox="6 6 303 288" fill="none" stroke="white" stroke-miterlimit="10" xmlns="http://www.w3.org/2000/svg" opacity="${this._config.opacityLines}"><path d="M0,214.4c8.1-5.4,17-12.6,27.8-23.4c43-43,28.9-57.1,71.8-100.1c43-43,57.1-28.8,100.1-71.8,c7.1-7.1,12.6-13.4,17.1-19.1"/><path d="M0,204.3c6.7-4.7,13.9-10.7,22.1-18.9c43-43,26-60,69-103c43-43,60-26,103-69c4.8-4.8,8.8-9.3,12.3-13.5"/><path d="M0,194.2c5.1-3.9,10.6-8.6,16.5-14.5c43-43,23.2-62.8,66.2-105.8c43-43,62.8-23.2,105.8-66.2,c2.7-2.7,5.1-5.3,7.4-7.8"/><path d="M0,184c3.5-2.8,7.1-6.1,10.8-9.8c43-43,20.4-65.6,63.4-108.6c43-43,65.6-20.4,108.6-63.4,c0.7-0.7,1.4-1.4,2.1-2.2"/><path d="M173.5,0c-40.8,38.1-66,15.3-107.8,57c-43,43-17.5,68.4-60.5,111.4c-1.8,1.8-3.5,3.4-5.2,4.9"/><path d="M161.3,0c-37.5,29.7-64.5,9-104,48.5C14.4,91.4,42.3,119.6,0,162.3"/><path d="M147.2,0c-34,20.5-61.9,3.5-98.5,40.1C8,80.8,33.8,110.9,0,150.5"/><path d="M128.6,0C99.2,10.2,72.2-0.4,40.2,31.6C2.1,69.7,24.5,100.8,0,137.3"/><path d="M77.8,0C62.9,2.1,47.8,7.1,31.8,23.1C-2.7,57.5,14,87.9,0,120.8"/><path d="M0,79.4c0.9-21.3,1.1-42.6,23.3-64.8C29.9,8,36.5,3.3,42.9,0"/></svg>`,
            LoginFile.BORDER_WIDTH, LoginFile.BORDER_WIDTH, 606, 576,
        );

        // Wallet symbol
        await this._drawDataUrlImage(
            // eslint-disable-next-line max-len
            `data:image/svg+xml,<svg width="99" height="104" viewBox="110 146 99 104" fill="white" xmlns="http://www.w3.org/2000/svg" opacity="${this._config.opacityWallet}"><path opacity=".8" d="M176,160l-7.2-12.6c-0.5-0.9-1.5-1.4-2.5-1.4h-14.5c-1,0-2,0.6-2.5,1.4L142,160c-0.5,0.9-0.5,2,0,2.9l7.2,12.6,c0.5,0.9,1.5,1.4,2.5,1.4h14.5c1,0,2-0.6,2.5-1.4l7.2-12.6C176.5,162,176.5,160.9,176,160z"/><path opacity=".78" d="M176,233.1l-7.2-12.6c-0.5-0.9-1.5-1.4-2.5-1.4h-14.5c-1,0-2,0.6-2.5,1.4l-7.2,12.6c-0.5,0.9-0.5,2,0,2.9,l7.2,12.6c0.5,0.9,1.5,1.4,2.5,1.4h14.5c1,0,2-0.6,2.5-1.4L176,236C176.5,235.1,176.5,234,176,233.1z"/><path opacity=".5" d="M144.4,178.3l-7.2-12.6c-0.5-0.9-1.5-1.4-2.5-1.4h-14.5c-1,0-2,0.6-2.5,1.4l-7.2,12.6c-0.5,0.9-0.5,2,0,2.9,l7.2,12.6c0.5,0.9,1.5,1.4,2.5,1.4h14.5c1,0,2-0.6,2.5-1.4l7.2-12.6C144.9,180.3,144.9,179.2,144.4,178.3z"/><path opacity=".6" d="M144.4,214.8l-7.2-12.6c-0.5-0.9-1.5-1.4-2.5-1.4h-14.5c-1,0-2,0.6-2.5,1.4l-7.2,12.6c-0.5,0.9-0.5,2,0,2.9,l7.2,12.6c0.5,0.9,1.5,1.4,2.5,1.4h14.5c1,0,2-0.6,2.5-1.4l7.2-12.6C144.9,216.8,144.9,215.7,144.4,214.8z"/><path opacity=".8" d="M207.6,178.3l-7.2-12.6c-0.5-0.9-1.5-1.4-2.5-1.4h-14.5c-1,0-2,0.6-2.5,1.4l-7.2,12.6c-0.5,0.9-0.5,2,0,2.9,l7.2,12.6c0.5,0.9,1.5,1.4,2.5,1.4h14.5c1,0,2-0.6,2.5-1.4l7.2-12.6C208.1,180.3,208.1,179.2,207.6,178.3z"/><path opacity=".6" d="M207.6,214.8l-7.2-12.6c-0.5-0.9-1.5-1.4-2.5-1.4h-14.5c-1,0-2,0.6-2.5,1.4l-7.2,12.6c-0.5,0.9-0.5,2,0,2.9,l7.2,12.6c0.5,0.9,1.5,1.4,2.5,1.4h14.5c1,0,2-0.6,2.5-1.4l7.2-12.6C208.1,216.8,208.1,215.7,207.6,214.8z"/></svg>`,
            220, 266, 198, 208,
        );
    }

    async _drawIWLogo() {
        await this._drawDataUrlImage(
            // eslint-disable-next-line max-len
            'data:image/svg+xml,<svg width="19.33" height="12" viewBox="285 507 19.33 12" fill="%231F2348" opacity=".7" xmlns="http://www.w3.org/2000/svg"><path d="M287.3,507.1c1.6,3.7,3.1,7.3,4.5,10.9c0.2,0.6,0.4,1,1.2,1c0.8,0,1-0.4,1.2-1c0.5-1.1,1-2.2,1.5-3.6,c0.6,1.4,1.1,2.5,1.6,3.6c0.2,0.5,0.4,0.9,1.2,0.9c0.8,0,1-0.3,1.3-0.9c1.2-3,2.5-6,3.8-9c0.3-0.6,0.5-1.2,0.8-1.8,c-2.1-0.4-2.1-0.4-2.8,1.4c-0.8,1.8-1.5,3.7-2.3,5.6c-0.2,0.5-0.4,1-0.8,1.7c-0.3-0.7-0.4-1.2-0.7-1.6c-0.8-1.3-0.8-2.5,0-3.8,c0.5-1,0.9-2.1,1.2-3.1c-2.6-1-2.4,1.4-3.2,2.6c-0.8-1.2-0.6-3.6-3.2-2.6c0.6,1.4,1.2,2.8,1.7,4.2c0.1,0.3,0.3,0.8,0.1,1.1,c-0.4,1-0.8,2-1.3,3.2c-1-2.5-2-4.8-2.9-7.1C289.5,506.9,289.5,506.9,287.3,507.1z"/><rect x="285" y="507" class="st9" width="2" height="12"/></svg>',
            570, 1014, 38.66, 24,
        );
    }

    /**
     * @param {string} dataUrl
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @returns {Promise<void>}
     */
    async _drawDataUrlImage(dataUrl, x, y, w, h) {
        const img = new Image();
        const loaded = new Promise(resolve => {
            img.onload = () => resolve();
        });
        img.src = dataUrl;
        await loaded;
        this._ctx.drawImage(img, x, y, w, h);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} [radius = 5]
     * @param {boolean} [fill = false]
     * @param {boolean} [stroke = false]
     * @param {boolean} [withIWCorner = false]
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
            const cornerWidth = LoginFile.RADIUS * 4;
            const cornerHeight = LoginFile.OUTER_RADIUS * 2;
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
    { name: 'orange', color: '#FC8702', corner: '#FD6216', opacityLines: 0.2, opacityWallet: 0.35 },
    { name: 'red', color: '#D94432', corner: '#CC3047', opacityLines: 0.2, opacityWallet: 0.3 },
    { name: 'yellow', color: '#E9B213', corner: '#EC991C', opacityLines: 0.25, opacityWallet: 0.5 },
    { name: 'blue', color: '#1F2348', corner: '#260133', opacityLines: 0.1, opacityWallet: 0.2 },
    { name: 'light-blue', color: '#0582CA', corner: '#265DD7', opacityLines: 0.2, opacityWallet: 0.3 },
    { name: 'purple', color: '#5F4B8B', corner: '#4D4C96', opacityLines: 0.15, opacityWallet: 0.2 },
    { name: 'green', color: '#21BCA5', corner: '#41A38E', opacityLines: 0.25, opacityWallet: 0.5 },
    { name: 'pink', color: '#FA7268', corner: '#E0516B', opacityLines: 0.23, opacityWallet: 0.32 },
    { name: 'light-green', color: '#88B04B', corner: '#70B069', opacityLines: 0.15, opacityWallet: 0.3 },
    { name: 'brown', color: '#795548', corner: '#724147', opacityLines: 0.15, opacityWallet: 0.2 },
    /* eslint-enable object-curly-newline */
];
LoginFile.WIDTH = 630;
LoginFile.HEIGHT = 1060;
LoginFile.OUTER_RADIUS = 24;
LoginFile.RADIUS = 16;
LoginFile.QR_SIZE = 330;
LoginFile.QR_PADDING = 12;
LoginFile.QR_BOX_SIZE = LoginFile.QR_SIZE + 2 * LoginFile.QR_PADDING;
LoginFile.BORDER_WIDTH = 12;
LoginFile.FONT_FAMILY = '\'Muli\', system-ui, sans-serif';
