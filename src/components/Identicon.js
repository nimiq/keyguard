/* global Iqons */

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
        const imageElement = new Image();
        $element.classList.add('identicon');
        while ($element.firstChild) { $element.removeChild($element.firstChild); }
        $element.appendChild(imageElement);

        return $element;
    }

    _updateIqon() {
        if (!this._address || !Iqons.hasAssets) {
            /** @type {HTMLImageElement} */ (this.$imgEl).src = Iqons.placeholderToDataUrl();
        }

        if (this._address) {
            Iqons.toDataUrl(this._address).then(url => {
                // Placeholder setting above is synchronous, thus this async result will replace the placeholder
                /** @type {HTMLImageElement} */ (this.$imgEl).src = url;
            });
        }
    }
}
