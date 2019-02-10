/* global Nimiq */
/* global I18n */
/* global PassphraseInput */
/* global AnimationUtils */
/* global PasswordStrength */

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
            <div class="password-strength strength-4  nq-text-s" data-i18n="passphrasebox-password-strength-4" >Hm, that's a weak password :(</div>
            <div class="password-strength strength-8  nq-text-s" data-i18n="passphrasebox-password-strength-8" >Ok, that's an average password.</div>
            <div class="password-strength strength-10 nq-text-s" data-i18n="passphrasebox-password-strength-10">Great, that's a strong password!</div>
            <div class="password-strength strength-12 nq-text-s" data-i18n="passphrasebox-password-strength-12">Super, that's a secure password!</div>
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
    async onPassphraseIneligable() {
        // We have to shake both possible too-weak notices
        const $hint0 = /** @type {HTMLElement} */(this.$el.querySelector('.password-strength.strength-0'));
        const $hint4 = /** @type {HTMLElement} */(this.$el.querySelector('.password-strength.strength-4'));

        await Promise.all([
            AnimationUtils.animate('shake', $hint0),
            AnimationUtils.animate('shake', $hint4),
        ]);
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        if (this._password && this._passphraseInput.text === this._password) {
            this.fire(PassphraseSetterBox.Events.SUBMIT, this._password);
            return;
        }

        const score = PasswordStrength.strength(this._passphraseInput.text);

        this.$el.classList.toggle('input-eligable', isValid && score >= 40);

        this.$el.classList.toggle('strength-0', !isValid);
        this.$el.classList.toggle('strength-4', isValid && score < 40);
        this.$el.classList.toggle('strength-8', isValid && score >= 40 && score < 75);
        this.$el.classList.toggle('strength-10', isValid && score >= 75 && score < 150);
        this.$el.classList.toggle('strength-12', isValid && score >= 150);
    }

    _isEligablePassword() {
        const password = this._passphraseInput.text;
        if (password.length < PassphraseInput.DEFAULT_MIN_LENGTH) return false;
        return PasswordStrength.strength(password) >= 40;
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();
        if (!this._isEligablePassword()) {
            this.onPassphraseIneligable();
            return;
        }
        if (!this._password) {
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
