/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseBox extends Nimiq.Observable {
    // eslint-disable-next-line valid-jsdoc, max-len
    /** @param {{bgColor?: string, hideInput?: boolean, buttonI18nTag?: string, minLength?: number, hideCancel?: boolean}} [options]
     *  @param {?HTMLFormElement} $el
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'light-blue',
            hideInput: false,
            buttonI18nTag: 'passphrasebox-confirm-tx',
            minLength: PassphraseInput.DEFAULT_MIN_LENGTH,
            hideCancel: false,
        };

        super();

        // eslint-disable-next-line max-len
        /** @type {{bgColor: string, hideInput: boolean, buttonI18nTag: string, minLength: number, hideCancel: boolean}} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseBox._createElement($el, this.options);

        this.$el.classList.toggle('hide-input', this.options.hideInput);
        this.$el.classList.toggle('hide-cancel', this.options.hideCancel);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

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
        $el.classList.add('passphrase-box', 'actionbox');
        if (!options.hideInput) $el.classList.add(`nq-${options.bgColor}-bg`);

        // To enable i18n validation with the dynamic nature of the passphrase box's contents,
        // all possible i18n tags and texts have to be specified here in the below format to
        // enable the validator to find them with its regular expression.
        /* eslint-disable max-len */
        /** @type {{[i18nTag: string]: string}} */
        const buttonVersions = {
            'passphrasebox-continue': '<button class="submit" data-i18n="passphrasebox-continue">Continue</button>',
            'passphrasebox-log-in': '<button class="submit" data-i18n="passphrasebox-log-in">Log in to your wallet</button>',
            'passphrasebox-log-out': '<button class="submit" data-i18n="passphrasebox-log-out">Confirm logout</button>',
            'passphrasebox-confirm-tx': '<button class="submit" data-i18n="passphrasebox-confirm-tx">Confirm transaction</button>',
            'passphrasebox-download': '<button class="submit" data-i18n="passphrasebox-download">Download Key File</button>',
            'passphrasebox-sign-msg': '<button class="submit" data-i18n="passphrasebox-sign-msg">Sign message</button>',
        };
        /* eslint-enable max-len */

        if (!buttonVersions[options.buttonI18nTag]) throw new Error('PassphraseBox button i18n tag not defined');

        $el.innerHTML = `
            <a class="cancel nq-icon cancel-circle-white"></a>
            <div class="prompt nq-text-s" data-i18n="passphrasebox-enter-passphrase">Enter your password</div>
            <div passphrase-input></div>
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
        this._passphraseInput.focus();
    }

    reset() {
        this._passphraseInput.reset();
    }

    /**
     * @param {number} [minLength]
     */
    setMinLength(minLength) {
        this._passphraseInput.setMinLength(minLength);
    }

    /**
     * @returns {Promise<void>}
     */
    async onPassphraseIncorrect() {
        return this._passphraseInput.onPassphraseIncorrect();
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this._isInputValid = isValid;
        this.$el.classList.toggle('input-valid', isValid);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();
        if (!this.options.hideInput && !this._isInputValid) return;

        const passphrase = !this.options.hideInput ? this._passphraseInput.text : undefined;
        this.fire(PassphraseBox.Events.SUBMIT, passphrase);
    }

    _onCancel() {
        this.fire(PassphraseBox.Events.CANCEL);
    }
}

PassphraseBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    CANCEL: 'passphrasebox-cancel',
};
