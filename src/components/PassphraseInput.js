/* global Nimiq */
/* global AnimationUtils */
/* global I18n */

class PassphraseInput extends Nimiq.Observable {
    /**
     * @param {boolean} [isPassphraseSetter]
     * @param {HTMLFormElement} [$el]
     */
    constructor(isPassphraseSetter = false, $el) {
        super();
        this._isPassphraseSetter = isPassphraseSetter;
        this.$el = PassphraseInput._createElement($el);
        this.$inputContainer = /** @type {HTMLElement} */ (this.$el.querySelector('.input-container'));
        this.$input = /** @type {HTMLInputElement} */ (this.$el.querySelector('input.password'));
        this.$eyeButton = /** @type {HTMLElement} */ (this.$el.querySelector('.eye-button'));
        this.$confirmButton = /** @type {HTMLButtonElement} */ (this.$el.querySelector('button'));
        this.$strengthIndicator = /** @type {HTMLElement} */ (this.$el.querySelector('.strength-indicator'));
        this.$strengthIndicatorContainer = /** @type {HTMLElement} */ (
            this.$el.querySelector('.strength-indicator-container'));

        this.$el.addEventListener('submit', event => this._submit(event));
        this.$eyeButton.addEventListener('click', () => this._changeVisibility());

        if (!isPassphraseSetter) {
            this.$strengthIndicatorContainer.style.display = 'none';
        } else {
            this._updateStrength();
            this.$input.addEventListener('input', () => this._updateStrength());
        }
    }

    /**
     * @param {HTMLFormElement} [$el]
     * @returns {HTMLFormElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-input');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <div class="input-container">
                <input class="password" type="password" data-i18n-placeholder="passphrase-placeholder" placeholder="Enter Passphrase">
                <span class="eye-button icon-eye"/>
            </div>
            <div class="strength-indicator-container">
                <div class="label"><span data-i18n="passphrase-strength">Strength</span>:</div>
                <meter max="130" low="10" optimum="100" class="strength-indicator"></meter>
            </div>
            <div class="grow"></div>
            <button data-i18n="passphrase-confirm">Confirm</button>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    focus() {
        this.$input.focus();
    }

    reset() {
        this.$input.value = '';
        this._changeVisibility(false);
        if (this._isPassphraseSetter) {
            this._updateStrength();
        }
    }

    async onPassphraseIncorrect() {
        return AnimationUtils.animate('shake', this.$inputContainer);
    }

    /** @param {Event} event */
    _submit(event) {
        event.preventDefault();
        if (this._isPassphraseSetter && this.$input.value.length < PassphraseInput.MIN_LENGTH) return;
        this.fire(PassphraseInput.Events.PASSPHRASE_ENTERED, this.$input.value);
    }

    /** @param {boolean} [becomeVisible] */
    _changeVisibility(becomeVisible) {
        becomeVisible = typeof becomeVisible !== 'undefined'
            ? becomeVisible
            : this.$input.getAttribute('type') === 'password';
        this.$input.setAttribute('type', becomeVisible ? 'text' : 'password');
        this.$eyeButton.classList.toggle('icon-eye-off', becomeVisible);
        this.$eyeButton.classList.toggle('icon-eye', !becomeVisible);
        this.$input.focus();
    }

    _updateStrength() {
        const passphraseLength = this.$input.value.length;
        this.$confirmButton.disabled = passphraseLength < PassphraseInput.MIN_LENGTH;
        this._updateStrengthIndicator();
    }

    _updateStrengthIndicator() {
        const passphraseLength = this.$input.value.length;
        let strengthIndicatorValue;
        if (passphraseLength === 0) {
            strengthIndicatorValue = 0;
        } else if (passphraseLength < 7) {
            strengthIndicatorValue = 10;
        } else if (passphraseLength < 10) {
            strengthIndicatorValue = 70;
        } else if (passphraseLength < 14) {
            strengthIndicatorValue = 100;
        } else {
            strengthIndicatorValue = 130;
        }
        this.$strengthIndicator.setAttribute('value', String(strengthIndicatorValue));
    }
}

PassphraseInput.Events = {
    PASSPHRASE_ENTERED: 'passphrase-entered',
};

PassphraseInput.MIN_LENGTH = 10;
