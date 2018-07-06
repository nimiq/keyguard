class Identicon { // eslint-disable-line no-unused-vars
    /**
     * @param {string} [address]
     * @param {HTMLImageElement} [el]
     */
    constructor(address, el) {
        this._address = address;

        /** @type {HTMLElement} */
        this.$el = el || this._createElement();

        this._updateIqon();
    }

    getElement() {
        return this.$el;
    }

    _createElement() {
        const imageElement = document.createElement('img');
        const element = document.createElement('div');
        element.classList.add('identicon');
        element.appendChild(imageElement);

        this.$imgEl = imageElement;

        return element;
    }

    /**
     * @param {string} address
     */
    set address(address) {
        this._address = address;
        this._updateIqon();
    }

    _updateIqon() {
        if (this._address) {
            Iqons.toDataUrl(this._address).then(url => {
                /** @type {HTMLImageElement} */ (this.$imgEl).src = url;
            });
        } else {
            /** @type {HTMLImageElement} */ (this.$imgEl).src = Iqons.placeholderToDataUrl();
        }
    }
}
