/* global Nimiq */
/* global I18n */
/* global Identicon */
class ChooseKeyType extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} [$el]
     * @param {string} [defaultKeyPath]
     * @param {Nimiq.Entropy} [entropy]
     */
    constructor($el, defaultKeyPath = '', entropy) {
        super();
        this._defaultKeyPath = defaultKeyPath;
        this._entropy = entropy;

        /** @type {HTMLFormElement} */
        this.$el = ChooseKeyType._createElement($el);

        /** @type {HTMLInputElement} */
        const $radioLegacy = (this.$el.querySelector('input#key-type-legacy'));
        $radioLegacy.addEventListener('change', this._checkEnableContinue.bind(this));

        /** @type {HTMLInputElement} */
        const $radioBip39 = (this.$el.querySelector('input#key-type-bip39'));
        $radioBip39.addEventListener('change', this._checkEnableContinue.bind(this));

        /** @type {HTMLDivElement} */
        const $identiconLegacy = (this.$el.querySelector('.identicon-legacy'));
        this._identiconLegacy = new Identicon(undefined, $identiconLegacy);

        /** @type {HTMLDivElement} */
        const $identiconBip39 = (this.$el.querySelector('.identicon-bip39'));
        this._identiconBip39 = new Identicon(undefined, $identiconBip39);

        /** @type {HTMLDivElement} */
        this.$addressLegacy = (this.$el.querySelector('.address-legacy'));

        /** @type {HTMLDivElement} */
        this.$addressBip39 = (this.$el.querySelector('.address-bip39'));

        /** @type {HTMLButtonElement} */
        this.$confirmButton = (this.$el.querySelector('button'));

        this.$el.addEventListener('submit', event => this._submit(event));

        this._update();
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @returns {HTMLFormElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('form');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <h1 data-i18n="choose-key-type-heading">Choose key type</h1>
            <h2 data-i18n="choose-key-type-subheading">We couldn't determine the type of your key. Please select it below.</h2>
            <div class="grow"></div>
            <div class="key-type-option">
                <input type="radio" name="key-type" id="key-type-legacy" value="0">
                <label for="key-type-legacy" class="row">
                    <div class="identicon-legacy"></div>
                    <div class="key-type-info">
                        <strong data-i18n="choose-key-type-legacy-address-heading">Single address</strong><br>
                        <span data-i18n="choose-key-type-legacy-address-info">Created before xx/xx/2018</span><br>
                        <br>
                        <span class="address-legacy"></span>                        
                    </div>
                </label>
            </div>
            <h2 class="key-type-or" data-i18n="choose-key-type-or">or</h2>
            <div class="key-type-option">
                <input type="radio" name="key-type" id="key-type-bip39" value="1">
                <label for="key-type-bip39" class="row">
                    <div class="identicon-bip39"></div>
                    <div class="key-type-info">
                        <strong data-i18n="choose-key-type-bip39-address-heading">Multiple addresses</strong><br>
                        <span data-i18n="choose-key-type-bip39-address-info">Created after xx/xx/2018</span><br>
                        <br>
                        <span class="address-bip39"></span>                        
                    </div>
                </label>
            </div>
            <div class="grow"></div>
            <button data-i18n="continue" type="submit" disabled>Continue</button>
        `;
        /* eslint-enable max-len */

        $el.classList.add('key-type-form');

        I18n.translateDom($el);
        return $el;
    }

    _update() {
        // Reset choice.
        /** @type {HTMLInputElement} */
        const selected = (this.$el.querySelector('input[name="key-type"]:checked'));
        if (selected) {
            selected.checked = false;
        }
        this._checkEnableContinue();

        if (!this._entropy) {
            return;
        }

        const legacyAddress = Nimiq.PublicKey.derive(new Nimiq.PrivateKey(this._entropy.serialize()))
            .toAddress().toUserFriendlyAddress();
        this._identiconLegacy.address = legacyAddress;
        this.$addressLegacy.textContent = legacyAddress;

        const bip39Address = this._entropy.toExtendedPrivateKey().derivePath(this._defaultKeyPath)
            .toAddress().toUserFriendlyAddress();
        this._identiconBip39.address = bip39Address;
        this.$addressBip39.textContent = bip39Address;
    }

    /**
     * @param {Nimiq.Entropy} entropy
     */
    set entropy(entropy) {
        this._entropy = entropy;
        this._update();
    }

    get value() {
        /** @type {HTMLInputElement} */
        const selected = (this.$el.querySelector('input[name="key-type"]:checked'));
        return selected ? parseInt(selected.value, 10) : null;
    }

    /**
     * @private
     */
    _checkEnableContinue() {
        this.$confirmButton.disabled = this.value === null;
    }

    /** @param {Event} event */
    _submit(event) {
        event.preventDefault();
        if (this.value !== null) {
            this.fire(ChooseKeyType.Events.CHOOSE, this.value, this._entropy);
        }
    }
}

ChooseKeyType.Events = {
    CHOOSE: 'choose-key-type',
};
