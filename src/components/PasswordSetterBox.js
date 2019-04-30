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
        };

        super();

        this._password = '';

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PasswordSetterBox._createElement($el, this.options);

        this._passwordInput = new PasswordInput(this.$el.querySelector('[password-input]'));
        this._passwordInput.on(PasswordInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));


        this._onInputChangeValidity(false);

        window.onpopstate = /** @param {PopStateEvent} ev */ ev => {
            if (ev.state && ev.state.isPasswordBoxInitialStep === true) {
                this.fire(PasswordSetterBox.Events.RESET);
                this.$el.classList.remove('repeat-short', 'repeat-long');
            }
        };
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
        $el.innerHTML = TemplateTags.noVars`
            <div class="password-strength strength-short  nq-text-s" data-i18n="passwordbox-password-strength-short" >Enter at least 8 characters</div>
            <div class="password-strength strength-weak   nq-text-s" data-i18n="passwordbox-password-strength-weak"  >That is a weak password</div>
            <div class="password-strength strength-good   nq-text-s" data-i18n="passwordbox-password-strength-good"  >Ok, that is an average password</div>
            <div class="password-strength strength-strong nq-text-s" data-i18n="passwordbox-password-strength-strong">Great, that is a strong password</div>
            <div class="password-strength strength-secure nq-text-s" data-i18n="passwordbox-password-strength-secure">Super, that is a secure password</div>
            <div class="repeat-long nq-text-s" data-i18n="passwordbox-repeat-password-long">No match, please try again</div>
            <div class="repeat-short nq-text-s" data-i18n="passwordbox-repeat-password-short">Password is too short</div>
            <div class="repeat-password nq-text-s" data-i18n="passwordbox-repeat-password">Repeat your password</div>

            <div password-input></div>

            <button class="submit" data-i18n="passwordbox-repeat">Repeat password</button>

            <svg height="48" width="54" color="inherit" class="loading-spinner">
                <use xlink:href="#loading-spinner" />
            </svg>
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

    async onPasswordIneligible() {
        const $hintTooShort = /** @type {HTMLElement} */ (this.$el.querySelector('.password-strength.strength-short'));
        await AnimationUtils.animate('shake', $hintTooShort);
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        if (this._repeatPasswordTimout) {
            window.clearTimeout(this._repeatPasswordTimout);
            this._repeatPasswordTimout = null;
        }

        if (this._password) {
            if (this._passwordInput.text === this._password) {
                this._repeatPasswordTimout = window.setTimeout(
                    () => {
                        this.fire(PasswordSetterBox.Events.SUBMIT, this._password);
                        this._passwordInput.reset();
                    },
                    400,
                );
                return;
            }
            if (this._passwordInput.text.length > 0) {
                if (this._passwordInput.text.length < this._password.length) {
                    this._repeatPasswordTimout = window.setTimeout(
                        async () => {
                            this.$el.classList.remove('repeat-long');
                            this.$el.classList.add('repeat-short');
                        },
                        400,
                    );
                } else {
                    this._repeatPasswordTimout = window.setTimeout(
                        () => {
                            this.$el.classList.remove('repeat-short');
                            this.$el.classList.add('repeat-long');
                        },
                        1200,
                    );
                }
            } else {
                this.$el.classList.remove('repeat-short', 'repeat-long');
            }
        }


        const score = PasswordStrength.strength(this._passwordInput.text);

        this.$el.classList.toggle('input-eligible', isValid && !this._password);

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

    _isPasswordEligible() {
        return this._passwordInput.text.length >= PasswordInput.DEFAULT_MIN_LENGTH;
    }

    /**
     * @param {Event} event
     */
    async _onSubmit(event) {
        event.preventDefault();
        if (!this._isPasswordEligible()) {
            this.onPasswordIneligible();
            return;
        }
        if (!this._password) {
            this._password = this._passwordInput.text;
            this._passwordInput.reset();
            this.$el.classList.add('repeat');
            this.fire(PasswordSetterBox.Events.ENTERED);
            window.history.replaceState({ isPasswordBoxInitialStep: true }, 'Keyguard');
            window.history.pushState({ isPasswordBoxRepeatStep: true }, 'Keyguard');
            this._passwordInput.focus();
            return;
        }
        if (this._password !== this._passwordInput.text) {
            await AnimationUtils.animate('shake', this._passwordInput.$el);
        }
    }
}

PasswordSetterBox.Events = {
    SUBMIT: 'passwordbox-submit',
    ENTERED: 'passwordbox-entered',
    RESET: 'passsordbox-reset',
};
