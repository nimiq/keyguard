class ChooseIdenticon extends Nimiq.Observable {
    /**
     * @param {EncryptionType} encryptionType
     * @param {HTMLElement} [$el]
     */
    constructor(encryptionType, $el) {
        super();

        this.generateIdenticons = this.generateIdenticons.bind(this);
        this._clearSelection = this._clearSelection.bind(this);

        this.$el = ChooseIdenticon._createElement($el);
        this._encryptionType = encryptionType;

        /** @type {{ [address: string]: Key}} */
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

        $el.innerHTML = `<h1>Choose Your Account Avatar</h1>
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

        /** @type {{ [address: string]: Key}} */
        const keys = {};

        for (let i = 0; i < 7; i++) {
            const keyPair = Nimiq.KeyPair.generate();
            const key = new Key(keyPair, this._encryptionType);
            keys[key.userFriendlyAddress] = key;
        }

        this._volatileKeys = keys;

        this.$identicons.textContent = '';

        Object.keys(keys).forEach(address => {
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

        this.$confirmButton.addEventListener('click', () => this.fire(
            ChooseIdenticon.EVENTS.CHOOSE_IDENTICON,
            this._volatileKeys[address],
        ));

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

ChooseIdenticon.EVENTS = {
    CHOOSE_IDENTICON: 'choose-identicon',
};
