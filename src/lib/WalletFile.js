/* global Iqons */
/* global QrEncoder */

class WalletFile {
    /**
     * @param {string} address
     * @param {string} encodedPrivKey
     */
    constructor(address, encodedPrivKey) {
        this._width = WalletFile.WIDTH;
        this._height = WalletFile.HEIGHT;
        const $canvas = document.createElement('canvas');
        $canvas.width = this._width;
        $canvas.height = this._height;
        this.$canvas = $canvas;
        this._address = address;
        /** @type {CanvasRenderingContext2D} */
        this._ctx = ($canvas.getContext('2d'));
        this._drawPromise = this._draw(address, encodedPrivKey);
    }

    static calculateQrPosition(walletBackupWidth = WalletFile.WIDTH, walletBackupHeight = WalletFile.HEIGHT) {
        const size = WalletFile.QR_SIZE;
        const padding = WalletFile.PADDING * 1.5;

        let x = (walletBackupWidth - size) / 2;
        let y = (walletBackupHeight + walletBackupHeight / WalletFile.PHI) / 2 - size / 2;
        x += padding / 2; /* add half padding to cut away the rounded corners */
        y += padding / 2;

        const width = size - padding;
        const height = size - padding;
        return {
            x, y, size, padding, width, height,
        };
    }

