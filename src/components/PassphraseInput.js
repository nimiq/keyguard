/* global Nimiq */
/* global AnimationUtils */
/* global I18n */

class PassphraseInput extends Nimiq.Observable {
    /**
     * @param {?HTMLElement} $el
     * @param {string} placeholder
     * @param {boolean} [showStrengthIndicator]
     */
    constructor($el, placeholder = 'Enter Passphrase', showStrengthIndicator = false) {
        super();
        this._showStrengthIndicator = showStrengthIndicator;
        this.$el = PassphraseInput._createElement($el);
        this.$inputContainer = /** @type {HTMLElement} */ (this.$el.querySelector('.input-container'));
        this.$input = /** @type {HTMLInputElement} */ (this.$el.querySelector('input.password'));
        this.$eyeButton = /** @type {HTMLElement} */ (this.$el.querySelector('.eye-button'));
        this.$confirmButton = /** @type {HTMLButtonElement} */ (this.$el.querySelector('button'));

        this.$strengthIndicator = /** @type {HTMLElement} */ (this.$el.querySelector('.strength-indicator'));
        this.$strengthIndicatorContainer = /** @type {HTMLElement} */ (this.$el.querySelector('.strength-indicator-container'));
        if (!showStrengthIndicator) {
            this.$strengthIndicatorContainer.style.display = 'none';
        }

        this.$input.placeholder = placeholder;

        this.$eyeButton.addEventListener('click', () => this._changeVisibility());

        this._onInputChanged();
        this.$input.addEventListener('input', () => this._onInputChanged());
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-input');

        /* eslint-disable max-len */
        $el.innerHTML = `
                <div class="input-container">
                    <input class="password" type="password" placeholder="Enter Passphrase">
                    <span class="eye-button icon-eye"/>
                </div>
                <div class="strength-indicator-container">
                    <div class="label"><span data-i18n="passphrase-strength">Strength</span>:</div>
                    <meter max="130" low="10" optimum="100" class="strength-indicator"></meter>
                </div>
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
        if (this._showStrengthIndicator) {
            this._onInputChanged();
        }
    }

    async onPassphraseIncorrect() {
        return AnimationUtils.animate('shake', this.$inputContainer);
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

    _onInputChanged() {
        const passphraseLength = this.$input.value.length;
        this._updateStrengthIndicator();
        this.valid = passphraseLength >= PassphraseInput.MIN_LENGTH;

        this.fire(PassphraseInput.Events.VALID, this.valid);
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

    /**
     * @returns {string}
     */
    get text() {
        return this.$input.value;
    }
}

PassphraseInput.Events = {
    VALID: 'passphrase-valid',
};

PassphraseInput.MIN_LENGTH = 10;
