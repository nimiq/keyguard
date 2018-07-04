class Identicon {

    /**
     * @param {string} [address]
     */
    constructor(address) {
        this._address = address;
        /** @type {HTMLImageElement} */
        this._el;
    }

    getElement() {
        if (this._el) return this._el;

        this._el = document.createElement('img');
        this._el.classList.add('identicon');

        this._updateIqon();

        return this._el;
    }

    /**
     * @param {string} address
     */
    set address(address) {
        this._address = address;
        this._updateIqon();
    }

    _updateIqon() {
        if (this._address && this._el) {
            Iqons.toDataUrl(this._address).then(url => {
                this._el.src = url;
            });
        }
    }
}
