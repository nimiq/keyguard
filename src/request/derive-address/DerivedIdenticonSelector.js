/* global Nimiq */
/* global I18n */
/* global Identicon */
/* global Errors */
/* global TemplateTags */

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
        this.$generateMoreButton = /** @type {HTMLElement} */ (this.$el.querySelector('.generate-more'));

        this.$generateMoreButton.addEventListener('click', this.nextPage.bind(this));
    }

    /**
     * @param {HTMLElement} [$el]
     *
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('identicon-selector');

        $el.innerHTML = TemplateTags.noVariables`
            <div class="identicons">
                <div class="loading center">
                    <div class="loading-animation"></div>
                    <h2 data-i18n="identicon-selector-loading">Mixing colors</h2>
                </div>
            </div>
            <button class="generate-more nq-button-s" data-i18n="identicon-selector-more-addresses">
                More addresses
            </button>`;

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
        if (!this._masterKey) {
            this.fire(
                DerivedIdenticonSelector.Events.MASTER_KEY_NOT_SET,
                new Errors.KeyguardError('Master key not set, call init() first'),
            );
            return;
        }

        this._page += 1;
        if (this._page > Math.floor(this._pathsToDerive.length / 7)) this._page = 1;
        this.generateIdenticons(this._masterKey, this._pathsToDerive, this._page);
    }

    /**
     * @param {Nimiq.ExtendedPrivateKey} masterKey
     * @param {string[]} pathsToDerive
     * @param {number} page
     */
    generateIdenticons(masterKey, pathsToDerive, page) {
        this.$generateMoreButton.blur();
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
            const $wrapper = document.createElement('a');
            $wrapper.classList.add('wrapper');
            $wrapper.setAttribute('tabindex', '0');
            $wrapper.setAttribute('href', '#');

            const identicon = new Identicon(address);
            const $identicon = identicon.getElement();

            $wrapper.appendChild($identicon);

            $wrapper.addEventListener('click', event => this._onSelectionConfirmed(address, event));

            this.$identicons.appendChild($wrapper);
        });

        setTimeout(() => this.$el.classList.add('active'), 100);
    }

    /**
     * @param {string} selectedAddress
     * @param {Event} event
     * @private
     */
    _onSelectionConfirmed(selectedAddress, event) {
        event.preventDefault();

        this.fire(
            DerivedIdenticonSelector.Events.IDENTICON_SELECTED,
            this._derivedAddresses[selectedAddress],
            selectedAddress,
        );
    }
}

DerivedIdenticonSelector.Events = {
    IDENTICON_SELECTED: 'identicon-selected',
    MASTER_KEY_NOT_SET: 'master-key-not-set',
};
