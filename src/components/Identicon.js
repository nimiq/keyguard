class Identicon { // eslint-disable-line no-unused-vars
    /**
     * @param {string} [address]
     * @param {HTMLImageElement} [el]
     */
    constructor(address, el) {
        this._address = address;

        /** @type {HTMLImageElement} */
        this.$el = el || this.getElement();

        this._updateIqon();
    }

    /**
     * @returns {HTMLImageElement}
     */
    getElement() {
        if (this.$el) return this.$el;

        const element = document.createElement('img');
        element.classList.add('identicon');

        return element;
    }

    /**
     * @param {string} address
     */
    set address(address) {
        this._address = address;
        this._updateIqon();
    }

    /** */
    _updateIqon() {
        if (this._address) {
            Iqons.toDataUrl(this._address).then(url => {
                this.$el.src = url;
            });
        } else {
            this.$el.src = Iqons.placeholderToDataUrl();
        }
    }
}
