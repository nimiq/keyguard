class ChooseIdenticon extends Nimiq.Observable {

    /**
     * @param {EncryptionType} encryptionType
     * @param {HTMLElement} $el
     */
    constructor(encryptionType, $el) {
        super();

        this.generateIdenticons = this.generateIdenticons.bind(this);
        this._clearSelection = this._clearSelection.bind(this);

        this.$el = $el;
        this._encryptionType = encryptionType;

        this._volatileKeys = {};

        this.$identicons = /** @type {HTMLElement} */ (this.$el.querySelector('.identicons')),
        this.$confirmButton = /** @type {HTMLElement} */ (this.$el.querySelector('.backdrop button')),
        this.$generateMoreButton = /** @type {HTMLElement} */ (this.$el.querySelector('.generate-more')),
        this.$backdrop = /** @type {HTMLElement} */ (this.$el.querySelector('.backdrop'))

        this.$generateMoreButton.addEventListener('click', this.generateIdenticons);
        this.$backdrop.addEventListener('click', this._clearSelection);
    }

    generateIdenticons() {
        this.$el.classList.remove('active');
        const keys = {};

        for (let i = 0; i < 7; i++) {
            const keyPair = Nimiq.KeyPair.generate();
            const key = new Key(keyPair, this._encryptionType);
            keys[key.userFriendlyAddress] = key;
        }

        this._volatileKeys = keys;

        this.$identicons.textContent = '';

        for (const address in keys) {
            const identicon = new Identicon(address);
            const $identicon = identicon.getElement();
            this.$identicons.appendChild($identicon);
            const $address = document.createElement('div');
            $address.classList.add('address');
            $address.textContent = address;
            $identicon.appendChild($address);
            $identicon.addEventListener('click', () => this._onIdenticonSelected($identicon, address));
        }

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

        this.$confirmButton.addEventListener('click', () => this.fire(
            ChooseIdenticon.EVENTS.CHOOSE_IDENTICON,
            this._volatileKeys[address]
        ));

        this.$selectedIdenticon = $identicon;
        this.$el.classList.add('selected');
        $identicon.classList.add('selected');
    }

    _clearSelection() {
        if (this.$selectedIdenticon) {
            this.$selectedIdenticon.classList.add('returning')
            this.$selectedIdenticon.classList.remove('selected');
        }

        this.$el.classList.remove('selected');
    }
}

ChooseIdenticon.EVENTS = {
    CHOOSE_IDENTICON: 'choose-identicon'
};
