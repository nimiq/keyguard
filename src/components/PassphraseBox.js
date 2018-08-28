/* global Nimiq */
/* global I18n */
/* global PassphraseInput */

class PassphraseBox extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} $el
     * @param {object} [options]
     */
    constructor($el, options = {}) {
        const defaults = {
            bgColor: 'purple',
            hideInput: false,
            isSetter: false,
            promptI18nTag: 'passphrasebox-enter-passphrase',
            buttonI18nTag: 'passphrasebox-confirm-tx',
        };

        super();

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseBox._createElement($el, {
            prompt: this.options.promptI18nTag,
            button: this.options.buttonI18nTag,
        }, this.options.bgColor);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.cancel')).addEventListener('click', () => this._onCancel());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {{prompt: string, button: string}} i18nTags
     * @param {'purple' | 'red' | 'yellow'} bgColor
     * @returns {HTMLFormElement}
     */
    static _createElement($el, i18nTags, bgColor) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'center', bgColor);

        // To enable i18n validation with the dynamic nature of the passphrase box's contents,
        // all possible i18n tags and texts have to be specified here in the below format to
        // enable the validator to find them with its regular expression.
        const promptVersions = {
            'passphrasebox-enter-passphrase': 'data-i18n="passphrasebox-enter-passphrase">Enter your passphrase<',
            'passphrasebox-protect-keyfile':
                'data-i18n="passphrasebox-protect-keyfile">Protect your keyfile with a password<',
            'passphrasebox-repeat-password': 'data-i18n="passphrasebox-repeat-password">Repeat your password<',
        };
        const buttonVersions = {
            'passphrasebox-continue': 'data-i18n="passphrasebox-continue">Continue<',
            'passphrasebox-log-in': 'data-i18n="passphrasebox-log-in">Log in to your wallet<',
            'passphrasebox-log-out': 'data-i18n="passphrasebox-log-out">Confirm logout<',
            'passphrasebox-download': 'data-i18n="passphrasebox-download">Download key file<',
            'passphrasebox-confirm-tx': 'data-i18n="passphrasebox-confirm-tx">Confirm transaction<',
        };

        if (!promptVersions[i18nTags.prompt]) throw new Error('PassphraseBox prompt i18n tag not defined');
        if (!buttonVersions[i18nTags.button]) throw new Error('PassphraseBox button i18n tag not defined');

        $el.innerHTML = `
            <a class="cancel icon-cancel"></a>
            <div class="prompt" ${promptVersions[i18nTags.prompt]}/div>
            <div passphrase-input></div>
            <button class="submit" ${buttonVersions[i18nTags.button]}/button>
        `;

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
     * @returns {Promise<void>}
     */
    async onPassphraseIncorrect() {
        return this._passphraseInput.onPassphraseIncorrect();
    }

    /**
     * @param {boolean} isValid
     */
    _onInputChangeValidity(isValid) {
        this.$el.classList.toggle('input-valid', isValid);
    }

    /**
     * @param {Event} event
     */
    _onSubmit(event) {
        event.preventDefault();
        this.fire(PassphraseBox.Events.SUBMIT, this._passphraseInput.text);
    }

    _onCancel() {
        this.fire(PassphraseBox.Events.CANCEL);
    }
}

PassphraseBox.Events = {
    SUBMIT: 'passphrasebox-submit',
    CANCEL: 'passphrasebox-cancel',
};
