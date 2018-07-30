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

        this.$el = ChooseIdenticon._createElement($el);

        /** @type {{ [address: string]: Nimiq.KeyPair}} */
        this._volatileKeys = {};

        this.$identicons = /** @type {HTMLElement} */ (this.$el.querySelector('.identicons'));
        this.$confirmButton = /** @type {HTMLElement} */ (this.$el.querySelector('.backdrop button'));
        this.$generateMoreButton = /** @type {HTMLElement} */ (this.$el.querySelector('.generate-more'));
        this.$backdrop = /** @type {HTMLElement} */ (this.$el.querySelector('.backdrop'));

        this.$generateMoreButton.addEventListener('click', this.generateIdenticons);
        this.$backdrop.addEventListener('click', this._clearSelection);
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

        /** @type {{ [address: string]: Nimiq.KeyPair}} */
        const keyPairs = {};

        for (let i = 0; i < 7; i++) {
            const keyPair = Nimiq.KeyPair.generate();
            const address = keyPair.publicKey.toAddress().toUserFriendlyAddress();
            keyPairs[address] = keyPair;
        }

        this._volatileKeys = keyPairs;

        this.$identicons.textContent = '';

        Object.keys(keyPairs).forEach(address => {
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

        // don't use addEventListener here to override easily when other identicon is selected
        this.$confirmButton.onclick = () => this.fire(
            ChooseIdenticon.Events.CHOOSE_IDENTICON,
            this._volatileKeys[address],
        );

        this.$selectedIdenticon = $identicon;
        this.$el.classList.add('selected');
        $identicon.classList.add('selected');
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
