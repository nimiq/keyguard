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

        this.$el = IdenticonSelector._createElement($el);

        /** @type {{ [address: string]: Nimiq.Entropy}} */
        this._volatileEntropies = {};

        this.$identicons = /** @type {HTMLElement} */ (this.$el.querySelector('.identicons'));
        this.$generateMoreButton = /** @type {HTMLElement} */ (this.$el.querySelector('.generate-more'));

        this.$generateMoreButton.addEventListener('click', this.generateIdenticons.bind(this));
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
            <h2 class="nq-h2 nq-blue">Avatars represent Accounts.</h2>
            <button class="generate-more nq-button-s">Generate new</button>`;

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
            const $wrapper = document.createElement('a');
            $wrapper.classList.add('wrapper');
            $wrapper.setAttribute('tabindex', '0');
            $wrapper.setAttribute('href', '#');

            const identicon = new Identicon(address);
            const $identicon = identicon.getElement();

            const $address = document.createElement('div');
            $address.classList.add('address');
            $address.textContent = address;

            $wrapper.appendChild($identicon);
            $wrapper.appendChild($address);

            $wrapper.addEventListener('click', e => this._onSelectionConfirmed(address, e));

            this.$identicons.appendChild($wrapper);
        });

        setTimeout(() => this.$el.classList.add('active'), 100);
    }

    /**
     * @param {string} selectedAddress
     * @param {Event} e
     * @private
     */
    _onSelectionConfirmed(selectedAddress, e) {
        e.preventDefault();
        if (!selectedAddress) { // something went wrong
            this.generateIdenticons(); // and gerate new identicons
            // TODO Add: in case it does happen, signal to user instead of silently resolving it.
            return;
        }

        this.fire(
            IdenticonSelector.Events.IDENTICON_SELECTED,
            this._volatileEntropies[selectedAddress],
            selectedAddress,
        );
    }
}

IdenticonSelector.Events = {
    IDENTICON_SELECTED: 'identicon-selected',
};
