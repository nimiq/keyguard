/* global I18n */
/* global KeyStore */
/* global Nimiq */
/* global PassphraseInput */
class ConfirmRemoval extends Nimiq.Observable {
    /**
     * @param {HTMLElement} [$el]
     * @param {string} keyId
     */
    constructor($el, keyId) {
        super();

        this.$el = ConfirmRemoval._createElement($el);
        this.keyId = keyId;

        this.$cancel = /** @type {HTMLElement} */ (this.$el.querySelector('.cancel'));
        this.$remove = /** @type {HTMLButtonElement} */ (this.$el.querySelector('.remove'));
        this.$remove.disabled = true;
        this.$passphrase = /** @type {HTMLElement} */ (this.$el.querySelector('.passphrase'));

        this._passphrase = new PassphraseInput(this.$passphrase);

        this.$cancel.addEventListener('click', () => this.fire(ConfirmRemoval.Events.CANCEL));
        this.$remove.addEventListener('click', this.onRemoveClicked.bind(this));
        this._passphrase.on(PassphraseInput.Events.VALID, /** @param {boolean} isValid */ isValid => {
            this.$remove.disabled = !isValid;
        });
    }

    async onRemoveClicked() {
        try {
            const passphrase = Nimiq.BufferUtils.fromAscii(this._passphrase.text);
            await KeyStore.instance.get(this.keyId, passphrase);
            this.fire(ConfirmRemoval.Events.REMOVE);
        } catch (e) {
            this._passphrase.onPassphraseIncorrect();
        }
    }

    /**
     * @param {HTMLElement} [$el]
     *
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('.confirm-removal');

        $el.innerHTML = `
            <h1>Confirm Key Removal</h1>
            <h2>Enter your password to confirm the removal of your key. This cannot be undone.</h2>
            <div class="grow"></div>
            <div class="passphrase"></div>
            <div class="grow"></div>
            <div>
                <button class="small cancel">Cancel</button>
                <button class="small remove">Remove key</button>
            </div>
        `;

        I18n.translateDom($el);

        return $el;
    }
}

ConfirmRemoval.Events = {
    CANCEL: 'confirm-cancel',
    REMOVE: 'confirm-remove',
};
