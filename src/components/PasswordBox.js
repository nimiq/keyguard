/* global Nimiq */
/* global I18n */
/* global PasswordInput */
/* global TemplateTags */

class PasswordBox extends Nimiq.Observable {
    // eslint-disable-next-line valid-jsdoc, max-len
    /** @param {{bgColor?: string, hideInput?: boolean, buttonI18nTag?: string, minLength?: number, hideCancel?: boolean}} [options]
     *  @param {?HTMLFormElement} $el
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'light-blue',
            hideInput: false,
            buttonI18nTag: 'passwordbox-confirm-tx',
            minLength: PasswordInput.DEFAULT_MIN_LENGTH,
            hideCancel: false,
        };

        super();

        // eslint-disable-next-line max-len
        /** @type {{bgColor: string, hideInput: boolean, buttonI18nTag: string, minLength: number, hideCancel: boolean}} */
        this.options = Object.assign(defaults, options);

        this.$el = PasswordBox._createElement($el, this.options);

        this.$el.classList.toggle('hide-input', this.options.hideInput);
        this.$el.classList.toggle('hide-cancel', this.options.hideCancel);

        this._passwordInput = new PasswordInput(this.$el.querySelector('[password-input]'));
        this._passwordInput.on(PasswordInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.setMinLength(this.options.minLength);

        this._isInputValid = false;

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.cancel')).addEventListener('click', () => this._onCancel());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {{bgColor: string, hideInput: boolean, buttonI18nTag: string}} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('password-box', 'actionbox');
        if (!options.hideInput) $el.classList.add(`nq-${options.bgColor}-bg`);

        // To enable i18n validation with the dynamic nature of the password box's contents,
        // all possible i18n tags and texts have to be specified here in the below format to
        // enable the validator to find them with its regular expression.
        /* eslint-disable max-len */
        /** @type {{[i18nTag: string]: string}} */
        const buttonVersions = {
            'passwordbox-continue': '<button class="submit" data-i18n="passwordbox-continue">Continue</button>',
            'passwordbox-log-in': '<button class="submit" data-i18n="passwordbox-log-in">Unlock</button>',
            'passwordbox-log-out': '<button class="submit" data-i18n="passwordbox-log-out">Confirm logout</button>',
            'passwordbox-confirm-tx': '<button class="submit" data-i18n="passwordbox-confirm-tx">Confirm transaction</button>',
            'passwordbox-download': '<button class="submit" data-i18n="passwordbox-download">Download Login File</button>',
            'passwordbox-show-words': '<button class="submit" data-i18n="passwordbox-show-words">Show recovery words</button>',
            'passwordbox-sign-msg': '<button class="submit" data-i18n="passwordbox-sign-msg">Sign message</button>',
        };
        /* eslint-enable max-len */

        if (!buttonVersions[options.buttonI18nTag]) throw new Error('PasswordBox button i18n tag not defined');

        $el.innerHTML = TemplateTags.hasVars(1)`
            <a class="cancel">
                <svg class="nq-icon">
                    <use xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-close"/>
                </svg>
            </a>
            <div class="prompt nq-text-s" data-i18n="passwordbox-enter-password">Enter your password</div>
            <div password-input></div>
            ${buttonVersions[options.buttonI18nTag]}
        `;

        /** @type {HTMLButtonElement} */
        ($el.querySelector('button.submit')).classList.add('nq-button', options.bgColor);
        if (!options.hideInput) {
            /** @type {HTMLButtonElement} */
            ($el.querySelector('button.submit')).classList.add('inverse');
        }

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
        if (!this.options.hideInput) {
            this._passwordInput.focus();
        }
    }

    reset() {
        this._passwordInput.reset();
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._passwordInput.setMinLength(minLength);
    }

    /**
     * @returns {Promise<void>}
     */
    async onPasswordIncorrect() {
        return this._passwordInput.onPasswordIncorrect();
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this._isInputValid = isValid;
        this.$el.classList.toggle('input-eligible', isValid);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();
        if (!this.options.hideInput && !this._isInputValid) return;

        const password = !this.options.hideInput ? this._passwordInput.text : undefined;
        this.fire(PasswordBox.Events.SUBMIT, password);
    }

    _onCancel() {
        this.fire(PasswordBox.Events.CANCEL);
    }

    /**
     * @param {boolean} hidden
     */
    hideInput(hidden) {
        this.options.hideInput = hidden;
        this.$el.classList.toggle('hide-input', hidden);
        this.$el.classList.toggle(`nq-${this.options.bgColor}-bg`, !hidden);
        /** @type {HTMLElement} */
        (this.$el.querySelector('button.submit')).classList.toggle('inverse', !hidden);
    }
}

PasswordBox.Events = {
    SUBMIT: 'passwordbox-submit',
    CANCEL: 'passwordbox-cancel',
};
