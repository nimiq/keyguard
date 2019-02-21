/* global Nimiq */
/* global AnimationUtils */
/* global I18n */

class PassphraseInput extends Nimiq.Observable {
    /**
     * @param {?HTMLElement} $el
     * @param {string} placeholder
     */
    constructor($el, placeholder = '••••••••') {
        super();
        this._minLength = PassphraseInput.DEFAULT_MIN_LENGTH;
        this.$el = PassphraseInput._createElement($el);

        this.$input = /** @type {HTMLInputElement} */ (this.$el.querySelector('input.password'));
        this.$eyeButton = /** @type {HTMLElement} */ (this.$el.querySelector('.eye-button'));

        this.$input.placeholder = placeholder;

        this.$eyeButton.addEventListener('click', () => {
            this._changeVisibility();
            this.focus();
        });

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
                <div class="input-wrapper">
                    <input class="password" type="password" placeholder="Enter password">
                </div>
                <svg class="nq-icon eye-button not-visible">
                    <use class="not-visible" xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-view-off"/>
                    <use class="is-visible"  xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-view"/>
                </svg>
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

    /** @type {HTMLInputElement} */
    get input() {
        return this.$input;
    }

    focus() {
        this.$input.focus();
    }

    reset() {
        this.$input.value = '';
        this._changeVisibility(false);
        this._onInputChanged();
    }

    async onPassphraseIncorrect() {
        await AnimationUtils.animate('shake', this.$input);
        this.reset();
    }

    /** @param {boolean} [becomeVisible] */
    _changeVisibility(becomeVisible) {
        becomeVisible = typeof becomeVisible !== 'undefined'
            ? becomeVisible
            : this.$input.getAttribute('type') === 'password';
        this.$input.setAttribute('type', becomeVisible ? 'text' : 'password');
        this.$eyeButton.classList.toggle('is-visible', becomeVisible);
        this.$eyeButton.classList.toggle('not-visible', !becomeVisible);
    }

    _onInputChanged() {
        const passphraseLength = this.$input.value.length;
        this.valid = passphraseLength >= this._minLength;

        this.fire(PassphraseInput.Events.VALID, this.valid);
    }

    /**
     * @returns {string}
     */
    get text() {
        return this.$input.value;
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._minLength = minLength || PassphraseInput.DEFAULT_MIN_LENGTH;
    }
}

PassphraseInput.Events = {
    VALID: 'passphraseinput-valid',
};

PassphraseInput.DEFAULT_MIN_LENGTH = 8;
