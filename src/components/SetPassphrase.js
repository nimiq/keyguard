/* global Nimiq */
/* global I18n */
/* global PassphraseInput */
class SetPassphrase extends Nimiq.Observable {
    /**
     * @param {?HTMLFormElement} [$el]
     */
    constructor($el) {
        super();

        /** @type {HTMLElement} */
        this.$el = SetPassphrase._createElement($el);
        this._checkEnableContinue = this._checkEnableContinue.bind(this);

        /** @type {HTMLFormElement} */
        const $passphraseFirst = (this.$el.querySelector('.passphrase-first'));

        /** @type {HTMLFormElement} */
        const $passphraseSecond = (this.$el.querySelector('.passphrase-second'));

        /** @type {HTMLFormElement} */
        this.$confirmButton = (this.$el.querySelector('.confirm-passphrase'));

        /** @type {PassphraseInput} */
        this._passphraseFirst = new PassphraseInput($passphraseFirst,
            I18n.translatePhrase('passphrase-placeholder'), true);
        this._passphraseFirst.on(PassphraseInput.Events.VALID, this._checkEnableContinue);

        /** @type {PassphraseInput} */
        this._passphraseSecond = new PassphraseInput($passphraseSecond,
            I18n.translatePhrase('repeat-passphrase-placeholder'), false);
        this._passphraseSecond.on(PassphraseInput.Events.VALID, this._checkEnableContinue);

        this.$el.addEventListener('submit', event => this._submit(event));
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @returns {HTMLFormElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('form');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <h1 data-i18n="create-set-passphrase-header1">Set a Passphrase</h1>
            <h2 data-i18n="create-set-passphrase-header2">Please enter a Passphrase to secure your account.</h2>
            <p data-i18n="create-set-passphrase-warning">The Passphrase is [strong]not[/strong] an alternative for your 24 Recovery Words!</p>
            <div class="grow"></div>
            <div class="my-account"></div>
            <div class="passphrase-first"></div>
            <div class="passphrase-second"></div>
            <div class="grow"></div>
            <button data-i18n="passphrase-confirm" type="submit" class="confirm-passphrase" disabled>Confirm</button>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    reset() {
        this._passphraseFirst.reset();
        this._passphraseSecond.reset();
    }

    /**
     * @private
     */
    _checkEnableContinue() {
        this.$confirmButton.disabled = !this._passphraseFirst.valid || !this._passphraseSecond.valid;
    }

    /** @param {Event} event */
    _submit(event) {
        event.preventDefault();
        if (this._passphraseFirst.text === this._passphraseSecond.text) {
            this.fire(SetPassphrase.Events.CHOOSE, this._passphraseFirst.text);
        } else {
            this._passphraseSecond.onPassphraseIncorrect();
        }
    }
}

SetPassphrase.Events = {
    CHOOSE: 'choose-passphrase',
};
