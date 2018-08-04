/* global Nimiq */
/* global I18n */
/* global Identicon */
class ChooseIdenticon extends Nimiq.Observable {
    /**
     * @param {HTMLElement} [$el]
     */
    constructor($el) {
        super();

        this.generateIdenticons = this.generateIdenticons.bind(this);
        this._clearSelection = this._clearSelection.bind(this);
        this._onSelectionConfirmed = this._onSelectionConfirmed.bind(this);

        this.$el = ChooseIdenticon._createElement($el);

        /** @type {{ [address: string]: Nimiq.Entropy}} */
        this._volatileEntropies = {};

        /** @type {?string} */
        this._selectedAddress = null;

        this.$identicons = /** @type {HTMLElement} */ (this.$el.querySelector('.identicons'));
        this.$confirmButton = /** @type {HTMLElement} */ (this.$el.querySelector('.backdrop button'));
        this.$generateMoreButton = /** @type {HTMLElement} */ (this.$el.querySelector('.generate-more'));
        this.$backdrop = /** @type {HTMLElement} */ (this.$el.querySelector('.backdrop'));

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
        $el.classList.add('choose-identicon');

        $el.innerHTML = `<h1 data-i18n="create-choose-identicon-header1">Choose Your Account Avatar</h1>
            <h2>The Avatar will be 'unique' to this Account. You can not change it later.</h2>
            <div class="grow"></div>
            <div class="identicons">
                <div class="loading center">
                    <div class="loading-animation"></div>
                    <h2>Mixing colors</h2>
                </div>
            </div>
            <div class="grow"></div>
            <a class="secondary generate-more center">Generate New</a>
            <div class="grow"></div>
            <div class="backdrop center">
                <button>Confirm</button>
                <a class="secondary">Back</a>
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
                const address = entropy.toExtendedPrivateKey().derive(0).toAddress().toUserFriendlyAddress();
                entropies[address] = entropy;
            } else {
                // Try again.
                i -= 1;
            }
        }

        this._volatileEntropies = entropies;

        this.$identicons.textContent = '';

        Object.keys(entropies).forEach(address => {
            const identicon = new Identicon(address);
            const $identicon = identicon.getElement();
            this.$identicons.appendChild($identicon);
            const $address = document.createElement('div');
            $address.classList.add('address');
            $address.textContent = address;
            $identicon.appendChild($address);
            $identicon.addEventListener('click', () => this._onIdenticonSelected($identicon, address));
        });

        setTimeout(() => this.$el.classList.add('active'), 100);
    }

    /**
     * @param {HTMLElement} $identicon
     * @param {string} address
     * @private
     */
    _onIdenticonSelected($identicon, address) {
        const $returningIdenticon = this.$el.querySelector('.identicon.returning');
        if ($returningIdenticon) {
            $returningIdenticon.classList.remove('returning');
        }

        this._selectedAddress = address;
        this.$selectedIdenticon = $identicon;
        this.$el.classList.add('selected');
        $identicon.classList.add('selected');
    }

    /**
     * @private
     */
    _onSelectionConfirmed() {
        if (!this._selectedAddress) throw new Error('Invalid state');
        this.fire(ChooseIdenticon.Events.CHOOSE_IDENTICON, this._volatileEntropies[this._selectedAddress]);
    }

    _clearSelection() {
        if (this.$selectedIdenticon) {
            this.$selectedIdenticon.classList.add('returning');
            this.$selectedIdenticon.classList.remove('selected');
        }

        this.$el.classList.remove('selected');
    }
}

ChooseIdenticon.Events = {
    CHOOSE_IDENTICON: 'choose-identicon',
};
