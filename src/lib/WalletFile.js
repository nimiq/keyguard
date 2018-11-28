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
    _draw(address, encodedPrivKey) {
        this._drawBackgroundGradient();
        this._drawEncodedPrivKey(encodedPrivKey);

        this._setFont();
        this._drawAddress(address);
        this._drawHeader();

        return this._drawIdenticon(address);
    }

    /**
     * @param {string} address
     */
    async _drawIdenticon(address) {
        const $img = await Iqons.image(address);
        const size = WalletFile.IDENTICON_SIZE;
        const pad = (this._width - size) / 2;
        const x = pad;
        const y = this._height - this._width - size / 2;
        this._ctx.drawImage($img, x, y, size, size);
    }

    _setFont() {
        const ctx = this._ctx;
        ctx.textAlign = 'center';
    }

    _drawHeader() {
        const ctx = this._ctx;
        const x = this._width / 2;
        const y = WalletFile.PADDING * 6;
        ctx.font = `600 20px ${WalletFile.FONT_FAMILY}`;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('ACCOUNT ACCESS FILE', x, y);

        ctx.font = `400 16px ${WalletFile.FONT_FAMILY}`;
        ctx.fillText('DO NOT share this File or QR Code!', x, WalletFile.PADDING * 12.5);
    }

    /**
     * @param {string} address
     */
    _drawAddress(address) {
        const ctx = this._ctx;
        const x = this._width / 2;
        const y = this._width;
        ctx.font = `400 16px ${WalletFile.FONT_FAMILY}`;
        ctx.fillStyle = 'white';
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
            fill: '#2e0038',
            background: 'transparent',
            size: Math.min(240, (window.innerWidth - 64)),
        });
        if (!$canvas) throw new Error('Cannot draw QR code');
        $el.appendChild($canvas);

        const qrPosition = WalletFile.calculateQrPosition(this._width, this._height);

        this._ctx.fillStyle = 'white';
        this._ctx.strokeStyle = 'white';
        this._roundRect(qrPosition.x, qrPosition.y, qrPosition.size, qrPosition.size, 16, true);

        const padding = qrPosition.padding;
        this._ctx.drawImage($canvas, qrPosition.x + padding, qrPosition.y + padding, qrPosition.size - 2 * padding,
            qrPosition.size - 2 * padding);
    }

    _drawBackgroundGradient() {
        this._ctx.fillStyle = 'white';
        this._ctx.fillRect(0, 0, this._width, this._height);
        const gradient = this._ctx.createLinearGradient(0, 0, 0, this._height);
        gradient.addColorStop(0, '#536DFE');
        gradient.addColorStop(1, '#a553fe');
        this._ctx.fillStyle = gradient;
        this._ctx.strokeStyle = 'transparent';
        this._roundRect(0, 0, this._width, this._height, 16, true);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} radius
     * @param {boolean} fill
     * @param {boolean} stroke
     */
    _roundRect(x, y, width, height, radius = 5, fill = false, stroke = true) {
        const ctx = this._ctx;
        const radiusObj = {
            tl: radius, tr: radius, br: radius, bl: radius,
        };
        ctx.beginPath();
        ctx.moveTo(x + radiusObj.tl, y);
        ctx.lineTo(x + width - radiusObj.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radiusObj.tr);
        ctx.lineTo(x + width, y + height - radiusObj.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radiusObj.br, y + height);
        ctx.lineTo(x + radiusObj.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radiusObj.bl);
        ctx.lineTo(x, y + radiusObj.tl);
        ctx.quadraticCurveTo(x, y, x + radiusObj.tl, y);
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
WalletFile.IDENTICON_SIZE = WalletFile.WIDTH / WalletFile.PHI;
WalletFile.QR_SIZE = WalletFile.WIDTH * (1 - 1 / WalletFile.PHI);
WalletFile.PADDING = 8;
WalletFile.FONT_FAMILY = '\'Muli\', system-ui, sans-serif';
