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

        this._onInputChangeValidity(false);
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
            <div class="password-strength strength-short  nq-text-s" data-i18n="passphrasebox-password-strength-short" >Enter at least 8 characters</div>
            <div class="password-strength strength-weak   nq-text-s" data-i18n="passphrasebox-password-strength-weak"  >That password is too weak</div>
            <div class="password-strength strength-good   nq-text-s" data-i18n="passphrasebox-password-strength-good"  >Ok, that is an average password</div>
            <div class="password-strength strength-strong nq-text-s" data-i18n="passphrasebox-password-strength-strong">Great, that is a strong password</div>
            <div class="password-strength strength-secure nq-text-s" data-i18n="passphrasebox-password-strength-secure">Super, that is a secure password</div>
            <div class="repeat-password nq-text-s" data-i18n="passphrasebox-repeat-password">Repeat your password</div>

            <div passphrase-input></div>

            <button class="submit" data-i18n="passphrasebox-continue">Continue</button>

            <a tabindex="0" class="password-skip nq-text-s"><span data-i18n="passphrasebox-password-skip">Skip for now</span> <i class="nq-icon chevron-right"></i></a>
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
        const $hintTooShort = /** @type {HTMLElement} */ (this.$el.querySelector('.password-strength.strength-short'));
        const $hintWeak = /** @type {HTMLElement} */ (this.$el.querySelector('.password-strength.strength-weak'));

        await Promise.all([
            AnimationUtils.animate('shake', $hintTooShort),
            AnimationUtils.animate('shake', $hintWeak),
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

        this.$el.classList.toggle('input-eligable', isValid && score >= PasswordStrength.Score.MINIMUM);

        this.$el.classList.toggle('strength-short', !isValid);
        this.$el.classList.toggle('strength-weak', isValid && score < PasswordStrength.Score.MINIMUM);
        this.$el.classList.toggle('strength-good',
            isValid
            && score >= PasswordStrength.Score.MINIMUM
            && score < PasswordStrength.Score.STRONG);
        this.$el.classList.toggle('strength-strong',
            isValid
            && score >= PasswordStrength.Score.STRONG
            && score < PasswordStrength.Score.SECURE);
        this.$el.classList.toggle('strength-secure', isValid && score >= PasswordStrength.Score.SECURE);
    }

    _isEligablePassword() {
        const password = this._passphraseInput.text;
        if (password.length < PassphraseInput.DEFAULT_MIN_LENGTH) return false;
        return PasswordStrength.strength(password) >= PasswordStrength.Score.MINIMUM;
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
