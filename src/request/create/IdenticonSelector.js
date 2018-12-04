/* global Nimiq */
/* global I18n */
/* global Identicon */

class IdenticonSelector extends Nimiq.Observable {
    /**
     * @param {HTMLElement} [$el]
     * @param {string} keyPath
     */
    constructor($el, keyPath) {
        super();

        this._keyPath = keyPath;

        this._clearSelection = this._clearSelection.bind(this);
        this._onSelectionConfirmed = this._onSelectionConfirmed.bind(this);

        this.$el = IdenticonSelector._createElement($el);

        /** @type {{ [address: string]: Nimiq.Entropy}} */
        this._volatileEntropies = {};

        /** @type {?string} */
        this._selectedAddress = null;

        this.$identicons = /** @type {HTMLElement} */ (this.$el.querySelector('.identicons'));
        this.$confirmButton = /** @type {HTMLElement} */ (this.$el.querySelector('.backdrop button'));
        this.$generateMoreButton = /** @type {HTMLElement} */ (this.$el.querySelector('.generate-more'));
        this.$backdrop = /** @type {HTMLElement} */ (this.$el.querySelector('.backdrop'));

        this.generateIdenticons = this.generateIdenticons.bind(this);
        this.$generateMoreButton.addEventListener('click', this.generateIdenticons);
        this.$backdrop.addEventListener('click', this._clearSelection);
        this.$confirmButton.addEventListener('click', this._onSelectionConfirmed);
    }

    /**
     * @param {HTMLElement} [$el]
     *
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('identicon-selector');

        $el.innerHTML = `
            <div class="identicons">
                <div class="loading center">
                    <div class="loading-animation"></div>
                    <h2 data-i18n="identicon-selector-loading">Mixing colors</h2>
                </div>
            </div>
            <button class="generate-more nq-button-s">Generate new</button>

            <div class="backdrop center">
                <button class="nq-button inverse" data-i18n="identicon-selector-button-select">Select</button>
                <a tabindex="0" class="nq-text-s nq-link" data-i18n="identicon-selector-link-back">Back</a>
            </div>`;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @returns {HTMLElement}
     */
    getElement() {
        return this.$el;
    }

    generateIdenticons() {
        this.$el.classList.remove('active');

        /** @type {{[address: string]: Nimiq.Entropy}} */
        const entropies = {};

        for (let i = 0; i < 7; i++) {
            const entropy = Nimiq.Entropy.generate();
            if (!Nimiq.MnemonicUtils.isCollidingChecksum(entropy)) {
                const masterKey = entropy.toExtendedPrivateKey();
                const key = masterKey.derivePath(this._keyPath);
                const address = key.toAddress().toUserFriendlyAddress();
                entropies[address] = entropy;
            } else {
                // Try again.
                i -= 1;
            }
        }

        this._volatileEntropies = entropies;

        this.$identicons.textContent = '';

        Object.keys(entropies).forEach(address => {
            const $wrapper = document.createElement('div');
            $wrapper.classList.add('wrapper');

            const identicon = new Identicon(address);
            const $identicon = identicon.getElement();

            const $address = document.createElement('div');
            $address.classList.add('address');
            $address.textContent = address;

            $wrapper.appendChild($identicon);
            $wrapper.appendChild($address);

            $wrapper.addEventListener('click', () => this._onIdenticonSelected($wrapper, address));

            this.$identicons.appendChild($wrapper);
        });

        setTimeout(() => this.$el.classList.add('active'), 100);
    }

    /**
     * @param {HTMLElement} $el
     * @param {string} address
     * @private
     */
    _onIdenticonSelected($el, address) {
        const $returningIdenticon = this.$el.querySelector('.wrapper.returning');
        if ($returningIdenticon) {
            $returningIdenticon.classList.remove('returning');
        }

        this._selectedAddress = address;
        this.$selectedIdenticon = $el;
        this.$el.classList.add('selected');
        $el.classList.add('selected');
    }

    /**
     * @private
     */
    _onSelectionConfirmed() {
        if (!this._selectedAddress) { // something went wrong
            this._clearSelection(); // clear current selection
            this.generateIdenticons(); // and gerate new identicons
            // TODO Add: in case it does happen, signal to user instead of silently resolving it.
            return;
        }
        this.fire(IdenticonSelector.Events.IDENTICON_SELECTED, this._volatileEntropies[this._selectedAddress]);
    }

    _clearSelection() {
        if (this.$selectedIdenticon) {
            this.$selectedIdenticon.classList.add('returning');
            this.$selectedIdenticon.classList.remove('selected');
        }

        this.$el.classList.remove('selected');
    }
}

IdenticonSelector.Events = {
    IDENTICON_SELECTED: 'identicon-selected',
};
