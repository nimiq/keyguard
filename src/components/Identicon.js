class Identicon { // eslint-disable-line no-unused-vars
    /**
     * @param {string} [address]
     * @param {HTMLDivElement} [$el]
     */
    constructor(address, $el) {
        this._address = address;

        this.$el = Identicon._createElement($el);
        this.$imgEl = this.$el.firstChild;

        this._updateIqon();
    }

    /**
     * @returns {HTMLDivElement}
     */
    getElement() {
        return this.$el;
    }

    /**
     * @param {string} address
     */
    set address(address) {
        this._address = address;
        this._updateIqon();
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        const $element = $el || document.createElement('div');
        const imageElement = document.createElement('img');
        $element.classList.add('identicon');
        $element.appendChild(imageElement);

        return $element;
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
