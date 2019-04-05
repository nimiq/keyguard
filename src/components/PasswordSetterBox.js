/* global Nimiq */
/* global I18n */
/* global PasswordInput */
/* global AnimationUtils */
/* global PasswordStrength */
/* global TemplateTags */

class PasswordSetterBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'light-blue',
            hideSkip: false,
        };

        super();

        this._password = '';

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PasswordSetterBox._createElement($el, this.options);

        this._passwordInput = new PasswordInput(this.$el.querySelector('[password-input]'));
        this._passwordInput.on(PasswordInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        if (!options.hideSkip) {
            /** @type {HTMLElement} */
            (this.$el.querySelector('.password-skip')).addEventListener('click', () => this._onSkip());
        }

        this._onInputChangeValidity(false);
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('password-box', 'actionbox', 'setter', `nq-${options.bgColor}-bg`);

        /* eslint-disable max-len */
        $el.innerHTML = TemplateTags.hasVars(1)`
            <div class="password-strength strength-short  nq-text-s" data-i18n="passwordbox-password-strength-short" >Enter at least 8 characters</div>
            <div class="password-strength strength-weak   nq-text-s" data-i18n="passwordbox-password-strength-weak"  >That password is too weak</div>
            <div class="password-strength strength-good   nq-text-s" data-i18n="passwordbox-password-strength-good"  >Ok, that is an average password</div>
            <div class="password-strength strength-strong nq-text-s" data-i18n="passwordbox-password-strength-strong">Great, that is a strong password</div>
            <div class="password-strength strength-secure nq-text-s" data-i18n="passwordbox-password-strength-secure">Super, that is a secure password</div>
            <div class="repeat-password nq-text-s" data-i18n="passwordbox-repeat-password">Repeat your password</div>

            <div password-input></div>

            <button class="submit" data-i18n="passwordbox-continue">Continue</button>

            ${options.hideSkip ? '' : TemplateTags.noVars`
                <a tabindex="0" class="password-skip nq-text-s">
                    <span data-i18n="passwordbox-password-skip">Skip for now</span>
                    <svg class="nq-icon">
                        <use xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-caret-right-small"/>
                    </svg>
                </a>
            `}
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
        this._passwordInput.focus();
    }

    /**
     * @param {boolean} [isWrongPassword]
     */
    async reset(isWrongPassword) {
        this._password = '';

        if (isWrongPassword) await this._passwordInput.onPasswordIncorrect();
        else this._passwordInput.reset();

        this.$el.classList.remove('repeat');
    }

    /**
     * @returns {Promise<void>}
     */
    async onPasswordIneligible() {
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
        if (this._password && this._passwordInput.text === this._password) {
            this.fire(PasswordSetterBox.Events.SUBMIT, this._password);
            return;
        }

        const score = PasswordStrength.strength(this._passwordInput.text);

        this.$el.classList.toggle('input-eligible', isValid && score >= PasswordStrength.Score.MINIMUM);

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

    _isEligiblePassword() {
        const password = this._passwordInput.text;
        if (password.length < PasswordInput.DEFAULT_MIN_LENGTH) return false;
        return PasswordStrength.strength(password) >= PasswordStrength.Score.MINIMUM;
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();
        if (!this._isEligiblePassword()) {
            this.onPasswordIneligible();
            return;
        }
        if (!this._password) {
            this._password = this._passwordInput.text;
            this._passwordInput.reset();
            this.$el.classList.add('repeat');
            this.fire(PasswordSetterBox.Events.ENTERED);
            return;
        }
        if (this._password !== this._passwordInput.text) {
            this.reset(true);
            this.fire(PasswordSetterBox.Events.NOT_EQUAL);
            return;
        }
        this.fire(PasswordSetterBox.Events.SUBMIT, this._password);
        this.reset();
    }

    _onSkip() {
        this.fire(PasswordSetterBox.Events.SKIP);
    }
}

PasswordSetterBox.Events = {
    SUBMIT: 'passwordbox-submit',
    ENTERED: 'passwordbox-entered',
    NOT_EQUAL: 'passwordbox-not-equal',
    SKIP: 'passwordbox-skip',
};
