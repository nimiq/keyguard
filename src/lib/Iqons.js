class Iqons {
    /* Public API */

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async svg(text) {
        const hash = this._hash(text);
        return this._svgTemplate(
            parseInt(hash[0], 10),
            parseInt(hash[2], 10),
            parseInt(hash[3] + hash[4], 10),
            parseInt(hash[5] + hash[6], 10),
            parseInt(hash[7] + hash[8], 10),
            parseInt(hash[9] + hash[10], 10),
            parseInt(hash[11], 10),
        );
    }

    /**
     * @param {string} text
     * @returns {Promise<string>}
     */
    static async toDataUrl(text) {
        const base64string = btoa(await this.svg(text));
        return `data:image/svg+xml;base64,${base64string.replace(/#/g, '%23')}`;
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholder(color, strokeWidth) {
        color = color || '#bbb';
        strokeWidth = strokeWidth || 1;
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
            <path fill="none" stroke="${color}" stroke-width="${2 * strokeWidth}" transform="translate(0, 8) scale(0.5)" d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
            <g transform="scale(0.9) translate(9, 8)">
                <circle cx="80" cy="80" r="40" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity=".9"></circle>
                <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>\`
            </g>
        </svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} [color]
     * @param {number} [strokeWidth]
     * @returns {string}
     */
    static placeholderToDataUrl(color, strokeWidth) {
        return `data:image/svg+xml;base64,${btoa(this.placeholder(color, strokeWidth))}`;
    }

    /* Private API */

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _svgTemplate(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        return this._$svg(await this._$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor));
    }

    /**
     * @param {number} color
     * @param {number} backgroundColor
     * @param {number} faceNr
     * @param {number} topNr
     * @param {number} sidesNr
     * @param {number} bottomNr
     * @param {number} accentColor
     * @returns {Promise<string>}
     */
    static async _$iqons(color, backgroundColor, faceNr, topNr, sidesNr, bottomNr, accentColor) {
        if (color === backgroundColor) {
            color += 1;
            if (color > 9) color = 0;
        }

        while (accentColor === color || accentColor === backgroundColor) {
            accentColor += 1;
            if (accentColor > 9) accentColor = 0;
        }

        const colorString = this.colors[color];
        const backgroundColorString = this.backgroundColors[backgroundColor];
        const accentColorString = this.colors[accentColor];

        /* eslint-disable max-len */
        return `<g color="${colorString}" fill="${accentColorString}">
            <rect fill="${backgroundColorString}" x="0" y="0" width="160" height="160"></rect>
            <circle cx="80" cy="80" r="40" fill="${colorString}"></circle>
            <g opacity=".1" fill="#010101"><path d="M119.21,80a39.46,39.46,0,0,1-67.13,28.13c10.36,2.33,36,3,49.82-14.28,10.39-12.47,8.31-33.23,4.16-43.26A39.35,39.35,0,0,1,119.21,80Z"/></g>
            ${await this._generatePart('top', topNr)}
            ${await this._generatePart('side', sidesNr)}
            ${await this._generatePart('face', faceNr)}
            ${await this._generatePart('bottom', bottomNr)}
        </g>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} content
     * @returns {string}
     */
    static _$svg(content) {
        const randomId = this._getRandomId();
        /* eslint-disable max-len */
        return `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" >
            <defs>
                <clipPath id="hexagon-clip-${randomId}" transform="scale(0.5) translate(0, 16)">
                    <path d="M251.6 17.34l63.53 110.03c5.72 9.9 5.72 22.1 0 32L251.6 269.4c-5.7 9.9-16.27 16-27.7 16H96.83c-11.43 0-22-6.1-27.7-16L5.6 159.37c-5.7-9.9-5.7-22.1 0-32L69.14 17.34c5.72-9.9 16.28-16 27.7-16H223.9c11.43 0 22 6.1 27.7 16z"/>
                </clipPath>
            </defs>
            <g clip-path="url(#hexagon-clip-${randomId})">
                ${content}
            </g>
        </svg>`;
        /* eslint-enable max-len */
    }

    /**
     * @param {string} part
     * @param {number} index
     * @returns {Promise<string>}
     */
    static async _generatePart(part, index) {
        const assets = await this._getAssets();
        const selector = `#${part}_${this._assetIndex(index, part)}`;
        const $part = assets.querySelector(selector);
        return ($part && $part.innerHTML) || '';
    }

    /**
     * @returns {Promise<Document>}
     */
    static async _getAssets() {
        if (this._assetPromise) return this._assetPromise;

        // /** @type {Promise<Document>} */
        this._assetPromise = new Promise(async (resolve, reject) => {
            try {
                // @ts-ignore
                const response = await fetch(self.NIMIQ_IQONS_SVG_PATH || Iqons.SVG_PATH);
                const assetsText = await response.text();
                const parser = new DOMParser();
                const assets = parser.parseFromString(assetsText, 'image/svg+xml');
                this._assets = assets;
                resolve(assets);
            } catch (e) {
                console.error(e);
                reject(e);
            }
        });

        return this._assetPromise;
    }

    static get hasAssets() {
        return !!this._assets;
    }

    /** @type {string[]} */
    static get colors() {
        return [
            '#FC8702', // orange-600
            '#D94432', // red-700
            '#E9B213', // yellow-700
            '#1A5493', // indigo-600
            '#0582CA', // light-blue-500
            '#5961A8', // purple-600
            '#21bca5', // teal-500
            '#FA7268', // pink-300
            '#88B04B', // light-green-600
            '#795548', // brown-400
        ];
    }

    /** @type {string[]} */
    static get backgroundColors() {
        return [
            '#FC8702', // orange-600
            '#D94432', // red-700
            '#E9B213', // yellow-700
            '#1F2348', // indigo-600
            '#0582CA', // light-blue-500
            '#5F4B8B', // purple-600
            '#21bca5', // teal-500
            '#FA7268', // pink-300
            '#88B04B', // light-green-600
            '#795548', // brown-400
        ];
    }

    /** @type {object} */
    static get assetCounts() {
        return {
            face: Iqons.CATALOG.face.length,
            side: Iqons.CATALOG.side.length,
            top: Iqons.CATALOG.top.length,
            bottom: Iqons.CATALOG.bottom.length,
        };
    }

    /**
     * @param {number} index
     * @param {string} part
     * @returns {string}
     */
    static _assetIndex(index, part) {
        index = (index % this.assetCounts[part]) + 1;
        let fullIndex = index.toString();
        if (index < 10) fullIndex = `0${fullIndex}`;
        return fullIndex;
    }

    /**
     * @param {string} text
     * @returns {string}
     */
    static _hash(text) {
        return (`${text
            .split('')
            .map(c => Number(c.charCodeAt(0)) + 3)
            .reduce((a, e) => a * (1 - a) * this._chaosHash(e), 0.5)}`)
            .split('')
            .reduce((a, e) => e + a, '')
            .substr(4, 17);
    }

    /**
     * @param {number} number
     * @returns {number}
     */
    static _chaosHash(number) {
        const k = 3.569956786876;
        let an = 1 / number;
        for (let i = 0; i < 100; i++) {
            an = (1 - an) * an * k;
        }
        return an;
    }

    /**
     * @returns {number}
     */
    static _getRandomId() {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0];
    }
}

