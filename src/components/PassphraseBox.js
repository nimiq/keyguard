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
            hideInput: false, // TODO: When a key is not encrypted, no passphrase is required
            buttonI18nTag: 'passphrasebox-confirm-tx',
        };

        super();

        /** @type {object} */
        this.options = Object.assign(defaults, options);

        this.$el = PassphraseBox._createElement($el, this.options);

        this._passphraseInput = new PassphraseInput(this.$el.querySelector('[passphrase-input]'));
        this._passphraseInput.on(PassphraseInput.Events.VALID, isValid => this._onInputChangeValidity(isValid));

        this.$el.addEventListener('submit', event => this._onSubmit(event));

        /** @type {HTMLElement} */
        (this.$el.querySelector('.cancel')).addEventListener('click', () => this._onCancel());
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @param {object} options
     * @returns {HTMLFormElement}
     */
    static _createElement($el, options) {
        $el = $el || document.createElement('form');
        $el.classList.add('passphrase-box', 'center', options.bgColor);

        // To enable i18n validation with the dynamic nature of the passphrase box's contents,
        // all possible i18n tags and texts have to be specified here in the below format to
        // enable the validator to find them with its regular expression.
        /* eslint-disable max-len */
        const buttonVersions = {
            'passphrasebox-continue': '<button class="submit" data-i18n="passphrasebox-continue">Continue</button>',
            'passphrasebox-log-in': '<button class="submit" data-i18n="passphrasebox-log-in">Log in to your wallet</button>',
            'passphrasebox-log-out': '<button class="submit" data-i18n="passphrasebox-log-out">Confirm logout</button>',
            // 'passphrasebox-download': '<button class="submit" data-i18n="passphrasebox-download">Download key file</button>',
            'passphrasebox-confirm-tx': '<button class="submit" data-i18n="passphrasebox-confirm-tx">Confirm transaction</button>',
        };
        /* eslint-enable max-len */

        if (!buttonVersions[options.buttonI18nTag]) throw new Error('PassphraseBox button i18n tag not defined');

        $el.innerHTML = `
            <a class="cancel icon-cancel"></a>
            <div class="prompt" data-i18n="passphrasebox-enter-passphrase">Enter your passphrase</div>
            <div passphrase-input></div>
            ${buttonVersions[options.buttonI18nTag]}
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
