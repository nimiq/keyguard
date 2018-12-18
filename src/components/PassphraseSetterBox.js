/* global Nimiq */
/* global I18n */
/* global PassphraseInput */
/* global AnimationUtils */

class PassphraseSetterBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'light-blue',
        };

        super();

        this._password = '';

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseSetterBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.password-skip')).addEventListener('click', () => this._onSkip());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'actionbox', 'setter', `nq-${options.bgColor}-bg`);

        /* eslint-disable max-len */
        $el.innerHTML = `
            <div class="password-strength strength-0  nq-text-s" data-i18n="passphrasebox-password-strength-0" >Enter at least 8 characters</div>
            <div class="password-strength strength-8  nq-text-s" data-i18n="passphrasebox-password-strength-8" >Great, that's a good password!</div>
            <div class="password-strength strength-10 nq-text-s" data-i18n="passphrasebox-password-strength-10">Super, that's a strong password!</div>
            <div class="password-strength strength-12 nq-text-s" data-i18n="passphrasebox-password-strength-12">Excellent, that's a very strong password!</div>
            <div class="repeat-password nq-text-s" data-i18n="passphrasebox-repeat-password">Repeat your password</div>

            <div passphrase-input></div>

            <a tabindex="0" class="password-skip nq-text-s"><span data-i18n="passphrasebox-password-skip">Skip for now</span> <i class="nq-icon chevron-right"></i></a>

            <button class="submit" data-i18n="passphrasebox-continue">Continue</button>
        `;
        /* eslint-enable max-len */

        /** @type {HTMLButtonElement} */
        ($el.querySelector('button.submit')).classList.add('nq-button', 'inverse', options.bgColor);

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

    /**
     * @param {boolean} [isWrongPassphrase]
     */
    async reset(isWrongPassphrase) {
        this._password = '';

        if (isWrongPassphrase) await this._passphraseInput.onPassphraseIncorrect();
        else this._passphraseInput.reset();

        this.$el.classList.remove('repeat');
    }

    /**
     * @returns {Promise<void>}
     */
    async onPassphraseTooShort() {
        const $hint = /** @type {HTMLElement} */(this.$el.querySelector('.password-strength'));
        await AnimationUtils.animate('shake', $hint);
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        if (this._password && this._passphraseInput.text === this._password) {
            this.fire(PassphraseSetterBox.Events.SUBMIT, this._password);
        }
        this.$el.classList.toggle('input-valid', isValid);

        const length = this._passphraseInput.text.length;
        this.$el.classList.toggle('strength-0', length < 8);
        this.$el.classList.toggle('strength-8', length >= 8 && length < 10);
        this.$el.classList.toggle('strength-10', length >= 10 && length < 12);
        this.$el.classList.toggle('strength-12', length >= 12);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        console.log(event);
        event.preventDefault();
        if (!this._password) {
            if (this._passphraseInput.text.length < PassphraseInput.DEFAULT_MIN_LENGTH) {
                this.onPassphraseTooShort();
                return;
            }
            this._password = this._passphraseInput.text;
            this._passphraseInput.reset();
            this.$el.classList.add('repeat');
            this.fire(PassphraseSetterBox.Events.ENTERED);
            return;
        }
        if (this._password !== this._passphraseInput.text) {
            this.reset(true);
            this.fire(PassphraseSetterBox.Events.NOT_EQUAL);
            return;
        }
        this.fire(PassphraseSetterBox.Events.SUBMIT, this._password);
        this.reset();
    }

    _onSkip() {
        this.fire(PassphraseSetterBox.Events.SKIP);
    }
}

PassphraseSetterBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    ENTERED: 'passphrasebox-entered',
    NOT_EQUAL: 'passphrasebox-not-equal',
    SKIP: 'passphrasebox-skip',
};