// @ts-ignore
Iqons.SVG_PATH = '/assets/Iqons.min.svg';

Iqons.CATALOG = {
    face: [
        'face_01', 'face_02', 'face_03', 'face_04', 'face_05', 'face_06', 'face_07',
        'face_08', 'face_09', 'face_10', 'face_11', 'face_12', 'face_13', 'face_14',
        'face_15', 'face_16', 'face_17', 'face_18', 'face_19', 'face_20', 'face_21',
    ],
    side: [
        'side_01', 'side_02', 'side_03', 'side_04', 'side_05', 'side_06', 'side_07',
        'side_08', 'side_09', 'side_10', 'side_11', 'side_12', 'side_13', 'side_14',
        'side_15', 'side_16', 'side_17', 'side_18', 'side_19', 'side_20', 'side_21',
    ],
    top: [
        'top_01', 'top_02', 'top_03', 'top_04', 'top_05', 'top_06', 'top_07',
        'top_08', 'top_09', 'top_10', 'top_11', 'top_12', 'top_13', 'top_14',
        'top_15', 'top_16', 'top_17', 'top_18', 'top_19', 'top_20', 'top_21',
    ],
    bottom: [
        'bottom_01', 'bottom_02', 'bottom_03', 'bottom_04', 'bottom_05', 'bottom_06', 'bottom_07',
        'bottom_08', 'bottom_09', 'bottom_10', 'bottom_11', 'bottom_12', 'bottom_13', 'bottom_14',
        'bottom_15', 'bottom_16', 'bottom_17', 'bottom_18', 'bottom_19', 'bottom_20', 'bottom_21',
    ],
};
