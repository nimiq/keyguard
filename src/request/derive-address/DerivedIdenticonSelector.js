/* global Nimiq */
/* global I18n */
/* global Identicon */

class DerivedIdenticonSelector extends Nimiq.Observable {
    /**
     * @param {HTMLElement} [$el]
     */
    constructor($el) {
        super();

        this.$el = DerivedIdenticonSelector._createElement($el);

        /** @type {number} */
        this._page = 1;

        /** @type {string[]} */
        this._pathsToDerive = [];

        /** @type {{ [address: string]: { address: Nimiq.Address, keyPath: string } }} */
        this._derivedAddresses = {};

        /** @type {?string} */
        this._selectedAddress = null;

        this.$identicons = /** @type {HTMLElement} */ (this.$el.querySelector('.identicons'));
        this.$confirmButton = /** @type {HTMLElement} */ (this.$el.querySelector('.backdrop button'));
        this.$generateMoreButton = /** @type {HTMLElement} */ (this.$el.querySelector('.generate-more'));
        this.$backdrop = /** @type {HTMLElement} */ (this.$el.querySelector('.backdrop'));

        this.$generateMoreButton.addEventListener('click', this.nextPage.bind(this));
        this.$backdrop.addEventListener('click', this._clearSelection.bind(this));
        this.$confirmButton.addEventListener('click', this._onSelectionConfirmed.bind(this));
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
            <button class="generate-more">Generate new</button>

            <div class="backdrop center">
                <button data-i18n="identicon-selector-button-select">Select</button>
                <a tabindex="0" class="secondary" data-i18n="identicon-selector-link-back">Back</a>
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

    /**
     * @param {Nimiq.ExtendedPrivateKey} masterKey
     * @param {string[]} pathsToDerive
     */
    init(masterKey, pathsToDerive) {
        /** @type {Nimiq.ExtendedPrivateKey} */
        this._masterKey = masterKey;

        /** @type {string[]} */
        this._pathsToDerive = pathsToDerive;

        this.generateIdenticons(this._masterKey, this._pathsToDerive, this._page);
    }

    nextPage() {
        // This check is mainly to make Typescript happy, as "this._masterKey is potentially undefined"
        if (!this._masterKey) throw new Error('Master key not set, call init() first');

        this._page += 1;
        if (this._page > 2) this._page = 1;
        this.generateIdenticons(this._masterKey, this._pathsToDerive, this._page);
    }

    /**
     * @param {Nimiq.ExtendedPrivateKey} masterKey
     * @param {string[]} pathsToDerive
     * @param {number} page
     */
    generateIdenticons(masterKey, pathsToDerive, page) {
        this.$el.classList.remove('active');

        /** @type {{ [address: string]: { address: Nimiq.Address, keyPath: string } }} */
        const derivedAddresses = {};

        const firstIndex = 7 * (page - 1);
        const lastIndex = (7 * page) - 1;

        for (let i = firstIndex; i <= lastIndex; i++) {
            const key = masterKey.derivePath(pathsToDerive[i]);
            const address = key.toAddress();
            derivedAddresses[address.toUserFriendlyAddress()] = {
                address,
                keyPath: pathsToDerive[i],
            };
        }

        this._derivedAddresses = derivedAddresses;

        this.$identicons.textContent = '';

        Object.keys(derivedAddresses).forEach(address => {
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
        if (!this._selectedAddress) throw new Error('Invalid state');
        this.fire(DerivedIdenticonSelector.Events.IDENTICON_SELECTED, this._derivedAddresses[this._selectedAddress]);
    }

    _clearSelection() {
        if (this.$selectedIdenticon) {
            this.$selectedIdenticon.classList.add('returning');
            this.$selectedIdenticon.classList.remove('selected');
        }

        this.$el.classList.remove('selected');
    }
}

DerivedIdenticonSelector.Events = {
    IDENTICON_SELECTED: 'identicon-selected',
};
