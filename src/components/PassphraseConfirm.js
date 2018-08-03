/* global Nimiq */
/* global I18n */
/* global PassphraseInput */
/**
 * @deprecated
 */
class PassphraseConfirm extends Nimiq.Observable {
    /**
     * @param {boolean} [isPassphraseSetter]
     * @param {HTMLFormElement} [$el]
     */
    constructor(isPassphraseSetter = false, $el) {
        super();

        this._onValidPassphrase = this._onValidPassphrase.bind(this);

        this._isPassphraseSetter = isPassphraseSetter;
        this.$el = PassphraseConfirm._createElement($el);
        this.$passphraseInput = /** @type {HTMLElement} */ (this.$el.querySelector('.passphrase-input'));
        this._passphraseInput = new PassphraseInput(this.$passphraseInput,
            I18n.translatePhrase('passphrase-placeholder'), isPassphraseSetter);
        this.$confirmButton = /** @type {HTMLButtonElement} */ (this.$el.querySelector('button'));

        this.$el.addEventListener('submit', event => this._submit(event));

        this._passphraseInput.on(PassphraseInput.Events.VALID, this._onValidPassphrase);
    }

    /**
     * @param {HTMLFormElement} [$el]
     * @returns {HTMLFormElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('form');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <div class="passphrase-input"></div>
            <button data-i18n="passphrase-confirm">Confirm</button>
        `;
        /* eslint-enable max-len */

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

    async onPassphraseIncorrect() {
        return this._passphraseInput.onPassphraseIncorrect();
    }

    /**
     * @param {boolean} valid
     * @private
     */
    _onValidPassphrase(valid) {
        this.$confirmButton.disabled = !valid;
    }

    /** @param {Event} event */
    _submit(event) {
        event.preventDefault();
        if (this._isPassphraseSetter && !this._passphraseInput.valid) return;
        this.fire(PassphraseConfirm.Events.PASSPHRASE_ENTERED, this._passphraseInput.text);
    }
}

PassphraseConfirm.Events = {
    PASSPHRASE_ENTERED: 'passphrase-entered',
};

PassphraseConfirm.MIN_LENGTH = 10;
