/* global QrEncoder */

class WalletFile {
    /**
     * @param {string} encodedPrivKey
     * @param {number} [color]
     */
    constructor(encodedPrivKey, color = 0) {
        this._width = WalletFile.WIDTH;
        this._height = WalletFile.HEIGHT;
        const $canvas = document.createElement('canvas');
        $canvas.width = this._width;
        $canvas.height = this._height;
        this.$canvas = $canvas;
        this._color = WalletFile.COLORS[color];
        if (!this._color) throw new Error(`Invalid color index: ${color}`);
        /** @type {CanvasRenderingContext2D} */
        this._ctx = ($canvas.getContext('2d'));
        this._drawPromise = this._draw(encodedPrivKey, this._color);
    }

    static calculateQrPosition() {
        return {
            x: 69,
            y: 287,
            size: WalletFile.QR_SIZE,
            padding: WalletFile.QR_PADDING,
            width: WalletFile.QR_BOX_SIZE,
            height: WalletFile.QR_BOX_SIZE,
        };
    }

    filename() {
        const walletName = `Nimiq Login File ${this._color.name[0].toUpperCase()}${this._color.name.substr(1)} Wallet`;
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
     * @param {{name: string, color: string, corner: string}} color
     * @returns {Promise<void>}
     */
    async _draw(encodedPrivKey, color) {
        this._drawBackground(color);
        await this._drawDecorations(color);
        await this._drawNimiqLogo();

        this._setFont();
        this._drawDateText();
        this._drawWarningText();

        // this._drawIWLogo();

        this._drawEncodedPrivKey(encodedPrivKey);
    }

    async _drawNimiqLogo() {
        const img = new Image();
        const loaded = new Promise(resolve => {
            img.onload = () => resolve();
        });
        // eslint-disable-next-line max-len
        img.src = 'data:image/svg+xml,<svg width="199" height="24" viewBox="0 0 199 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M26.702 10.875L21.077 1.125C20.6645 0.4125 19.9145 0 19.127 0H7.87705C7.08955 0 6.33955 0.4125 5.92705 1.125L0.302051 10.875C-0.110449 11.5875 -0.110449 12.4125 0.302051 13.125L5.92705 22.875C6.33955 23.5875 7.08955 24 7.87705 24H19.127C19.9145 24 20.6645 23.5875 21.077 22.875L26.702 13.125C27.1145 12.4125 27.1145 11.5875 26.702 10.875Z"/><path d="M46.7253 4.72461H49.1628V19.1246H47.2503L39.4878 9.03711V19.1246H37.0503V4.72461H39.0003L46.7628 14.8121V4.72461H46.7253Z"/><path d="M53.9629 19.1246V4.72461H56.5879V19.1246H53.9629Z"/><path d="M73.275 4.72461H75.3375V19.1246H73.0125V10.1621L69.225 19.1246H67.5L63.6375 10.2746V19.1246H61.3125V4.72461H63.375L68.325 16.0121L73.275 4.72461Z"/><path d="M80.1377 19.1246V4.72461H82.7627V19.1246H80.1377Z"/><path d="M98.0625 20.1746C98.5125 20.6246 99 21.1121 99.5625 21.5621L97.8 22.9871C97.1625 22.5371 96.525 21.9746 95.9625 21.3371C95.4 20.6996 94.875 20.0246 94.4625 19.2746C94.35 19.2746 94.1625 19.3121 93.8625 19.3121C92.475 19.3121 91.275 19.0121 90.225 18.4121C89.175 17.8121 88.3875 16.9496 87.825 15.8246C87.2625 14.6996 87 13.3871 87 11.8871C87 10.3871 87.2625 9.07461 87.825 7.98711C88.3875 6.86211 89.175 6.03711 90.1875 5.43711C91.2375 4.83711 92.4375 4.53711 93.825 4.53711C95.2125 4.53711 96.45 4.83711 97.4625 5.43711C98.5125 6.03711 99.3 6.89961 99.825 7.98711C100.388 9.11211 100.65 10.4246 100.65 11.8871C100.65 13.5371 100.312 14.9621 99.675 16.1246C99.0375 17.2871 98.1 18.1496 96.9 18.7121C97.275 19.2371 97.6125 19.7246 98.0625 20.1746ZM90.75 15.8621C91.5 16.7621 92.55 17.2496 93.8625 17.2496C95.175 17.2496 96.225 16.7996 96.975 15.8621C97.725 14.9621 98.1 13.6121 98.1 11.9246C98.1 10.2371 97.725 8.92461 96.975 8.02461C96.225 7.12461 95.175 6.67461 93.8625 6.67461C92.55 6.67461 91.5 7.12461 90.75 8.02461C90 8.92461 89.625 10.2371 89.625 11.9621C89.6625 13.6121 90.0375 14.9246 90.75 15.8621Z"/><path d="M112.425 19.1246V4.72461H114.075V17.7371H121.313V19.1246H112.425Z"/><path d="M124.913 18.6377C124.2 18.1877 123.638 17.5877 123.225 16.8002C122.813 16.0127 122.625 15.0752 122.625 13.9877C122.625 12.9377 122.813 12.0002 123.225 11.1752C123.638 10.3877 124.2 9.75019 124.913 9.33769C125.625 8.88769 126.487 8.7002 127.462 8.7002C128.437 8.7002 129.262 8.92519 130.012 9.33769C130.725 9.78769 131.287 10.3877 131.7 11.1752C132.112 11.9627 132.3 12.9002 132.3 13.9877C132.3 15.0377 132.112 15.9752 131.7 16.8002C131.287 17.5877 130.725 18.2252 130.012 18.6377C129.3 19.0877 128.437 19.2752 127.462 19.2752C126.487 19.2752 125.625 19.0502 124.913 18.6377ZM129.75 16.9127C130.275 16.2377 130.575 15.2627 130.575 13.9877C130.575 12.7502 130.312 11.7752 129.75 11.1002C129.187 10.4252 128.437 10.0877 127.425 10.0877C126.412 10.0877 125.662 10.4252 125.1 11.1002C124.538 11.7752 124.275 12.7502 124.275 13.9877C124.275 15.2627 124.538 16.2377 125.1 16.9127C125.662 17.5877 126.412 17.9252 127.425 17.9252C128.437 17.9252 129.225 17.5877 129.75 16.9127Z"/><path d="M143.888 8.9248V19.0123C143.888 20.5123 143.513 21.6748 142.725 22.4623C141.938 23.2498 140.813 23.6248 139.275 23.6248C137.738 23.6248 136.388 23.2873 135.263 22.5748L135.563 21.2248C136.2 21.5998 136.838 21.8623 137.4 22.0123C137.963 22.1623 138.6 22.2373 139.275 22.2373C140.25 22.2373 141 21.9748 141.488 21.4498C141.975 20.9248 142.238 20.1748 142.238 19.1248V16.7248C141.938 17.3623 141.488 17.8873 140.888 18.2248C140.288 18.5998 139.575 18.7498 138.75 18.7498C137.85 18.7498 137.063 18.5248 136.388 18.1123C135.675 17.6998 135.15 17.0998 134.775 16.3123C134.4 15.5248 134.213 14.6623 134.213 13.6498C134.213 12.6373 134.4 11.7748 134.775 10.9873C135.15 10.1998 135.675 9.6373 136.388 9.1873C137.1 8.7748 137.888 8.5498 138.75 8.5498C139.575 8.5498 140.25 8.73731 140.85 9.07481C141.45 9.41231 141.9 9.8998 142.2 10.5373V8.7748H143.888V8.9248ZM141.413 16.4623C141.975 15.8248 142.238 14.9248 142.238 13.7623C142.238 12.5998 141.975 11.6998 141.413 11.0623C140.85 10.4248 140.063 10.0873 139.088 10.0873C138.075 10.0873 137.288 10.4248 136.725 11.0623C136.163 11.6998 135.863 12.5998 135.863 13.7623C135.863 14.9248 136.163 15.8248 136.725 16.4623C137.288 17.0998 138.075 17.4373 139.088 17.4373C140.063 17.4373 140.85 17.0998 141.413 16.4623Z"/><path d="M146.888 4.6123H148.875V6.4873H146.888V4.6123ZM147.038 19.1248V8.9248H148.688V19.1248H147.038Z"/><path d="M160.613 12.7121V19.1246H158.963V12.8246C158.963 11.8871 158.776 11.1746 158.401 10.7621C158.026 10.3121 157.426 10.0871 156.601 10.0871C155.663 10.0871 154.913 10.3871 154.351 10.9496C153.788 11.5121 153.488 12.2996 153.488 13.3121V19.1246H151.876V11.8121C151.876 10.7621 151.838 9.82459 151.726 8.96209H153.301L153.451 10.7996C153.751 10.1246 154.238 9.63709 154.838 9.26209C155.476 8.88709 156.151 8.73709 156.976 8.73709C159.376 8.69959 160.613 10.0496 160.613 12.7121Z"/><path d="M169.2 19.1246V4.72461H178.125V6.11211H170.85V11.0996H177.713V12.4871H170.85V19.1246H169.2Z"/><path d="M180.226 4.6123H182.213V6.4873H180.226V4.6123ZM180.376 19.1248V8.9248H182.026V19.1248H180.376Z"/><path d="M185.213 19.1248V4.2373H186.863V19.1248H185.213Z"/><path d="M198.563 13.9875H191.101C191.101 15.3 191.401 16.275 192.001 16.9125C192.601 17.5875 193.426 17.8875 194.551 17.8875C195.751 17.8875 196.838 17.475 197.813 16.6875L198.376 17.8875C197.926 18.3 197.363 18.6375 196.651 18.8625C195.938 19.0875 195.226 19.2375 194.513 19.2375C192.938 19.2375 191.663 18.75 190.763 17.8125C189.863 16.875 189.413 15.6 189.413 13.95C189.413 12.9 189.601 12 190.013 11.175C190.426 10.3875 190.988 9.75 191.701 9.3C192.413 8.85 193.276 8.625 194.176 8.625C195.526 8.625 196.576 9.075 197.363 9.9375C198.151 10.8375 198.526 12.0375 198.526 13.575V13.9875H198.563ZM192.151 10.725C191.626 11.25 191.288 11.9625 191.138 12.9H197.063C196.988 11.925 196.688 11.2125 196.238 10.725C195.751 10.2375 195.076 9.975 194.251 9.975C193.388 9.975 192.713 10.2375 192.151 10.725Z"/></svg>';
        await loaded;
        this._ctx.drawImage(img, 58, 43, 199, 24);
    }

    _setFont() {
        const ctx = this._ctx;
        ctx.font = `600 14px ${WalletFile.FONT_FAMILY}`;
        ctx.textAlign = 'center';
    }

    _drawDateText() {
        const ctx = this._ctx;
        const x = WalletFile.WIDTH / 2;
        const y = 97;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText('15-08-2018', x, y);
    }

    _drawWarningText() {
        const ctx = this._ctx;
        const x = WalletFile.WIDTH / 2;
        const y = WalletFile.HEIGHT - 32;
        ctx.fillStyle = 'white';
        ctx.fillText('Do not share this file.', x, y);
    }

    /**
     * @param {string} encodedPrivKey
     */
    _drawEncodedPrivKey(encodedPrivKey) {
        const $el = document.createElement('div');
        const $canvas = QrEncoder.render({
            text: encodedPrivKey,
            radius: 0.7,
            ecLevel: 'Q',
            fill: 'white',
            background: 'transparent',
            size: Math.min(240, (window.innerWidth - 64)),
        });
        if (!$canvas) throw new Error('Cannot draw QR code');
        $el.appendChild($canvas);

        const qrPosition = WalletFile.calculateQrPosition();
        const padding = qrPosition.padding;

        this._ctx.drawImage($canvas,
            qrPosition.x + padding,
            qrPosition.y + padding,
            qrPosition.size,
            qrPosition.size);
    }

    /**
     * @param {{name: string, color: string, corner: string}} color
     */
    _drawBackground(color) {
        const ctx = this._ctx;

        ctx.fillStyle = 'white';
        this._roundRect(0, 0, this._width, this._height, WalletFile.OUTER_RADIUS, true, false);

        ctx.fillStyle = color.color;
        this._roundRect(
            WalletFile.BORDER_WIDTH,
            WalletFile.BORDER_WIDTH,
            this._width - WalletFile.BORDER_WIDTH * 2,
            this._height - WalletFile.BORDER_WIDTH * 2,
            WalletFile.RADIUS,
            true, false,
        );

        // const gradient = ctx.createLinearGradient(0, 0, 0, this._height);
        // gradient.addColorStop(0, '#F4F4F5');
        // gradient.addColorStop(1, '#F4F4F4');
    }

    /**
     * @param {{name: string, color: string, corner: string}} color
     */
    async _drawDecorations(color) { // eslint-disable-line no-unused-vars
        const img1 = new Image();
        const loaded1 = new Promise(resolve => {
            img1.onload = () => resolve();
        });
        // eslint-disable-next-line max-len
        img1.src = 'data:image/svg+xml,<svg width="303" height="288" viewBox="0 0 303 288" fill="none" stroke="white" stroke-miterlimit="10" xmlns="http://www.w3.org/2000/svg"><g opacity="0.15"><path d="M365.737 -158.847C322.745 -115.855 308.603 -129.997 265.611 -87.0046C222.619 -44.0125 236.761 -29.8704 193.769 13.1217C150.777 56.1138 136.634 41.9717 93.6424 84.9637C50.6503 127.956 64.7924 142.098 21.8003 185.09C-21.1918 228.082 -35.3339 213.94 -78.326 256.932"/><path d="M360.08 -164.504C317.088 -121.512 300.118 -138.482 257.126 -95.4903C214.133 -52.4982 231.104 -35.5276 188.112 7.46447C145.12 50.4566 128.149 33.486 85.1572 76.4781C42.1651 119.47 59.1357 136.441 16.1436 179.433C-26.8485 222.425 -43.8191 205.454 -86.8112 248.446"/><path d="M354.423 -170.161C311.431 -127.169 291.632 -146.968 248.64 -103.976C205.648 -60.9838 225.447 -41.1848 182.455 1.80725C139.463 44.7993 119.664 25.0003 76.6718 67.9924C33.6797 110.985 53.4787 130.784 10.4866 173.776C-32.5055 216.768 -52.3045 196.969 -95.2966 239.961"/><path d="M348.767 -175.817C305.775 -132.825 283.147 -155.453 240.155 -112.461C197.163 -69.4685 219.79 -46.8411 176.798 -3.849C133.806 39.1431 111.179 16.5157 68.1866 59.5078C25.1946 102.5 47.822 125.127 4.82987 168.119C-38.1622 211.111 -60.7896 188.484 -103.782 231.476"/><path d="M343.11 -181.475C300.118 -138.483 274.662 -163.938 231.67 -120.946C188.678 -77.9542 214.133 -52.4983 171.141 -9.50623C128.149 33.4859 102.693 8.03001 59.7012 51.0221C16.7091 94.0142 42.165 119.47 -0.827109 162.462C-43.8192 205.454 -69.2751 179.998 -112.267 222.99"/><path d="M337.453 -187.131C294.461 -144.139 266.177 -172.423 223.184 -129.431C180.192 -86.4388 208.477 -58.1546 165.485 -15.1625C122.492 27.8296 94.2082 -0.454662 51.2161 42.5374C8.22398 85.5295 36.5082 113.814 -6.48385 156.806C-49.4759 199.798 -77.7602 171.514 -120.752 214.506"/><path d="M331.796 -192.788C288.804 -149.796 257.691 -180.909 214.699 -137.917C171.707 -94.9245 202.82 -63.8118 159.828 -20.8197C116.835 22.1724 85.7227 -8.94032 42.7307 34.0518C-0.261434 77.0439 30.8513 108.157 -12.1408 151.149C-55.1329 194.141 -86.2456 163.028 -129.238 206.02"/><path d="M326.139 -198.445C283.147 -155.453 249.206 -189.394 206.214 -146.402C163.222 -103.41 197.163 -69.469 154.171 -26.4769C111.179 16.5152 77.2376 -17.426 34.2455 25.5661C-8.7466 68.5582 25.1945 102.499 -17.7976 145.491C-60.7897 188.484 -94.7308 154.542 -137.723 197.535"/><path d="M320.482 -204.102C277.49 -161.109 240.721 -197.879 197.728 -154.887C154.736 -111.895 191.506 -75.1253 148.514 -32.1332C105.522 10.8589 68.7522 -25.9106 25.7601 17.0814C-17.232 60.0735 19.5375 96.8431 -23.4546 139.835C-66.4466 182.827 -103.216 146.058 -146.208 189.05"/><path d="M314.825 -209.759C271.833 -166.767 232.235 -206.365 189.243 -163.373C146.251 -120.38 185.849 -80.7825 142.857 -37.7904C99.865 5.20168 60.267 -34.3963 17.2749 8.59579C-25.7172 51.5879 13.8808 91.1859 -29.1113 134.178C-72.1034 177.17 -111.701 137.572 -154.693 180.564"/></g></svg>';
        await loaded1;
        this._ctx.drawImage(img1, 6, 6, 303, 288);

        const img2 = new Image();
        const loaded2 = new Promise(resolve => {
            img2.onload = () => resolve();
        });
        // eslint-disable-next-line max-len
        img2.src = 'data:image/svg+xml,<svg width="99" height="104" viewBox="0 0 99 104" fill="white" xmlns="http://www.w3.org/2000/svg"><g opacity="0.35"><path opacity="0.7" d="M66.0024 14.0063L58.7577 1.44893C58.241 0.550593 57.2798 0 56.2463 0H41.757C40.7234 0 39.7671 0.555422 39.2503 1.44893L32.0009 14.0063C31.4841 14.9046 31.4841 16.0058 32.0009 16.9042L39.2455 29.4615C39.7623 30.3599 40.7234 30.9105 41.757 30.9105H56.2463C57.2798 30.9105 58.2361 30.355 58.7529 29.4615L65.9976 16.9042C66.5192 16.0107 66.5192 14.9046 66.0024 14.0063Z"/><path opacity="0.78" d="M66.0024 87.0678L58.7577 74.5105C58.241 73.6121 57.2798 73.0615 56.2463 73.0615H41.757C40.7234 73.0615 39.7671 73.6169 39.2503 74.5105L32.0009 87.0678C31.4841 87.9662 31.4841 89.0674 32.0009 89.9657L39.2455 102.523C39.7623 103.421 40.7234 103.972 41.757 103.972H56.2463C57.2798 103.972 58.2361 103.417 58.7529 102.523L65.9976 89.9657C66.5192 89.0722 66.5192 87.9662 66.0024 87.0678Z"/><path opacity="0.5" d="M34.3891 32.2719L27.1445 19.7146C26.6277 18.8162 25.6666 18.2656 24.633 18.2656H10.1437C9.11014 18.2656 8.15384 18.821 7.63706 19.7146L0.387588 32.2719C-0.129196 33.1703 -0.129196 34.2715 0.387588 35.1698L7.63223 47.7272C8.14901 48.6255 9.11014 49.1761 10.1437 49.1761H24.633C25.6666 49.1761 26.6228 48.6207 27.1396 47.7272L34.3843 35.1698C34.9059 34.2763 34.9059 33.1703 34.3891 32.2719Z"/><path opacity="0.6" d="M34.3891 68.8022L27.1445 56.2448C26.6277 55.3465 25.6666 54.7959 24.633 54.7959H10.1437C9.11014 54.7959 8.15384 55.3513 7.63706 56.2448L0.387588 68.8022C-0.129196 69.7005 -0.129196 70.8017 0.387588 71.7001L7.63223 84.2574C8.14901 85.1558 9.11014 85.7064 10.1437 85.7064H24.633C25.6666 85.7064 26.6228 85.1509 27.1396 84.2574L34.3843 71.7001C34.9059 70.8066 34.9059 69.7005 34.3891 68.8022Z"/><path opacity="0.8" d="M97.6147 32.2719L90.3701 19.7146C89.8533 18.8162 88.8921 18.2656 87.8586 18.2656H73.3693C72.3357 18.2656 71.3794 18.821 70.8626 19.7146L63.6132 32.2719C63.0964 33.1703 63.0964 34.2715 63.6132 35.1698L70.8578 47.7272C71.3746 48.6255 72.3357 49.1761 73.3693 49.1761H87.8586C88.8921 49.1761 89.8484 48.6207 90.3652 47.7272L97.6099 35.1698C98.1315 34.2763 98.1315 33.1703 97.6147 32.2719Z"/><path opacity="0.6" d="M97.6137 68.8022L90.3691 56.2448C89.8523 55.3465 88.8912 54.7959 87.8576 54.7959H73.3683C72.3347 54.7959 71.3785 55.3513 70.8617 56.2448L63.6122 68.8022C63.0954 69.7005 63.0954 70.8017 63.6122 71.7001L70.8568 84.2574C71.3736 85.1558 72.3347 85.7064 73.3683 85.7064H87.8576C88.8912 85.7064 89.8475 85.1509 90.3642 84.2574L97.6089 71.7001C98.1305 70.8066 98.1305 69.7005 97.6137 68.8022Z"/></g></svg>';
        await loaded2;
        this._ctx.drawImage(img2, 110, 146, 99, 104);
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

WalletFile.COLORS = [
    { name: 'blue', color: '#1F2348', corner: '#260133' },
    { name: 'yellow', color: '#E9B213', corner: '#EC991C' },
    { name: 'light-blue', color: '#0582CA', corner: '#265DD7' },
    { name: 'green', color: '#21BCA5', corner: '#41A38E' },
    { name: 'orange', color: '#FC8702', corner: '#FD6216' },
    { name: 'red', color: '#D94432', corner: '#CC3047' },
    // { name: 'purple', color: '#', corner: '#' },
    // { name: 'brown', color: '#', corner: '#' },
];
WalletFile.WIDTH = 315;
WalletFile.HEIGHT = 530;
WalletFile.OUTER_RADIUS = 12;
WalletFile.RADIUS = 8;
WalletFile.QR_SIZE = 165;
WalletFile.QR_PADDING = 6;
WalletFile.QR_BOX_SIZE = WalletFile.QR_SIZE + 2 * WalletFile.QR_PADDING;
WalletFile.BORDER_WIDTH = 6;
WalletFile.FONT_FAMILY = '\'Muli\', system-ui, sans-serif';
