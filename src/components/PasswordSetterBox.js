/* global Nimiq */
/* global I18n */
/* global PasswordInput */
/* global AnimationUtils */
/* global PasswordStrength */
/* global TemplateTags */

class PasswordSetterBox extends Nimiq.Observable {
    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {?HTMLFormElement} $el
     * @param {{bgColor?: string, buttonI18nTag?: string}} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'light-blue',
            buttonI18nTag: 'passwordbox-confirm',
        };

        super();

        this._password = '';

        /** @type {{bgColor: string, buttonI18nTag: string}} */
        this.options = Object.assign(defaults, options);

        this.$el = PasswordSetterBox._createElement($el, this.options);

        this._passwordInput = new PasswordInput(
            this.$el.querySelector('[password-input]'),
            PasswordSetterBox.PASSWORD_MAX_LENGTH,
        );
        this._passwordInput.on(PasswordInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));
        this._passwordInput.on(
            PasswordInput.Events.LENGTH,
            length => this.fire(PasswordSetterBox.Events.LENGTH, length),
        );

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
     * @param {{bgColor: string, buttonI18nTag: string}} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('password-box', 'actionbox', 'setter', `nq-${options.bgColor}-bg`);

        // To enable i18n validation with the dynamic nature of the password box's contents,
        // all possible i18n tags and texts have to be specified here in the below format to
        // enable the validator to find them with its regular expression.
        /* eslint-disable max-len */
        /** @type {{[i18nTag: string]: string}} */
        const buttonVersions = {
            'passwordbox-confirm': '<button class="submit show-in-repeat" data-i18n="passwordbox-confirm">Confirm</button>',
            'passwordbox-confirm-create': '<button class="submit show-in-repeat" data-i18n="passwordbox-confirm-create">Create account</button>',
            'passwordbox-confirm-log-in': '<button class="submit show-in-repeat" data-i18n="passwordbox-confirm-log-in">Log in</button>',
        };

        $el.innerHTML = TemplateTags.hasVars(1)`
            <div class="password-strength strength-short  nq-text-s" data-i18n="passwordbox-password-strength-short" >Enter 8 characters or more</div>
            <div class="password-strength strength-weak   nq-text-s" data-i18n="passwordbox-password-strength-weak"  >Weak password</div>
            <div class="password-strength strength-good   nq-text-s" data-i18n="passwordbox-password-strength-good"  >Good password</div>
            <div class="password-strength strength-strong nq-text-s" data-i18n="passwordbox-password-strength-strong">Strong password</div>
            <div class="password-strength strength-secure nq-text-s" data-i18n="passwordbox-password-strength-secure">Secure password</div>
            <div class="password-strength too-long nq-text-s" data-i18n="passwordbox-password-too-long">Max. 256 characters</div>

            <div class="repeat-long nq-text-s" data-i18n="passwordbox-repeat-password-long">No match, please try again</div>
            <div class="repeat-short nq-text-s" data-i18n="passwordbox-repeat-password-short">Password is too short</div>
            <div class="repeat-password nq-text-s" data-i18n="passwordbox-repeat-password">Repeat your password</div>

            <div password-input></div>

            <button class="submit" data-i18n="passwordbox-repeat">Repeat password</button>
            ${buttonVersions[options.buttonI18nTag]}

            <!-- Loading spinner SVG -->
            <svg height="48" width="54" color="inherit" class="loading-spinner"><g>
                <path class="big-hex" d="M51.9,21.9L41.3,3.6c-0.8-1.3-2.2-2.1-3.7-2.1H16.4c-1.5,0-2.9,0.8-3.7,2.1L2.1,21.9c-0.8,1.3-0.8,2.9,0,4.2 l10.6,18.3c0.8,1.3,2.2,2.1,3.7,2.1h21.3c1.5,0,2.9-0.8,3.7-2.1l10.6-18.3C52.7,24.8,52.7,23.2,51.9,21.9z" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.4" stroke-dasharray="92.5 60"/>
                <path class="small-hex" d="M51.9,21.9L41.3,3.6c-0.8-1.3-2.2-2.1-3.7-2.1H16.4c-1.5,0-2.9,0.8-3.7,2.1L2.1,21.9c-0.8,1.3-0.8,2.9,0,4.2 l10.6,18.3c0.8,1.3,2.2,2.1,3.7,2.1h21.3c1.5,0,2.9-0.8,3.7-2.1l10.6-18.3C52.7,24.8,52.7,23.2,51.9,21.9z" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="47.5 105"/>
            </g></svg>
        `;
        /* eslint-enable max-len */

        $el.querySelectorAll('button.submit').forEach(
            $button => $button.classList.add('nq-button', 'inverse', options.bgColor),
        );

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

        if (isWrongPassword) await AnimationUtils.animate('shake', this.$el);
        else this._passwordInput.reset();

        this.$el.classList.remove('repeat');
    }

    async onPasswordIneligible() {
        await AnimationUtils.animate('shake', this.$el);
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
            if (this._passwordInput.text.length > 0 && this._passwordInput.text.length < this._password.length) {
                this._repeatPasswordTimout = window.setTimeout(
                    () => {
                        this.$el.classList.remove('repeat-long');
                        this.$el.classList.add('repeat-short');
                    },
                    400,
                );
            } else {
                this.$el.classList.remove('repeat-short', 'repeat-long');
            }
        }

        const score = PasswordStrength.strength(this._passwordInput.text);
        const length = this._passwordInput.text.length;

        this.$el.classList.toggle(
            'input-eligible',
            isValid && (!this._password || this._passwordInput.text.length >= this._password.length),
        );

        this.$el.classList.toggle('too-long', length > PasswordSetterBox.PASSWORD_MAX_LENGTH);
        this.$el.classList.toggle('strength-short', !isValid && length <= PasswordSetterBox.PASSWORD_MAX_LENGTH);
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
        if (this._password === this._passwordInput.text) {
            this.fire(PasswordSetterBox.Events.SUBMIT, this._password);
            this._passwordInput.reset();
            return;
        }
        if (this._passwordInput.text.length >= this._password.length) {
            this.$el.classList.remove('repeat-short');
            this.$el.classList.add('repeat-long');
            await AnimationUtils.animate('shake', this.$el);
            this._passwordInput.focus();
        }
    }
}

PasswordSetterBox.Events = {
    SUBMIT: 'passwordbox-submit',
    ENTERED: 'passwordbox-entered',
    RESET: 'passwordbox-reset',
    LENGTH: 'passwordbox-length',
};

PasswordSetterBox.PASSWORD_MAX_LENGTH = 256;
