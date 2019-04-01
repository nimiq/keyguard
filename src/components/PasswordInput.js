/* global Nimiq */
/* global AnimationUtils */
/* global I18n */
/* global TemplateTags */

class PasswordInput extends Nimiq.Observable {
    /**
     * @param {?HTMLElement} $el
     * @param {string} placeholder
     */
    constructor($el, placeholder = '••••••••') {
        super();
        this._minLength = PasswordInput.DEFAULT_MIN_LENGTH;
        this.$el = PasswordInput._createElement($el);

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
        $el.classList.add('password-input');

        /* eslint-disable max-len */
        $el.innerHTML = TemplateTags.noVariables`
            <div class="input-container">
                <div class="input-wrapper">
                    <input class="password" type="password" placeholder="Enter password">
                </div>
                <svg class="nq-icon eye-button">
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

    async onPasswordIncorrect() {
        await AnimationUtils.animate('shake', this.$input);
        this.reset();
    }

    /** @param {boolean} [becomeVisible] */
    _changeVisibility(becomeVisible) {
        becomeVisible = typeof becomeVisible !== 'undefined'
            ? becomeVisible
            : this.$input.getAttribute('type') === 'password';
        this.$input.setAttribute('type', becomeVisible ? 'text' : 'password');
        this.$eyeButton.classList.toggle('visible', becomeVisible);
    }

    _onInputChanged() {
        const passwordLength = this.$input.value.length;
        this.valid = passwordLength >= this._minLength;

        this.fire(PasswordInput.Events.VALID, this.valid);
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
        this._minLength = minLength || PasswordInput.DEFAULT_MIN_LENGTH;
    }
}

PasswordInput.Events = {
    VALID: 'passwordinput-valid',
};

PasswordInput.DEFAULT_MIN_LENGTH = 8;