    filename() {
        return `${this._address.replace(/ /g, '-')}.png`;
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
     * @param {string} address
     * @param {string} encodedPrivKey
     * @returns {Promise<void>}
     */
    async _draw(address, encodedPrivKey) {
        this._drawBackground();
        this._drawEncodedPrivKey(encodedPrivKey);

        // this._setFont();
        this._drawAddress(address);
        this._drawHeaderText();
        this._drawWarningText();

        await this._drawNimiqLogo();
        await this._drawIdenticon(address);
    }

    async _drawNimiqLogo() {
        const $img = new Image();
        const loaded = new Promise(resolve => {
            $img.onload = () => resolve();
        });
        // eslint-disable-next-line max-len
        $img.src = 'data:image/svg+xml,<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 270 64"><defs><style>.cls-1{fill:url(%23radial-gradient);}.cls-2{fill:%231f2348;}</style><radialGradient id="radial-gradient" cx="54.17" cy="63.17" r="72.02" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="%23ec991c"/><stop offset="1" stop-color="%23e9b213"/></radialGradient></defs><title>nimiq_logo_rgb_horizontal</title><path class="cls-1" d="M71.2,29l-15-26A6,6,0,0,0,51,0H21a6,6,0,0,0-5.19,3L.8,29a6,6,0,0,0,0,6l15,26A6,6,0,0,0,21,64H51a6,6,0,0,0,5.19-3l15-26A6,6,0,0,0,71.2,29Z"/><path class="cls-2" d="M124.5,13H131V51h-5L105.5,24.5V51H99V13h5l20.5,26.5Z"/><path class="cls-2" d="M144,51V13h7V51Z"/><path class="cls-2" d="M195.5,13H201V51h-6V27.5L184.75,51h-4.5L170,27.5V51h-6V13h5.5l13,29.75Z"/><path class="cls-2" d="M214,51V13h7V51Z"/><path class="cls-2" d="M267.76,42.34a15.86,15.86,0,0,1-8,7.59,21.09,21.09,0,0,0,3.05,4.1,38,38,0,0,0,4,3.72L262,61.5a29,29,0,0,1-4.82-4.38,31.82,31.82,0,0,1-4.07-5.67c-.28,0-1.1,0-1.61,0a19.67,19.67,0,0,1-9.89-2.36,15.71,15.71,0,0,1-6.4-6.8A23.51,23.51,0,0,1,233,32a22.34,22.34,0,0,1,2.24-10.34,15.87,15.87,0,0,1,6.42-6.8,21.8,21.8,0,0,1,19.73,0,15.71,15.71,0,0,1,6.4,6.8A22.6,22.6,0,0,1,270,32,23.33,23.33,0,0,1,267.76,42.34Zm-24.73,0a11.7,11.7,0,0,0,16.94,0c2-2.43,3-5.85,3-10.37s-1-8-3-10.39a11.78,11.78,0,0,0-16.94,0c-2,2.39-3,5.9-3,10.42S241,39.94,243,42.37Z"/></svg>';
        await loaded;
        this._ctx.drawImage($img, WalletFile.PADDING * 4, WalletFile.PADDING * 4, 150, 36);
    }

    /**
     * @param {string} address
     */
    async _drawIdenticon(address) {
        const $img = await Iqons.image(address);
        const size = WalletFile.IDENTICON_SIZE;
        const pad = (this._width - size) / 2;
        const x = pad;
        const y = this._height - this._width - size / 1.5;
        this._ctx.drawImage($img, x, y, size, size);
    }

    // _setFont() {
    //     const ctx = this._ctx;
    //     ctx.textAlign = 'center';
    // }

    _drawHeaderText() {
        const ctx = this._ctx;
        const x = 150 + 32 + 8;
        const y = WalletFile.PADDING * 7.6;
        ctx.font = `400 30px ${WalletFile.FONT_FAMILY}`;
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgb(31, 35, 72, 1)'; // Based on Nimiq Blue
        ctx.fillText('Wallet File', x, y);
    }

    _drawWarningText() {
        const ctx = this._ctx;
        const x = WalletFile.WIDTH / 2;
        const y = WalletFile.HEIGHT - WalletFile.PADDING * 2.5;
        ctx.font = `400 16px ${WalletFile.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgb(255, 255, 255, 0.7)'; // Based on Nimiq Blue
        ctx.fillText('Do not share this file or QR Code', x, y);
    }

    /**
     * @param {string} address
     */
    _drawAddress(address) {
        const ctx = this._ctx;
        const x = this._width / 2;
        const y = this._width / 1.2;
        ctx.font = `400 16px ${WalletFile.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgb(31, 35, 72, 0.7)'; // Based on Nimiq Blue
        ctx.fillText(address, x, y);
    }

    /**
     * @param {string} encodedPrivKey
     */
    _drawEncodedPrivKey(encodedPrivKey) {
        const $el = document.createElement('div');
        const $canvas = QrEncoder.render({
            text: encodedPrivKey,
            radius: 0.8,
            ecLevel: 'Q',
            fill: '#1F2348',
            background: 'transparent',
            size: Math.min(240, (window.innerWidth - 64)),
        });
        if (!$canvas) throw new Error('Cannot draw QR code');
        $el.appendChild($canvas);

        const qrPosition = WalletFile.calculateQrPosition(this._width, this._height);

        this._ctx.fillStyle = 'white';
        this._roundRect(qrPosition.x, qrPosition.y, qrPosition.size,
            qrPosition.size, WalletFile.RADIUS / 2, true, false);

        const padding = qrPosition.padding;
        this._ctx.drawImage($canvas, qrPosition.x + padding, qrPosition.y + padding, qrPosition.size - 2 * padding,
            qrPosition.size - 2 * padding);
    }

    _drawBackground() {
        const ctx = this._ctx;

        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, this._width, this._height);

        // const gradient = ctx.createLinearGradient(0, 0, 0, this._height);
        // gradient.addColorStop(0, '#F4F4F5');
        // gradient.addColorStop(1, '#F4F4F4');
        ctx.fillStyle = '#FAFAFA';
        this._roundRect(0, 0, this._width, this._height, WalletFile.RADIUS, true, false);

        // Draw dark bottom shape
        ctx.fillStyle = '#1F2348';
        this._roundRect(0, this._height - 275, this._width, 275, {
            tl: 0,
            tr: 0,
            br: WalletFile.RADIUS,
            bl: WalletFile.RADIUS,
        }, true, false, {
            tl: { x: 0, y: 0 },
            tr: { x: 0, y: -48 },
        });
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number|{tl: number, tr: number, br: number, bl: number}} radius
     * @param {boolean} fill
     * @param {boolean} stroke
     * @param {{tl: {x: number, y: number}, tr: {x: number, y: number}}} [skew]
     */
    _roundRect(x, y, width, height, radius = 5, fill = false, stroke = true, skew) {
        const ctx = this._ctx;

        /** @type {{tl: number, tr: number, br: number, bl: number}} */
        let radiusObj;
        if (typeof radius === 'number') {
            radiusObj = {
                tl: radius,
                tr: radius,
                br: radius,
                bl: radius,
            };
        } else radiusObj = radius;

        skew = skew || { tl: { x: 0, y: 0 }, tr: { x: 0, y: 0 } };

        ctx.beginPath();
        ctx.moveTo(x + radiusObj.tl + skew.tl.x, y + skew.tl.y); // Top left
        ctx.lineTo(x + width - radiusObj.tr + skew.tr.x, y + skew.tr.y); // Top right
        ctx.quadraticCurveTo(x + width + skew.tr.x, y + skew.tr.y, x + width + skew.tr.x, y + radiusObj.tr + skew.tr.y);
        ctx.lineTo(x + width, y + height - radiusObj.br); // Bottom right
        ctx.quadraticCurveTo(x + width, y + height, x + width - radiusObj.br, y + height);
        ctx.lineTo(x + radiusObj.bl, y + height); // Bottom left
        ctx.quadraticCurveTo(x, y + height, x, y + height - radiusObj.bl);
        ctx.lineTo(x + skew.tl.x, y + radiusObj.tl + skew.tl.y); // Top left
        ctx.quadraticCurveTo(x + skew.tl.x, y + skew.tl.y, x + radiusObj.tl + skew.tl.x, y + skew.tl.y);
        ctx.closePath();
        if (fill) {
            ctx.fill();
        }
        if (stroke) {
            ctx.stroke();
        }
    }
}

WalletFile.PHI = 1.618;
WalletFile.WIDTH = 300 * WalletFile.PHI;
WalletFile.HEIGHT = WalletFile.WIDTH * WalletFile.PHI;
WalletFile.RADIUS = 16;
WalletFile.IDENTICON_SIZE = WalletFile.WIDTH / WalletFile.PHI / 1.5;
WalletFile.QR_SIZE = WalletFile.WIDTH * (1 - 1 / WalletFile.PHI);
WalletFile.PADDING = 8;
WalletFile.FONT_FAMILY = '\'Muli\', system-ui, sans-serif';
